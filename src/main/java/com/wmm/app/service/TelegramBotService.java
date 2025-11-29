package com.wmm.app.service;

import com.wmm.app.config.TelegramProperties;
import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.ProductGroup;
import com.wmm.app.domain.ProductGroupLink;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.ProductGroupLinkRepository;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.bots.DefaultAbsSender;
import org.telegram.telegrambots.bots.DefaultBotOptions;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Service
public class TelegramBotService {

    private final ProductGroupLinkRepository productGroupLinkRepository;
    private final InventoryCurrentRepository inventoryCurrentRepository;
    private final DefaultAbsSender sender;
    private final String defaultChatId;
    private static final Logger log = LoggerFactory.getLogger(TelegramBotService.class);

    public TelegramBotService(
        ProductGroupLinkRepository productGroupLinkRepository,
        InventoryCurrentRepository inventoryCurrentRepository,
        TelegramProperties telegramProperties
    ) {
        this.productGroupLinkRepository = productGroupLinkRepository;
        this.inventoryCurrentRepository = inventoryCurrentRepository;
        this.defaultChatId = telegramProperties.getChatId();

        String token = telegramProperties.getBot().getToken();
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Telegram bot token is not configured");
        }

        if (defaultChatId == null || defaultChatId.isBlank()) {
            log.warn("Default Telegram chat id is not configured; outbound notifications may fail");
        }

        this.sender = new DefaultAbsSender(new DefaultBotOptions()) {
            @Override
            public String getBotToken() {
                return token;
            }
        };
    }

    // 🔴 Уведомление о полном отсутствии товара
    public void notifyOutOfStock(String materialCode, String productTitle, String storageType) {
        String message =
            """
            🔴 *Товар закончился*

            🏷️ *Название:* %s
            📝 *Код:* `%s`
            🏢 *Склад:* %s
            """.formatted(productTitle, materialCode, storageType);

        sendMessageWithAnalogButton(defaultChatId, message, materialCode);
    }

    // 🟡 Уведомление о низком остатке
    public void notifyLowStock(String materialCode, String productTitle, int visibleStock, int minThreshold, String storageType) {
        String message =
            """
            🟡 *НИЗКИЙ ОСТАТОК ТОВАРА*

            🏷️ *Название:* %s
            📝 *Код:* `%s`
            📦 *Остаток:* %d ед.
            ⚠️ *Минимум:* %d ед.
            🏢 *Склад:* %s
            """.formatted(productTitle, materialCode, visibleStock, minThreshold, storageType);

        sendMessageWithAnalogButton(defaultChatId, message, materialCode);
    }

    // 🔍 Обработка кнопки "Показать аналоги"
    public void handleAnalogRequest(String materialCode, String chatId) {
        Optional<ProductGroupLink> linkOpt = productGroupLinkRepository.findByMaterialCode(materialCode);
        if (linkOpt.isEmpty()) {
            sendMessage(chatId, "❌ Аналоги для кода `" + materialCode + "` не найдены.");
            return;
        }

        ProductGroup group = linkOpt.get().getGroup();
        String groupName = Optional.ofNullable(group.getName()).orElse("Без названия");

        // все материалы в группе, кроме исходного
        List<ProductGroupLink> links = productGroupLinkRepository.findByGroupId(group.getId());
        List<String> codes = links.stream().map(ProductGroupLink::getMaterialCode).filter(code -> !code.equals(materialCode)).toList();

        if (codes.isEmpty()) {
            sendMessage(chatId, "ℹ️ В группе *" + groupName + "* нет других кодов.");
            return;
        }

        // остатки из InventoryCurrent
        List<InventoryCurrent> items = inventoryCurrentRepository.findByMaterialIn(codes);

        Map<String, Map<String, Integer>> stockMap = new HashMap<>();
        Map<String, String> titles = new HashMap<>();

        for (InventoryCurrent ic : items) {
            Integer qty = ic.getAvailableStock();
            if (qty == null || qty <= 0) continue;

            stockMap.computeIfAbsent(ic.getMaterial(), k -> new HashMap<>()).merge(ic.getStorageType(), qty, Integer::sum);

            if (!titles.containsKey(ic.getMaterial()) && ic.getMaterialDescription() != null) titles.put(
                ic.getMaterial(),
                ic.getMaterialDescription()
            );
        }

        StringBuilder msg = new StringBuilder();
        msg
            .append("🔍 *АНАЛОГИ ТОВАРА*\n\n")
            .append("🧾 Код: `")
            .append(materialCode)
            .append("`\n")
            .append("📦 Группа: *")
            .append(groupName)
            .append("*\n\n");

        int shown = 0;
        for (String code : codes) {
            Map<String, Integer> perStorage = stockMap.get(code);
            if (perStorage == null || perStorage.isEmpty()) continue;
            shown++;

            String title = titles.getOrDefault(code, "");
            msg.append("✅ `").append(code).append("`");
            if (!title.isBlank()) msg.append(" — ").append(title);
            msg.append("\n");
            perStorage.forEach((st, q) -> msg.append("   • ").append(st).append(" — *").append(q).append("* ед.\n"));
        }

        if (shown == 0) msg.append("❌ В группе нет товаров с доступным остатком.");

        sendMessage(chatId, msg.toString());
    }

    // 📘 Отправка сообщения с кнопкой "Показать аналоги"
    public void sendMessageWithAnalogButton(String chatId, String text, String materialCode) {
        if (isChatMissing(chatId)) {
            log.warn("Skip sending message with analog button because chatId is missing for material {}", materialCode);
            return;
        }

        SendMessage msg = new SendMessage(chatId, text);
        msg.setParseMode("Markdown");

        InlineKeyboardButton analogsBtn = new InlineKeyboardButton();
        analogsBtn.setText("🔍 Показать аналоги");
        analogsBtn.setCallbackData("/analogs_" + materialCode);

        InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
        markup.setKeyboard(List.of(List.of(analogsBtn)));
        msg.setReplyMarkup(markup);

        try {
            sender.execute(msg);
        } catch (TelegramApiException e) {
            log.error("Failed to send analog button message for material {} to chat {}", materialCode, chatId, e);
        }
    }

    // 💬 Отправка простого текстового сообщения
    public void sendMessage(String chatId, String text) {
        if (isChatMissing(chatId)) {
            log.warn("Skip sending plain message because chatId is missing. Text: {}", text);
            return;
        }

        SendMessage message = new SendMessage(chatId, text);
        message.setParseMode("Markdown");
        try {
            sender.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send message to chat {}", chatId, e);
        }
    }

    private boolean isChatMissing(String chatId) {
        if (chatId == null || chatId.isBlank()) {
            log.error("Chat id is missing; configured default chat id: {}", defaultChatId);
            return true;
        }
        return false;
    }
}

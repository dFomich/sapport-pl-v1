package com.wmm.app.service;

import com.wmm.app.config.TelegramProperties;
import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.ProductGroup;
import com.wmm.app.domain.ProductGroupLink;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.ProductGroupLinkRepository;
import java.util.*;
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

    public TelegramBotService(
        ProductGroupLinkRepository productGroupLinkRepository,
        InventoryCurrentRepository inventoryCurrentRepository,
        TelegramProperties telegramProperties
    ) {
        this.productGroupLinkRepository = productGroupLinkRepository;
        this.inventoryCurrentRepository = inventoryCurrentRepository;
        this.defaultChatId = telegramProperties.getChatId();

        String token = telegramProperties.getBot().getToken();
        if (token != null && !token.isBlank()) {
            this.sender = new DefaultAbsSender(new DefaultBotOptions()) {
                @Override
                public String getBotToken() {
                    return token;
                }
            };
        } else {
            this.sender = null;
        }
    }

    public void notifyOutOfStock(InventoryCurrent ic, String productTitle, String storageType) {
        String message =
            """
            🔴 *Товар закончился*

            🏷️ *Название:* %s
            📝 *Код:* `%s`
            🏢 *Склад:* %s
            """.formatted(productTitle, ic.getMaterial(), storageType);

        sendMessageWithAnalogButton(defaultChatId, message, ic.getMaterial());
    }

    public void notifyLowStock(InventoryCurrent ic, String productTitle, int minThreshold) {
        String message =
            """
            🟡 *НИЗКИЙ ОСТАТОК ТОВАРА*

            🏷️ *Название:* %s
            📝 *Код:* `%s`
            📦 *Остаток:* %d ед.
            """.formatted(productTitle, ic.getMaterial(), ic.getAvailableStock(), minThreshold);

        sendMessageWithAnalogButton(defaultChatId, message, ic.getMaterial());
    }

    public void handleAnalogRequest(String materialCode, String chatId) {
        Optional<ProductGroupLink> linkOpt = productGroupLinkRepository.findByMaterialCode(materialCode);
        if (linkOpt.isEmpty()) {
            sendMessage(chatId, "❌ Аналоги для кода `" + materialCode + "` не найдены.");
            return;
        }

        ProductGroup group = linkOpt.get().getGroup();
        String groupName = Optional.ofNullable(group.getName()).orElse("Без названия");

        List<ProductGroupLink> allLinks = productGroupLinkRepository.findByGroupId(group.getId());
        List<String> codes = allLinks.stream().map(ProductGroupLink::getMaterialCode).toList();

        if (codes.isEmpty()) {
            sendMessage(chatId, "ℹ️ В группе *" + groupName + "* пока нет кодов.");
            return;
        }

        List<InventoryCurrent> stockItems = inventoryCurrentRepository.findByMaterialIn(codes);

        Map<String, Map<String, Integer>> stockMap = new HashMap<>();
        for (InventoryCurrent ic : stockItems) {
            if (ic.getAvailableStock() <= 0) continue;
            stockMap
                .computeIfAbsent(ic.getMaterial(), k -> new HashMap<>())
                .merge(ic.getStorageType(), ic.getAvailableStock(), Integer::sum);
        }

        StringBuilder msg = new StringBuilder();
        msg.append("🔍 *АНАЛОГИ*\n\n");
        msg.append("📝 *Поиск по коду:* `").append(materialCode).append("`\n");
        msg.append("🔗 *Группа:* ").append(groupName).append("\n\n");

        int codesWithStock = 0;
        for (String code : codes) {
            Map<String, Integer> perStorage = stockMap.get(code);
            if (perStorage == null || perStorage.isEmpty()) continue;

            codesWithStock++;
            msg.append("✅ `").append(code).append("`\n");
            for (Map.Entry<String, Integer> e : perStorage.entrySet()) {
                msg.append("   • ").append(e.getKey()).append(" — *").append(e.getValue()).append("* ед.\n");
            }
        }

        if (codesWithStock == 0) {
            msg.append("❌ В группе нет товаров в наличии");
        }

        sendMessage(chatId, msg.toString());
    }

    public void sendMessageWithAnalogButton(String chatId, String text, String materialCode) {
        if (sender == null) {
            System.out.println("Telegram sender not configured, skipping message with button: " + text);
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
            e.printStackTrace();
        }
    }

    public void sendMessage(String chatId, String text) {
        if (sender == null) {
            System.out.println("Telegram sender not configured, skipping message: " + text);
            return;
        }

        SendMessage message = new SendMessage(chatId, text);
        message.setParseMode("Markdown");
        try {
            sender.execute(message);
        } catch (TelegramApiException e) {
            e.printStackTrace();
        }
    }
}

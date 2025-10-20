package com.wmm.app.service;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.ProductGroup;
import com.wmm.app.domain.ProductGroupLink;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.ProductGroupLinkRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

public class TelegramBotService extends TelegramLongPollingBot {

    @Autowired
    private ProductGroupLinkRepository productGroupLinkRepository;

    @Autowired
    private InventoryCurrentRepository inventoryCurrentRepository;

    private static final String DEFAULT_CHAT_ID = "-1003139822839";
    private final String username;
    private final String token;

    public TelegramBotService(String username, String token) {
        this.username = username;
        this.token = token;
    }

    @Override
    public String getBotUsername() {
        return username;
    }

    @Override
    public String getBotToken() {
        return token;
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String chatId = update.getMessage().getChatId().toString();
            sendMessage(chatId, "👋 Привет! Я бот CLD-WH. Уведомлю, когда какой-то товар закончится.");
        }

        if (update.hasCallbackQuery()) {
            String data = update.getCallbackQuery().getData();
            String chatId = update.getCallbackQuery().getMessage().getChatId().toString();

            if (data.startsWith("/analogs_")) {
                String materialCode = data.substring("/analogs_".length());
                handleAnalogRequest(materialCode, chatId);
            }
        }
    }

    public void notifyOutOfStock(InventoryCurrent ic, String productTitle, String storageType) {
        String message =
            """
            🔴 *НИЗКИЙ ОСТАТОК ТОВАРА*

            🏷️ *Название:* %s
            📝 *Код:* `%s`
            📦 *Остаток:* 0 ед.
            🏢 *Склад:* %s
            """.formatted(productTitle, ic.getMaterial(), storageType);

        sendMessageWithAnalogButton(DEFAULT_CHAT_ID, message, ic.getMaterial());
    }

    public void notifyLowStock(InventoryCurrent ic, String productTitle, int minThreshold) {
        String message =
            """
            🟡 *НИЗКИЙ ОСТАТОК ТОВАРА*

            🏷️ *Название:* %s
            📝 *Код:* `%s`
            📦 *Остаток:* %d ед.
            ⚠️ *Порог:* %d ед.
            """.formatted(productTitle, ic.getMaterial(), ic.getAvailableStock(), minThreshold);

        sendMessageWithAnalogButton(DEFAULT_CHAT_ID, message, ic.getMaterial());
    }

    private void sendMessageWithAnalogButton(String chatId, String text, String materialCode) {
        SendMessage msg = new SendMessage(chatId, text);
        msg.setParseMode("Markdown");

        InlineKeyboardButton analogsBtn = new InlineKeyboardButton();
        analogsBtn.setText("🔍 Показать аналоги");
        analogsBtn.setCallbackData("/analogs_" + materialCode);

        InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
        markup.setKeyboard(List.of(List.of(analogsBtn)));
        msg.setReplyMarkup(markup);

        try {
            execute(msg);
        } catch (TelegramApiException e) {
            e.printStackTrace();
        }
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

    public void sendMessage(String chatId, String text) {
        SendMessage message = new SendMessage(chatId, text);
        message.setParseMode("Markdown");
        try {
            execute(message);
        } catch (TelegramApiException e) {
            e.printStackTrace();
        }
    }
}

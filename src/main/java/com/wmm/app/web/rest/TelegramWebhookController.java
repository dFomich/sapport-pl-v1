package com.wmm.app.web.rest;

import com.wmm.app.service.TelegramBotService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.telegram.telegrambots.meta.api.objects.Update;

@RestController
@RequestMapping("/api/telegram")
public class TelegramWebhookController {

    private final TelegramBotService telegramBotService;

    public TelegramWebhookController(TelegramBotService telegramBotService) {
        this.telegramBotService = telegramBotService;
    }

    @PostMapping("/webhook")
    public void handleWebhook(@RequestBody Update update) {
        if (update.hasCallbackQuery()) {
            String callbackData = update.getCallbackQuery().getData();
            String chatId = update.getCallbackQuery().getMessage().getChatId().toString();

            if (callbackData.startsWith("/analogs_")) {
                String materialCode = callbackData.substring(9);
                telegramBotService.handleAnalogRequest(materialCode, chatId);
            }
        }
    }
}

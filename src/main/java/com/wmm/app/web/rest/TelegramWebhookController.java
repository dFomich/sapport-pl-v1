package com.wmm.app.web.rest;

import com.wmm.app.service.TelegramBotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.telegram.telegrambots.meta.api.objects.Update;

@RestController
@RequestMapping("/api/telegram")
public class TelegramWebhookController {

    private static final Logger log = LoggerFactory.getLogger(TelegramWebhookController.class);

    private final TelegramBotService telegramBotService;

    public TelegramWebhookController(TelegramBotService telegramBotService) {
        this.telegramBotService = telegramBotService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody(required = false) Update update) {
        if (update == null) {
            log.warn("Received empty webhook update");
            return ResponseEntity.badRequest().build();
        }

        if (!update.hasCallbackQuery()) {
            log.debug("Ignore update without callback query: {}", update);
            return ResponseEntity.ok().build();
        }

        var callbackQuery = update.getCallbackQuery();
        if (callbackQuery.getMessage() == null || callbackQuery.getMessage().getChatId() == null) {
            log.warn("Callback query is missing message/chat id: {}", callbackQuery);
            return ResponseEntity.badRequest().build();
        }

        String callbackData = callbackQuery.getData();
        if (callbackData == null || !callbackData.startsWith("/analogs_")) {
            log.debug("Unsupported callback data received: {}", callbackData);
            return ResponseEntity.ok().build();
        }

        String chatId = callbackQuery.getMessage().getChatId().toString();
        String materialCode = callbackData.substring("/analogs_".length());
        telegramBotService.handleAnalogRequest(materialCode, chatId);
        return ResponseEntity.ok().build();
    }
}

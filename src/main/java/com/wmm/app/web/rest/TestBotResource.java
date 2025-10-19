package com.wmm.app.web.rest;

import com.wmm.app.service.TelegramBotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestBotResource {

    private final TelegramBotService telegramBotService;

    public TestBotResource(TelegramBotService telegramBotService) {
        this.telegramBotService = telegramBotService;
    }

    @GetMapping("/api/test-bot")
    public String sendTestMessage(@RequestParam String chatId) {
        telegramBotService.sendMessage(chatId, "✅ CLD-WH бот работает и видит тебя!");
        return "Отправлено сообщение пользователю " + chatId;
    }
}

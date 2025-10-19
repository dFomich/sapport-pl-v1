package com.wmm.app.service;

import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

public class TelegramBotService extends TelegramLongPollingBot {

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
        // Пока бот просто отвечает на любые сообщения
        if (update.hasMessage() && update.getMessage().hasText()) {
            String chatId = update.getMessage().getChatId().toString();
            sendMessage(chatId, "👋 Привет! Я бот CLD-WH. Уведомлю, когда какой-то товар закончится.");
        }
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

package com.wmm.app.config;

import com.wmm.app.service.TelegramBotService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

@Configuration
public class TelegramBotConfig {

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.bot.username}")
    private String botUsername;

    @Bean
    public TelegramBotService telegramBotService() {
        return new TelegramBotService(botUsername, botToken);
    }

    @Bean
    public TelegramBotsApi telegramBotsApi(TelegramBotService botService) throws Exception {
        TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
        botsApi.registerBot(botService);
        return botsApi;
    }
}

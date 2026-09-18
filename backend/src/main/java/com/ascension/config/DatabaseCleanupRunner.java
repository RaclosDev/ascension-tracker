package com.ascension.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseCleanupRunner {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            log.info("Starting database cleanup: removing old emojis from meals...");
            int updated = jdbcTemplate.update("UPDATE meals SET icon = '' WHERE icon IS NOT NULL AND icon != ''");
            log.info("Database cleanup finished. Emptied icons for {} meals.", updated);
        } catch (Exception e) {
            log.error("Failed to clean up meal icons: {}", e.getMessage());
        }
    }
}

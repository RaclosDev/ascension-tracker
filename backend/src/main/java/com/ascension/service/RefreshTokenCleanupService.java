package com.ascension.service;

import com.ascension.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class RefreshTokenCleanupService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupService.class);

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenCleanupService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Borra todos los refresh tokens cuya fecha de expiración ya ha pasado.
     * Se ejecuta todos los días a las 03:00 (hora del servidor).
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        log.info("Starting cleanup of expired refresh tokens...");
        refreshTokenRepository.deleteByExpiryDateBefore(now);
        log.info("Expired refresh tokens cleanup completed");
    }
}

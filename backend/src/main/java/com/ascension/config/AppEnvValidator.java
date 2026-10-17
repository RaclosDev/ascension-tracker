package com.ascension.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class AppEnvValidator {

    private static final Logger log = LoggerFactory.getLogger(AppEnvValidator.class);

    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${app.fatsecret.client-id:}")
    private String fatsecretClientId;

    @Value("${app.fatsecret.client-secret:}")
    private String fatsecretClientSecret;

    @Value("${app.push.vapid-public-key:}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key:}")
    private String vapidPrivateKey;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String corsOrigins;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @PostConstruct
    public void validateEnvVariables() {
        if ("CHANGE_ME".equals(googleClientId) || googleClientId == null || googleClientId.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: google.client-id is not configured correctly. Please set GOOGLE_CLIENT_ID environment variable.");
        }
        
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || "CHANGE_ME".equalsIgnoreCase(geminiApiKey.trim())) {
            log.warn("GEMINI_API_KEY is missing or has default value 'CHANGE_ME'. AI features will fail.");
        }

        boolean fatsecretConfigured = (fatsecretClientId != null && !fatsecretClientId.trim().isEmpty())
                || (fatsecretClientSecret != null && !fatsecretClientSecret.trim().isEmpty());
        if (fatsecretConfigured) {
            if ("CHANGE_ME".equalsIgnoreCase(fatsecretClientId != null ? fatsecretClientId.trim() : "")
                    || "CHANGE_ME".equalsIgnoreCase(fatsecretClientSecret != null ? fatsecretClientSecret.trim() : "")) {
                throw new IllegalStateException("FATAL: FatSecret configuration contains default placeholder 'CHANGE_ME'. Please set valid credentials or remove them.");
            }
        }

        boolean vapidConfigured = (vapidPublicKey != null && !vapidPublicKey.trim().isEmpty())
                || (vapidPrivateKey != null && !vapidPrivateKey.trim().isEmpty());
        if (vapidConfigured) {
            if ("CHANGE_ME".equalsIgnoreCase(vapidPublicKey != null ? vapidPublicKey.trim() : "")
                    || "CHANGE_ME".equalsIgnoreCase(vapidPrivateKey != null ? vapidPrivateKey.trim() : "")) {
                throw new IllegalStateException("FATAL: VAPID push configuration contains default placeholder 'CHANGE_ME'. Please set valid keys or remove them.");
            }
        }
        
        if (java.util.Arrays.asList(activeProfile.split(",")).contains("prod") && corsOrigins.contains("*")) {
            throw new IllegalStateException("FATAL: Wildcard CORS ('*') is not allowed in production profile.");
        }

        log.info("Environment variables validation passed.");
    }
}

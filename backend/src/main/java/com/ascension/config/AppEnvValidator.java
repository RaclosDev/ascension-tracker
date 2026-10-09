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

    @Value("${gemini.api.key:CHANGE_ME}")
    private String geminiApiKey;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String corsOrigins;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @PostConstruct
    public void validateEnvVariables() {
        if ("CHANGE_ME".equals(googleClientId) || googleClientId == null || googleClientId.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: google.client-id is not configured correctly. Please set GOOGLE_CLIENT_ID environment variable.");
        }
        
        if ("CHANGE_ME".equals(geminiApiKey) || geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            log.warn("gemini.api.key is missing or has default value. AI features will fail.");
        }
        
        if (java.util.Arrays.asList(activeProfile.split(",")).contains("prod") && corsOrigins.contains("*")) {
            throw new IllegalStateException("FATAL: Wildcard CORS ('*') is not allowed in production profile.");
        }

        log.info("Environment variables validation passed.");
    }
}

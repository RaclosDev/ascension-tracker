package com.ascension.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.external-api")
public class ExternalApiProperties {

    private ClientConfig fatsecret = new ClientConfig(3, 100L, 5000, 15000);
    private ClientConfig gemini = new ClientConfig(3, 150L, 5000, 15000);

    @Getter
    @Setter
    public static class ClientConfig {
        private int maxAttempts = 3;
        private long initialBackoffMs = 100L;
        private int connectTimeoutMs = 5000;
        private int readTimeoutMs = 15000;

        public ClientConfig() {}

        public ClientConfig(int maxAttempts, long initialBackoffMs, int connectTimeoutMs, int readTimeoutMs) {
            this.maxAttempts = maxAttempts;
            this.initialBackoffMs = initialBackoffMs;
            this.connectTimeoutMs = connectTimeoutMs;
            this.readTimeoutMs = readTimeoutMs;
        }
    }
}

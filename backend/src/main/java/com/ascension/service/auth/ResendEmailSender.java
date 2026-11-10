package com.ascension.service.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends account emails through the Resend API (https://resend.com). Without {@code RESEND_API_KEY}
 * it stays disabled: signing up with a password and resetting it answer 503.
 */
@Component
public class ResendEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailSender.class);
    private static final URI ENDPOINT = URI.create("https://api.resend.com/emails");

    private final String apiKey;
    private final String from;
    private final ObjectMapper objectMapper;
    private final HttpClient client;

    @Autowired
    public ResendEmailSender(@Value("${app.mail.resend-api-key:}") String apiKey,
                             @Value("${app.mail.from:Ascension <no-reply@raclos.es>}") String from,
                             ObjectMapper objectMapper) {
        this(apiKey, from, objectMapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    ResendEmailSender(String apiKey, String from, ObjectMapper objectMapper, HttpClient client) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = from;
        this.objectMapper = objectMapper;
        this.client = client;
    }

    @Override
    public boolean enabled() {
        return !apiKey.isEmpty();
    }

    @Override
    public void send(Email message) {
        if (!enabled()) {
            log.warn("RESEND_API_KEY is not set: message '{}' not sent", message.subject());
            return;
        }
        HttpRequest request = HttpRequest.newBuilder(ENDPOINT)
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json; charset=utf-8")
                .POST(HttpRequest.BodyPublishers.ofString(body(message), StandardCharsets.UTF_8))
                .build();
        client.sendAsync(request, HttpResponse.BodyHandlers.ofString()).whenComplete((response, error) -> {
            if (error != null) {
                log.warn("Message '{}' could not be sent: {}", message.subject(), error.getMessage());
            } else if (response.statusCode() / 100 != 2) {
                log.warn("Resend rejected message '{}': HTTP {}", message.subject(), response.statusCode());
            }
        });
    }

    String body(Email email) {
        return objectMapper.writeValueAsString(Map.of(
                "from", from,
                "to", List.of(email.to()),
                "subject", email.subject(),
                "text", email.text(),
                "html", email.html()));
    }
}

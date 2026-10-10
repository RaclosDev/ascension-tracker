package com.ascension.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class FatSecretClient {
    private static final Logger log = LoggerFactory.getLogger(FatSecretClient.class);
    
    private final RestTemplateBuilder builder;
    private final ObjectMapper objectMapper;
    private final FatSecretSignatureBuilder signatureBuilder;
    private RestTemplate restTemplate;

    public FatSecretClient(RestTemplateBuilder builder, ObjectMapper objectMapper, FatSecretSignatureBuilder signatureBuilder) {
        this.builder = builder;
        this.objectMapper = objectMapper;
        this.signatureBuilder = signatureBuilder;
    }

    @PostConstruct
    public void init() {
        this.restTemplate = builder.setConnectTimeout(Duration.ofSeconds(5)).setReadTimeout(Duration.ofSeconds(15)).build();
    }

    public JsonNode searchFatSecret(String query) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("method", "foods.search");
            params.put("search_expression", query.trim());
            params.put("format", "json");
            params.put("region", "ES");
            params.put("language", "es");
            params.put("max_results", "15");

            String signedUrl = signatureBuilder.sign("https://platform.fatsecret.com/rest/server.api", params);
            java.net.URI uri = java.net.URI.create(signedUrl);
            ResponseEntity<String> response;
            try {
                response = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);
            } catch (org.springframework.web.client.RestClientException e) {
                if (e instanceof org.springframework.web.client.RestClientResponseException rcre) {
                    log.error("FS Search Error: {} - {}", rcre.getStatusCode(), rcre.getResponseBodyAsString());
                } else {
                    log.error("FS Search Network Error: {}", e.getMessage().replaceAll("https://platform.fatsecret.com/rest/server.api.*", "https://platform.fatsecret.com/rest/server.api[REDACTED]"));
                }
                throw new RuntimeException("External API Error");
            }
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("FS Search Error", e);
            throw new RuntimeException("FS Search Error: " + e.getMessage(), e);
        }
    }
}

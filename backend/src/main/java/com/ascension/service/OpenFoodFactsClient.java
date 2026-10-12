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

@Component
public class OpenFoodFactsClient {
    private static final Logger log = LoggerFactory.getLogger(OpenFoodFactsClient.class);
    
    private final RestTemplateBuilder builder;
    private final ObjectMapper objectMapper;
    private RestTemplate restTemplate;

    public OpenFoodFactsClient(RestTemplateBuilder builder, ObjectMapper objectMapper) {
        this.builder = builder;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        this.restTemplate = builder.setConnectTimeout(Duration.ofSeconds(5)).setReadTimeout(Duration.ofSeconds(15)).build();
    }

    public JsonNode searchOpenFoodFacts(String query) {
        try {
            String offUrl = "https://es.openfoodfacts.org/cgi/search.pl?search_terms=" + 
                java.net.URLEncoder.encode(query.trim(), "UTF-8") + "&search_simple=1&action=process&json=true&page_size=15";
            ResponseEntity<String> offResponse;
            try {
                offResponse = restTemplate.exchange(java.net.URI.create(offUrl), HttpMethod.GET, null, String.class);
            } catch (org.springframework.web.client.RestClientException e) {
                if (e instanceof org.springframework.web.client.RestClientResponseException rcre) {
                    log.error("OFF Search Error: {} - {}", rcre.getStatusCode(), rcre.getResponseBodyAsString());
                } else {
                    log.error("OFF Search Network Error: {}", e.getMessage());
                }
                throw new RuntimeException("External API Error");
            }
            return objectMapper.readTree(offResponse.getBody());
        } catch (Exception e) {
            log.error("OFF Search Error", e);
            throw new RuntimeException("OFF Search Error: " + e.getMessage(), e);
        }
    }

    public String searchBarcode(String barcode) {
        if (barcode == null || barcode.isBlank() || !barcode.matches("^\\d{6,14}$")) return "{\"product\": null}";
        try {
            String url = "https://world.openfoodfacts.org/api/v2/product/" + barcode + ".json";
            java.net.URI uri = java.net.URI.create(url);
            ResponseEntity<String> response;
            try {
                response = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);
            } catch (org.springframework.web.client.RestClientException e) {
                if (e instanceof org.springframework.web.client.RestClientResponseException rcre) {
                    log.error("Barcode Search Error: {} - {}", rcre.getStatusCode(), rcre.getResponseBodyAsString());
                } else {
                    log.error("Barcode Search Network Error: {}", e.getMessage());
                }
                throw new RuntimeException("External API Error");
            }
            return response.getBody();
        } catch (Exception e) {
            log.error("Barcode Search Error", e);
            throw new RuntimeException("External API Error: " + e.getMessage(), e);
        }
    }
}

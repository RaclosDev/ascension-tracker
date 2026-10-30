package com.ascension.service;

import com.ascension.config.ExternalApiProperties;
import com.ascension.exception.ExternalApiException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class OpenFoodFactsClient {
    private static final Logger log = LoggerFactory.getLogger(OpenFoodFactsClient.class);
    
    private final RestTemplateBuilder builder;
    private final ObjectMapper objectMapper;
    private final ExternalApiProperties externalApiProperties;
    private RestTemplate restTemplate;

    public OpenFoodFactsClient(RestTemplateBuilder builder, ObjectMapper objectMapper, ExternalApiProperties externalApiProperties) {
        this.builder = builder;
        this.objectMapper = objectMapper;
        this.externalApiProperties = externalApiProperties;
    }

    @PostConstruct
    public void init() {
        var cfg = externalApiProperties.getOpenfoodfacts();
        this.restTemplate = builder
                .connectTimeout(Duration.ofMillis(cfg.getConnectTimeoutMs()))
                .readTimeout(Duration.ofMillis(cfg.getReadTimeoutMs()))
                .build();
    }

    public JsonNode searchOpenFoodFacts(String query) {
        try {
            String offUrl = "https://es.openfoodfacts.org/cgi/search.pl?search_terms=" + 
                URLEncoder.encode(query.trim(), StandardCharsets.UTF_8) + "&search_simple=1&action=process&json=true&page_size=15";
            ResponseEntity<String> offResponse;
            try {
                offResponse = restTemplate.exchange(URI.create(offUrl), HttpMethod.GET, null, String.class);
            } catch (RestClientException e) {
                if (e instanceof RestClientResponseException rcre) {
                    log.error("OFF Search Error: {} - {}", rcre.getStatusCode(), rcre.getResponseBodyAsString());
                } else {
                    log.error("OFF Search Network Error: {}", e.getMessage());
                }
                throw new ExternalApiException("OpenFoodFacts", HttpStatus.BAD_GATEWAY, "External API Error", e);
            }
            return objectMapper.readTree(offResponse.getBody());
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("OFF Search Error", e);
            throw new ExternalApiException("OpenFoodFacts", HttpStatus.BAD_GATEWAY, "OFF Search Error: " + e.getMessage(), e);
        }
    }

    public String searchBarcode(String barcode) {
        if (barcode == null || barcode.isBlank() || !barcode.matches("^\\d{6,14}$")) return "{\"product\": null}";
        try {
            String url = "https://world.openfoodfacts.org/api/v2/product/" + barcode + ".json";
            URI uri = URI.create(url);
            ResponseEntity<String> response;
            try {
                response = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);
            } catch (RestClientException e) {
                if (e instanceof RestClientResponseException rcre) {
                    log.error("Barcode Search Error: {} - {}", rcre.getStatusCode(), rcre.getResponseBodyAsString());
                } else {
                    log.error("Barcode Search Network Error: {}", e.getMessage());
                }
                throw new ExternalApiException("OpenFoodFacts", HttpStatus.BAD_GATEWAY, "External API Error", e);
            }
            return response.getBody();
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Barcode Search Error", e);
            throw new ExternalApiException("OpenFoodFacts", HttpStatus.BAD_GATEWAY, "External API Error: " + e.getMessage(), e);
        }
    }
}

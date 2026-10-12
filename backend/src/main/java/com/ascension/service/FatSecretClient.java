package com.ascension.service;

import com.ascension.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class FatSecretClient {
    private static final Logger log = LoggerFactory.getLogger(FatSecretClient.class);
    private static final int MAX_ATTEMPTS = 3;
    private static final long INITIAL_BACKOFF_MS = 100L;
    
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

    void setRestTemplate(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public JsonNode searchFatSecret(String query) {
        Map<String, String> params = new HashMap<>();
        params.put("method", "foods.search");
        params.put("search_expression", query != null ? query.trim() : "");
        params.put("format", "json");
        params.put("region", "ES");
        params.put("language", "es");
        params.put("max_results", "15");

        String signedUrl;
        try {
            signedUrl = signatureBuilder.sign("https://platform.fatsecret.com/rest/server.api", params);
        } catch (Exception e) {
            log.error("Error signing FatSecret request", e);
            throw new ExternalApiException("FatSecret", HttpStatus.BAD_GATEWAY, "Error firmando solicitud de FatSecret", e);
        }

        URI uri = URI.create(signedUrl);
        ResponseEntity<String> response = null;
        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                response = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);
                lastException = null;
                break;
            } catch (RestClientResponseException rcre) {
                lastException = rcre;
                int statusCode = rcre.getStatusCode().value();
                log.error("FS Search Error on attempt {}/{}: status {} - {}", attempt, MAX_ATTEMPTS, statusCode, rcre.getResponseBodyAsString());
                
                // Do not retry 4xx errors except 429 Too Many Requests
                if (rcre.getStatusCode().is4xxClientError() && statusCode != 429) {
                    throw new ExternalApiException("FatSecret", HttpStatus.BAD_GATEWAY,
                            "Error en la llamada al servicio externo FatSecret: " + statusCode, rcre);
                }

                if (attempt < MAX_ATTEMPTS) {
                    applyBackoff(attempt);
                }
            } catch (ResourceAccessException rae) {
                lastException = rae;
                String errorMsg = rae.getMessage() != null
                        ? rae.getMessage().replaceAll("https://platform.fatsecret.com/rest/server.api.*", "https://platform.fatsecret.com/rest/server.api[REDACTED]")
                        : "Network I/O error";
                log.error("FS Search Network Error on attempt {}/{}: {}", attempt, MAX_ATTEMPTS, errorMsg);

                if (attempt < MAX_ATTEMPTS) {
                    applyBackoff(attempt);
                }
            } catch (Exception e) {
                lastException = e;
                log.error("FS Search unexpected error on attempt {}/{}: {}", attempt, MAX_ATTEMPTS, e.getMessage());
                if (attempt < MAX_ATTEMPTS) {
                    applyBackoff(attempt);
                }
            }
        }

        if (response == null || lastException != null) {
            if (lastException instanceof ResourceAccessException) {
                throw new ExternalApiException("FatSecret", HttpStatus.SERVICE_UNAVAILABLE,
                        "Servicio externo FatSecret no disponible o tiempo de espera agotado", lastException);
            }
            if (lastException instanceof RestClientResponseException rcre) {
                if (rcre.getStatusCode().value() == 429) {
                    throw new ExternalApiException("FatSecret", HttpStatus.SERVICE_UNAVAILABLE,
                            "Límite de cuota excedido en FatSecret (429)", lastException);
                }
                if (rcre.getStatusCode().is5xxServerError()) {
                    throw new ExternalApiException("FatSecret", HttpStatus.BAD_GATEWAY,
                            "Servicio externo FatSecret respondió con error 5xx: " + rcre.getStatusCode().value(), lastException);
                }
            }
            throw new ExternalApiException("FatSecret", HttpStatus.BAD_GATEWAY,
                    "Error de comunicación con el servicio externo FatSecret", lastException);
        }

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("Error parsing FatSecret response", e);
            throw new ExternalApiException("FatSecret", HttpStatus.BAD_GATEWAY, "Error al parsear respuesta JSON de FatSecret", e);
        }
    }

    private void applyBackoff(int attempt) {
        long backoffMs = INITIAL_BACKOFF_MS * (1L << (attempt - 1));
        try {
            Thread.sleep(backoffMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new ExternalApiException("FatSecret", HttpStatus.SERVICE_UNAVAILABLE, "Operación interrumpida durante reintento", ie);
        }
    }
}

package com.ascension.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class FoodExternalService {

    private static final Logger log = LoggerFactory.getLogger(FoodExternalService.class);
    
    private final OpenFoodFactsClient offClient;
    private final FatSecretClient fatSecretClient;
    private final FatSecretResponseMapper fatSecretMapper;
    private final ObjectMapper objectMapper;

    @Cacheable(value = "foodSearch", key = "'q:' + #query", unless = "#result == null or #result.contains('error')")
    public String searchOpenFoodFacts(String query) {
        if (query == null || query.isBlank() || query.length() > 100) return "{\"products\": []}";
        try {
            com.fasterxml.jackson.databind.node.ArrayNode combinedProducts = objectMapper.createArrayNode();

            java.util.concurrent.CompletableFuture<JsonNode> offFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    return offClient.searchOpenFoodFacts(query);
                } catch (Exception e) {
                    log.warn("OFF Search Failed: {}", e.getMessage());
                    return null;
                }
            });

            java.util.concurrent.CompletableFuture<JsonNode> fsFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    JsonNode fsRawRoot = fatSecretClient.searchFatSecret(query);
                    String fsMapped = fatSecretMapper.mapFatSecretToOpenFoodFacts(fsRawRoot, false);
                    return objectMapper.readTree(fsMapped);
                } catch (Exception e) {
                    log.warn("FatSecret Search Failed: {}", e.getMessage());
                    return null;
                }
            });

            try {
                java.util.concurrent.CompletableFuture.allOf(offFuture, fsFuture).get(4, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("External food APIs timeout or interrupted: {}", e.getMessage());
                if (!offFuture.isDone()) {
                    offFuture.cancel(true);
                }
                if (!fsFuture.isDone()) {
                    fsFuture.cancel(true);
                }
            }

            JsonNode offRoot = offFuture.getNow(null);
            JsonNode fsRoot = fsFuture.getNow(null);

            boolean offSuccess = false;
            if (offRoot != null) {
                JsonNode offProducts = offRoot.path("products");
                if (offProducts.isArray()) {
                    combinedProducts.addAll((com.fasterxml.jackson.databind.node.ArrayNode) offProducts);
                    offSuccess = true;
                }
            }

            boolean fsSuccess = false;
            if (fsRoot != null) {
                JsonNode fsProducts = fsRoot.path("products");
                if (fsProducts.isArray()) {
                    combinedProducts.addAll((com.fasterxml.jackson.databind.node.ArrayNode) fsProducts);
                    fsSuccess = true;
                }
            }

            if (!offSuccess && !fsSuccess) {
                throw new com.ascension.exception.ExternalApiException("ExternalFoodApis", org.springframework.http.HttpStatus.BAD_GATEWAY, "Both external food APIs failed or timed out");
            }

            com.fasterxml.jackson.databind.node.ObjectNode finalRoot = objectMapper.createObjectNode();
            finalRoot.set("products", combinedProducts);
            return objectMapper.writeValueAsString(finalRoot);

        } catch (com.ascension.exception.ExternalApiException eae) {
            throw eae;
        } catch (Exception e) {
            log.error("Error combining external APIs", e);
            throw new RuntimeException("External API Error: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "foodSearch", key = "'b:' + #barcode", unless = "#result == null or #result.contains('error')")
    public String searchBarcode(String barcode) {
        return offClient.searchBarcode(barcode);
    }
}

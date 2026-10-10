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

            // 1. OpenFoodFacts
            try {
                JsonNode offRoot = offClient.searchOpenFoodFacts(query);
                JsonNode offProducts = offRoot.path("products");
                if (offProducts.isArray()) {
                    combinedProducts.addAll((com.fasterxml.jackson.databind.node.ArrayNode) offProducts);
                }
            } catch (Exception e) {
                log.warn("OFF Search Failed: {}", e.getMessage());
            }

            // 2. FatSecret
            try {
                JsonNode fsRawRoot = fatSecretClient.searchFatSecret(query);
                String fsMapped = fatSecretMapper.mapFatSecretToOpenFoodFacts(fsRawRoot, false);
                JsonNode fsRoot = objectMapper.readTree(fsMapped);
                JsonNode fsProducts = fsRoot.path("products");
                if (fsProducts.isArray()) {
                    combinedProducts.addAll((com.fasterxml.jackson.databind.node.ArrayNode) fsProducts);
                }
            } catch (Exception e) {
                log.warn("FatSecret Search Failed: {}", e.getMessage());
            }

            com.fasterxml.jackson.databind.node.ObjectNode finalRoot = objectMapper.createObjectNode();
            finalRoot.set("products", combinedProducts);
            return objectMapper.writeValueAsString(finalRoot);

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

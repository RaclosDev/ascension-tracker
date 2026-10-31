package com.ascension.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
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
    private final ExternalApiExecution execution;

    @Cacheable(value = "foodSearch", key = "'q:' + #query", unless = "#result == null or #result.contains('error')")
    public String searchOpenFoodFacts(String query) {
        if (query == null || query.isBlank() || query.length() > 100) return "{\"products\": []}";
        try {
            tools.jackson.databind.node.ArrayNode combinedProducts = objectMapper.createArrayNode();

            var results = execution.<JsonNode>search(java.util.List.of(
                    () -> offClient.searchOpenFoodFacts(query),
                    () -> objectMapper.readTree(fatSecretMapper.mapFatSecretToOpenFoodFacts(
                            fatSecretClient.searchFatSecret(query), false))), 4000);
            JsonNode offRoot = completedResult(results.get(0));
            JsonNode fsRoot = completedResult(results.get(1));

            boolean offSuccess = false;
            if (offRoot != null) {
                JsonNode offProducts = offRoot.path("products");
                if (offProducts.isArray()) {
                    combinedProducts.addAll((tools.jackson.databind.node.ArrayNode) offProducts);
                    offSuccess = true;
                }
            }

            boolean fsSuccess = false;
            if (fsRoot != null) {
                JsonNode fsProducts = fsRoot.path("products");
                if (fsProducts.isArray()) {
                    combinedProducts.addAll((tools.jackson.databind.node.ArrayNode) fsProducts);
                    fsSuccess = true;
                }
            }

            if (!offSuccess && !fsSuccess) {
                throw new com.ascension.exception.ExternalApiException("ExternalFoodApis", org.springframework.http.HttpStatus.BAD_GATEWAY, "Both external food APIs failed or timed out");
            }

            tools.jackson.databind.node.ObjectNode finalRoot = objectMapper.createObjectNode();
            finalRoot.set("products", combinedProducts);
            return objectMapper.writeValueAsString(finalRoot);

        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new com.ascension.exception.ExternalApiException("ExternalFoodApis", org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Food search interrupted", ex);
        } catch (com.ascension.exception.ExternalApiException eae) {
            throw eae;
        } catch (Exception e) {
            log.error("Error combining external APIs", e);
            throw new RuntimeException("External API Error: " + e.getMessage(), e);
        }
    }

    private JsonNode completedResult(java.util.concurrent.Future<JsonNode> result) throws InterruptedException {
        if (result.isCancelled()) return null;
        try {
            return result.get();
        } catch (java.util.concurrent.ExecutionException ex) {
            log.warn("Food provider failed: {}", ex.getCause().getClass().getSimpleName());
            return null;
        }
    }

    @Cacheable(value = "foodSearch", key = "'b:' + #barcode", unless = "#result == null or #result.contains('error')")
    public String searchBarcode(String barcode) {
        return offClient.searchBarcode(barcode);
    }
}

package com.ascension.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
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
    private final CacheManager cacheManager;

    /**
     * Cached for 24 h only when both providers answered: a result with one provider down is partial and must
     * not hide the missing products for a day. The key ignores case and extra spaces.
     */
    public String searchOpenFoodFacts(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank() || rawQuery.length() > 100) return "{\"products\": []}";
        String query = rawQuery.trim().replaceAll("\s+", " ").toLowerCase(java.util.Locale.ROOT);
        Cache cache = cacheManager.getCache("foodSearch");
        String key = "q:" + query;
        String cached = cache != null ? cache.get(key, String.class) : null;
        if (cached != null) return cached;
        boolean[] complete = new boolean[1];
        String body = fetchCombined(query, complete);
        if (cache != null && complete[0]) cache.put(key, body);
        return body;
    }

    private String fetchCombined(String query, boolean[] complete) {
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

            complete[0] = offSuccess && fsSuccess;
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
        } catch (RuntimeException e) {
            log.error("Error combining external APIs", e);
            throw new com.ascension.exception.ExternalApiException("ExternalFoodApis",
                    org.springframework.http.HttpStatus.BAD_GATEWAY, "Error combinando las APIs externas de alimentos", e);
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

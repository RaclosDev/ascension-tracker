package com.ascension.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import jakarta.annotation.PostConstruct;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class FoodExternalService {

    private static final Logger log = LoggerFactory.getLogger(FoodExternalService.class);
    
    private String buildErrorResponse(String key, boolean isArray) {
        ObjectNode root = objectMapper.createObjectNode();
        if (isArray) root.putArray(key);
        else root.putNull(key);
        root.put("debug_error", "An internal error occurred.");
        try { return objectMapper.writeValueAsString(root); } 
        catch (Exception ex) { return "{\"" + key + "\": " + (isArray ? "[]" : "null") + "}"; }
    }

    private RestTemplate restTemplate;
    @PostConstruct
    public void init() {
        this.restTemplate = builder.setConnectTimeout(Duration.ofSeconds(5)).setReadTimeout(Duration.ofSeconds(15)).build();
        this.objectMapper = new ObjectMapper();
    }

    private final RestTemplateBuilder builder;
    private ObjectMapper objectMapper;

    @Value("${app.fatsecret.client-id}")
    private String clientId;

    @Value("${app.fatsecret.client-secret}")
    private String clientSecret;

    
    private String oauthEncode(String value) throws Exception {
        return URLEncoder.encode(value, StandardCharsets.UTF_8.name())
                .replace("+", "%20")
                .replace("*", "%2A")
                .replace("%7E", "~");
    }

    private String getOAuth1Url(String url, Map<String, String> queryParams) {
        try {
            String cId = clientId != null ? clientId.trim() : "";
            String cSec = clientSecret != null ? clientSecret.trim() : "";
            String consumerSecret = cSec + "&"; 
            String nonce = UUID.randomUUID().toString().replaceAll("-", "");
            String timestamp = String.valueOf(Instant.now().getEpochSecond());

            Map<String, String> allParams = new HashMap<>(queryParams);
            allParams.put("oauth_consumer_key", cId);
            allParams.put("oauth_nonce", nonce);
            allParams.put("oauth_signature_method", "HMAC-SHA1");
            allParams.put("oauth_timestamp", timestamp);
            allParams.put("oauth_version", "1.0");

            List<String> keys = new ArrayList<>(allParams.keySet());
            Collections.sort(keys);

            StringBuilder paramString = new StringBuilder();
            for (int i = 0; i < keys.size(); i++) {
                if (i > 0) paramString.append("&");
                paramString.append(oauthEncode(keys.get(i))).append("=").append(oauthEncode(allParams.get(keys.get(i))));
            }

            String baseString = "GET&" + oauthEncode(url) + "&" + oauthEncode(paramString.toString());

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(consumerSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            String signature = Base64.getEncoder().encodeToString(mac.doFinal(baseString.getBytes(StandardCharsets.UTF_8)));

            return url + "?" + paramString.toString() + "&oauth_signature=" + oauthEncode(signature);
        } catch (Exception e) {
            log.error("Error", e);
            return url;
        }
    }

    public String searchOpenFoodFacts(String query) {
        if (query == null || query.isBlank()) return "{\"products\": []}";
        try {
            com.fasterxml.jackson.databind.node.ArrayNode combinedProducts = objectMapper.createArrayNode();

            // 1. OpenFoodFacts (Supermercados de Espaa)
            try {
                String offUrl = "https://es.openfoodfacts.org/cgi/search.pl?search_terms=" + 
                    java.net.URLEncoder.encode(query.trim(), "UTF-8") + "&search_simple=1&action=process&json=true&page_size=15";
                ResponseEntity<String> offResponse = restTemplate.exchange(java.net.URI.create(offUrl), HttpMethod.GET, null, String.class);
                JsonNode offRoot = objectMapper.readTree(offResponse.getBody());
                JsonNode offProducts = offRoot.path("products");
                if (offProducts.isArray()) {
                    combinedProducts.addAll((com.fasterxml.jackson.databind.node.ArrayNode) offProducts);
                }
            } catch (Exception e) {
                log.error("OFF Search Error", e);
            }

            // 2. FatSecret (Alimentos genricos y restaurantes)
            try {
                Map<String, String> params = new HashMap<>();
                params.put("method", "foods.search");
                params.put("search_expression", query.trim());
                params.put("format", "json");
                params.put("region", "ES");
                params.put("language", "es");
                params.put("max_results", "15");

                String signedUrl = getOAuth1Url("https://platform.fatsecret.com/rest/server.api", params);
                java.net.URI uri = java.net.URI.create(signedUrl);
                ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);
                String fsMapped = mapFatSecretToOpenFoodFacts(objectMapper.readTree(response.getBody()), false);
                JsonNode fsRoot = objectMapper.readTree(fsMapped);
                JsonNode fsProducts = fsRoot.path("products");
                if (fsProducts.isArray()) {
                    combinedProducts.addAll((com.fasterxml.jackson.databind.node.ArrayNode) fsProducts);
                }
            } catch (Exception e) {
                log.error("FS Search Error", e);
            }

            com.fasterxml.jackson.databind.node.ObjectNode finalRoot = objectMapper.createObjectNode();
            finalRoot.set("products", combinedProducts);
            return objectMapper.writeValueAsString(finalRoot);

        } catch (Exception e) {
            log.error("Error", e);
            return buildErrorResponse("products", true);
        }
    }

    public String searchBarcode(String barcode) {
        if (barcode == null || barcode.isBlank()) return "{\"product\": null}";
        try {
            String url = "https://world.openfoodfacts.org/api/v2/product/" + barcode + ".json";
            java.net.URI uri = java.net.URI.create(url);
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, null, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error", e);
            return buildErrorResponse("product", false);
        }
    }

    private String mapFatSecretToOpenFoodFacts(JsonNode root, boolean singleProduct) {
        try {
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText("Unknown");
                String cSec = clientSecret != null ? clientSecret : "";
                String debugInfo = errorMsg + " | SecLen: " + cSec.length() + " | Prefix: " + (cSec.length() > 4 ? cSec.substring(0, 4) : "null") + " | Time: " + Instant.now().getEpochSecond();
                log.error("FatSecret API Error: {}", debugInfo);
                return singleProduct ? buildErrorResponse("product", false) : buildErrorResponse("products", true);
            }
            ObjectNode openFoodFactsRoot = objectMapper.createObjectNode();
            
            if (singleProduct) {
                JsonNode food = root.path("food");
                if (food.isMissingNode()) return "{\"product\": null}";
                openFoodFactsRoot.set("product", mapSingleFood(food));
            } else {
                ArrayNode mappedProducts = objectMapper.createArrayNode();
                JsonNode foods = root.path("foods").path("food");
                if (foods.isArray()) {
                    for (JsonNode food : foods) mappedProducts.add(mapSingleFood(food));
                } else if (foods.isObject()) {
                    mappedProducts.add(mapSingleFood(foods));
                }
                openFoodFactsRoot.set("products", mappedProducts);
            }
            return objectMapper.writeValueAsString(openFoodFactsRoot);
        } catch (Exception e) {
            return singleProduct ? "{\"product\": null}" : "{\"products\": []}";
        }
    }

    private ObjectNode mapSingleFood(JsonNode food) {
        ObjectNode product = objectMapper.createObjectNode();
        product.put("product_name", food.path("food_name").asText(""));
        product.put("brands", food.path("brand_name").asText(""));
        product.put("code", food.path("food_id").asText(""));
        
        ObjectNode nutriments = objectMapper.createObjectNode();
        JsonNode servings = food.path("servings").path("serving");
        
        if (!servings.isMissingNode()) {
            JsonNode targetServing = null;
            if (servings.isArray() && servings.size() > 0) {
                for (JsonNode serving : servings) {
                    String unit = serving.path("metric_serving_unit").asText("");
                    if (("g".equalsIgnoreCase(unit) || "ml".equalsIgnoreCase(unit)) && "100.000".equals(serving.path("metric_serving_amount").asText())) {
                        targetServing = serving;
                        break;
                    }
                }
                if (targetServing == null) targetServing = servings.get(0);
            } else if (servings.isObject()) {
                targetServing = servings;
            }

            if (targetServing != null) {
                double metricAmount = targetServing.path("metric_serving_amount").asDouble(100.0);
                double scale = metricAmount > 0 ? (100.0 / metricAmount) : 1.0;
                nutriments.put("energy-kcal_100g", targetServing.path("calories").asDouble(0) * scale);
                nutriments.put("proteins_100g", targetServing.path("protein").asDouble(0) * scale);
                nutriments.put("carbohydrates_100g", targetServing.path("carbohydrate").asDouble(0) * scale);
                nutriments.put("fat_100g", targetServing.path("fat").asDouble(0) * scale);
            }
        } else {
            String desc = food.path("food_description").asText("");
            double kcal = extractRegex(desc, "(?i)Calor[íi]as?\\s*:\\s*([0-9.]+)");
            double fat = extractRegex(desc, "(?i)Grasas?\\s*:\\s*([0-9.]+)");
            double carbs = extractRegex(desc, "(?i)Carbh?\\s*:\\s*([0-9.]+)");
            if (carbs == 0) carbs = extractRegex(desc, "(?i)Carbohidratos?\\s*:\\s*([0-9.]+)");
            double protein = extractRegex(desc, "(?i)Prot(?:e[íi]nas?)?\\s*:\\s*([0-9.]+)");
            
            if (kcal == 0 && fat == 0) { 
                kcal = extractRegex(desc, "(?i)Calories\\s*:\\s*([0-9.]+)");
                fat = extractRegex(desc, "(?i)Fat\\s*:\\s*([0-9.]+)");
                carbs = extractRegex(desc, "(?i)Carbs?\\s*:\\s*([0-9.]+)");
                protein = extractRegex(desc, "(?i)Protein\\s*:\\s*([0-9.]+)");
            }
            double weight = extractRegex(desc, "(?i)Por\\s+([0-9.]+)\\s*g");
            if (weight == 0) weight = extractRegex(desc, "(?i)Per\\s+([0-9.]+)\\s*g");
            double scale = weight > 0 ? (100.0 / weight) : 1.0;

            nutriments.put("energy-kcal_100g", kcal * scale);
            nutriments.put("proteins_100g", protein * scale);
            nutriments.put("carbohydrates_100g", carbs * scale);
            nutriments.put("fat_100g", fat * scale);
        }

        product.set("nutriments", nutriments);
        return product;
    }

    private double extractRegex(String text, String pattern) {
        Matcher m = Pattern.compile(pattern).matcher(text);
        return m.find() ? Double.parseDouble(m.group(1)) : 0;
    }
}

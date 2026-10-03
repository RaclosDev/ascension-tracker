package com.ascension.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiApiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiApiClient.class);

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GEMINI_MODEL:}")
    private String geminiModel;

    private final RestTemplateBuilder builder;
    private RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedWorkingUrl = null;
    private volatile List<String> cachedModelCandidates = null;

    @PostConstruct
    public void init() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        this.restTemplate = builder.requestFactory(() -> factory).build();
    }

    public String executePrompt(String prompt) {
        return executePrompt(prompt, null, null);
    }

    public String getActiveModelName() {
        if (cachedWorkingUrl != null) {
            try {
                int start = cachedWorkingUrl.indexOf("models/") + 7;
                int end = cachedWorkingUrl.indexOf(":", start);
                return cachedWorkingUrl.substring(start, end);
            } catch (Exception e) {
                return "gemini-unknown";
            }
        }
        return "detecting...";
    }

    public String executePrompt(String prompt, String base64Image, String mimeType) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured.");
        }

        String apiKey = geminiApiKey.trim();

        if (cachedWorkingUrl != null) {
            try {
                return cleanJsonResponse(callApiEndpoint(cachedWorkingUrl, prompt, base64Image, mimeType));
            } catch (Exception e) {
                cachedWorkingUrl = null; 
            }
        }

        List<String> modelCandidates = cachedModelCandidates;
        if (modelCandidates == null) {
            synchronized (this) {
                modelCandidates = cachedModelCandidates;
                if (modelCandidates == null) {
                    modelCandidates = discoverModels(apiKey);
                    cachedModelCandidates = modelCandidates;
                }
            }
        }

        Exception lastException = null;
        for (String modelName : modelCandidates) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
            try {
                String responseText = callApiEndpoint(url, prompt, base64Image, mimeType);
                cachedWorkingUrl = url;
                return cleanJsonResponse(responseText);
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw new RuntimeException("All Gemini models failed. Last error: " + (lastException != null ? lastException.getMessage() : "unknown"));
    }

    private List<String> discoverModels(String apiKey) {
        List<String> candidates = new ArrayList<>();
        if (geminiModel != null && !geminiModel.trim().isEmpty()) {
            candidates.add(geminiModel.trim());
        }
        
        candidates.add("gemini-3.8-flash");
        candidates.add("gemini-3.7-flash");
        candidates.add("gemini-3.5-flash-lite");
        candidates.add("gemini-3.1-flash-lite");

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode models = root.path("models");
            if (models.isArray()) {
                for (JsonNode model : models) {
                    String name = model.path("name").asText();
                    if (name.startsWith("models/")) {
                        name = name.substring(7);
                    }
                    if (name.contains("gemini") && !candidates.contains(name)) {
                        candidates.add(name);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to discover models, falling back to static list. Error: {}", e.getMessage());
        }
        return candidates;
    }

    private String callApiEndpoint(String url, String prompt, String base64Image, String mimeType) throws Exception {
        Map<String, Object> request = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentMap = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);

        if (base64Image != null && mimeType != null) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", base64Image);

            Map<String, Object> inlineDataPart = new HashMap<>();
            inlineDataPart.put("inlineData", inlineData);
            parts.add(inlineDataPart);
        }

        contentMap.put("parts", parts);
        contents.add(contentMap);
        request.put("contents", contents);

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.1);
        request.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode firstCandidate = candidates.get(0);
            JsonNode partsNode = firstCandidate.path("content").path("parts");
            if (partsNode.isArray() && partsNode.size() > 0) {
                return partsNode.get(0).path("text").asText();
            }
        }

        throw new RuntimeException("Unexpected response structure: " + response.getBody());
    }

    private String cleanJsonResponse(String response) {
        if (response == null) return "{}";
        
        int firstBrace = response.indexOf('{');
        int firstBracket = response.indexOf('[');
        
        int start = -1;
        if (firstBrace != -1 && firstBracket != -1) {
            start = Math.min(firstBrace, firstBracket);
        } else if (firstBrace != -1) {
            start = firstBrace;
        } else if (firstBracket != -1) {
            start = firstBracket;
        }
        
        if (start == -1) return response.trim();
        
        int lastBrace = response.lastIndexOf('}');
        int lastBracket = response.lastIndexOf(']');
        
        int end = -1;
        if (lastBrace != -1 && lastBracket != -1) {
            end = Math.max(lastBrace, lastBracket);
        } else if (lastBrace != -1) {
            end = lastBrace;
        } else if (lastBracket != -1) {
            end = lastBracket;
        }
        
        if (end != -1 && end >= start) {
            return response.substring(start, end + 1);
        }
        
        return response.trim();
    }
}

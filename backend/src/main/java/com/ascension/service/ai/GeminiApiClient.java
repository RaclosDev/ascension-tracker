package com.ascension.service.ai;

import com.ascension.config.ExternalApiProperties;
import com.ascension.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiApiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiApiClient.class);
    public static final long TOTAL_REQUEST_DEADLINE_MS = 35_000L;
    public static final long MODEL_CACHE_TTL_MS = 3600_000L; // 1 hour TTL
    public static final int MAX_MODELS_PER_REQUEST = 3;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GEMINI_MODEL:}")
    private String geminiModel;

    @Value("${app.gemini.fallback-models:gemini-flash-lite-latest,gemini-3-flash-preview,gemini-3.5-flash-lite,gemini-flash-latest,gemini-3.8-flash}")
    private String fallbackModels = "gemini-flash-lite-latest,gemini-3-flash-preview,gemini-3.5-flash-lite,gemini-flash-latest,gemini-3.8-flash";

    private final RestTemplateBuilder builder;
    private final ExternalApiProperties properties;
    private RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedWorkingUrl = null;
    private volatile List<String> cachedModelCandidates = null;
    private volatile long modelCacheExpiresAt = 0L;

    public GeminiApiClient(RestTemplateBuilder builder, ExternalApiProperties properties) {
        this.builder = builder;
        this.properties = properties != null ? properties : new ExternalApiProperties();
    }

    @PostConstruct
    public void init() {
        var cfg = properties.getGemini();
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(cfg.getConnectTimeoutMs());
        factory.setReadTimeout(cfg.getReadTimeoutMs());
        this.restTemplate = builder.requestFactory(() -> factory).build();
    }

    private boolean matchesDiscovered(String pref, List<String> discovered) {
        return discovered.contains(pref) || discovered.stream().anyMatch(d -> d.startsWith(pref) || pref.startsWith(d));
    }

    private boolean isTextGenerationModel(String name) {
        if (name == null || name.isBlank()) return false;
        String lower = name.toLowerCase();
        return !(lower.contains("tts") || lower.contains("audio") || lower.contains("embed")
                || lower.contains("realtime") || lower.contains("live") || lower.contains("image")
                || lower.contains("banana") || lower.contains("transcribe") || lower.contains("robotics")
                || lower.contains("lyria") || lower.contains("computer-use") || lower.contains("deep-research")
                || lower.contains("customtools") || lower.contains("antigravity"));
    }

    private String sanitizeApiKey(String key) {
        if (key == null) {
            return null;
        }
        String trimmed = key.trim();
        if (trimmed.length() >= 2) {
            char first = trimmed.charAt(0);
            char last = trimmed.charAt(trimmed.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
            }
        }
        return trimmed;
    }

    void setRestTemplate(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    void setGeminiApiKey(String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
    }

    void setFallbackModels(String fallbackModels) {
        this.fallbackModels = fallbackModels;
    }

    void invalidateModelCache() {
        this.cachedModelCandidates = null;
        this.modelCacheExpiresAt = 0L;
        this.cachedWorkingUrl = null;
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
        String apiKey = sanitizeApiKey(geminiApiKey);
        if (apiKey == null || apiKey.isEmpty()) {
            throw new ExternalApiException("Gemini", HttpStatus.SERVICE_UNAVAILABLE, "GEMINI_API_KEY is not configured.");
        }
        long deadline = System.currentTimeMillis() + TOTAL_REQUEST_DEADLINE_MS;

        if (cachedWorkingUrl != null) {
            try {
                checkDeadline(deadline);
                return cleanJsonResponse(callApiEndpointWithRetry(cachedWorkingUrl, prompt, base64Image, mimeType, deadline));
            } catch (Exception e) {
                if (isUnrecoverableClientError(e)) {
                    log.warn("Gemini rejected cached request with non-retryable client error: {}", e.getMessage());
                    throw toExternalApiException(e);
                }
                log.warn("Cached Gemini model failed, invalidating cache and discovering models: {}", e.getMessage());
                cachedWorkingUrl = null;
            }
        }

        long now = System.currentTimeMillis();
        List<String> modelCandidates = cachedModelCandidates;
        if (modelCandidates == null || now > modelCacheExpiresAt) {
            synchronized (this) {
                modelCandidates = cachedModelCandidates;
                if (modelCandidates == null || System.currentTimeMillis() > modelCacheExpiresAt) {
                    modelCandidates = discoverModels(apiKey);
                    cachedModelCandidates = modelCandidates;
                    modelCacheExpiresAt = System.currentTimeMillis() + MODEL_CACHE_TTL_MS;
                }
            }
        }

        List<String> modelsToTry = modelCandidates.stream().limit(MAX_MODELS_PER_REQUEST).toList();
        Exception lastException = null;

        for (String modelName : modelsToTry) {
            checkDeadline(deadline);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";
            try {
                String responseText = callApiEndpointWithRetry(url, prompt, base64Image, mimeType, deadline);
                cachedWorkingUrl = url;
                return cleanJsonResponse(responseText);
            } catch (Exception e) {
                lastException = e;
                if (isUnrecoverableClientError(e)) {
                    log.warn("Gemini model {} rejected request with non-retryable client error: {}", modelName, e.getMessage());
                    throw toExternalApiException(e);
                }
                log.warn("Gemini model {} failed: {}", modelName, e.getMessage());
            }
        }

        throw toExternalApiException(lastException);
    }

    private boolean isUnrecoverableClientError(Exception e) {
        if (e instanceof ExternalApiException eae) {
            int code = eae.getStatus() != null ? eae.getStatus().value() : 500;
            return eae.getStatus() != null && eae.getStatus().is4xxClientError() && code != 429 && code != 404;
        }
        if (e instanceof RestClientResponseException rcre) {
            int code = rcre.getStatusCode().value();
            if (code == 429 || code == 404) {
                return false;
            }
            if (code == 400) {
                String body = rcre.getResponseBodyAsString().toLowerCase();
                if (body.contains("model") || body.contains("not supported") || body.contains("not found")
                        || body.contains("unsupported") || body.contains("modalit")) {
                    return false;
                }
            }
            return rcre.getStatusCode().is4xxClientError();
        }
        return false;
    }

    private ExternalApiException toExternalApiException(Exception lastException) {
        if (lastException instanceof ExternalApiException eae) {
            return eae;
        }
        if (lastException instanceof ResourceAccessException) {
            return new ExternalApiException("Gemini", HttpStatus.SERVICE_UNAVAILABLE,
                    "Servicio de IA de Gemini no disponible o tiempo de espera agotado", lastException);
        }
        if (lastException instanceof RestClientResponseException rcre) {
            String detailedMsg = extractErrorMessage(rcre);
            if (rcre.getStatusCode().value() == 429) {
                return new ExternalApiException("Gemini", HttpStatus.SERVICE_UNAVAILABLE,
                        "Límite de cuota o tasa excedido en Gemini API (429)", lastException);
            }
            if (rcre.getStatusCode().is5xxServerError()) {
                return new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY,
                        "Servicio de IA de Gemini respondió con error 5xx: " + rcre.getStatusCode().value(), lastException);
            }
            if (rcre.getStatusCode().is4xxClientError()) {
                return new ExternalApiException("Gemini", HttpStatus.valueOf(rcre.getStatusCode().value()),
                        "Gemini API (" + rcre.getStatusCode().value() + "): " + detailedMsg, lastException);
            }
        }
        return new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY,
                "Todos los modelos de Gemini fallaron. Último error: " + (lastException != null ? lastException.getMessage() : "desconocido"), lastException);
    }

    private String extractErrorMessage(RestClientResponseException rcre) {
        try {
            String body = rcre.getResponseBodyAsString();
            if (body != null && !body.isBlank()) {
                JsonNode root = objectMapper.readTree(body);
                JsonNode msgNode = root.path("error").path("message");
                if (!msgNode.isMissingNode() && !msgNode.asText().isBlank()) {
                    return msgNode.asText();
                }
            }
        } catch (Exception ignored) {
            // Fallback to status text
        }
        return rcre.getStatusText();
    }

    private void checkDeadline(long deadline) {
        if (System.currentTimeMillis() >= deadline) {
            throw new ExternalApiException("Gemini", HttpStatus.GATEWAY_TIMEOUT,
                    "Deadline de petición excedido (35s) para Gemini API");
        }
    }

    private List<String> discoverModels(String apiKey) {
        List<String> candidates = new ArrayList<>();
        if (geminiModel != null && !geminiModel.trim().isEmpty() && isTextGenerationModel(geminiModel)) {
            candidates.add(geminiModel.trim());
        }

        List<String> discovered = new ArrayList<>();
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models";
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("x-goog-api-key", apiKey);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode models = root.path("models");
            if (models.isArray()) {
                for (JsonNode model : models) {
                    boolean supportsGenerateContent = false;
                    JsonNode supportedMethods = model.path("supportedGenerationMethods");
                    if (supportedMethods.isArray()) {
                        for (JsonNode method : supportedMethods) {
                            if ("generateContent".equalsIgnoreCase(method.asText())) {
                                supportsGenerateContent = true;
                                break;
                            }
                        }
                    }

                    if (supportsGenerateContent) {
                        String name = model.path("name").asText();
                        if (name.startsWith("models/")) {
                            name = name.substring(7);
                        }
                        if (name.contains("gemini") && isTextGenerationModel(name)) {
                            discovered.add(name);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to discover models, using configured preferred models. Error: {}", e.getMessage());
        }

        // Priority 1: Configured fallback models matching discovered models or if discovery failed
        List<String> preferred = new ArrayList<>();
        if (fallbackModels != null && !fallbackModels.isBlank()) {
            Arrays.stream(fallbackModels.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty() && isTextGenerationModel(s))
                    .forEach(preferred::add);
        }

        for (String pref : preferred) {
            if (!candidates.contains(pref) && (discovered.isEmpty() || matchesDiscovered(pref, discovered))) {
                candidates.add(pref);
            }
        }

        // Priority 2: Discovered text models that contain "flash"
        for (String disc : discovered) {
            if (disc.contains("flash") && !candidates.contains(disc)) {
                candidates.add(disc);
            }
        }

        // Priority 3: Other discovered text models
        for (String disc : discovered) {
            if (!candidates.contains(disc)) {
                candidates.add(disc);
            }
        }

        // Priority 4: Ensure preferred fallbacks are included even if discovery returned non-matching models
        for (String pref : preferred) {
            if (!candidates.contains(pref)) {
                candidates.add(pref);
            }
        }

        return candidates;
    }

    private String callApiEndpointWithRetry(String url, String prompt, String base64Image, String mimeType, long deadline) throws Exception {
        Exception lastException = null;
        int maxAttempts = properties.getGemini().getMaxAttempts();

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            checkDeadline(deadline);
            try {
                return callApiEndpoint(url, prompt, base64Image, mimeType);
            } catch (RestClientResponseException rcre) {
                lastException = rcre;
                int status = rcre.getStatusCode().value();
                log.warn("Gemini API error on attempt {}/{}: status {} - {}", attempt, maxAttempts, status, rcre.getResponseBodyAsString());

                boolean isRetryable = rcre.getStatusCode().is5xxServerError() || status == 429;
                if (!isRetryable) {
                    throw rcre;
                }
                if (attempt < maxAttempts) {
                    applyBackoff(attempt, deadline);
                }
            } catch (ResourceAccessException rae) {
                lastException = rae;
                log.warn("Gemini API network error on attempt {}/{}: {}", attempt, maxAttempts, rae.getMessage());
                if (attempt < maxAttempts) {
                    applyBackoff(attempt, deadline);
                }
            } catch (Exception e) {
                lastException = e;
                if (isUnrecoverableClientError(e)) {
                    throw e;
                }
                log.warn("Gemini API call unexpected error on attempt {}/{}: {}", attempt, maxAttempts, e.getMessage());
                if (attempt < maxAttempts) {
                    applyBackoff(attempt, deadline);
                }
            }
        }

        throw lastException != null ? lastException : new RuntimeException("Gemini API call failed after retries");
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

        String apiKey = sanitizeApiKey(geminiApiKey);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.set("x-goog-api-key", apiKey);
        }

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode firstCandidate = candidates.get(0);
            String finishReason = firstCandidate.path("finishReason").asText("");
            if ("SAFETY".equalsIgnoreCase(finishReason) || "RECITATION".equalsIgnoreCase(finishReason) || "BLOCKLIST".equalsIgnoreCase(finishReason)) {
                throw new ExternalApiException("Gemini", HttpStatus.BAD_REQUEST, "Peticion bloqueada por filtros de seguridad de Gemini (" + finishReason + ")");
            }
            JsonNode partsNode = firstCandidate.path("content").path("parts");
            if (partsNode.isArray() && partsNode.size() > 0) {
                return partsNode.get(0).path("text").asText();
            }
        }

        JsonNode blockReason = root.path("promptFeedback").path("blockReason");
        if (!blockReason.isMissingNode() && !blockReason.asText().isBlank()) {
            throw new ExternalApiException("Gemini", HttpStatus.BAD_REQUEST, "Peticion bloqueada por filtro de contenido de Gemini (" + blockReason.asText() + ")");
        }

        throw new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY, "Respuesta sin contenido generado por Gemini");
    }

    private void applyBackoff(int attempt, long deadline) {
        long initialBackoffMs = properties.getGemini().getInitialBackoffMs();
        long backoffMs = initialBackoffMs * (1L << (attempt - 1));
        if (System.currentTimeMillis() + backoffMs >= deadline) {
            throw new ExternalApiException("Gemini", HttpStatus.GATEWAY_TIMEOUT,
                    "Deadline de petición excedido (20s) para Gemini API antes de reintento");
        }
        try {
            Thread.sleep(backoffMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new ExternalApiException("Gemini", HttpStatus.SERVICE_UNAVAILABLE, "Operación interrumpida durante reintento a Gemini", ie);
        }
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

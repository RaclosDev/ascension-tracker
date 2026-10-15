package com.ascension.service.ai;

import com.ascension.exception.ExternalApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiApiClientTest {

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    private GeminiApiClient geminiApiClient;

    @BeforeEach
    void setUp() {
        geminiApiClient = new GeminiApiClient(restTemplateBuilder, new com.ascension.config.ExternalApiProperties());
        geminiApiClient.setRestTemplate(restTemplate);
        geminiApiClient.invalidateModelCache();
    }

    @Test
    void executePrompt_WhenApiKeyMissing_ThrowsExternalApiException503() {
        geminiApiClient.setGeminiApiKey("");

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> geminiApiClient.executePrompt("Hola"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(ex.getMessage()).contains("GEMINI_API_KEY is not configured");
    }

    @Test
    void executePrompt_FiltersModelsWithoutGenerateContentMethod() {
        geminiApiClient.setGeminiApiKey("dummy-key");

        // gemini-embedding-001 has only embedContent, gemini-3.8-flash has generateContent
        String mockModelsResponse = "{\"models\":[" +
                "{\"name\":\"models/gemini-embedding-001\",\"supportedGenerationMethods\":[\"embedContent\"]}," +
                "{\"name\":\"models/gemini-3.8-flash\",\"supportedGenerationMethods\":[\"generateContent\"]}" +
                "]}";
        String mockGenerateResponse = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"result\\\":\\\"ok\\\"}\"}]}}]}";

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockModelsResponse));
        when(restTemplate.exchange(contains("gemini-3.8-flash:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockGenerateResponse));

        String result = geminiApiClient.executePrompt("Dame calorías");

        assertThat(result).isEqualTo("{\"result\":\"ok\"}");
        verify(restTemplate, times(0)).exchange(contains("gemini-embedding-001"), any(), any(), eq(String.class));
    }

    @Test
    void executePrompt_LimitsCandidateAttemptsToAtMostTwoModels() {
        geminiApiClient.setGeminiApiKey("dummy-key");
        geminiApiClient.setFallbackModels("model-one,model-two,model-three,model-four");

        // Failed models discovery forces static fallback list
        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Discovery failed"));

        when(restTemplate.exchange(contains("model-one:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("model-one 500 error"));
        when(restTemplate.exchange(contains("model-two:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("model-two 500 error"));

        assertThrows(ExternalApiException.class, () -> geminiApiClient.executePrompt("Hola"));

        // Only first 2 models attempted (with retries), 3rd and 4th models never invoked
        verify(restTemplate, atLeastOnce()).exchange(contains("model-one:generateContent"), any(), any(), eq(String.class));
        verify(restTemplate, atLeastOnce()).exchange(contains("model-two:generateContent"), any(), any(), eq(String.class));
        verify(restTemplate, times(0)).exchange(contains("model-three:generateContent"), any(), any(), eq(String.class));
        verify(restTemplate, times(0)).exchange(contains("model-four:generateContent"), any(), any(), eq(String.class));
    }

    @Test
    void executePrompt_WhenNetworkTimeout_ThrowsExternalApiException503() {
        geminiApiClient.setGeminiApiKey("dummy-key");

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection timed out"));
        when(restTemplate.exchange(contains("generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection timed out"));

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> geminiApiClient.executePrompt("Dame calorías"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(ex.getServiceName()).isEqualTo("Gemini");
    }
}

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
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiApiClientTest {

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    private GeminiApiClient geminiApiClient;

    @BeforeEach
    void setUp() {
        geminiApiClient = new GeminiApiClient(restTemplateBuilder);
        geminiApiClient.setRestTemplate(restTemplate);
    }

    @Test
    void executePrompt_WhenApiKeyMissing_ThrowsExternalApiException503() {
        geminiApiClient.setGeminiApiKey("");

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> geminiApiClient.executePrompt("Hola"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(ex.getMessage()).contains("GEMINI_API_KEY is not configured");
    }

    @Test
    void executePrompt_Success() {
        geminiApiClient.setGeminiApiKey("dummy-key");

        String mockModelsResponse = "{\"models\":[{\"name\":\"models/gemini-3.8-flash\"}]}";
        String mockGenerateResponse = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"result\\\":\\\"ok\\\"}\"}]}}]}";

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockModelsResponse));
        when(restTemplate.exchange(contains("generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockGenerateResponse));

        String result = geminiApiClient.executePrompt("Dame calorías");

        assertThat(result).isEqualTo("{\"result\":\"ok\"}");
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

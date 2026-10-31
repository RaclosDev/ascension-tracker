package com.ascension.service.ai;

import com.ascension.exception.ExternalApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

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
    private com.ascension.service.ExternalApiExecution execution;

    @org.junit.jupiter.api.AfterEach
    void tearDown() { execution.close(); }

    @BeforeEach
    void setUp() {
        execution = new com.ascension.service.ExternalApiExecution();
        geminiApiClient = new GeminiApiClient(restTemplateBuilder, new com.ascension.config.ExternalApiProperties(), execution);
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
    void executePrompt_LimitsCandidateAttemptsToAtMostThreeModels() {
        geminiApiClient.setGeminiApiKey("dummy-key");
        geminiApiClient.setFallbackModels("model-one,model-two,model-three,model-four");

        // Failed models discovery forces static fallback list
        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Discovery failed"));

        when(restTemplate.exchange(contains("model-one:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("model-one 500 error"));
        when(restTemplate.exchange(contains("model-two:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("model-two 500 error"));
        when(restTemplate.exchange(contains("model-three:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("model-three 500 error"));

        assertThrows(ExternalApiException.class, () -> geminiApiClient.executePrompt("Hola"));

        // Only first 3 models attempted (with retries), 4th model never invoked
        verify(restTemplate, atLeastOnce()).exchange(contains("model-one:generateContent"), any(), any(), eq(String.class));
        verify(restTemplate, atLeastOnce()).exchange(contains("model-two:generateContent"), any(), any(), eq(String.class));
        verify(restTemplate, atLeastOnce()).exchange(contains("model-three:generateContent"), any(), any(), eq(String.class));
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

    @Test
    void executePrompt_WhenClientError400_ThrowsImmediatelyWithoutTryingFallbackModels() {
        geminiApiClient.setGeminiApiKey("dummy-key");
        geminiApiClient.setFallbackModels("model-one,model-two");

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Discovery failed"));

        HttpClientErrorException badRequestException = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST, "Bad Request", HttpHeaders.EMPTY, "{\"error\":\"invalid image\"}".getBytes(StandardCharsets.UTF_8), null
        );
        when(restTemplate.exchange(contains("model-one:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(badRequestException);

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> geminiApiClient.executePrompt("Test prompt"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        // model-two was never called because 400 is an unrecoverable client error
        verify(restTemplate, times(0)).exchange(contains("model-two:generateContent"), any(), any(), eq(String.class));
    }
    @Test
    void executePrompt_WhenModelNotSupported400_TriesFallbackModelAndSucceeds() {
        geminiApiClient.setGeminiApiKey("dummy-key");
        geminiApiClient.setFallbackModels("bad-model,good-model");

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Discovery failed"));

        HttpClientErrorException modelNotFoundException = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST, "Bad Request", HttpHeaders.EMPTY,
                "{\"error\":{\"code\":400,\"message\":\"models/bad-model is not supported for generateContent\"}}".getBytes(StandardCharsets.UTF_8), null
        );
        when(restTemplate.exchange(contains("bad-model:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(modelNotFoundException);

        String mockSuccessResponse = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"result\\\":\\\"fallback_ok\\\"}\"}]}}]}";
        when(restTemplate.exchange(contains("good-model:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockSuccessResponse));

        String result = geminiApiClient.executePrompt("Test prompt");

        assertThat(result).isEqualTo("{\"result\":\"fallback_ok\"}");
        verify(restTemplate, times(1)).exchange(contains("good-model:generateContent"), any(), any(), eq(String.class));
    }

    @Test
    void executePrompt_SanitizesQuotedApiKey() {
        geminiApiClient.setGeminiApiKey("\"clean-key-123\"");
        geminiApiClient.setFallbackModels("test-model");

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Discovery failed"));

        String mockSuccessResponse = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"status\\\":\\\"ok\\\"}\"}]}}]}";
        when(restTemplate.exchange(contains("test-model:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockSuccessResponse));

        String result = geminiApiClient.executePrompt("Test");

        assertThat(result).isEqualTo("{\"status\":\"ok\"}");
    }
    @Test
    void executePrompt_FiltersOutTtsAndAudioModelsEvenIfTheySupportGenerateContent() {
        geminiApiClient.setGeminiApiKey("dummy-key");
        geminiApiClient.setFallbackModels(""); // empty fallback to rely purely on discovery

        String mockModelsResponse = "{\"models\":[" +
                "{\"name\":\"models/gemini-2.5-flash-preview-tts\",\"supportedGenerationMethods\":[\"generateContent\"]}," +
                "{\"name\":\"models/gemini-2.0-flash\",\"supportedGenerationMethods\":[\"generateContent\"]}" +
                "]}";
        String mockGenerateResponse = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"result\\\":\\\"text_ok\\\"}\"}]}}]}";

        when(restTemplate.exchange(contains("/models"), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockModelsResponse));
        when(restTemplate.exchange(contains("gemini-2.0-flash:generateContent"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mockGenerateResponse));

        String result = geminiApiClient.executePrompt("Hola");

        assertThat(result).isEqualTo("{\"result\":\"text_ok\"}");
        verify(restTemplate, times(0)).exchange(contains("gemini-2.5-flash-preview-tts"), any(), any(), eq(String.class));
        verify(restTemplate, times(1)).exchange(contains("gemini-2.0-flash:generateContent"), any(), any(), eq(String.class));
    }
}

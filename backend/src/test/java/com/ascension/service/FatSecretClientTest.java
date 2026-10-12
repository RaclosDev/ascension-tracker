package com.ascension.service;

import com.ascension.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FatSecretClientTest {

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private FatSecretSignatureBuilder signatureBuilder;

    @Mock
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();
    private FatSecretClient fatSecretClient;

    @BeforeEach
    void setUp() {
        fatSecretClient = new FatSecretClient(restTemplateBuilder, objectMapper, signatureBuilder, new com.ascension.config.ExternalApiProperties());
        fatSecretClient.setRestTemplate(restTemplate);
    }

    @Test
    void searchFatSecret_Success() {
        when(signatureBuilder.sign(anyString(), anyMap())).thenReturn("https://platform.fatsecret.com/rest/server.api?signed=true");
        when(restTemplate.exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"foods\":{\"food\":[]}}"));

        JsonNode result = fatSecretClient.searchFatSecret("manzana");

        assertThat(result).isNotNull();
        assertThat(result.has("foods")).isTrue();
        verify(restTemplate, times(1)).exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class));
    }

    @Test
    void searchFatSecret_On5xxServerError_RetriesAndThrowsExternalApiException502() {
        when(signatureBuilder.sign(anyString(), anyMap())).thenReturn("https://platform.fatsecret.com/rest/server.api?signed=true");
        when(restTemplate.exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class)))
                .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error"));

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> fatSecretClient.searchFatSecret("manzana"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(ex.getServiceName()).isEqualTo("FatSecret");
        verify(restTemplate, times(3)).exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class));
    }

    @Test
    void searchFatSecret_OnNetworkTimeout_RetriesAndThrowsExternalApiException503() {
        when(signatureBuilder.sign(anyString(), anyMap())).thenReturn("https://platform.fatsecret.com/rest/server.api?signed=true");
        when(restTemplate.exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection timed out"));

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> fatSecretClient.searchFatSecret("manzana"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(ex.getServiceName()).isEqualTo("FatSecret");
        verify(restTemplate, times(3)).exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class));
    }

    @Test
    void searchFatSecret_On429TooManyRequests_RetriesAndThrowsExternalApiException503() {
        when(signatureBuilder.sign(anyString(), anyMap())).thenReturn("https://platform.fatsecret.com/rest/server.api?signed=true");
        when(restTemplate.exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class)))
                .thenThrow(new org.springframework.web.client.HttpClientErrorException(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests"));

        ExternalApiException ex = assertThrows(ExternalApiException.class, () -> fatSecretClient.searchFatSecret("manzana"));

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(ex.getServiceName()).isEqualTo("FatSecret");
        verify(restTemplate, times(3)).exchange(any(URI.class), eq(HttpMethod.GET), isNull(), eq(String.class));
    }
}

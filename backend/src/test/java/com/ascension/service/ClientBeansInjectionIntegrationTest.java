package com.ascension.service;

import com.ascension.config.ExternalApiProperties;
import com.ascension.service.ai.GeminiApiClient;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {
    ExternalApiProperties.class,
    FatSecretSignatureBuilder.class,
    FatSecretClient.class,
    GeminiApiClient.class,
    ExternalApiExecution.class,
    ClientBeansInjectionIntegrationTest.TestConfig.class
})
@TestPropertySource(properties = {
    "app.fatsecret.client-id=test-id",
    "app.fatsecret.client-secret=test-secret",
    "GEMINI_API_KEY=test-api-key"
})
class ClientBeansInjectionIntegrationTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        public RestTemplateBuilder restTemplateBuilder() {
            return new RestTemplateBuilder();
        }

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    @Autowired
    private FatSecretClient fatSecretClient;

    @Autowired
    private GeminiApiClient geminiApiClient;

    @Test
    @DisplayName("Spring context should successfully instantiate and autowire FatSecretClient and GeminiApiClient beans")
    void shouldSuccessfullyInstantiateClientBeans() {
        assertThat(fatSecretClient).isNotNull();
        assertThat(geminiApiClient).isNotNull();
    }
}

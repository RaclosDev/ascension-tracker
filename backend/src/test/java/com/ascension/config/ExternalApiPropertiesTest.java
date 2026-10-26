package com.ascension.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ExternalApiPropertiesTest {

    @Test
    void defaultValues_AreCorrectlySet() {
        ExternalApiProperties properties = new ExternalApiProperties();

        assertThat(properties.getFatsecret()).isNotNull();
        assertThat(properties.getFatsecret().getMaxAttempts()).isEqualTo(3);
        assertThat(properties.getFatsecret().getInitialBackoffMs()).isEqualTo(100L);
        assertThat(properties.getFatsecret().getConnectTimeoutMs()).isEqualTo(5000);
        assertThat(properties.getFatsecret().getReadTimeoutMs()).isEqualTo(15000);

        assertThat(properties.getGemini()).isNotNull();
        assertThat(properties.getGemini().getMaxAttempts()).isEqualTo(3);
        assertThat(properties.getGemini().getInitialBackoffMs()).isEqualTo(150L);
        assertThat(properties.getGemini().getConnectTimeoutMs()).isEqualTo(5000);
        assertThat(properties.getGemini().getReadTimeoutMs()).isEqualTo(25000);
    }

    @Test
    void customValues_CanBeConfigured() {
        ExternalApiProperties properties = new ExternalApiProperties();
        properties.getFatsecret().setMaxAttempts(5);
        properties.getFatsecret().setInitialBackoffMs(200L);
        properties.getFatsecret().setConnectTimeoutMs(8000);
        properties.getFatsecret().setReadTimeoutMs(20000);

        properties.getGemini().setMaxAttempts(4);
        properties.getGemini().setInitialBackoffMs(300L);
        properties.getGemini().setConnectTimeoutMs(7000);
        properties.getGemini().setReadTimeoutMs(25000);

        assertThat(properties.getFatsecret().getMaxAttempts()).isEqualTo(5);
        assertThat(properties.getFatsecret().getInitialBackoffMs()).isEqualTo(200L);
        assertThat(properties.getFatsecret().getConnectTimeoutMs()).isEqualTo(8000);
        assertThat(properties.getFatsecret().getReadTimeoutMs()).isEqualTo(20000);

        assertThat(properties.getGemini().getMaxAttempts()).isEqualTo(4);
        assertThat(properties.getGemini().getInitialBackoffMs()).isEqualTo(300L);
        assertThat(properties.getGemini().getConnectTimeoutMs()).isEqualTo(7000);
        assertThat(properties.getGemini().getReadTimeoutMs()).isEqualTo(25000);
    }
}

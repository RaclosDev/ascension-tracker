package com.ascension.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class GeminiAiServiceTest {

    @InjectMocks
    private GeminiAiService geminiAiService;

    @Mock
    private com.ascension.service.ai.GeminiApiClient apiClient;

    @Test
    void testContextLoads() {
        assertThat(geminiAiService).isNotNull();
    }

    @Test
    void processNutritionalLabel_WithGarbageBytes_ThrowsException() {
        // Arrange
        byte[] garbage = new byte[100];
        java.util.Arrays.fill(garbage, (byte) 0);
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "test.jpg", "image/jpeg", garbage);

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
                RuntimeException.class,
                () -> geminiAiService.processNutritionalLabel("test@test.com", file)
        );
    }

    @Test
    void processNutritionalLabel_WithFakeJpegHeaderButGarbageBody_ThrowsException() {
        // Arrange
        byte[] fakeJpeg = new byte[100];
        fakeJpeg[0] = (byte) 0xFF;
        fakeJpeg[1] = (byte) 0xD8;
        fakeJpeg[2] = (byte) 0xFF;
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "test.jpg", "image/jpeg", fakeJpeg);

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
                RuntimeException.class,
                () -> geminiAiService.processNutritionalLabel("test@test.com", file)
        );
    }
}

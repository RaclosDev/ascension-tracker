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

    @Mock
    private com.ascension.service.NutritionService nutritionService;

    @Mock
    private com.ascension.service.NutritionLogService nutritionLogService;

    @Mock
    private com.ascension.service.RecipeService recipeService;

    @Mock
    private com.ascension.service.MacroCalculatorService macroCalculatorService;

    @Mock
    private com.ascension.service.ai.NutritionPromptBuilder promptBuilder;

    @Mock
    private com.ascension.service.ai.AiJsonParser jsonParser;

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

    @Test
    void processNaturalLanguageLog_withDataUrlPrefix_cleansHeaderAndExecutes() throws Exception {
        String email = "test@test.com";
        java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(1, 1, java.awt.image.BufferedImage.TYPE_INT_RGB);
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(img, "png", baos);
        byte[] validPngBytes = baos.toByteArray();

        String rawBase64 = java.util.Base64.getEncoder().encodeToString(validPngBytes);
        String dataUrl = "data:image/png;base64," + rawBase64;

        org.mockito.Mockito.when(nutritionService.getMeals(email)).thenReturn(java.util.List.of());
        org.mockito.Mockito.when(nutritionLogService.getSavedFoods(email)).thenReturn(java.util.List.of());
        org.mockito.Mockito.when(recipeService.getRecipes(email)).thenReturn(java.util.List.of());
        org.mockito.Mockito.when(promptBuilder.buildFoodLogPrompt(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(StringBuilder.class),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn("mock prompt");
        org.mockito.Mockito.when(apiClient.executePrompt(org.mockito.ArgumentMatchers.eq("mock prompt"), org.mockito.ArgumentMatchers.eq(rawBase64), org.mockito.ArgumentMatchers.eq("image/png")))
                .thenReturn("[]");
        org.mockito.Mockito.when(jsonParser.parseFoodLogs(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of());

        java.util.List<com.ascension.dto.FoodLogDTO> result = geminiAiService.processNaturalLanguageLog(
                email, "comí una manzana", dataUrl, 0, java.time.LocalDate.now());

        assertThat(result).isNotNull();
        org.mockito.Mockito.verify(apiClient).executePrompt(org.mockito.ArgumentMatchers.eq("mock prompt"), org.mockito.ArgumentMatchers.eq(rawBase64), org.mockito.ArgumentMatchers.eq("image/png"));
    }
}

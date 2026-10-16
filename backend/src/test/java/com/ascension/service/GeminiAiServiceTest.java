package com.ascension.service;

import com.ascension.service.ai.GeminiApiClient;
import com.ascension.service.ai.GeminiQuotaService;
import com.ascension.service.ai.NutritionPromptBuilder;
import com.ascension.service.ai.AiJsonParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiAiServiceTest {

    @InjectMocks
    private GeminiAiService geminiAiService;

    @Mock
    private GeminiApiClient apiClient;

    @Mock
    private GeminiQuotaService quotaService;

    @Mock
    private NutritionService nutritionService;

    @Mock
    private NutritionLogService nutritionLogService;

    @Mock
    private RecipeService recipeService;

    @Mock
    private MacroCalculatorService macroCalculatorService;

    @Mock
    private NutritionPromptBuilder promptBuilder;

    @Mock
    private AiJsonParser jsonParser;

    @Test
    void testContextLoads() {
        assertThat(geminiAiService).isNotNull();
    }

    @Test
    void processNutritionalLabel_WithGarbageBytes_ThrowsExceptionAndDoesNotRecordCircuitBreakerFailure() {
        byte[] garbage = new byte[100];
        Arrays.fill(garbage, (byte) 0);
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", garbage);

        assertThrows(
                IllegalArgumentException.class,
                () -> geminiAiService.processNutritionalLabel("test@test.com", file)
        );
        verify(quotaService).checkQuotaAndCircuit("test@test.com");
        verify(quotaService, never()).recordFailure(any());
    }

    @Test
    void processNutritionalLabel_WithFakeJpegHeaderButGarbageBody_ThrowsExceptionAndDoesNotRecordCircuitBreakerFailure() {
        byte[] fakeJpeg = new byte[100];
        fakeJpeg[0] = (byte) 0xFF;
        fakeJpeg[1] = (byte) 0xD8;
        fakeJpeg[2] = (byte) 0xFF;
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", fakeJpeg);

        assertThrows(
                IllegalArgumentException.class,
                () -> geminiAiService.processNutritionalLabel("test@test.com", file)
        );
        verify(quotaService).checkQuotaAndCircuit("test@test.com");
        verify(quotaService, never()).recordFailure(any());
    }

    @Test
    void validateAndGetMimeType_WhenDimensionsExceed25MP_ThrowsIllegalArgumentException() throws Exception {
        // Create an image of 6000 x 5000 = 30,000,000 pixels (> 25 MP limit)
        BufferedImage hugeImage = new BufferedImage(6000, 5000, BufferedImage.TYPE_BYTE_GRAY);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(hugeImage, "png", baos);
        byte[] hugeImageBytes = baos.toByteArray();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> geminiAiService.validateAndGetMimeType(hugeImageBytes)
        );

        assertThat(ex.getMessage()).contains("exceeds max limit");
    }

    @Test
    void validateAndGetMimeType_WhenDimensionsUnderLimit_ReturnsCorrectMimeType() throws Exception {
        BufferedImage normalImage = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(normalImage, "png", baos);
        byte[] normalImageBytes = baos.toByteArray();

        String mimeType = geminiAiService.validateAndGetMimeType(normalImageBytes);
        assertThat(mimeType).isEqualTo("image/png");
    }

    @Test
    void processNaturalLanguageLog_withDataUrlPrefix_cleansHeaderAndExecutes() throws Exception {
        String email = "test@test.com";
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        byte[] validPngBytes = baos.toByteArray();

        String rawBase64 = Base64.getEncoder().encodeToString(validPngBytes);
        String dataUrl = "data:image/png;base64," + rawBase64;

        when(nutritionService.getMeals(email)).thenReturn(List.of());
        when(nutritionLogService.getSavedFoods(email)).thenReturn(List.of());
        when(recipeService.getRecipes(email)).thenReturn(List.of());
        when(promptBuilder.buildFoodLogPrompt(
                any(),
                any(),
                any(StringBuilder.class),
                any(),
                any(),
                any(),
                anyInt()))
                .thenReturn("mock prompt");
        when(apiClient.executePrompt(eq("mock prompt"), eq(rawBase64), eq("image/png")))
                .thenReturn("[]");

        geminiAiService.processNaturalLanguageLog(email, "1 manzana", dataUrl, 0, java.time.LocalDate.now());

        verify(quotaService).checkQuotaAndCircuit(email);
        verify(quotaService).recordSuccess(email);
        verify(apiClient).executePrompt(eq("mock prompt"), eq(rawBase64), eq("image/png"));
    }
}

package com.ascension.service;

import com.ascension.dto.FoodLogDTO;
import com.ascension.exception.ExternalApiException;
import com.ascension.exception.UserDataQuotaExceededException;
import com.ascension.service.ai.AiJsonParser;
import com.ascension.service.ai.GeminiApiClient;
import com.ascension.service.ai.GeminiQuotaService;
import com.ascension.service.ai.NutritionPromptBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
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
    private UserDataQuotaService userDataQuotaService;

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
        verify(quotaService, never()).checkAndReserveQuota(any());
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
        verify(quotaService, never()).checkAndReserveQuota(any());
        verify(quotaService, never()).recordFailure(any());
    }

    @Test
    void validateAndGetMimeType_WhenDimensionsExceed25MP_ThrowsIllegalArgumentException() throws Exception {
        BufferedImage hugeImage = new BufferedImage(6000, 5000, BufferedImage.TYPE_BYTE_GRAY);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(hugeImage, "png", baos);
        byte[] hugeImageBytes = baos.toByteArray();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> geminiAiService.validateAndGetMimeType(hugeImageBytes)
        );

        assertThat(ex.getMessage()).contains("25 megapixels");
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

        geminiAiService.processNaturalLanguageLog(email, "1 manzana", dataUrl, 0, LocalDate.now());

        verify(userDataQuotaService).checkFoodLogQuota(email, 1);
        verify(quotaService).checkAndReserveQuota(email);
        verify(quotaService).recordSuccess(email);
        verify(apiClient).executePrompt(eq("mock prompt"), eq(rawBase64), eq("image/png"));
    }

    @Test
    void processNaturalLanguageLog_withMalformedBase64_throwsIllegalArgumentExceptionBeforeReservingQuota() {
        String email = "test@test.com";
        assertThrows(
                IllegalArgumentException.class,
                () -> geminiAiService.processNaturalLanguageLog(email, "1 manzana", "invalid!!base64", 0, LocalDate.now())
        );

        verify(quotaService, never()).checkAndReserveQuota(any());
        verify(apiClient, never()).executePrompt(any(), any(), any());
        verify(quotaService, never()).releaseQuota(any());
    }

    @Test
    void processNaturalLanguageLog_whenFoodLogQuotaExceeded_throwsUserDataQuotaExceededBeforeGemini() {
        String email = "test@test.com";
        doThrow(new UserDataQuotaExceededException("Limite de alimentos alcanzado"))
                .when(userDataQuotaService).checkFoodLogQuota(email, 1);

        assertThrows(
                UserDataQuotaExceededException.class,
                () -> geminiAiService.processNaturalLanguageLog(email, "1 manzana", null, 0, LocalDate.now())
        );

        verify(userDataQuotaService).checkFoodLogQuota(email, 1);
        verify(quotaService, never()).checkAndReserveQuota(any());
        verify(apiClient, never()).executePrompt(any());
        verify(quotaService, never()).releaseQuota(any());
    }

    @Test
    void processNaturalLanguageLog_whenGeminiSucceedsButDbFails_doesNotReleaseQuota() throws Exception {
        String email = "test@test.com";
        when(nutritionService.getMeals(email)).thenReturn(List.of());
        when(nutritionLogService.getSavedFoods(email)).thenReturn(List.of());
        when(recipeService.getRecipes(email)).thenReturn(List.of());
        when(promptBuilder.buildFoodLogPrompt(any(), any(), any(StringBuilder.class), any(), any(), any(), anyInt()))
                .thenReturn("mock prompt");
        when(apiClient.executePrompt(eq("mock prompt"))).thenReturn("[{\"product\":\"Apple\"}]");

        FoodLogDTO parsedDto = FoodLogDTO.builder().product("Apple").build();
        when(jsonParser.parseFoodLogs(eq("[{\"product\":\"Apple\"}]"), anyInt(), anyInt(), any(), any()))
                .thenReturn(List.of(parsedDto));
        doThrow(new UserDataQuotaExceededException("Quota exceeded on save"))
                .when(nutritionLogService).addFoodLog(eq(email), any());

        assertThrows(
                UserDataQuotaExceededException.class,
                () -> geminiAiService.processNaturalLanguageLog(email, "1 manzana", null, 0, LocalDate.now())
        );

        verify(quotaService).recordSuccess(email);
        verify(quotaService, never()).releaseQuota(any());
        verify(quotaService, never()).recordFailure(any());
    }

    @Test
    void processNaturalLanguageLog_whenGeminiReturns400ClientError_doesNotReleaseQuotaAndDoesNotTripCircuit() {
        String email = "test@test.com";
        when(nutritionService.getMeals(email)).thenReturn(List.of());
        when(nutritionLogService.getSavedFoods(email)).thenReturn(List.of());
        when(recipeService.getRecipes(email)).thenReturn(List.of());
        when(promptBuilder.buildFoodLogPrompt(any(), any(), any(StringBuilder.class), any(), any(), any(), anyInt()))
                .thenReturn("mock prompt");
        doThrow(new ExternalApiException("Gemini", HttpStatus.BAD_REQUEST, "Corrupt body"))
                .when(apiClient).executePrompt(eq("mock prompt"));

        assertThrows(
                ExternalApiException.class,
                () -> geminiAiService.processNaturalLanguageLog(email, "1 manzana", null, 0, LocalDate.now())
        );

        verify(quotaService).checkAndReserveQuota(email);
        verify(quotaService, never()).releaseQuota(any());
        verify(quotaService, never()).recordFailure(any());
    }

    @Test
    void processNaturalLanguageLog_whenGeminiReturns502ServerError_releasesQuotaAndRecordsFailure() {
        String email = "test@test.com";
        when(nutritionService.getMeals(email)).thenReturn(List.of());
        when(nutritionLogService.getSavedFoods(email)).thenReturn(List.of());
        when(recipeService.getRecipes(email)).thenReturn(List.of());
        when(promptBuilder.buildFoodLogPrompt(any(), any(), any(StringBuilder.class), any(), any(), any(), anyInt()))
                .thenReturn("mock prompt");
        doThrow(new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY, "502 Bad Gateway"))
                .when(apiClient).executePrompt(eq("mock prompt"));

        assertThrows(
                ExternalApiException.class,
                () -> geminiAiService.processNaturalLanguageLog(email, "1 manzana", null, 0, LocalDate.now())
        );

        verify(quotaService).checkAndReserveQuota(email);
        verify(quotaService).releaseQuota(email);
        verify(quotaService).recordFailure(any());
    }

    @Test
    void validateAndGetMimeType_validWebp_returnsWebpMimeType() {
        byte[] validWebp = new byte[30];
        validWebp[0] = 'R'; validWebp[1] = 'I'; validWebp[2] = 'F'; validWebp[3] = 'F';
        validWebp[8] = 'W'; validWebp[9] = 'E'; validWebp[10] = 'B'; validWebp[11] = 'P';
        validWebp[12] = 'V'; validWebp[13] = 'P'; validWebp[14] = '8'; validWebp[15] = 'X';
        // 100x100 -> width-1 = 99 (0x63), height-1 = 99 (0x63)
        validWebp[24] = 99; validWebp[25] = 0; validWebp[26] = 0;
        validWebp[27] = 99; validWebp[28] = 0; validWebp[29] = 0;

        String mime = geminiAiService.validateAndGetMimeType(validWebp);
        org.junit.jupiter.api.Assertions.assertEquals("image/webp", mime);
    }

    @Test
    void validateAndGetMimeType_oversizedWebp_throwsIllegalArgumentException() {
        byte[] oversizedWebp = new byte[30];
        oversizedWebp[0] = 'R'; oversizedWebp[1] = 'I'; oversizedWebp[2] = 'F'; oversizedWebp[3] = 'F';
        oversizedWebp[8] = 'W'; oversizedWebp[9] = 'E'; oversizedWebp[10] = 'B'; oversizedWebp[11] = 'P';
        oversizedWebp[12] = 'V'; oversizedWebp[13] = 'P'; oversizedWebp[14] = '8'; oversizedWebp[15] = 'X';
        // 6000x5000 = 30 MP -> 5999 (0x176F), 4999 (0x1387)
        oversizedWebp[24] = (byte) 0x6F; oversizedWebp[25] = 0x17; oversizedWebp[26] = 0;
        oversizedWebp[27] = (byte) 0x87; oversizedWebp[28] = 0x13; oversizedWebp[29] = 0;

        IllegalArgumentException ex = org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> geminiAiService.validateAndGetMimeType(oversizedWebp)
        );
        org.junit.jupiter.api.Assertions.assertTrue(ex.getMessage().contains("exceeds maximum allowed limit of 25 megapixels"));
    }
}

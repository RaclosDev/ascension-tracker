package com.ascension.controller;

import com.ascension.dto.AiFoodRequestDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.exception.ExternalApiException;
import com.ascension.service.GeminiAiService;
import com.ascension.service.MacroCalculatorService;
import com.ascension.service.NutritionLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NutritionAiController.class)
public class NutritionAiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GeminiAiService geminiAiService;

    @MockBean
    private MacroCalculatorService macroCalculatorService;

    @MockBean
    private NutritionLogService nutritionLogService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void addSavedFoodWithAi_WithoutJwt_ReturnsUnauthorized() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana de 150g");

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void addSavedFoodWithAi_Success_ReturnsOk() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana de 150g");

        SavedFoodDTO responseDto = new SavedFoodDTO();
        responseDto.setName("Manzana");
        responseDto.setKcalPer100g(52.0);

        when(geminiAiService.processNaturalLanguageFood(eq("test@example.com"), eq("1 manzana de 150g")))
                .thenReturn(responseDto);
        when(geminiAiService.getActiveModelName()).thenReturn("gemini-3.8-flash");

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(header().string("X-AI-Model", "gemini-3.8-flash"))
                .andExpect(jsonPath("$.name").value("Manzana"));
    }

    @Test
    public void addSavedFoodWithAi_WhenExternalApiFails502_DelegatesToGlobalExceptionHandler() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana");

        when(geminiAiService.processNaturalLanguageFood(eq("test@example.com"), eq("1 manzana")))
                .thenThrow(new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY, "Error del servicio de IA de Gemini"));

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("Error del servicio de IA de Gemini"))
                .andExpect(jsonPath("$.trace_id").exists());
    }

    @Test
    public void addSavedFoodWithAi_WhenServiceUnavailable503_DelegatesToGlobalExceptionHandler() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana");

        when(geminiAiService.processNaturalLanguageFood(eq("test@example.com"), eq("1 manzana")))
                .thenThrow(new ExternalApiException("Gemini", HttpStatus.SERVICE_UNAVAILABLE, "Servicio de Gemini no disponible"));

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Servicio de Gemini no disponible"))
                .andExpect(jsonPath("$.trace_id").exists());
    }

    @Test
    public void getAssistantSummary_WhenInvalidDateFormat_ReturnsBadRequest400() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/nutrition/ai/assistant-summary?date=fecha-invalida")
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Formato de fecha invalido (esperado YYYY-MM-DD)"))
                .andExpect(jsonPath("$.trace_id").exists());
    }
}

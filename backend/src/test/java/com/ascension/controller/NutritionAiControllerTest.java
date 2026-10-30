package com.ascension.controller;

import com.ascension.dto.AiChatRequestDTO;
import com.ascension.dto.AiFoodRequestDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.exception.AiQuotaExceededException;
import com.ascension.exception.ExternalApiException;
import com.ascension.service.GeminiAiService;
import com.ascension.service.MacroCalculatorService;
import com.ascension.service.NutritionLogService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    @MockitoBean
    private GeminiAiService geminiAiService;

    @MockitoBean
    private MacroCalculatorService macroCalculatorService;

    @MockitoBean
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
    public void addSavedFoodWithAi_WhenExternalApiFails502_MasksUpstreamError() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana");

        when(geminiAiService.processNaturalLanguageFood(eq("test@example.com"), eq("1 manzana")))
                .thenThrow(new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY, "Raw Google Internal Details: connection reset"));

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("El servicio externo no está disponible temporalmente. Por favor, inténtalo más tarde."))
                .andExpect(jsonPath("$.trace_id").exists());
    }

    @Test
    public void addSavedFoodWithAi_WhenServiceUnavailable503_MasksUpstreamError() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana");

        when(geminiAiService.processNaturalLanguageFood(eq("test@example.com"), eq("1 manzana")))
                .thenThrow(new ExternalApiException("Gemini", HttpStatus.SERVICE_UNAVAILABLE, "Raw upstream 503 from backend server"));

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("El servicio externo no está disponible temporalmente. Por favor, inténtalo más tarde."))
                .andExpect(jsonPath("$.trace_id").exists());
    }

    @Test
    public void addSavedFoodWithAi_WhenTextExceeds2000Chars_ReturnsBadRequest400() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("a".repeat(2001));

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El texto no puede superar los 2000 caracteres"));
    }

    @Test
    public void assistantChat_WhenMessageExceeds2000Chars_ReturnsBadRequest400() throws Exception {
        AiChatRequestDTO request = new AiChatRequestDTO();
        request.setMessage("x".repeat(2001));

        mockMvc.perform(post("/api/nutrition/ai/assistant-chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El mensaje no puede superar los 2000 caracteres"));
    }

    @Test
    public void assistantChat_WhenHistoryExceeds20Turns_ReturnsBadRequest400() throws Exception {
        AiChatRequestDTO request = new AiChatRequestDTO();
        request.setMessage("Hola");
        List<AiChatRequestDTO.ChatMessageDTO> history = new ArrayList<>();
        for (int i = 0; i < 21; i++) {
            history.add(new AiChatRequestDTO.ChatMessageDTO("user", "msg " + i));
        }
        request.setChatHistory(history);

        mockMvc.perform(post("/api/nutrition/ai/assistant-chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El historial no puede superar los 20 mensajes"));
    }

    @Test
    public void assistantChat_WhenRoleInvalid_ReturnsBadRequest400() throws Exception {
        AiChatRequestDTO request = new AiChatRequestDTO();
        request.setMessage("Hola");
        request.setChatHistory(List.of(new AiChatRequestDTO.ChatMessageDTO("system_admin", "Hack attempt")));

        mockMvc.perform(post("/api/nutrition/ai/assistant-chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El rol debe ser estrictamente 'user' o 'assistant'"));
    }

    @Test
    public void assistantChat_WhenQuotaExceeded_ReturnsTooManyRequests429() throws Exception {
        AiChatRequestDTO request = new AiChatRequestDTO();
        request.setMessage("¿Qué ceno?");

        when(geminiAiService.generateMealAssistantResponse(eq("test@example.com"), eq("¿Qué ceno?"), any(), any(), any(), any()))
                .thenThrow(new AiQuotaExceededException("Has alcanzado tu límite diario de consultas de IA (50). Inténtalo de nuevo mañana."));

        mockMvc.perform(post("/api/nutrition/ai/assistant-chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("Has alcanzado tu límite diario de consultas de IA (50). Inténtalo de nuevo mañana."))
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

    @Test
    public void applyAssistantFoods_WhenNegativeValues_ReturnsBadRequest400() throws Exception {
        String json = "{\"date\":\"2026-10-16\",\"mealIndex\":1,\"foods\":[{\"product\":\"Pollo\",\"quantity\":-10,\"kcal\":100,\"protein\":20,\"carbs\":0,\"fat\":2}]}";

        mockMvc.perform(post("/api/nutrition/ai/assistant-apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("La cantidad no puede ser negativa"));
    }

    @Test
    public void applyAssistantFoods_WhenProductExceeds255Chars_ReturnsBadRequest400() throws Exception {
        String longProduct = "P".repeat(256);
        String json = "{\"date\":\"2026-10-16\",\"mealIndex\":1,\"foods\":[{\"product\":\"" + longProduct + "\",\"quantity\":100,\"kcal\":100,\"protein\":20,\"carbs\":0,\"fat\":2}]}";

        mockMvc.perform(post("/api/nutrition/ai/assistant-apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El nombre del producto no puede superar los 255 caracteres"));
    }

    @Test
    public void applyAssistantFoods_WhenListExceeds50Items_ReturnsBadRequest400() throws Exception {
        com.ascension.dto.AiApplyRequestDTO request = new com.ascension.dto.AiApplyRequestDTO();
        request.setDate("2026-10-16");
        request.setMealIndex(1);
        List<com.ascension.dto.AiApplyRequestDTO.AppliedFoodItemDTO> list = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            list.add(com.ascension.dto.AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                    .product("Item " + i)
                    .quantity(100.0)
                    .kcal(100.0)
                    .protein(10.0)
                    .carbs(10.0)
                    .fat(1.0)
                    .build());
        }
        request.setFoods(list);

        mockMvc.perform(post("/api/nutrition/ai/assistant-apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No se pueden añadir más de 50 alimentos a la vez"));
    }

    @Test
    public void applyAssistantFoods_WhenNaNInJson_ReturnsBadRequest400() throws Exception {
        String json = "{\"date\":\"2026-10-16\",\"mealIndex\":1,\"foods\":[{\"product\":\"Pollo\",\"quantity\":\"NaN\",\"kcal\":100,\"protein\":20,\"carbs\":0,\"fat\":2}]}";

        mockMvc.perform(post("/api/nutrition/ai/assistant-apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void applyAssistantFoods_WhenValid_ReturnsOk200() throws Exception {
        com.ascension.dto.AiApplyRequestDTO request = new com.ascension.dto.AiApplyRequestDTO();
        request.setDate("2026-10-16");
        request.setMealIndex(1);
        request.setFoods(List.of(com.ascension.dto.AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Tortilla francesa")
                .quantity(120.0)
                .kcal(180.0)
                .protein(14.0)
                .carbs(1.0)
                .fat(13.0)
                .build()));

        when(nutritionLogService.applyAssistantFoods(eq("test@example.com"), any(), eq(1), any()))
                .thenReturn(List.of(new com.ascension.dto.FoodLogDTO()));

        mockMvc.perform(post("/api/nutrition/ai/assistant-apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isOk());
    }
    @Test
    public void addSavedFoodWithAi_WhenExternalApiFails400_ReturnsBadRequestWithSpecificMessage() throws Exception {
        AiFoodRequestDTO request = new AiFoodRequestDTO();
        request.setText("1 manzana");

        when(geminiAiService.processNaturalLanguageFood(eq("test@example.com"), eq("1 manzana")))
                .thenThrow(new ExternalApiException("Gemini", HttpStatus.BAD_REQUEST, "Peticion bloqueada por filtros de seguridad"));

        mockMvc.perform(post("/api/nutrition/ai/food")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Peticion bloqueada por filtros de seguridad"))
                .andExpect(jsonPath("$.trace_id").exists());
    }
}

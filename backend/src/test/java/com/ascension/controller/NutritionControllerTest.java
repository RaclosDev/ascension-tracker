package com.ascension.controller;

import com.ascension.dto.FoodLogDTO;
import com.ascension.service.GeminiAiService;
import com.ascension.service.NutritionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NutritionController.class)
public class NutritionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NutritionService nutritionService;

    @MockBean
    private com.ascension.service.NutritionLogService nutritionLogService;

    @MockBean
    private com.ascension.service.RecipeService recipeService;

    @MockBean
    private com.ascension.service.MacroCalculatorService macroCalculatorService;

    @MockBean
    private GeminiAiService geminiAiService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void addFoodLog_WithoutJwt_ReturnsUnauthorized() throws Exception {
        FoodLogDTO dto = new FoodLogDTO();
        dto.setProduct("Apple");
        dto.setQuantity(100.0);
        dto.setKcal(52.0);
        dto.setProtein(0.3);
        dto.setCarbs(14.0);
        dto.setFat(0.2);
        dto.setDate(LocalDate.now());

        mockMvc.perform(post("/api/nutrition/logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void addFoodLog_WithValidJwt_ReturnsOk() throws Exception {
        FoodLogDTO dto = new FoodLogDTO();
        dto.setProduct("Apple");
        dto.setQuantity(100.0);
        dto.setKcal(52.0);
        dto.setProtein(0.3);
        dto.setCarbs(14.0);
        dto.setFat(0.2);
        dto.setDate(LocalDate.now());
        dto.setMealIndex(0);

        when(nutritionLogService.addFoodLog(eq("test@example.com"), any(FoodLogDTO.class))).thenReturn(dto);

        mockMvc.perform(post("/api/nutrition/logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isOk());
    }
}

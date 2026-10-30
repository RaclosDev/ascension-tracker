package com.ascension.controller;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.service.NutritionLogService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FoodLogController.class)
public class FoodLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NutritionLogService nutritionLogService;

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
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product").value("Apple"));
    }

    @Test
    public void getSavedFoods_WithValidJwt_ReturnsList() throws Exception {
        SavedFoodDTO food = new SavedFoodDTO();
        food.setId(1L);
        food.setName("Oats");

        when(nutritionLogService.getSavedFoods("test@example.com")).thenReturn(Collections.singletonList(food));

        mockMvc.perform(get("/api/nutrition/my-foods")
                .contentType(MediaType.APPLICATION_JSON)
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Oats"));
    }
}

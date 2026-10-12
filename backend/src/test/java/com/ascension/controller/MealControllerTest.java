package com.ascension.controller;

import com.ascension.dto.MealDTO;
import com.ascension.service.NutritionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MealController.class)
public class MealControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NutritionService nutritionService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void getMeals_WithoutJwt_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/nutrition/meals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void getMeals_WithValidJwt_ReturnsMeals() throws Exception {
        MealDTO meal = new MealDTO();
        meal.setId(1L);
        meal.setName("Desayuno");

        when(nutritionService.getMeals("test@example.com")).thenReturn(Collections.singletonList(meal));

        mockMvc.perform(get("/api/nutrition/meals")
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Desayuno"));
    }

    @Test
    public void addMeal_WithValidJwt_ReturnsCreated() throws Exception {
        MealDTO meal = new MealDTO();
        meal.setName("Almuerzo");

        when(nutritionService.addMeal(any(MealDTO.class), eq("test@example.com"))).thenReturn(meal);

        mockMvc.perform(post("/api/nutrition/meals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(meal))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Almuerzo"));
    }
}

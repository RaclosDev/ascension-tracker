package com.ascension.controller;

import com.ascension.dto.MacrosDTO;
import com.ascension.service.MacroCalculatorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NutritionController.class)
public class NutritionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MacroCalculatorService macroCalculatorService;

    @Test
    public void getMacros_WithoutJwt_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/nutrition/macros")
                .contentType(MediaType.APPLICATION_JSON)
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void getMacros_WithValidJwt_ReturnsOk() throws Exception {
        MacrosDTO dto = new MacrosDTO();
        dto.setKcal(2500);
        dto.setProtein(180.0);
        dto.setCarbs(250.0);
        dto.setFat(70.0);

        when(macroCalculatorService.getMacros("test@example.com")).thenReturn(dto);

        mockMvc.perform(get("/api/nutrition/macros")
                .contentType(MediaType.APPLICATION_JSON)
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kcal").value(2500))
                .andExpect(jsonPath("$.protein").value(180));
    }
}

package com.ascension.controller;

import com.ascension.dto.RecipeDTO;
import com.ascension.service.RecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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

@WebMvcTest(RecipeController.class)
public class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecipeService recipeService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void getRecipes_WithoutJwt_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/nutrition/recipes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void getRecipes_WithValidJwt_ReturnsList() throws Exception {
        RecipeDTO recipe = new RecipeDTO();
        recipe.setId(1L);
        recipe.setName("Tortilla");

        when(recipeService.getRecipes("test@example.com")).thenReturn(Collections.singletonList(recipe));

        mockMvc.perform(get("/api/nutrition/recipes")
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tortilla"));
    }

    @Test
    public void addRecipe_WithValidJwt_ReturnsCreated() throws Exception {
        RecipeDTO recipe = new RecipeDTO();
        recipe.setName("Tortilla");

        when(recipeService.addRecipe(eq("test@example.com"), any(RecipeDTO.class))).thenReturn(recipe);

        mockMvc.perform(post("/api/nutrition/recipes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(recipe))
                .with(jwt().jwt(builder -> builder.claim("email", "test@example.com")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tortilla"));
    }
}

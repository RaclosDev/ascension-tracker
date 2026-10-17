package com.ascension.controller;

import com.ascension.dto.CustomExerciseDTO;
import com.ascension.service.CustomExerciseService;
import com.ascension.service.WorkoutService;
import com.ascension.service.WorkoutTemplateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WorkoutController.class)
class WorkoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WorkoutService workoutService;

    @MockBean
    private WorkoutTemplateService workoutTemplateService;

    @MockBean
    private CustomExerciseService customExerciseService;

    private static final String TEST_EMAIL = "athlete@example.com";

    @Test
    @DisplayName("PUT /api/workouts/custom-exercises/{id} updates existing custom exercise successfully")
    void updateCustomExercise_withValidData_returnsUpdatedDto() throws Exception {
        CustomExerciseDTO inputDto = CustomExerciseDTO.builder()
                .name("Press Banca Mancuerna")
                .muscle("Pecho")
                .equipment("Mancuernas")
                .build();

        CustomExerciseDTO returnedDto = CustomExerciseDTO.builder()
                .id("ce-123")
                .name("Press Banca Mancuerna")
                .muscle("Pecho")
                .equipment("Mancuernas")
                .userEmail(TEST_EMAIL)
                .build();

        when(customExerciseService.updateCustomExercise(eq(TEST_EMAIL), eq("ce-123"), any(CustomExerciseDTO.class)))
                .thenReturn(returnedDto);

        mockMvc.perform(put("/api/workouts/custom-exercises/ce-123")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL)))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inputDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ce-123"))
                .andExpect(jsonPath("$.name").value("Press Banca Mancuerna"))
                .andExpect(jsonPath("$.muscle").value("Pecho"))
                .andExpect(jsonPath("$.equipment").value("Mancuernas"));

        verify(customExerciseService).updateCustomExercise(eq(TEST_EMAIL), eq("ce-123"), any(CustomExerciseDTO.class));
    }
}

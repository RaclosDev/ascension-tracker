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

    @Test
    @DisplayName("GET /api/workouts with size=1000000 is rejected with 400 Bad Request")
    void getHistory_whenSizeExceeds100_returns400BadRequest() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/workouts")
                        .param("size", "1000000")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/workouts with size=0 is rejected with 400 Bad Request")
    void getHistory_whenSizeZero_returns400BadRequest() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/workouts")
                        .param("size", "0")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/workouts with page=-1 is rejected with 400 Bad Request")
    void getHistory_whenPageNegative_returns400BadRequest() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/workouts")
                        .param("page", "-1")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/workouts/recent with negative since is rejected with 400 Bad Request")
    void getRecent_whenSinceNegative_returns400BadRequest() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/workouts/recent")
                        .param("since", "-500")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("GET /api/workouts with valid page and size returns 200 OK")
    void getHistory_withValidParams_returns200Ok() throws Exception {
        when(workoutService.getWorkoutHistory(eq(TEST_EMAIL), eq(1), eq(25)))
                .thenReturn(org.springframework.data.domain.Page.empty());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/workouts")
                        .param("page", "1")
                        .param("size", "25")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isOk());

        verify(workoutService).getWorkoutHistory(eq(TEST_EMAIL), eq(1), eq(25));
    }

    @Test
    @DisplayName("GET /api/workouts/stats returns 200 OK with aggregated metrics")
    void getStats_returns200OkWithMetrics() throws Exception {
        com.ascension.dto.WorkoutStatsDTO statsDto = com.ascension.dto.WorkoutStatsDTO.builder()
                .totalWorkouts(5)
                .totalDurationSeconds(12000)
                .totalSets(30)
                .totalVolume(8500.0)
                .build();

        when(workoutService.getStats(eq(TEST_EMAIL))).thenReturn(statsDto);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/workouts/stats")
                        .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalWorkouts").value(5))
                .andExpect(jsonPath("$.totalDurationSeconds").value(12000))
                .andExpect(jsonPath("$.totalSets").value(30))
                .andExpect(jsonPath("$.totalVolume").value(8500.0));

        verify(workoutService).getStats(eq(TEST_EMAIL));
    }
}

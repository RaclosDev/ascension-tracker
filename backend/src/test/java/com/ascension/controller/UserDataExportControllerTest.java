package com.ascension.controller;

import com.ascension.dto.UserDataExportDTO;
import com.ascension.service.UserDataExportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserDataExportController.class)
class UserDataExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserDataExportService userDataExportService;

    @MockitoBean
    private com.ascension.service.UserDataRestoreService userDataRestoreService;

    private static final String TEST_EMAIL = "athlete@example.com";

    @Test
    @DisplayName("GET /api/user/export without JWT should return 401 Unauthorized")
    void exportUserData_withoutJwt_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/user/export"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/user/export with valid JWT should return 200 OK with Content-Disposition attachment header")
    void exportUserData_withValidJwt_returnsExportJsonAndAttachmentHeader() throws Exception {
        String expectedDate = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String expectedFilename = "ascension-backup-" + expectedDate + ".json";

        UserDataExportDTO exportDTO = UserDataExportDTO.builder()
                .version("1.0")
                .exportedAt(Instant.now())
                .userEmail(TEST_EMAIL)
                .workouts(List.of())
                .customExercises(List.of())
                .workoutTemplates(List.of())
                .foodLogs(List.of())
                .meals(List.of())
                .recipes(List.of())
                .savedFoods(List.of())
                .stepsEntries(List.of())
                .weightEntries(List.of())
                .userSettings(null)
                .build();

        when(userDataExportService.exportUserData(TEST_EMAIL)).thenReturn(exportDTO);

        mockMvc.perform(get("/api/user/export")
                .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL))))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + expectedFilename + "\""))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString(MediaType.APPLICATION_JSON_VALUE)))
                .andExpect(jsonPath("$.version").value("1.0"))
                .andExpect(jsonPath("$.userEmail").value(TEST_EMAIL));

        verify(userDataExportService).exportUserData(TEST_EMAIL);
    }

    @Test
    @DisplayName("POST /api/user/restore without JWT should return 401 Unauthorized")
    void restoreUserData_withoutJwt_returnsUnauthorized() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/user/restore")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":\"1.0\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/user/restore without mode parameter should return 400 Bad Request")
    void restoreUserData_withoutModeParam_returnsBadRequest400() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/user/restore")
                .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL)))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":\"1.0\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/user/restore with invalid mode parameter should return 400 Bad Request")
    void restoreUserData_withInvalidMode_returnsBadRequest400() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/user/restore?mode=INVALID_MODE")
                .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL)))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":\"1.0\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/user/restore with out-of-range field in nested DTO should return 400 Bad Request")
    void restoreUserData_withOutOfRangeFieldInNestedDto_returnsBadRequest400() throws Exception {
        String invalidJson = """
                {
                  "version": "1.0",
                  "foodLogs": [
                    {
                      "date": "2026-10-14",
                      "mealIndex": 0,
                      "product": "Avena",
                      "quantity": -50.0,
                      "kcal": -200.0
                    }
                  ]
                }
                """;

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/user/restore?mode=MERGE")
                .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL)))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/user/restore with valid JWT and explicit mode should call service and return summary")
    void restoreUserData_withValidJwt_returnsSummary() throws Exception {
        com.ascension.dto.UserDataRestoreSummaryDTO summary = com.ascension.dto.UserDataRestoreSummaryDTO.builder()
                .mode("OVERWRITE")
                .workoutsRestored(5)
                .customExercisesRestored(2)
                .foodLogsRestored(10)
                .settingsRestored(true)
                .restoredAt(Instant.now())
                .build();

        when(userDataRestoreService.restoreUserData(eq(TEST_EMAIL), eq(com.ascension.model.RestoreMode.OVERWRITE), eq(false), any(UserDataExportDTO.class)))
                .thenReturn(summary);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/user/restore?mode=OVERWRITE")
                .with(jwt().jwt(builder -> builder.claim("email", TEST_EMAIL)))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":\"1.0\",\"userEmail\":\"athlete@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("OVERWRITE"))
                .andExpect(jsonPath("$.workoutsRestored").value(5))
                .andExpect(jsonPath("$.customExercisesRestored").value(2))
                .andExpect(jsonPath("$.foodLogsRestored").value(10))
                .andExpect(jsonPath("$.settingsRestored").value(true));

        verify(userDataRestoreService).restoreUserData(eq(TEST_EMAIL), eq(com.ascension.model.RestoreMode.OVERWRITE), eq(false), any(UserDataExportDTO.class));
    }
}

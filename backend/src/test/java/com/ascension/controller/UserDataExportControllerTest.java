package com.ascension.controller;

import com.ascension.dto.UserDataExportDTO;
import com.ascension.service.UserDataExportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserDataExportController.class)
class UserDataExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserDataExportService userDataExportService;

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
}

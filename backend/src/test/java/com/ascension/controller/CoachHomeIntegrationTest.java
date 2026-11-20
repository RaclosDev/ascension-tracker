package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Key lifts and upcoming meets on the coach's home. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachHomeIntegrationTest {

    private static final String SHARED =
            "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":false,\"editNutrition\":false}";
    private static final String BODY_ONLY =
            "{\"training\":false,\"nutrition\":false,\"body\":true,\"editTraining\":false,\"editNutrition\":false}";

    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    @Test
    void showsTheMostTrainedLiftAndUpcomingMeetsOfClientsWhoShareTraining() throws Exception {
        String coach = coach();
        String lifter = user();
        String closed = user();
        String link = accept(lifter, invite(coach), SHARED);
        String closedLink = accept(closed, invite(coach), BODY_ONLY);

        // Squat on three days (the favourite), bench on one with a heavier estimate.
        workout(lifter, 30, "squat", 100, 5, "normal");
        workout(lifter, 10, "squat", 110, 5, "normal");
        String best = workout(lifter, 3, "squat", 120, 3, "normal");
        workout(lifter, 2, "squat", 200, 1, "warmup");
        workout(lifter, 5, "bench", 150, 2, "normal");
        // Too old, and somebody who does not share training.
        workout(lifter, 60, "squat", 300, 1, "normal");
        workout(closed, 3, "squat", 250, 1, "normal");

        for (String id : new String[] {link, closedLink}) {
            jdbc.update("INSERT INTO coach_powerlifting_profiles (link_id, content, version) "
                    + "VALUES (?, '{\"enabled\":true}'::jsonb, 1)", UUID.fromString(id));
            meet(id, "Regional", LocalDate.now().plusDays(20), false);
        }
        meet(link, "Pasada", LocalDate.now().minusDays(20), false);
        meet(link, "Archivada", LocalDate.now().plusDays(5), true);

        mvc.perform(as(get("/api/coach/home"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifts.length()").value(1))
                .andExpect(jsonPath("$.lifts[0].linkId").value(link))
                .andExpect(jsonPath("$.lifts[0].exerciseId").value("squat"))
                .andExpect(jsonPath("$.lifts[0].workoutId").value(best))
                .andExpect(jsonPath("$.lifts[0].weight").value(120.0))
                .andExpect(jsonPath("$.lifts[0].reps").value(3.0))
                .andExpect(jsonPath("$.lifts[0].e1rm").value(132.0))
                // 132 in the last three weeks against 116.7 in the three before.
                .andExpect(jsonPath("$.lifts[0].trend").value(15.3))
                .andExpect(jsonPath("$.meets.length()").value(1))
                .andExpect(jsonPath("$.meets[0].linkId").value(link))
                .andExpect(jsonPath("$.meets[0].name").value("Regional"));

        mvc.perform(as(get("/api/coach/home"), user())).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/home"), coach()))
                .andExpect(jsonPath("$.lifts.length()").value(0))
                .andExpect(jsonPath("$.meets.length()").value(0));
    }

    private String workout(String email, int daysAgo, String exercise, double weight, int reps, String type) {
        String id = UUID.randomUUID().toString();
        long done = Instant.now().minus(daysAgo, ChronoUnit.DAYS).toEpochMilli();
        jdbc.update("INSERT INTO workouts (id, name, user_email, started_at, finished_at) VALUES (?, 'Sesión', ?, ?, ?)",
                id, email, done - 3_600_000, done);
        jdbc.update("INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES (?, ?, ?, 0)",
                id + "-e", id, exercise);
        jdbc.update("INSERT INTO workout_sets (id, workout_exercise_id, completed, reps, weight, type, order_index) "
                + "VALUES (?, ?, true, ?, ?, ?, 0)", id + "-s", id + "-e", reps, weight, type);
        return id;
    }

    private void meet(String link, String name, LocalDate date, boolean archived) {
        jdbc.update("INSERT INTO coach_powerlifting_meets (link_id, content) VALUES (?, ?::jsonb)",
                UUID.fromString(link),
                "{\"name\":\"%s\",\"date\":\"%s\",\"archived\":%s}".formatted(name, date, archived));
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String invite(String coach) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
    }

    private String accept(String client, String token, String permissions) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                        .contentType("application/json").content(permissions))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@home.test";
        users.ensureUserExists(email, "Home Test", null);
        return email;
    }
}

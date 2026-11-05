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

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The traffic light on the coach's client list. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachClientStatusIntegrationTest {

    private static final String BODY_ONLY =
            "{\"training\":false,\"nutrition\":false,\"body\":true,\"editTraining\":false,\"editNutrition\":false}";

    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    @Test
    void flagsIdleClientsAndMissingCheckins() throws Exception {
        String coach = coach();
        String active = user();
        String idle = user();
        String activeLink = accept(active, invite(coach));
        String idleLink = accept(idle, invite(coach));
        // Both linked a month ago.
        jdbc.update("UPDATE coach_clients SET created_at = NOW() - INTERVAL '30 days' WHERE id IN (?, ?)",
                UUID.fromString(activeLink), UUID.fromString(idleLink));

        LocalDate today = LocalDate.now();
        mvc.perform(as(post("/api/weights"), active).contentType("application/json")
                        .content("{\"date\":\"" + today + "\",\"weight\":80}"))
                .andExpect(status().isOk());
        // Cutting to 70 kg, but only 0.1 kg lighter than three weeks ago.
        mvc.perform(as(post("/api/weights"), active).contentType("application/json")
                        .content("{\"date\":\"" + today.minusDays(22) + "\",\"weight\":80.1}"))
                .andExpect(status().isOk());
        jdbc.update("""
                INSERT INTO user_settings (user_email, goal_weight, kcal, start_date, start_weight, weekly_goal)
                VALUES (?, 70, 2000, ?, 82, -0.5)
                """, active, today.minusDays(40));
        String path = "$[?(@.linkId == '%s')]";
        mvc.perform(as(get("/api/coach/clients/status"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath(path.formatted(activeLink) + ".lastActivity").value(today.toString()))
                .andExpect(jsonPath(path.formatted(activeLink) + ".signals[?(@.reason == 'INACTIVE')]").isEmpty())
                .andExpect(jsonPath(path.formatted(activeLink) + ".level").value("RED"))
                .andExpect(jsonPath(path.formatted(activeLink) + ".signals[0].reason").value("CHECKIN_MISSING"))
                .andExpect(jsonPath(path.formatted(activeLink) + ".signals[1].reason").value("WEIGHT_STALLED"))
                .andExpect(jsonPath(path.formatted(idleLink) + ".level").value("RED"))
                .andExpect(jsonPath(path.formatted(idleLink) + ".signals[0].reason").value("INACTIVE"))
                .andExpect(jsonPath(path.formatted(idleLink) + ".signals[0].value").value(30));

        mvc.perform(as(get("/api/coach/clients/status"), user())).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/status"), coach())).andExpect(jsonPath("$.length()").value(0));
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String invite(String coach) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
    }

    private String accept(String client, String token) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                        .contentType("application/json").content(BODY_ONLY))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@status.test";
        users.ensureUserExists(email, "Status Test", null);
        return email;
    }
}

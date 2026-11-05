package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.CoachSubscriptionService;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.admin.emails= , Boss@Admin.test")
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class AdminPlansIntegrationTest {

    private static final String ADMIN = "boss@admin.test";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired CoachSubscriptionService subscriptions;

    @Test
    void onlyAdminsSeeAndChangePlans() throws Exception {
        users.ensureUserExists(ADMIN, "Boss", null);
        String coach = coach();
        mvc.perform(as(get("/api/admin/me"), ADMIN)).andExpect(jsonPath("$.admin").value(true));
        mvc.perform(as(get("/api/admin/me"), coach)).andExpect(jsonPath("$.admin").value(false));
        mvc.perform(as(get("/api/admin/coaches"), coach)).andExpect(status().isForbidden());
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", userId(coach)), coach)
                        .contentType("application/json").content(change("ELITE", today().plusDays(30))))
                .andExpect(status().isForbidden());

        mvc.perform(as(get("/api/admin/coaches"), ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plans.length()").value(4))
                .andExpect(jsonPath("$.coaches[?(@.email == '" + coach + "')].status").value("TRIALING"));
    }

    @Test
    void aPaidPlanRunsThroughTheLastPaidDayThenFallsBackToFree() throws Exception {
        String coach = coach();
        UUID coachId = userId(coach);
        LocalDate paidUntil = today().plusDays(30);
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", coachId), ADMIN)
                        .contentType("application/json").content(change("elite", paidUntil)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("ELITE"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.effectivePlan").value("ELITE"))
                .andExpect(jsonPath("$.maxClients").value(50));
        assertThat(subscriptions.summary(coachId).currentPeriodEnd())
                .isEqualTo(paidUntil.plusDays(1).atStartOfDay(ZoneId.of("Europe/Madrid")).toInstant());

        jdbc.update("UPDATE coach_subscriptions SET current_period_end = NOW() - INTERVAL '1 minute' WHERE coach_user_id = ?",
                coachId);
        assertThat(subscriptions.summary(coachId).effectivePlan()).isEqualTo("FREE");
        assertThat(subscriptions.dailyLimitFor(coach)).isEqualTo(50);

        mvc.perform(as(put("/api/admin/coaches/{id}/plan", coachId), ADMIN)
                        .contentType("application/json").content("{\"plan\":\"FREE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FREE"))
                .andExpect(jsonPath("$.currentPeriodEnd").doesNotExist());
    }

    @Test
    void rejectsUnknownPlansBadDatesAndNonCoaches() throws Exception {
        UUID coachId = userId(coach());
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", coachId), ADMIN)
                        .contentType("application/json").content(change("GOLD", today().plusDays(30))))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", coachId), ADMIN)
                        .contentType("application/json").content(change("PRO", today().minusDays(1))))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", coachId), ADMIN)
                        .contentType("application/json").content("{\"plan\":\"PRO\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", coachId), ADMIN)
                        .contentType("application/json").content(change("PRO", today().plusDays(401))))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/admin/coaches/{id}/plan", userId(user())), ADMIN)
                        .contentType("application/json").content(change("PRO", today().plusDays(30))))
                .andExpect(status().isNotFound());
    }

    private static LocalDate today() {
        return LocalDate.now(ZoneId.of("Europe/Madrid"));
    }

    private static String change(String plan, LocalDate paidUntil) {
        return "{\"plan\":\"" + plan + "\",\"paidUntil\":\"" + paidUntil + "\"}";
    }

    private UUID userId(String email) {
        return jdbc.queryForObject("SELECT id FROM users WHERE email = ?", UUID.class, email);
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@admin-plan.test";
        users.ensureUserExists(email, "Plan Test", null);
        return email;
    }
}

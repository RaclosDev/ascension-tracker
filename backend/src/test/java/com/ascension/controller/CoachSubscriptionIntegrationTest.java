package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.AccountDeletionService;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachSubscriptionIntegrationTest {

    private static final String BODY_ONLY = "{\"training\":false,\"nutrition\":false,\"body\":true}";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;
    @Autowired CoachSubscriptionService subscriptions;
    @Autowired AccountDeletionService accountDeletion;

    @Test
    void becomingACoachStartsTheTrialOnce() throws Exception {
        String coach = coach();
        String body = mvc.perform(as(get("/api/coach/subscription"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("PRO"))
                .andExpect(jsonPath("$.status").value("TRIALING"))
                .andExpect(jsonPath("$.effectivePlan").value("PRO"))
                .andExpect(jsonPath("$.maxClients").value(25))
                .andExpect(jsonPath("$.activeClients").value(0))
                .andExpect(jsonPath("$.aiDailyLimit").value(150))
                .andReturn().getResponse().getContentAsString();
        Instant trialEnds = Instant.parse(json.readTree(body).get("trialEndsAt").asString());
        assertThat(Duration.between(Instant.now(), trialEnds).toDays()).isBetween(13L, 14L);

        // Activating again does not restart the trial.
        jdbc.update("UPDATE coach_subscriptions SET trial_ends_at = NOW() + INTERVAL '2 days' WHERE coach_user_id = ?",
                userId(coach));
        mvc.perform(as(post("/api/coach/profile"), coach)).andExpect(status().isOk());
        String again = mvc.perform(as(get("/api/coach/subscription"), coach))
                .andReturn().getResponse().getContentAsString();
        Instant kept = Instant.parse(json.readTree(again).get("trialEndsAt").asString());
        assertThat(Duration.between(Instant.now(), kept).toHours()).isBetween(47L, 48L);

        mvc.perform(as(get("/api/coach/subscription"), user())).andExpect(status().isForbidden());
    }

    @Test
    void anExpiredTrialFallsBackToTheFreePlanLimitWithoutDroppingClients() throws Exception {
        String coach = coach();
        String first = user();
        accept(first, invite(coach)).andExpect(status().isOk());
        String second = user();
        accept(second, invite(coach)).andExpect(status().isOk());
        String pending = invite(coach);

        expireTrial(coach);
        mvc.perform(as(get("/api/coach/subscription"), coach))
                .andExpect(jsonPath("$.status").value("TRIALING"))
                .andExpect(jsonPath("$.effectivePlan").value("FREE"))
                .andExpect(jsonPath("$.maxClients").value(1))
                .andExpect(jsonPath("$.activeClients").value(2))
                .andExpect(jsonPath("$.aiDailyLimit").value(50));

        // Existing clients stay; new ones are blocked until the coach is under the limit.
        mvc.perform(as(get("/api/coach/clients"), coach)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Tu plan admite 1 atleta activo")));
        accept(user(), pending).andExpect(status().isBadRequest());
    }

    @Test
    void aiQuotaFollowsTheCoachPlanForTheCoachAndLinkedClients() throws Exception {
        String coach = coach();
        String client = user();
        String outsider = user();
        accept(client, invite(coach)).andExpect(status().isOk());

        assertThat(subscriptions.dailyLimitFor(coach)).isEqualTo(150);
        assertThat(subscriptions.dailyLimitFor(client.toUpperCase())).isEqualTo(150);
        assertThat(subscriptions.dailyLimitFor(outsider)).isZero();

        // A canceled plan counts until the paid period ends.
        jdbc.update("""
                UPDATE coach_subscriptions SET plan = 'ELITE', status = 'CANCELED',
                       current_period_end = NOW() + INTERVAL '3 days' WHERE coach_user_id = ?
                """, userId(coach));
        assertThat(subscriptions.dailyLimitFor(client)).isEqualTo(250);
        jdbc.update("UPDATE coach_subscriptions SET current_period_end = NOW() - INTERVAL '1 day' WHERE coach_user_id = ?",
                userId(coach));
        assertThat(subscriptions.dailyLimitFor(client)).isEqualTo(50);

        jdbc.update("UPDATE coach_clients SET status = 'ENDED', ended_at = NOW() WHERE client_user_id = ?",
                userId(client));
        assertThat(subscriptions.dailyLimitFor(client)).isZero();
    }

    @Test
    void theSubscriptionIsExportedAndDeletedWithTheAccount() throws Exception {
        String coach = coach();
        mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching.subscription.plan").value("PRO"))
                .andExpect(jsonPath("$.coaching.subscription.status").value("TRIALING"));

        UUID coachId = userId(coach);
        accountDeletion.wipeAccountData(coach);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_subscriptions WHERE coach_user_id = ?",
                Integer.class, coachId)).isZero();
    }

    private void expireTrial(String coach) {
        jdbc.update("UPDATE coach_subscriptions SET trial_ends_at = NOW() - INTERVAL '1 minute' WHERE coach_user_id = ?",
                userId(coach));
    }

    private UUID userId(String email) {
        return jdbc.queryForObject("SELECT id FROM users WHERE email = ?", UUID.class, email);
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String invite(String coach) throws Exception {
        JsonNode created = json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        return created.get("token").asString();
    }

    private org.springframework.test.web.servlet.ResultActions accept(String client, String token) throws Exception {
        return mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token)
                .contentType("application/json").content(BODY_ONLY), client));
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@plan.test";
        users.ensureUserExists(email, "Plan Test", null);
        return email;
    }
}

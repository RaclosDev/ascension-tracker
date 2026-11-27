package com.ascension.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachClientLimitIntegrationTest {
    private static final String BODY_ONLY = "{\"training\":false,\"nutrition\":false,\"body\":true}";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;

    @Test
    void twoAthletesAcceptingAtTheSameTimeCannotExceedTheFreePlanLimit() throws Exception {
        String coach = newUser();
        mvc.perform(as(post("/api/coach/profile"), coach)).andExpect(status().isOk());
        // The trial plan would allow 25 athletes: end it so the FREE plan (one athlete) applies.
        jdbc.update("UPDATE coach_subscriptions SET status = 'CANCELED', current_period_end = NULL "
                + "WHERE coach_user_id = (SELECT id FROM users WHERE email = ?)", coach);
        String firstToken = invite(coach);
        String secondToken = invite(coach);
        String clientA = newUser();
        String clientB = newUser();

        CountDownLatch start = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            var a = pool.submit(() -> accept(start, clientA, firstToken));
            var b = pool.submit(() -> accept(start, clientB, secondToken));
            start.countDown();
            List<Integer> statuses = List.of(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
            assertThat(statuses).containsExactlyInAnyOrder(200, 400);
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM coach_clients WHERE status = 'ACTIVE'
                  AND coach_user_id = (SELECT id FROM users WHERE email = ?)
                """, Integer.class, coach)).isEqualTo(1);
    }

    private int accept(CountDownLatch start, String client, String token) throws Exception {
        start.await();
        return mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token)
                .contentType("application/json").content(BODY_ONLY), client))
                .andReturn().getResponse().getStatus();
    }

    private String invite(String coach) throws Exception {
        var created = json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        return created.get("token").asString();
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String newUser() {
        String email = UUID.randomUUID() + "@limit.test";
        users.ensureUserExists(email, "Limit Test", null);
        return email;
    }
}

package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.CoachService;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachSetupIntegrationTest {
    private static final String SETUP = """
            {"services":{"training":true,"nutrition":false,"progress":false},
             "goal":"Preparar mi primera competición", "experience":"Dos años", "trainingDays":4,
             "equipment":"Rack y barra", "reviewed":false}
            """;
    private static final String CONSENT = """
            {"training":true,"nutrition":true,"body":true,"editTraining":false,"editNutrition":true}
            """;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired CoachService coaches;

    @Test
    void invitationTransfersSetupWithoutGrantingExtraPermissionsAndExportsIt() throws Exception {
        String coach = coach();
        String client = user();
        String token = invite(coach, "{\"setup\":" + SETUP + "}");
        mvc.perform(as(get("/api/coaching/invitations/{token}", token), client))
                .andExpect(status().isOk()).andExpect(jsonPath("$.setup.trainingDays").value(4));
        String link = accept(client, token);
        mvc.perform(as(get("/api/coach/clients"), coach))
                .andExpect(jsonPath("$[0].setup.goal").value("Preparar mi primera competición"))
                .andExpect(jsonPath("$[0].permissions.editTraining").value(false));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_invitations WHERE coaching_setup IS NOT NULL AND accepted_by = (SELECT id FROM users WHERE email = ?)", Integer.class, client)).isZero();
        assertThat(coaches.exportFor(client).asClient().getFirst().setup().trainingDays()).isEqualTo(4);
        mvc.perform(as(put("/api/coach/clients/{id}/setup", link), coach)
                        .contentType("application/json").content(SETUP.replace("false}", "true}")))
                .andExpect(status().isOk());
        mvc.perform(as(get("/api/coach/clients"), coach))
                .andExpect(jsonPath("$[0].permissions.editTraining").value(false));
    }

    @Test
    void legacyLinksStayUnconfiguredAndStartingServiceHasNoRetroactiveAlerts() throws Exception {
        String coach = coach();
        String link = accept(user(), invite(coach, "{}"));
        jdbc.update("UPDATE coach_clients SET created_at = NOW() - INTERVAL '40 days' WHERE id = ?", UUID.fromString(link));
        mvc.perform(as(get("/api/coach/clients"), coach)).andExpect(jsonPath("$[0].setup").doesNotExist());
        mvc.perform(as(get("/api/coach/clients/status"), coach)).andExpect(jsonPath("$[0].signals").isEmpty());
        mvc.perform(as(put("/api/coach/clients/{id}/setup", link), coach).contentType("application/json").content(SETUP))
                .andExpect(status().isOk());
        mvc.perform(as(get("/api/coach/clients/status"), coach))
                .andExpect(jsonPath("$[0].signals").isEmpty());
        jdbc.update("UPDATE coach_clients SET setup_started_at = NOW() - INTERVAL '10 days' WHERE id = ?", UUID.fromString(link));
        mvc.perform(as(get("/api/coach/clients/status"), coach))
                .andExpect(jsonPath("$[0].signals[?(@.reason == 'FEW_FOOD_LOGS')]").isEmpty())
                .andExpect(jsonPath("$[0].signals[?(@.reason == 'NO_NUTRITION_PLAN')]").isEmpty());
    }

    @Test
    void setupCannotBeEditedByAnotherCoachClientOrAfterEndingLink() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach, "{}"));
        for (String stranger : new String[]{coach(), client}) {
            mvc.perform(as(put("/api/coach/clients/{id}/setup", link), stranger).contentType("application/json").content(SETUP))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(as(post("/api/coach/clients/{id}/end", link), coach)).andExpect(status().isNoContent());
        mvc.perform(as(put("/api/coach/clients/{id}/setup", link), coach).contentType("application/json").content(SETUP))
                .andExpect(status().isNotFound());
    }

    @Test
    void directClientLookupIsScopedAndUnavailableAfterRelationshipEnds() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach, "{\"setup\":" + SETUP + "}"));
        mvc.perform(as(get("/api/coach/clients/{id}", link), coach))
                .andExpect(status().isOk()).andExpect(jsonPath("$.linkId").value(link))
                .andExpect(jsonPath("$.setup.trainingDays").value(4));
        mvc.perform(as(get("/api/coach/clients/{id}", link), coach())).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients/{id}/status", link), coach))
                .andExpect(status().isOk()).andExpect(jsonPath("$.linkId").value(link));
        mvc.perform(as(get("/api/coach/clients/{id}/status", link), coach())).andExpect(status().isNotFound());
        mvc.perform(as(post("/api/coach/clients/{id}/end", link), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/clients/{id}", link), coach)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients/{id}/status", link), coach)).andExpect(status().isNotFound());
    }

    @Test
    void rejectsEmptyServicesAndInvalidAvailabilityAndClearsRevokedSetup() throws Exception {
        String coach = coach();
        for (String setup : new String[]{SETUP.replace("\"training\":true", "\"training\":false"), SETUP.replace("\"trainingDays\":4", "\"trainingDays\":8")}) {
            mvc.perform(as(post("/api/coach/invitations"), coach).contentType("application/json").content("{\"setup\":" + setup + "}"))
                    .andExpect(status().isBadRequest());
        }
        String response = mvc.perform(as(post("/api/coach/invitations"), coach).contentType("application/json").content("{\"setup\":" + SETUP + "}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = json.readTree(response).get("id").asString();
        mvc.perform(as(delete("/api/coach/invitations/{id}", id), coach)).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT coaching_setup::text FROM coach_invitations WHERE id = ?", String.class, UUID.fromString(id))).isNull();
    }

    private String invite(String coach, String body) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach).contentType("application/json").content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
    }
    private String accept(String client, String token) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client).contentType("application/json").content(CONSENT))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }
    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }
    private String user() {
        String email = UUID.randomUUID() + "@setup.test";
        users.ensureUserExists(email, "Setup Test", null);
        return email;
    }
    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }
}

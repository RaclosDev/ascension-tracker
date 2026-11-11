package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
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
class CoachSettingsIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;

    @Test
    void settingsArePrivateVersionedAndIncludedInExport() throws Exception {
        String owner = coach();
        String other = coach();
        mvc.perform(as(get("/api/coach/settings"), owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(0)).andExpect(jsonPath("$.review.day").value(7));
        mvc.perform(as(put("/api/coach/settings"), owner).contentType("application/json").content(body(0, 3)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.displayName").value("Fuerza con Ana"))
                .andExpect(jsonPath("$.version").value(1));
        mvc.perform(as(put("/api/coach/settings"), owner).contentType("application/json").content(body(0, 4)))
                .andExpect(status().isConflict());
        mvc.perform(as(get("/api/coach/settings"), other)).andExpect(jsonPath("$.version").value(0));
        mvc.perform(as(get("/api/user/export"), owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.coachSettings.displayName").value("Fuerza con Ana"));
        assertThat(jdbc.queryForObject("SELECT name FROM users WHERE email = ?", String.class, owner)).isEqualTo("Nombre de cuenta");
    }

    @Test
    void invitationKeepsItsAgendaAfterDefaultsChangeAndUsesProfessionalIdentity() throws Exception {
        String owner = coach();
        String client = user();
        save(owner, 0, 3);
        String token = invite(owner);
        save(owner, 1, 5);
        mvc.perform(as(get("/api/coaching/invitations/{token}", token), client))
                .andExpect(status().isOk()).andExpect(jsonPath("$.coach.name").value("Fuerza con Ana"))
                .andExpect(jsonPath("$.coach.picture").isEmpty()).andExpect(jsonPath("$.coachPresentation").value("Fuerza y seguimiento semanal"))
                .andExpect(jsonPath("$.review.day").value(3)).andExpect(jsonPath("$.review.timeZone").value("Atlantic/Canary"));
        mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                .contentType("application/json").content("{\"training\":true,\"editTraining\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.followup.schedule.day").value(3))
                .andExpect(jsonPath("$.coach.name").value("Fuerza con Ana"))
                .andExpect(jsonPath("$.permissions.editTraining").value(false));
        mvc.perform(as(get("/api/user/export"), client)).andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching.asClient[0].other.name").value("Fuerza con Ana"))
                .andExpect(jsonPath("$.coaching.asClient[0].other.picture").isEmpty());
        save(owner, 2, 1);
        assertThat(jdbc.queryForObject("SELECT review_day FROM coach_clients WHERE coach_user_id = (SELECT id FROM users WHERE email = ?)", Integer.class, owner)).isEqualTo(3);
        String next = invite(owner);
        mvc.perform(as(get("/api/coaching/invitations/{token}", next), user()))
                .andExpect(jsonPath("$.review.day").value(1));
    }

    @Test
    void validatesServicesTimezoneTimeAndRequiredVersion() throws Exception {
        String owner = coach();
        for (String invalid : new String[] {
                body(0, 3).replace("Atlantic/Canary", "Invented/Zone"),
                body(0, 3).replace("17:30", "17:30:01"),
                body(0, 3).replace("\"nutrition\":true", "\"nutrition\":false"),
                body(0, 3).replace("\"paused\":false", "\"paused\":true"),
                body(0, 8), body(0, 3).replace("\"version\":0", "\"version\":null"),
                body(0, 3).replace("Fuerza con Ana", " ") }) {
            mvc.perform(as(put("/api/coach/settings"), owner).contentType("application/json").content(invalid))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void nonCoachCannotSaveOrReadProfessionalSettings() throws Exception {
        String client = user();
        mvc.perform(as(get("/api/coach/settings"), client)).andExpect(status().isForbidden());
        mvc.perform(as(put("/api/coach/settings"), client).contentType("application/json").content(body(0, 3)))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/user/export"), client)).andExpect(status().isOk())
                .andExpect(jsonPath("$.coachSettings").doesNotExist());
    }

    private void save(String owner, int version, int day) throws Exception {
        mvc.perform(as(put("/api/coach/settings"), owner).contentType("application/json").content(body(version, day)))
                .andExpect(status().isOk());
    }
    private String body(int version, int day) {
        return """
                {"displayName":" Fuerza con Ana ","presentation":"Fuerza y seguimiento semanal","showAccountPhoto":false,
                 "services":{"training":false,"nutrition":true,"progress":false},"prefill":true,
                 "review":{"day":%d,"time":"17:30","timeZone":"Atlantic/Canary","paused":false},"version":%d}
                """.formatted(day, version);
    }
    private String invite(String owner) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/invitations"), owner)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("token").asString();
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
        String email = UUID.randomUUID() + "@professional-settings.test";
        users.ensureUserExists(email, "Nombre de cuenta", "https://example.test/photo.png");
        return email;
    }
}

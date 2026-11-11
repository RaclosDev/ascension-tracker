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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachPowerliftingIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;
    private static final String EDIT = "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":true}";
    private static final String PROFILE = """
            {"expectedVersion":0,"profile":{"enabled":true,"equipment":"CLASSIC","federation":"IPF",
            "trainingMax":{"squat":180,"bench":100,"deadlift":220},"notes":"Preparar el bloque",
            "marks":[{"id":"00000000-0000-0000-0000-000000000001","lift":"SQUAT","kg":190,
            "date":"2026-01-01","context":"COMPETITION","reference":"Campeonato"}]}}
            """;

    @Test
    void versionsProfileExportsBothRolesAndCascadesOnAccountDeletion() throws Exception {
        String coach = coach();
        String client = user();
        String link = link(coach, client);
        String path = "/api/coach/clients/" + link + "/powerlifting";
        mvc.perform(as(get(path), coach)).andExpect(status().isOk()).andExpect(jsonPath("$.version").value(0));
        mvc.perform(as(put(path), coach).contentType("application/json").content(PROFILE))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.profile.trainingMax.squat").value(180));
        mvc.perform(as(put(path), coach).contentType("application/json").content(PROFILE))
                .andExpect(status().isConflict());
        mvc.perform(as(put(path), coach).contentType("application/json")
                        .content(PROFILE.replace("\"expectedVersion\":0", "\"expectedVersion\":1").replace("180", "185")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(2));
        for (String email : new String[]{coach, client}) {
            mvc.perform(as(get("/api/user/export"), email)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.powerlifting[0].profile.trainingMax.squat").value(185));
        }
        jdbc.update("DELETE FROM users WHERE email = ?", client);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_powerlifting_profiles WHERE link_id = ?::uuid", Integer.class, link)).isZero();
    }

    @Test
    void rejectsForeignReadOnlyRevokedEndedAndInvalidData() throws Exception {
        String coach = coach();
        String client = user();
        String link = link(coach, client);
        String path = "/api/coach/clients/" + link + "/powerlifting";
        mvc.perform(as(get(path), coach())).andExpect(status().isNotFound());
        mvc.perform(as(put(path), coach).contentType("application/json").content(PROFILE.replace("180", "-1")))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put(path), coach).contentType("application/json").content(PROFILE.replace("2026-01-01", "2099-01-01")))
                .andExpect(status().isBadRequest());
        mvc.perform(as(patch("/api/coaching/coaches/" + link), client).contentType("application/json")
                        .content(EDIT.replace("\"editTraining\":true", "\"editTraining\":false")))
                .andExpect(status().isNoContent());
        mvc.perform(as(get(path), coach)).andExpect(status().isOk());
        mvc.perform(as(put(path), coach).contentType("application/json").content(PROFILE)).andExpect(status().isForbidden());
        mvc.perform(as(patch("/api/coaching/coaches/" + link), client).contentType("application/json")
                        .content("{\"training\":false,\"nutrition\":true,\"body\":false,\"editTraining\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(as(get(path), coach)).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/coach/clients/" + link + "/end"), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get(path), coach)).andExpect(status().isNotFound());
    }

    private String user() {
        String email = UUID.randomUUID() + "@power.test";
        users.ensureUserExists(email, "Power Test", null);
        return email;
    }
    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }
    private String link(String coach, String client) throws Exception {
        String token = json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/" + token + "/accept"), client)
                .contentType("application/json").content(EDIT)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }
    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }
}

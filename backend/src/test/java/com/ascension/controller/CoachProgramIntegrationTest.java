package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import tools.jackson.databind.JsonNode;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachProgramIntegrationTest {

    private static final String PROGRAM = """
            {"name":"Fuerza 4 semanas","notes":"Progresión lineal","weeks":4,"days":[
              {"week":1,"dayIndex":1,"name":"Torso","exercises":[
                {"exerciseId":"bench-press","exerciseName":"Press banca","sets":4,"repsMin":6,"repsMax":8,
                 "targetRpe":8.5,"restSeconds":150,"loadHint":"75 %","notes":"Pausa en el pecho"},
                {"exerciseId":"custom-row","exerciseName":"Remo en polea del entrenador","sets":3,"repsMin":10,
                 "repsMax":12,"targetRir":2,"supersetGroup":1}]},
              {"week":1,"dayIndex":3,"name":"Pierna","exercises":[
                {"exerciseId":"squat","sets":5,"repsMin":5,"repsMax":5}]}]}
            """;

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired AccountDeletionService accountDeletion;
    @Autowired ObjectMapper json;

    @Test
    void coachBuildsUpdatesDuplicatesAndDeletesLibraryPrograms() throws Exception {
        String coach = coach();
        String id = create(coach, PROGRAM);

        mvc.perform(as(get("/api/coach/programs/{id}", id), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Fuerza 4 semanas"))
                .andExpect(jsonPath("$.days.length()").value(2))
                .andExpect(jsonPath("$.days[0].exercises[0].exerciseName").value("Press banca"))
                .andExpect(jsonPath("$.days[0].exercises[0].targetRpe").value(8.5))
                .andExpect(jsonPath("$.days[0].exercises[1].supersetGroup").value(1))
                .andExpect(jsonPath("$.days[0].exercises[1].targetRpe").doesNotExist())
                .andExpect(jsonPath("$.days[1].name").value("Pierna"));

        mvc.perform(as(put("/api/coach/programs/{id}", id), coach).contentType("application/json").content("""
                        {"name":"Fuerza v2","weeks":2,"days":[{"week":2,"dayIndex":5,"name":"Full body",
                          "exercises":[{"exerciseId":"deadlift","sets":3}]}]}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Fuerza v2"))
                .andExpect(jsonPath("$.days.length()").value(1))
                .andExpect(jsonPath("$.days[0].exercises[0].exerciseId").value("deadlift"));

        String copyId = json.readTree(mvc.perform(as(post("/api/coach/programs/{id}/duplicate", id), coach))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Fuerza v2 (copia)"))
                .andExpect(jsonPath("$.days[0].name").value("Full body"))
                .andReturn().getResponse().getContentAsString()).get("id").asString();
        assertThat(copyId).isNotEqualTo(id);

        mvc.perform(as(get("/api/coach/programs"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].dayCount").value(1));

        mvc.perform(as(delete("/api/coach/programs/{id}", id), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/programs/{id}", id), coach)).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM program_days WHERE program_id = ?::uuid",
                Integer.class, id)).isZero();
    }

    @Test
    void programsAreInvisibleToOtherAccountsAndNonCoaches() throws Exception {
        String coach = coach();
        String otherCoach = coach();
        String notCoach = user();
        String id = create(coach, PROGRAM);

        mvc.perform(as(get("/api/coach/programs/{id}", id), otherCoach)).andExpect(status().isNotFound());
        mvc.perform(as(put("/api/coach/programs/{id}", id), otherCoach).contentType("application/json")
                .content(PROGRAM)).andExpect(status().isNotFound());
        mvc.perform(as(post("/api/coach/programs/{id}/duplicate", id), otherCoach)).andExpect(status().isNotFound());
        mvc.perform(as(delete("/api/coach/programs/{id}", id), otherCoach)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/programs"), otherCoach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(as(get("/api/coach/programs/{id}", UUID.randomUUID()), coach)).andExpect(status().isNotFound());

        mvc.perform(as(get("/api/coach/programs"), notCoach)).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/coach/programs"), notCoach).contentType("application/json").content(PROGRAM))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/programs/{id}", id), notCoach)).andExpect(status().isForbidden());
    }

    @Test
    void rejectsInvalidPrograms() throws Exception {
        String coach = coach();
        String[] invalid = {
                // Day beyond the program's weeks.
                """
                {"name":"X","weeks":1,"days":[{"week":2,"dayIndex":1,"name":"D","exercises":[]}]}""",
                // Two days in the same slot.
                """
                {"name":"X","weeks":1,"days":[{"week":1,"dayIndex":1,"name":"A","exercises":[]},
                  {"week":1,"dayIndex":1,"name":"B","exercises":[]}]}""",
                // Reps range upside down.
                """
                {"name":"X","weeks":1,"days":[{"week":1,"dayIndex":1,"name":"A","exercises":[
                  {"exerciseId":"squat","sets":3,"repsMin":10,"repsMax":5}]}]}""",
                // Out-of-range values and missing fields.
                """
                {"name":"X","weeks":1,"days":[{"week":1,"dayIndex":8,"name":"A","exercises":[]}]}""",
                """
                {"name":"X","weeks":1,"days":[{"week":1,"dayIndex":1,"name":"A","exercises":[
                  {"exerciseId":"squat","sets":0}]}]}""",
                """
                {"name":"X","weeks":1,"days":[{"week":1,"dayIndex":1,"name":"A","exercises":[
                  {"exerciseId":"squat","sets":3,"targetRpe":11}]}]}""",
                """
                {"name":" ","weeks":1,"days":[]}""",
                """
                {"name":"X","weeks":0,"days":[]}""",
                """
                {"name":"X","weeks":1}"""
        };
        for (String body : invalid) {
            mvc.perform(as(post("/api/coach/programs"), coach).contentType("application/json").content(body))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(as(get("/api/coach/programs"), coach)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void gdprExportIncludesTheCoachPrograms() throws Exception {
        String coach = coach();
        create(coach, PROGRAM);
        mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programs[0].name").value("Fuerza 4 semanas"))
                .andExpect(jsonPath("$.programs[0].days[0].exercises[0].exerciseName").value("Press banca"));
        mvc.perform(as(get("/api/user/export"), user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programs").doesNotExist());
    }

    @Test
    void deletingTheCoachAccountRemovesTheirPrograms() throws Exception {
        String coach = coach();
        String id = create(coach, PROGRAM);
        accountDeletion.wipeAccountData(coach);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM programs WHERE id = ?::uuid", Integer.class, id))
                .isZero();
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM program_exercises e JOIN program_days d ON d.id = e.program_day_id
                WHERE d.program_id = ?::uuid
                """, Integer.class, id)).isZero();
    }

    private String create(String coach, String body) throws Exception {
        JsonNode created = json.readTree(mvc.perform(as(post("/api/coach/programs"), coach)
                        .contentType("application/json").content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        return created.get("id").asString();
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
        String email = UUID.randomUUID() + "@programs.test";
        users.ensureUserExists(email, "Program Test", null);
        return email;
    }
}

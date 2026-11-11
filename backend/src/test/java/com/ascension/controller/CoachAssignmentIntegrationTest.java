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

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachAssignmentIntegrationTest {

    private static final String PROGRAM = """
            {"name":"Fuerza","status":"READY","weeks":2,"days":[{"week":1,"dayIndex":1,"name":"Torso","exercises":[
              {"exerciseId":"bench-press","exerciseName":"Press banca","sets":4,"repsMin":6,"repsMax":8}]}]}
            """;
    private static final String EDIT = "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":true}";
    private static final String VIEW = "{\"training\":true,\"nutrition\":false,\"body\":false}";
    private static final String EDIT_WITHOUT_VIEW =
            "{\"training\":false,\"nutrition\":false,\"body\":true,\"editTraining\":true}";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired AccountDeletionService accountDeletion;
    @Autowired ObjectMapper json;

    @Test
    void draftsAndStalePreviewsCannotReplaceAnActiveAssignment() throws Exception {
        String coach = coach();
        String link = accept(user(), invite(coach), EDIT);
        String program = createProgram(coach);
        String active = assign(coach, link, program).get("id").asString();
        String version = json.readTree(mvc.perform(as(get("/api/coach/programs/{id}", program), coach))
                .andReturn().getResponse().getContentAsString()).get("updatedAt").asString();
        mvc.perform(as(put("/api/coach/programs/{id}", program), coach).contentType("application/json")
                .content(PROGRAM.replace("READY", "DRAFT"))).andExpect(status().isOk());
        mvc.perform(assignRequest(coach, link, program)).andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/coach/programs/{id}", program), coach).contentType("application/json")
                .content(PROGRAM)).andExpect(status().isOk());
        mvc.perform(as(post("/api/coach/clients/{link}/programs", link), coach).contentType("application/json")
                .content("""
                        {"programId":"%s","startDate":"%s","programUpdatedAt":"%s"}
                        """.formatted(program, LocalDate.now(), version)))
                .andExpect(status().isConflict());
        mvc.perform(as(get("/api/coach/clients/{link}/programs", link), coach))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(active))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void assignsACopyOwnedByTheClientThatOutlivesTheOriginal() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT);
        String programId = createProgram(coach);

        mvc.perform(as(get("/api/coach/clients"), coach))
                .andExpect(jsonPath("$[0].permissions.editTraining").value(true));

        JsonNode assignment = assign(coach, linkId, programId);
        String copyId = assignment.get("programId").asString();
        assertThat(copyId).isNotEqualTo(programId);
        assertThat(assignment.get("sourceProgramId").asString()).isEqualTo(programId);
        assertThat(assignment.get("status").asString()).isEqualTo("ACTIVE");
        assertThat(assignment.get("programName").asString()).isEqualTo("Fuerza");

        assertThat(jdbc.queryForObject("""
                SELECT u.email FROM programs p JOIN users u ON u.id = p.owner_user_id
                WHERE p.id = ?::uuid AND NOT p.is_library
                """, String.class, copyId)).isEqualTo(client);
        // The copy never shows up in the coach's library.
        mvc.perform(as(get("/api/coach/programs"), coach)).andExpect(jsonPath("$.length()").value(1));

        mvc.perform(as(put("/api/coach/programs/{id}", programId), coach).contentType("application/json")
                .content(PROGRAM.replace("Fuerza", "Otro"))).andExpect(status().isOk());
        mvc.perform(as(delete("/api/coach/programs/{id}", programId), coach)).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT name FROM programs WHERE id = ?::uuid", String.class, copyId))
                .isEqualTo("Fuerza");
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM program_exercises e JOIN program_days d ON d.id = e.program_day_id
                WHERE d.program_id = ?::uuid
                """, Integer.class, copyId)).isEqualTo(1);
        mvc.perform(as(get("/api/coach/clients/{linkId}/programs", linkId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].sourceProgramId").doesNotExist());
    }

    @Test
    void aNewAssignmentEndsTheActiveOne() throws Exception {
        String coach = coach();
        String linkId = accept(user(), invite(coach), EDIT);
        String first = assign(coach, linkId, createProgram(coach)).get("id").asString();
        String second = assign(coach, linkId, createProgram(coach)).get("id").asString();

        mvc.perform(as(get("/api/coach/clients/{linkId}/programs", linkId), coach))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(second))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].status").value("ENDED"))
                .andExpect(jsonPath("$[1].endedAt").exists());

        mvc.perform(as(post("/api/coach/clients/{linkId}/programs/{id}/end", linkId, first), coach))
                .andExpect(status().isNotFound());
        mvc.perform(as(post("/api/coach/clients/{linkId}/programs/{id}/end", linkId, second), coach))
                .andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM program_assignments WHERE coach_link_id = ?::uuid"
                + " AND status = 'ACTIVE'", Integer.class, linkId)).isZero();
    }

    @Test
    void assigningNeedsTheEditConsentAndViewingNeedsTraining() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), VIEW);
        String programId = createProgram(coach);

        mvc.perform(assignRequest(coach, linkId, programId)).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{linkId}/programs", linkId), coach)).andExpect(status().isOk());

        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                .content(EDIT)).andExpect(status().isNoContent());
        mvc.perform(assignRequest(coach, linkId, programId)).andExpect(status().isCreated());

        // Edit without view is never stored: the client cannot grant prescribing on hidden training.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                .content(EDIT_WITHOUT_VIEW)).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT can_edit_training FROM coach_clients WHERE id = ?::uuid",
                Boolean.class, linkId)).isFalse();
        mvc.perform(assignRequest(coach, linkId, programId)).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{linkId}/programs", linkId), coach)).andExpect(status().isForbidden());

        String other = accept(user(), invite(coach), EDIT_WITHOUT_VIEW);
        assertThat(jdbc.queryForObject("SELECT can_edit_training FROM coach_clients WHERE id = ?::uuid",
                Boolean.class, other)).isFalse();
    }

    @Test
    void foreignLinksProgramsAndEndedLinksAreNotFound() throws Exception {
        String coach = coach();
        String otherCoach = coach();
        String linkId = accept(user(), invite(coach), EDIT);
        String foreignProgram = createProgram(otherCoach);
        String programId = createProgram(coach);

        mvc.perform(assignRequest(otherCoach, linkId, foreignProgram)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients/{linkId}/programs", linkId), otherCoach))
                .andExpect(status().isNotFound());
        mvc.perform(assignRequest(coach, linkId, foreignProgram)).andExpect(status().isNotFound());
        String assignmentId = assign(coach, linkId, programId).get("id").asString();
        mvc.perform(as(post("/api/coach/clients/{linkId}/programs/{id}/end", linkId, assignmentId), otherCoach))
                .andExpect(status().isNotFound());

        // A program already copied to a client cannot be assigned again as if it were the coach's.
        String copyId = jdbc.queryForObject("SELECT program_id FROM program_assignments WHERE id = ?::uuid",
                UUID.class, assignmentId).toString();
        mvc.perform(assignRequest(coach, linkId, copyId)).andExpect(status().isNotFound());

        mvc.perform(as(post("/api/coach/clients/{linkId}/end", linkId), coach)).andExpect(status().isNoContent());
        mvc.perform(assignRequest(coach, linkId, programId)).andExpect(status().isNotFound());
        // Ending the link leaves the client's copy and the record in place.
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM programs WHERE id = ?::uuid", Integer.class, copyId))
                .isEqualTo(1);
    }

    @Test
    void rejectsStartDatesTooFarAndMissingFields() throws Exception {
        String coach = coach();
        String linkId = accept(user(), invite(coach), EDIT);
        String programId = createProgram(coach);
        String[] invalid = {
                "{\"programId\":\"" + programId + "\",\"startDate\":\"" + LocalDate.now().plusYears(2) + "\"}",
                "{\"programId\":\"" + programId + "\",\"startDate\":\"" + LocalDate.now().minusYears(2) + "\"}",
                "{\"programId\":\"" + programId + "\"}",
                "{\"startDate\":\"" + LocalDate.now() + "\"}"
        };
        for (String body : invalid) {
            mvc.perform(as(post("/api/coach/clients/{linkId}/programs", linkId), coach)
                    .contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
    }

    @Test
    void exportShowsBothSidesAndDeletingTheClientRemovesTheCopy() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT);
        String copyId = assign(coach, linkId, createProgram(coach)).get("programId").asString();

        mvc.perform(as(get("/api/user/export"), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching.programAssignments[0].role").value("CLIENT"))
                .andExpect(jsonPath("$.coaching.programAssignments[0].other.email").value(coach))
                .andExpect(jsonPath("$.coaching.programAssignments[0].programName").value("Fuerza"));
        mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching.programAssignments[0].role").value("COACH"))
                .andExpect(jsonPath("$.coaching.programAssignments[0].other.email").value(client));

        accountDeletion.wipeAccountData(client);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM programs WHERE id = ?::uuid", Integer.class, copyId))
                .isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM program_assignments WHERE program_id = ?::uuid",
                Integer.class, copyId)).isZero();
    }

    private JsonNode assign(String coach, String linkId, String programId) throws Exception {
        return json.readTree(mvc.perform(assignRequest(coach, linkId, programId))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private MockHttpServletRequestBuilder assignRequest(String coach, String linkId, String programId) {
        return as(post("/api/coach/clients/{linkId}/programs", linkId), coach).contentType("application/json")
                .content("{\"programId\":\"" + programId + "\",\"startDate\":\"" + LocalDate.now() + "\"}");
    }

    private String createProgram(String coach) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/programs"), coach)
                        .contentType("application/json").content(PROGRAM))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
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
        String email = UUID.randomUUID() + "@assign.test";
        users.ensureUserExists(email, "Assign Test", null);
        return email;
    }
}

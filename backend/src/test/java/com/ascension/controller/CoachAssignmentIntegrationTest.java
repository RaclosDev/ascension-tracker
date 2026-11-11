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
    void libraryFavoritesArePersonalAndCannotReferToAnotherCoachsProgram() throws Exception {
        String coach=coach(); String other=coach(); String program=createProgram(coach);
        String item="""
                {"type":"PROGRAM","id":"%s","favorite":true,"category":"SESSION","tags":["casa","30 min"],"minutes":30,"equipment":"mancuernas","used":true}
                """.formatted(program);
        mvc.perform(as(put("/api/coach/library-items"),coach).contentType("application/json").content(item))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].favorite").value(true)).andExpect(jsonPath("$[0].lastUsed").exists());
        mvc.perform(as(get("/api/coach/library-items"),other)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(as(put("/api/coach/library-items"),other).contentType("application/json").content(item)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/user/export"),coach)).andExpect(jsonPath("$.coachLibraryItems[0].tags[0]").value("casa"));
    }

    @Test
    void structuredLoadsSnapshotTrainingMaxAndDoNotTrustClientSuppliedReferences() throws Exception {
        String coach = coach(); String client = user(); String link = accept(client,invite(coach),EDIT);
        String profile = """
                {"expectedVersion":0,"profile":{"enabled":true,"equipment":"CLASSIC","federation":"",
                "trainingMax":{"squat":150,"bench":100,"deadlift":180},"marks":[],"notes":""}}
                """;
        mvc.perform(as(put("/api/coach/clients/{link}/powerlifting",link),coach).contentType("application/json").content(profile))
                .andExpect(status().isOk());
        String structured = PROGRAM.replace("\"sets\":4", """
                "sets":1,"prescription":{"load":{"mode":"PERCENT_TM","amount":82,"unit":"TOTAL","lift":"bench","increment":2.5,"referenceKg":999,"resolvedKg":999},
                "sets":[{"kind":"TOP","reps":3,"rpe":8,"load":null}]}
                """);
        String program = json.readTree(mvc.perform(as(post("/api/coach/programs"),coach).contentType("application/json").content(structured))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
        String assignment = assign(coach,link,program).get("id").asString();
        String read = "/api/coach/clients/"+link+"/programs/"+assignment+"/plan";
        mvc.perform(as(get(read),coach)).andExpect(status().isOk())
                .andExpect(jsonPath("$.days[0].exercises[0].prescription.load.referenceKg").value(100))
                .andExpect(jsonPath("$.days[0].exercises[0].prescription.load.resolvedKg").value(82.5));
        mvc.perform(as(put("/api/coach/clients/{link}/powerlifting",link),coach).contentType("application/json")
                .content(profile.replace("\"expectedVersion\":0","\"expectedVersion\":1").replace("\"bench\":100","\"bench\":120")))
                .andExpect(status().isOk());
        mvc.perform(as(get(read),coach)).andExpect(jsonPath("$.days[0].exercises[0].prescription.load.resolvedKg").value(82.5));
        mvc.perform(as(post("/api/coach/programs"),coach).contentType("application/json")
                .content(structured.replace("\"rpe\":8","\"rpe\":8,\"rir\":2"))).andExpect(status().isBadRequest());
    }

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

    @Test
    void adaptationPublishesANewCopyAndPreservesLibraryAndRecordedWorkouts() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), EDIT);
        String library = createProgram(coach);
        JsonNode original = assign(coach, link, library);
        String assignmentId = original.get("id").asString();
        String copyId = original.get("programId").asString();
        String dayId = jdbc.queryForObject("SELECT id::text FROM program_days WHERE program_id = ?::uuid LIMIT 1",
                String.class, copyId);
        mvc.perform(as(post("/api/workouts"), client).contentType("application/json").content("""
                {"name":"Torso","startedAt":1000,"finishedAt":2000,"exercises":[],"programDayId":"%s"}
                """.formatted(dayId))).andExpect(status().isOk());

        JsonNode adapted = json.readTree(mvc.perform(adaptRequest(coach, link, assignmentId,
                        PROGRAM.replace("Fuerza", "Fuerza adaptada").replace("\"sets\":4", "\"sets\":3"), LocalDate.now()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertThat(adapted.get("programId").asString()).isNotEqualTo(copyId);
        assertThat(adapted.get("sourceProgramId").asString()).isEqualTo(library);
        mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", link, assignmentId), coach))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Fuerza"))
                .andExpect(jsonPath("$.days[0].exercises[0].sets").value(4));
        mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", link, adapted.get("id").asString()), coach))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Fuerza adaptada"))
                .andExpect(jsonPath("$.days[0].exercises[0].sets").value(3));
        mvc.perform(as(get("/api/coach/programs/{id}", library), coach))
                .andExpect(jsonPath("$.name").value("Fuerza"));
        mvc.perform(as(get("/api/coach/clients/{link}/programs", link), coach))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].status").value("ENDED"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workouts WHERE program_day_id = ?::uuid", Integer.class, dayId))
                .isEqualTo(1);
        mvc.perform(adaptRequest(coach, link, assignmentId, PROGRAM, LocalDate.now()))
                .andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM program_assignments WHERE coach_link_id = ?::uuid", Integer.class, link))
                .isEqualTo(2);
    }

    @Test
    void adaptationChecksConsentAndAssignmentOwnershipOnReadAndPublish() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), EDIT);
        String assignment = assign(coach, link, createProgram(coach)).get("id").asString();
        String otherLink = accept(user(), invite(coach), EDIT);
        String otherCoach = coach();
        mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", otherLink, assignment), coach))
                .andExpect(status().isNotFound());
        mvc.perform(adaptRequest(coach, otherLink, assignment, PROGRAM, LocalDate.now()))
                .andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", link, assignment), otherCoach))
                .andExpect(status().isNotFound());
        mvc.perform(adaptRequest(otherCoach, link, assignment, PROGRAM, LocalDate.now()))
                .andExpect(status().isNotFound());

        mvc.perform(as(patch("/api/coaching/coaches/{link}", link), client).contentType("application/json").content(VIEW))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", link, assignment), coach))
                .andExpect(status().isOk());
        mvc.perform(adaptRequest(coach, link, assignment, PROGRAM, LocalDate.now()))
                .andExpect(status().isForbidden());
        mvc.perform(as(patch("/api/coaching/coaches/{link}", link), client).contentType("application/json").content(EDIT_WITHOUT_VIEW))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", link, assignment), coach))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidAdaptationCannotEndTheCurrentProgram() throws Exception {
        String coach = coach();
        String link = accept(user(), invite(coach), EDIT);
        String assignment = assign(coach, link, createProgram(coach)).get("id").asString();
        mvc.perform(adaptRequest(coach, link, assignment, PROGRAM, LocalDate.now().minusDays(1)))
                .andExpect(status().isBadRequest());
        mvc.perform(adaptRequest(coach, link, assignment, "{\"name\":\"Vacío\",\"weeks\":1,\"days\":[]}", LocalDate.now()))
                .andExpect(status().isBadRequest());
        mvc.perform(adaptRequest(coach, link, assignment, PROGRAM.replace("\"sets\":4", "\"sets\":0"), LocalDate.now()))
                .andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/coach/clients/{link}/programs", link), coach))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void futureAdaptationKeepsTodayAndCancellationRestoresThePreviousSchedule() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), EDIT);
        JsonNode current = assign(coach, link, createProgram(coach));
        LocalDate future = LocalDate.now().plusDays(2);
        JsonNode scheduled = json.readTree(mvc.perform(adaptRequest(coach, link, current.get("id").asString(),
                        PROGRAM.replace("Fuerza", "Semana siguiente"), future))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn().getResponse().getContentAsString());
        mvc.perform(as(get("/api/coach/clients/{link}/programs", link), coach))
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"))
                .andExpect(jsonPath("$[1].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].endedAt").doesNotExist());
        mvc.perform(as(get("/api/coaching/today").param("date", LocalDate.now().toString()), client))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].phase").value("UPCOMING"))
                .andExpect(jsonPath("$[1].programId").value(current.get("programId").asString()));
        mvc.perform(as(get("/api/coaching/today").param("date", future.toString()), client))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].programId").value(scheduled.get("programId").asString()));
        mvc.perform(as(post("/api/coaching/programs/{id}/end", scheduled.get("id").asString()), client))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/today").param("date", future.toString()), client))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].programId").value(current.get("programId").asString()));
    }

    @Test
    void weeklyDraftChecksOwnershipVersionsAndKeepsPrivateNotesOutOfThePublishedCopy() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), EDIT);
        String monday = LocalDate.now().with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY)).toString();
        String path = "/api/coach/clients/" + link + "/weeks/" + monday;
        String body = """
                {"expectedVersion":0,"content":{"program":%s,"privateNotes":"Solo entrenador",
                "intent":"DELOAD","decision":"Reducir fatiga"}}
                """.formatted(PROGRAM.replace("\"weeks\":2", "\"weeks\":1"));
        mvc.perform(as(put(path), coach).contentType("application/json").content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));
        mvc.perform(as(put(path), coach).contentType("application/json").content(body))
                .andExpect(status().isConflict());
        mvc.perform(as(get(path), coach())).andExpect(status().isNotFound());
        mvc.perform(as(get(path), client)).andExpect(status().isNotFound());
        JsonNode published = json.readTree(mvc.perform(as(post(path + "/publish"), coach)
                        .contentType("application/json").content("{\"expectedVersion\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.publishedVersion").value(1))
                .andReturn().getResponse().getContentAsString());
        String assignment = published.get("assignmentId").asString();
        String copy = mvc.perform(as(get("/api/coach/clients/{link}/programs/{id}/plan", link, assignment), coach))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(copy).doesNotContain("Solo entrenador", "Reducir fatiga");
        mvc.perform(as(post(path + "/publish"), coach).contentType("application/json").content("{\"expectedVersion\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignmentId").value(assignment));
        mvc.perform(as(get("/api/user/export"), coach)).andExpect(jsonPath("$.coachWeekPlans[0].content.privateNotes").value("Solo entrenador"));
        mvc.perform(as(get("/api/user/export"), client)).andExpect(jsonPath("$.coachWeekPlans").doesNotExist());
    }

    private MockHttpServletRequestBuilder adaptRequest(String coach, String link, String assignment, String program, LocalDate start) {
        return as(post("/api/coach/clients/{link}/programs/{id}/adapt", link, assignment), coach)
                .contentType("application/json").content("{\"program\":" + program + ",\"startDate\":\"" + start + "\"}");
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

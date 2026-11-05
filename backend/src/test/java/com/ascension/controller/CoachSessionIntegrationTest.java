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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
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

/** The coach's prescribed-versus-done view of a client's program, and comments on workouts. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachSessionIntegrationTest {

    private static final String EDIT = "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":true}";
    private static final String NO_TRAINING = "{\"training\":false,\"nutrition\":true,\"body\":false,\"editTraining\":false}";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;

    private final LocalDate start = LocalDate.now();
    private final LocalDate monday = start.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

    @Test
    void showsEachPrescribedDayNextToTheWorkoutAndTheCoachComment() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT);
        String assignmentId = assign(coach, linkId, createProgram(coach), start);
        String sessions = "/api/coach/clients/{linkId}/programs/{id}/sessions";

        mvc.perform(as(get(sessions, linkId, assignmentId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].week").value(1))
                .andExpect(jsonPath("$[0].dayIndex").value(1))
                .andExpect(jsonPath("$[0].date").value(monday.toString()))
                .andExpect(jsonPath("$[0].name").value("Torso"))
                .andExpect(jsonPath("$[0].exercises[0].sets").value(4))
                .andExpect(jsonPath("$[0].workoutId").doesNotExist())
                .andExpect(jsonPath("$[1].week").value(2))
                .andExpect(jsonPath("$[1].date").value(monday.plusWeeks(1).plusDays(2).toString()));

        String dayId = jdbc.queryForObject("""
                SELECT d.id::text FROM program_days d JOIN program_assignments a ON a.program_id = d.program_id
                WHERE a.id = ?::uuid AND d.week = 1
                """, String.class, assignmentId);
        String workoutId = saveWorkout(client, dayId);

        String comment = "/api/coach/clients/{linkId}/workouts/{workoutId}/comment";
        mvc.perform(as(put(comment, linkId, workoutId), coach).contentType("application/json")
                .content("{\"text\":\"  \"}")).andExpect(status().isBadRequest());
        mvc.perform(as(put(comment, linkId, workoutId), coach).contentType("application/json")
                .content("{\"text\":\"Buen trabajo\"}")).andExpect(status().isNoContent());
        mvc.perform(as(put(comment, linkId, workoutId), coach).contentType("application/json")
                .content("{\"text\":\" Sube 2,5 kg la próxima \"}")).andExpect(status().isNoContent());

        mvc.perform(as(get(sessions, linkId, assignmentId), coach))
                .andExpect(jsonPath("$[0].workoutId").value(workoutId))
                .andExpect(jsonPath("$[0].workoutName").value("Torso"))
                .andExpect(jsonPath("$[0].finishedAt").value(2000))
                .andExpect(jsonPath("$[0].origin").value("PRESCRIBED_MODIFIED"))
                .andExpect(jsonPath("$[0].comment").value("Sube 2,5 kg la próxima"))
                .andExpect(jsonPath("$[1].workoutId").doesNotExist());

        mvc.perform(as(get("/api/coaching/workouts/{id}/comments", workoutId), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].coach.email").value(coach))
                .andExpect(jsonPath("$[0].text").value("Sube 2,5 kg la próxima"));
        // Someone else's workout reads as having no comments.
        mvc.perform(as(get("/api/coaching/workouts/{id}/comments", workoutId), user()))
                .andExpect(jsonPath("$.length()").value(0));

        mvc.perform(as(get("/api/user/export"), client))
                .andExpect(jsonPath("$.coaching.workoutComments[0].role").value("CLIENT"))
                .andExpect(jsonPath("$.coaching.workoutComments[0].other.email").value(coach))
                .andExpect(jsonPath("$.coaching.workoutComments[0].workoutId").value(workoutId));
        mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(jsonPath("$.coaching.workoutComments[0].role").value("COACH"))
                .andExpect(jsonPath("$.coaching.workoutComments[0].other.email").value(client));

        mvc.perform(as(delete(comment, linkId, workoutId), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/workouts/{id}/comments", workoutId), client))
                .andExpect(jsonPath("$.length()").value(0));

        // Comments go with the workout.
        mvc.perform(as(put(comment, linkId, workoutId), coach).contentType("application/json")
                .content("{\"text\":\"Otra vez\"}")).andExpect(status().isNoContent());
        mvc.perform(as(delete("/api/workouts/{id}", workoutId), client)).andExpect(status().is2xxSuccessful());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workout_comments WHERE workout_id = ?",
                Integer.class, workoutId)).isZero();
    }

    @Test
    void sessionsAndCommentsStayWithinTheLinkAndItsConsent() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT);
        String assignmentId = assign(coach, linkId, createProgram(coach), start);
        String workoutId = saveWorkout(client, null);
        String sessions = "/api/coach/clients/{linkId}/programs/{id}/sessions";
        String comment = "/api/coach/clients/{linkId}/workouts/{workoutId}/comment";

        // Another coach, or the same coach through another client's link, sees nothing.
        String otherCoach = coach();
        mvc.perform(as(get(sessions, linkId, assignmentId), otherCoach)).andExpect(status().isNotFound());
        mvc.perform(as(put(comment, linkId, workoutId), otherCoach).contentType("application/json")
                .content("{\"text\":\"Hola\"}")).andExpect(status().isNotFound());
        String otherClient = user();
        String otherLink = accept(otherClient, invite(coach), EDIT);
        mvc.perform(as(get(sessions, otherLink, assignmentId), coach)).andExpect(status().isNotFound());
        mvc.perform(as(put(comment, otherLink, workoutId), coach).contentType("application/json")
                .content("{\"text\":\"Hola\"}")).andExpect(status().isNotFound());
        mvc.perform(as(put(comment, linkId, saveWorkout(otherClient, null)), coach).contentType("application/json")
                .content("{\"text\":\"Hola\"}")).andExpect(status().isNotFound());
        mvc.perform(as(get(sessions, linkId, UUID.randomUUID().toString()), coach)).andExpect(status().isNotFound());

        // Without training consent the coach can neither read sessions nor comment.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                .content(NO_TRAINING)).andExpect(status().isNoContent());
        mvc.perform(as(get(sessions, linkId, assignmentId), coach)).andExpect(status().isForbidden());
        mvc.perform(as(put(comment, linkId, workoutId), coach).contentType("application/json")
                .content("{\"text\":\"Hola\"}")).andExpect(status().isForbidden());

        // Once the link ends, nothing at all.
        mvc.perform(as(post("/api/coach/clients/{linkId}/end", linkId), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get(sessions, linkId, assignmentId), coach)).andExpect(status().isNotFound());
        mvc.perform(as(delete(comment, linkId, workoutId), coach)).andExpect(status().isNotFound());
    }

    private String saveWorkout(String email, String dayId) throws Exception {
        String link = dayId == null ? "" : ",\"programDayId\":\"" + dayId + "\",\"programOrigin\":\"PRESCRIBED_MODIFIED\"";
        return json.readTree(mvc.perform(as(post("/api/workouts"), email).contentType("application/json")
                        .content("{\"name\":\"Torso\",\"startedAt\":1000,\"finishedAt\":2000,"
                                + "\"exercises\":[]" + link + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("id").asString();
    }

    private String assign(String coach, String linkId, String programId, LocalDate start) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/clients/{linkId}/programs", linkId), coach)
                        .contentType("application/json")
                        .content("{\"programId\":\"" + programId + "\",\"startDate\":\"" + start + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString())
                .get("id").asString();
    }

    private String createProgram(String coach) throws Exception {
        String program = """
                {"name":"Fuerza","weeks":2,"days":[
                  {"week":2,"dayIndex":3,"name":"Pierna","exercises":[
                    {"exerciseId":"squat","exerciseName":"Sentadilla","sets":3}]},
                  {"week":1,"dayIndex":1,"name":"Torso","exercises":[
                    {"exerciseId":"bench-press","exerciseName":"Press banca","sets":4,"repsMin":6,"repsMax":8}]}]}
                """;
        return json.readTree(mvc.perform(as(post("/api/coach/programs"), coach)
                        .contentType("application/json").content(program))
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
        String email = UUID.randomUUID() + "@sessions.test";
        users.ensureUserExists(email, "Session Test", null);
        return email;
    }
}

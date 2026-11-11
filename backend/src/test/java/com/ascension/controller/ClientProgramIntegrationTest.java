package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The client's "Hoy": the prescribed day for a date, and workouts that carry it out. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class ClientProgramIntegrationTest {

    private static final String EDIT = "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":true}";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;

    private final LocalDate today = LocalDate.now();
    private final int weekday = today.getDayOfWeek().getValue();

    @Test
    void showsTodaysPrescribedDayAndLinksTheWorkoutThatCarriesItOut() throws Exception {
        String coach = coach();
        String client = user();
        String copyId = assign(coach, accept(client, invite(coach)), createProgram(coach, weekday), today);
        String dayId = dayOf(copyId);

        mvc.perform(as(get("/api/coaching/today").param("date", today.toString()), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].phase").value("ACTIVE"))
                .andExpect(jsonPath("$[0].week").value(1))
                .andExpect(jsonPath("$[0].dayIndex").value(weekday))
                .andExpect(jsonPath("$[0].programName").value("Fuerza"))
                .andExpect(jsonPath("$[0].coachName").value("Today Test"))
                .andExpect(jsonPath("$[0].day.id").value(dayId))
                .andExpect(jsonPath("$[0].day.name").value("Torso"))
                .andExpect(jsonPath("$[0].day.exercises[0].exerciseId").value("bench-press"))
                .andExpect(jsonPath("$[0].day.exercises[0].sets").value(4))
                .andExpect(jsonPath("$[0].completedWorkoutId").doesNotExist())
                .andExpect(jsonPath("$[0].otherDays.length()").value(0));

        JsonNode saved = json.readTree(mvc.perform(saveWorkout(client, dayId, "PRESCRIBED_MODIFIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programDayId").value(dayId))
                .andExpect(jsonPath("$.programOrigin").value("PRESCRIBED_MODIFIED"))
                .andReturn().getResponse().getContentAsString());
        String workoutId = saved.get("id").asString();

        mvc.perform(as(get("/api/coaching/today").param("date", today.toString()), client))
                .andExpect(jsonPath("$[0].completedWorkoutId").value(workoutId));

        // Editing from an older client that omits the link keeps it.
        mvc.perform(as(put("/api/workouts/{id}", workoutId), client).contentType("application/json")
                        .content("{\"name\":\"Editado\",\"startedAt\":1000,\"finishedAt\":2000,\"exercises\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programDayId").value(dayId));

        // A workout without a link stays the client's own.
        mvc.perform(saveWorkout(client, null, null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programDayId").doesNotExist())
                .andExpect(jsonPath("$.programOrigin").doesNotExist());

        // Deleting the copy keeps the workout and drops the link.
        jdbc.update("DELETE FROM programs WHERE id = ?::uuid", copyId);
        assertThat(jdbc.queryForObject("SELECT program_day_id FROM workouts WHERE id = ?", UUID.class, workoutId))
                .isNull();
    }

    @Test
    void reportsUpcomingFinishedAndRestDays() throws Exception {
        String coach = coach();
        String program = createProgram(coach, weekday);
        String otherWeekday = createProgram(coach, weekday % 7 + 1);

        String upcoming = user();
        assign(coach, accept(upcoming, invite(coach)), program, today.plusDays(7));
        mvc.perform(as(get("/api/coaching/today"), upcoming))
                .andExpect(jsonPath("$[0].phase").value("UPCOMING"))
                .andExpect(jsonPath("$[0].day").doesNotExist());

        String finished = user();
        assign(coach, accept(finished, invite(coach)), program, today.minusDays(21));
        mvc.perform(as(get("/api/coaching/today"), finished))
                .andExpect(jsonPath("$[0].phase").value("FINISHED"));

        String rest = user();
        String restCopy = assign(coach, accept(rest, invite(coach)), otherWeekday, today);
        String movableDay = dayOf(restCopy);
        mvc.perform(as(get("/api/coaching/today").param("date", today.toString()), rest))
                .andExpect(jsonPath("$[0].phase").value("ACTIVE"))
                .andExpect(jsonPath("$[0].week").value(1))
                .andExpect(jsonPath("$[0].day").doesNotExist())
                .andExpect(jsonPath("$[0].otherDays.length()").value(1))
                .andExpect(jsonPath("$[0].otherDays[0].id").value(movableDay))
                .andExpect(jsonPath("$[0].otherDays[0].dayIndex").value(weekday % 7 + 1))
                .andExpect(jsonPath("$[0].otherDays[0].exercises[0].exerciseId").value("bench-press"));

        // Doing that day today takes it off the list.
        mvc.perform(saveWorkout(rest, movableDay, "PRESCRIBED")).andExpect(status().isOk());
        mvc.perform(as(get("/api/coaching/today").param("date", today.toString()), rest))
                .andExpect(jsonPath("$[0].otherDays.length()").value(0));

        mvc.perform(as(get("/api/coaching/today").param("date", today.plusDays(5).toString()), rest))
                .andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/coaching/today"), user())).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void workoutsCannotClaimDaysOfOtherAccountsOrTheLibrary() throws Exception {
        String coach = coach();
        String client = user();
        String libraryProgram = createProgram(coach, weekday);
        String copyId = assign(coach, accept(client, invite(coach)), libraryProgram, today);
        String intruder = user();

        mvc.perform(saveWorkout(intruder, dayOf(copyId), "PRESCRIBED")).andExpect(status().isNotFound());
        mvc.perform(saveWorkout(coach, dayOf(libraryProgram), "PRESCRIBED")).andExpect(status().isNotFound());
        mvc.perform(saveWorkout(client, UUID.randomUUID().toString(), "PRESCRIBED"))
                .andExpect(status().isNotFound());
        mvc.perform(saveWorkout(client, dayOf(copyId), "OWN")).andExpect(status().isBadRequest());
        // Without an origin, a linked workout counts as done as prescribed.
        mvc.perform(saveWorkout(client, dayOf(copyId), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.programOrigin").value("PRESCRIBED"));
        mvc.perform(as(get("/api/coaching/today"), intruder)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void theClientCanStopFollowingAProgramAndKeepsTheCopy() throws Exception {
        String coach = coach();
        String client = user();
        String copyId = assign(coach, accept(client, invite(coach)), createProgram(coach, weekday), today);
        String assignmentId = jdbc.queryForObject(
                "SELECT id::text FROM program_assignments WHERE program_id = ?::uuid", String.class, copyId);

        mvc.perform(as(post("/api/coaching/programs/{id}/end", assignmentId), user()))
                .andExpect(status().isNotFound());
        mvc.perform(as(post("/api/coaching/programs/{id}/end", assignmentId), coach))
                .andExpect(status().isNotFound());
        mvc.perform(as(post("/api/coaching/programs/{id}/end", assignmentId), client))
                .andExpect(status().isNoContent());
        mvc.perform(as(post("/api/coaching/programs/{id}/end", assignmentId), client))
                .andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coaching/today"), client)).andExpect(jsonPath("$.length()").value(0));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM programs WHERE id = ?::uuid", Integer.class, copyId))
                .isEqualTo(1);
    }

    private MockHttpServletRequestBuilder saveWorkout(String email, String dayId, String origin) {
        String link = (dayId == null ? "" : ",\"programDayId\":\"" + dayId + "\"")
                + (origin == null ? "" : ",\"programOrigin\":\"" + origin + "\"");
        return as(post("/api/workouts"), email).contentType("application/json")
                .content("{\"name\":\"Torso\",\"startedAt\":1000,\"finishedAt\":2000,\"exercises\":[]" + link + "}");
    }

    private String dayOf(String programId) {
        return jdbc.queryForObject("SELECT id::text FROM program_days WHERE program_id = ?::uuid LIMIT 1",
                String.class, programId);
    }

    /** Assigns a library program and returns the client's copy. */
    private String assign(String coach, String linkId, String programId, LocalDate start) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/clients/{linkId}/programs", linkId), coach)
                        .contentType("application/json")
                        .content("{\"programId\":\"" + programId + "\",\"startDate\":\"" + start + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString())
                .get("programId").asString();
    }

    private String createProgram(String coach, int dayIndex) throws Exception {
        String program = """
                {"name":"Fuerza","status":"READY","weeks":2,"days":[{"week":1,"dayIndex":%d,"name":"Torso","exercises":[
                  {"exerciseId":"bench-press","exerciseName":"Press banca","sets":4,"repsMin":6,"repsMax":8}]}]}
                """.formatted(dayIndex);
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

    private String accept(String client, String token) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                        .contentType("application/json").content(EDIT))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@today.test";
        users.ensureUserExists(email, "Today Test", null);
        return email;
    }
}

package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.contains;

/** Weekly check-ins: the coach's questions, the client's answers and the coach's reply. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachCheckinIntegrationTest {

    private static final String WITH_BODY =
            "{\"training\":true,\"nutrition\":false,\"body\":true,\"editTraining\":false,\"editNutrition\":false}";
    private static final String WITHOUT_BODY = WITH_BODY.replace("\"body\":true", "\"body\":false");
    private static final String CHECKIN = """
            {"energy":4,"sleep":3,"trainingAdherence":5,"dietAdherence":4,
             "answers":["  Subí peso en press  ","Nada"],"notes":"  Semana dura  "}
            """;
    private static final String CLIENT_PATH = "/api/coaching/coaches/{linkId}/checkin";
    private static final String COACH_PATH = "/api/coach/clients/{linkId}/checkins";

    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;

    private final LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

    @Test
    void theClientAnswersTheCoachQuestionsAndTheCoachReplies() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), WITH_BODY);

        mvc.perform(as(get("/api/coach/checkin-template"), coach))
                .andExpect(jsonPath("$.custom").value(false))
                .andExpect(jsonPath("$.questions.length()").value(3));
        mvc.perform(as(put("/api/coach/checkin-template"), coach).contentType("application/json")
                        .content("{\"questions\":[\"  ¿Qué tal los entrenos?  \",\"¿Molestias?\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.custom").value(true))
                .andExpect(jsonPath("$.questions[0]").value("¿Qué tal los entrenos?"));

        mvc.perform(as(get(CLIENT_PATH, linkId), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekStart").value(monday.toString()))
                .andExpect(jsonPath("$.coach.email").value(coach))
                .andExpect(jsonPath("$.questions.length()").value(2))
                .andExpect(jsonPath("$.current").doesNotExist());

        mvc.perform(as(post("/api/weights"), client).contentType("application/json")
                        .content("{\"date\":\"" + monday + "\",\"weight\":80.4}"))
                .andExpect(status().isOk());
        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json").content(CHECKIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weekStart").value(monday.toString()))
                .andExpect(jsonPath("$.weightAvg").value(80.4))
                .andExpect(jsonPath("$.answers[0].question").value("¿Qué tal los entrenos?"))
                .andExpect(jsonPath("$.answers[0].answer").value("Subí peso en press"))
                .andExpect(jsonPath("$.notes").value("Semana dura"));

        // Editing the template later does not change what the client already answered.
        mvc.perform(as(put("/api/coach/checkin-template"), coach).contentType("application/json")
                        .content("{\"questions\":[\"Otra\"]}"))
                .andExpect(status().isOk());
        mvc.perform(as(get(CLIENT_PATH, linkId), client))
                .andExpect(jsonPath("$.questions.length()").value(2))
                .andExpect(jsonPath("$.current.energy").value(4));
        // Still editable until the coach replies.
        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json")
                        .content(CHECKIN.replace("\"energy\":4", "\"energy\":2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.energy").value(2));

        String checkinId = json.readTree(mvc.perform(as(get(COACH_PATH, linkId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].weightAvg").value(80.4))
                .andExpect(jsonPath("$[0].coachReply").doesNotExist())
                .andReturn().getResponse().getContentAsString()).get(0).get("id").asString();
        mvc.perform(as(put(COACH_PATH + "/{id}/reply", linkId, checkinId), coach).contentType("application/json")
                        .content("{\"reply\":\"  Buen trabajo  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coachReply").value("Buen trabajo"))
                .andExpect(jsonPath("$.repliedAt").exists());

        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json").content(CHECKIN))
                .andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/coaching/coaches/{linkId}/checkins", linkId), client))
                .andExpect(jsonPath("$[0].coachReply").value("Buen trabajo"))
                .andExpect(jsonPath("$[0].energy").value(2));

        // Without body consent the coach no longer sees the weight.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                        .content(WITHOUT_BODY))
                .andExpect(status().isNoContent());
        mvc.perform(as(get(COACH_PATH, linkId), coach))
                .andExpect(jsonPath("$[0].weightAvg").doesNotExist());

        mvc.perform(as(get("/api/user/export"), client))
                .andExpect(jsonPath("$.coaching.checkins[0].role").value("CLIENT"))
                .andExpect(jsonPath("$.coaching.checkins[0].other.email").value(coach))
                .andExpect(jsonPath("$.coaching.checkins[0].checkin.coachReply").value("Buen trabajo"));
        mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(jsonPath("$.coaching.checkins[0].role").value("COACH"));

        // After the link ends the coach loses access; the client keeps the history.
        mvc.perform(as(post("/api/coaching/coaches/{linkId}/end", linkId), client))
                .andExpect(status().isNoContent());
        mvc.perform(as(get(COACH_PATH, linkId), coach)).andExpect(status().isNotFound());
        mvc.perform(as(get(CLIENT_PATH, linkId), client)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coaching/coaches/{linkId}/checkins", linkId), client))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void checkinsAreValidatedAndPrivateToTheLink() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), WITHOUT_BODY);

        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json")
                        .content(CHECKIN.replace("\"energy\":4", "\"energy\":6")))
                .andExpect(status().isBadRequest());
        // The default template has three questions.
        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json")
                        .content(CHECKIN.replace("\"Nada\"", "\"a\",\"b\",\"c\"")))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json")
                        .content("{\"energy\":3,\"sleep\":3,\"trainingAdherence\":3,\"dietAdherence\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answers.length()").value(3))
                .andExpect(jsonPath("$.answers[0].answer").value(""))
                .andExpect(jsonPath("$.weightAvg").doesNotExist());

        // Another coach and another client see nothing of this link.
        mvc.perform(as(get(COACH_PATH, linkId), coach())).andExpect(status().isNotFound());
        mvc.perform(as(get(CLIENT_PATH, linkId), user())).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coaching/coaches/{linkId}/checkins", linkId), user()))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(as(put(COACH_PATH + "/{id}/reply", linkId, UUID.randomUUID()), coach)
                        .contentType("application/json").content("{\"reply\":\"Hola\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/checkin-template"), user())).andExpect(status().isForbidden());
        mvc.perform(as(put("/api/coach/checkin-template"), coach).contentType("application/json")
                        .content("{\"questions\":[\"\"]}"))
                .andExpect(status().isBadRequest());
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    @Test
    void nutritionOnlyUsesItsOwnMetricsAndKeepsSubmittedQuestions() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), WITH_BODY);
        configure(coach, link, false, true);
        mvc.perform(as(get(CLIENT_PATH, link), client)).andExpect(status().isOk())
                .andExpect(jsonPath("$.scoreKeys").value(contains("energy", "sleep", "dietAdherence")))
                .andExpect(jsonPath("$.questions[3]").value("¿Cómo han ido el hambre y la organización de las comidas?"));
        mvc.perform(as(put(CLIENT_PATH, link), client).contentType("application/json")
                .content("{\"energy\":4,\"sleep\":3}")).andExpect(status().isBadRequest());
        mvc.perform(as(put(CLIENT_PATH, link), client).contentType("application/json").content(CHECKIN))
                .andExpect(status().isOk()).andExpect(jsonPath("$.trainingAdherence").doesNotExist())
                .andExpect(jsonPath("$.dietAdherence").value(4));
        configure(coach, link, true, false);
        mvc.perform(as(get(CLIENT_PATH, link), client))
                .andExpect(jsonPath("$.scoreKeys").value(contains("energy", "sleep", "dietAdherence")))
                .andExpect(jsonPath("$.questions[3]").value("¿Cómo han ido el hambre y la organización de las comidas?"));
    }

    @Test
    void trainingOnlyAndUnconfiguredLinksNeverRequireDietScores() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), WITH_BODY);
        mvc.perform(as(get(CLIENT_PATH, link), client))
                .andExpect(jsonPath("$.scoreKeys").value(contains("energy", "sleep")))
                .andExpect(jsonPath("$.followup.nextDueAt").doesNotExist());
        configure(coach, link, true, false);
        mvc.perform(as(get(CLIENT_PATH, link), client))
                .andExpect(jsonPath("$.scoreKeys").value(contains("energy", "sleep", "trainingAdherence")))
                .andExpect(jsonPath("$.questions[3]").value("¿Qué sesión o ejercicio necesita un ajuste?"));
        mvc.perform(as(put(CLIENT_PATH, link), client).contentType("application/json")
                        .content("{\"energy\":4,\"sleep\":3,\"trainingAdherence\":4}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.trainingAdherence").value(4))
                .andExpect(jsonPath("$.dietAdherence").doesNotExist());
    }

    @Test
    void repliesRejectStaleVersionsAndCannotOverwriteAnExistingReply() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), WITH_BODY);
        var sent = json.readTree(mvc.perform(as(put(CLIENT_PATH, link), client)
                .contentType("application/json").content(CHECKIN)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        String id = sent.get("id").asString();
        String previousVersion = sent.get("updatedAt").asString();
        var updated = json.readTree(mvc.perform(as(put(CLIENT_PATH, link), client)
                .contentType("application/json").content(CHECKIN.replace("Semana dura", "Mejor esta semana")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        mvc.perform(as(put(COACH_PATH + "/{id}/reply", link, id), coach).contentType("application/json")
                        .content(json.writeValueAsString(Map.of("reply", "Antigua", "expectedUpdatedAt", previousVersion))))
                .andExpect(status().isConflict());
        String request = json.writeValueAsString(Map.of("reply", "Revisado", "expectedUpdatedAt", updated.get("updatedAt").asString()));
        mvc.perform(as(put(COACH_PATH + "/{id}/reply", link, id), coach).contentType("application/json").content(request))
                .andExpect(status().isOk()).andExpect(jsonPath("$.coachReply").value("Revisado"));
        mvc.perform(as(put(COACH_PATH + "/{id}/reply", link, id), coach).contentType("application/json").content(request))
                .andExpect(status().isConflict());
        mvc.perform(as(put(CLIENT_PATH, link), client).contentType("application/json").content(CHECKIN))
                .andExpect(status().isBadRequest());
        mvc.perform(as(get(COACH_PATH, link), coach)).andExpect(jsonPath("$[0].notes").value("Mejor esta semana"));
    }

    private void configure(String coach, String link, boolean training, boolean nutrition) throws Exception {
        String setup = "{\"services\":{\"training\":" + training + ",\"nutrition\":" + nutrition
                + ",\"progress\":false},\"reviewed\":true}";
        mvc.perform(as(put("/api/coach/clients/{link}/setup", link), coach).contentType("application/json").content(setup))
                .andExpect(status().isOk());
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
        String email = UUID.randomUUID() + "@checkin.test";
        users.ensureUserExists(email, "Checkin Test", null);
        return email;
    }
}

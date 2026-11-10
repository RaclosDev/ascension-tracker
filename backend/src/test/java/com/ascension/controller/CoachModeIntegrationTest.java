package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.CustomExerciseDTO;
import com.ascension.dto.WeightEntryDTO;
import com.ascension.service.CustomExerciseService;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.UserService;
import com.ascension.service.WeightService;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachModeIntegrationTest {

    private static final String BODY_ONLY = "{\"training\":false,\"nutrition\":false,\"body\":true}";
    private static final String TRAINING_ONLY = "{\"training\":true,\"nutrition\":false,\"body\":false}";
    private static final String NOTHING = "{\"training\":false,\"nutrition\":false,\"body\":false}";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired WeightService weights;
    @Autowired AccountDeletionService accountDeletion;
    @Autowired ObjectMapper json;
    @Autowired CustomExerciseService customExercises;

    @Test
    void clientConsentsAndCoachReadsOnlyWhatWasGranted() throws Exception {
        String coach = coach();
        String client = user();
        weights.saveEntry(client, WeightEntryDTO.builder().date(LocalDate.now().minusDays(10)).weight(81.4).build());
        weights.saveEntry(client, WeightEntryDTO.builder().date(LocalDate.now().minusDays(400)).weight(90.0).build());
        String token = invite(coach);

        mvc.perform(as(get("/api/coaching/invitations/{token}", token), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coach.email").value(coach))
                .andExpect(jsonPath("$.alreadyLinked").value(false));
        String linkId = accept(client, token, BODY_ONLY);

        mvc.perform(as(get("/api/coach/clients"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].linkId").value(linkId))
                .andExpect(jsonPath("$[0].client.email").value(client))
                .andExpect(jsonPath("$[0].permissions.body").value(true));
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].weight").value(81.4));
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId).param("days", "3650"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].weight").value(90.0));
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId).param("days", "0"), coach))
                .andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts", linkId), coach))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{id}/nutrition/logs", linkId).param("date", "2026-01-05"), coach))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{id}/targets", linkId), coach))
                .andExpect(status().isForbidden());

        mvc.perform(as(get("/api/coaching/access-log"), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].action").value("VIEW_WEIGHT"))
                .andExpect(jsonPath("$[0].hits").value(2))
                .andExpect(jsonPath("$[0].coach.email").value(coach));

        // The token is single use.
        mvc.perform(as(get("/api/coaching/invitations/{token}", token), user()))
                .andExpect(status().isNotFound());
    }

    @Test
    void coachCannotReachLinksThatAreMissingForeignOrEnded() throws Exception {
        String coach = coach();
        String otherCoach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), BODY_ONLY);

        mvc.perform(as(get("/api/coach/clients/{id}/weights", UUID.randomUUID()), coach))
                .andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId), otherCoach))
                .andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId), client))
                .andExpect(status().isNotFound());
        mvc.perform(as(post("/api/coach/clients/{id}/end", linkId), otherCoach))
                .andExpect(status().isNotFound());

        // The client narrows the scope: body data is no longer visible, training is.
        mvc.perform(as(patch("/api/coaching/coaches/{id}", linkId).contentType("application/json")
                        .content(TRAINING_ONLY), client))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId), coach))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts", linkId), coach))
                .andExpect(status().isOk());
        mvc.perform(as(patch("/api/coaching/coaches/{id}", linkId).contentType("application/json")
                        .content(NOTHING), client))
                .andExpect(status().isBadRequest());

        mvc.perform(as(post("/api/coaching/coaches/{id}/end", linkId), client))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts", linkId), coach))
                .andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coach/clients"), coach))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(as(get("/api/coaching/coaches"), client))
                .andExpect(jsonPath("$.length()").value(0));

        // A fresh invitation can link them again after the old link ended.
        accept(client, invite(coach), BODY_ONLY);
    }

    @Test
    void invitationsRejectNonCoachesSelfUseExpiryRevocationAndEmptyConsent() throws Exception {
        String notCoach = user();
        mvc.perform(as(post("/api/coach/invitations"), notCoach)).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients"), notCoach)).andExpect(status().isForbidden());

        String coach = coach();
        String client = user();
        String token = invite(coach);
        mvc.perform(as(get("/api/coaching/invitations/{token}", token), coach)).andExpect(status().isBadRequest());
        mvc.perform(acceptRequest(coach, token, BODY_ONLY)).andExpect(status().isBadRequest());
        mvc.perform(acceptRequest(client, token, NOTHING)).andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/coaching/invitations/{token}", "not-a-token"), client)).andExpect(status().isNotFound());

        jdbc.update("UPDATE coach_invitations SET expires_at = NOW() - INTERVAL '1 minute' WHERE coach_user_id = "
                + "(SELECT id FROM users WHERE email = ?)", coach);
        mvc.perform(acceptRequest(client, token, BODY_ONLY)).andExpect(status().isNotFound());

        String revoked = invite(coach);
        String invitationId = json.readTree(mvc.perform(as(get("/api/coach/invitations"), coach))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get(0).get("id").asString();
        mvc.perform(as(delete("/api/coach/invitations/{id}", invitationId), coach)).andExpect(status().isNoContent());
        mvc.perform(acceptRequest(client, revoked, BODY_ONLY)).andExpect(status().isNotFound());
        mvc.perform(as(delete("/api/coach/invitations/{id}", invitationId), coach)).andExpect(status().isNotFound());

        String linked = invite(coach);
        accept(client, linked, BODY_ONLY);
        String second = invite(coach);
        mvc.perform(as(get("/api/coaching/invitations/{token}", second), client))
                .andExpect(jsonPath("$.alreadyLinked").value(true));
        mvc.perform(acceptRequest(client, second, BODY_ONLY)).andExpect(status().isBadRequest());
    }

    @Test
    void deletingEitherAccountRemovesTheLinkAndItsAccessLog() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), BODY_ONLY);
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId), coach)).andExpect(status().isOk());
        UUID clientId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", UUID.class, client);

        accountDeletion.wipeAccountData(client);

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_clients WHERE client_user_id = ?",
                Integer.class, clientId)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_access_log WHERE client_user_id = ?",
                Integer.class, clientId)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_invitations WHERE accepted_by = ?",
                Integer.class, clientId)).isZero();

        String other = user();
        accept(other, invite(coach), BODY_ONLY);
        UUID coachId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", UUID.class, coach);
        accountDeletion.wipeAccountData(coach);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_clients WHERE coach_user_id = ?",
                Integer.class, coachId)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_profiles WHERE user_id = ?",
                Integer.class, coachId)).isZero();
        assertThat(users.findByEmail(other)).isPresent();
    }

    @Test
    void coachSeesClientCustomExercisesAndRecentWorkoutsOnlyWithTrainingPermission() throws Exception {
        String coach = coach();
        String client = user();
        customExercises.saveCustomExercise(client, CustomExerciseDTO.builder()
                .id("custom-" + UUID.randomUUID()).name("Press inclinado en polea").muscle("Chest")
                .equipment("Cable").build());
        String linkId = accept(client, invite(coach), TRAINING_ONLY);

        mvc.perform(as(get("/api/coach/clients/{id}/workouts/custom-exercises", linkId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Press inclinado en polea"))
                .andExpect(jsonPath("$[0].userEmail").doesNotExist());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts/recent", linkId).param("since", "0"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mvc.perform(as(patch("/api/coaching/coaches/{id}", linkId).contentType("application/json")
                        .content(BODY_ONLY), client))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts/custom-exercises", linkId), coach))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts/recent", linkId).param("since", "0"), coach))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coach/clients/{id}/workouts/custom-exercises", linkId), user()))
                .andExpect(status().isNotFound());
    }

    @Test
    void gdprExportIncludesCoachingDataForBothSidesWithoutTokens() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), BODY_ONLY);
        mvc.perform(as(get("/api/coach/clients/{id}/weights", linkId), coach)).andExpect(status().isOk());

        String clientExport = mvc.perform(as(get("/api/user/export"), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching.coachSince").doesNotExist())
                .andExpect(jsonPath("$.coaching.asClient[0].linkId").value(linkId))
                .andExpect(jsonPath("$.coaching.asClient[0].other.email").value(coach))
                .andExpect(jsonPath("$.coaching.asClient[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.coaching.asClient[0].permissions.body").value(true))
                .andExpect(jsonPath("$.coaching.asCoach.length()").value(0))
                .andExpect(jsonPath("$.coaching.accessesToMyData[0].action").value("VIEW_WEIGHT"))
                .andExpect(jsonPath("$.coaching.accessesToMyData[0].other.email").value(coach))
                .andReturn().getResponse().getContentAsString();
        assertThat(clientExport).doesNotContain("token");

        String coachExport = mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching.coachSince").exists())
                .andExpect(jsonPath("$.coaching.asCoach[0].other.email").value(client))
                .andExpect(jsonPath("$.coaching.invitations[0].acceptedAt").exists())
                .andExpect(jsonPath("$.coaching.myAccessesAsCoach[0].other.email").value(client))
                .andReturn().getResponse().getContentAsString();
        assertThat(coachExport).doesNotContain("token");

        // Users without coach-mode data get no coaching section at all.
        mvc.perform(as(get("/api/user/export"), user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coaching").doesNotExist());
    }

    @Test
    void everyReferenceToAUserIdLetsTheAccountBeDeleted() {
        List<String> rules = jdbc.queryForList("""
                SELECT tc.table_name || '.' || kcu.column_name || ' ' || rc.delete_rule
                FROM information_schema.referential_constraints rc
                JOIN information_schema.table_constraints tc
                  ON tc.constraint_name = rc.constraint_name AND tc.constraint_schema = rc.constraint_schema
                JOIN information_schema.key_column_usage kcu
                  ON kcu.constraint_name = rc.constraint_name AND kcu.constraint_schema = rc.constraint_schema
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = rc.constraint_name AND ccu.constraint_schema = rc.constraint_schema
                WHERE tc.table_schema = 'public' AND ccu.table_name = 'users' AND ccu.column_name = 'id'
                """, String.class);
        assertThat(rules).isNotEmpty();
        assertThat(rules).allSatisfy(rule -> assertThat(rule).matches(".* (CASCADE|SET NULL)"));
    }

    @Test
    void anInvitationCarriesWhatTheCoachAsksAndKnowsUntilItIsAccepted() throws Exception {
        String coach = coach();
        String client = user();
        String body = """
                {"clientName":"  Ana López ","permissions":{"training":true,"nutrition":true,"body":false,
                 "editTraining":true,"editNutrition":true},
                 "profile":{"sex":"F","age":31,"heightCm":165,"startWeight":64.5,"goalWeight":60,
                            "activityFactor":1.55,"appModules":"TRAINING_NUTRITION"}}
                """;
        String token = json.readTree(mvc.perform(as(post("/api/coach/invitations")
                        .contentType("application/json").content(body), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString())
                .get("token").asString();

        mvc.perform(as(get("/api/coach/invitations"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clientName").value("Ana López"))
                .andExpect(jsonPath("$[0].prefilled").value(true))
                .andExpect(jsonPath("$[0].permissions.editNutrition").value(true));
        mvc.perform(as(get("/api/coaching/invitations/{token}", token), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requested.training").value(true))
                .andExpect(jsonPath("$.requested.body").value(false))
                .andExpect(jsonPath("$.profile.sex").value("F"))
                .andExpect(jsonPath("$.profile.startWeight").value(64.5))
                .andExpect(jsonPath("$.profile.appModules").value("TRAINING_NUTRITION"));

        accept(client, token, TRAINING_ONLY);
        Integer leftovers = jdbc.queryForObject("""
                SELECT COUNT(*) FROM coach_invitations i JOIN users u ON u.id = i.coach_user_id
                WHERE u.email = ? AND (i.client_name IS NOT NULL OR i.prefill_start_weight IS NOT NULL
                                       OR i.prefill_sex IS NOT NULL)
                """, Integer.class, coach);
        assertThat(leftovers).isZero();
    }

    @Test
    void anInvitationRejectsImpossibleDetails() throws Exception {
        String coach = coach();
        mvc.perform(as(post("/api/coach/invitations").contentType("application/json")
                        .content("{\"profile\":{\"age\":3,\"sex\":\"X\"}}"), coach))
                .andExpect(status().isBadRequest());
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private MockHttpServletRequestBuilder acceptRequest(String email, String token, String permissions) {
        return as(post("/api/coaching/invitations/{token}/accept", token)
                .contentType("application/json").content(permissions), email);
    }

    private String invite(String coach) throws Exception {
        JsonNode created = json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        return created.get("token").asString();
    }

    private String accept(String client, String token, String permissions) throws Exception {
        JsonNode link = json.readTree(mvc.perform(acceptRequest(client, token, permissions))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        return link.get("linkId").asString();
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@coach.test";
        users.ensureUserExists(email, "Coach Test", null);
        return email;
    }
}

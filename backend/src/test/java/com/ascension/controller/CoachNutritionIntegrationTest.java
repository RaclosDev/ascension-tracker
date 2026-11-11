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

/** Nutrition targets a coach sets, and how they replace the client's own while in force. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachNutritionIntegrationTest {

    private static final String EDIT_ALL =
            "{\"training\":true,\"nutrition\":true,\"body\":false,\"editTraining\":true,\"editNutrition\":true}";
    private static final String VIEW_ONLY =
            "{\"training\":true,\"nutrition\":true,\"body\":false,\"editTraining\":true,\"editNutrition\":false}";
    // Editing nutrition without seeing it is not stored.
    private static final String EDIT_WITHOUT_VIEW =
            "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":false,\"editNutrition\":true}";
    private static final String PLAN = """
            {"training":{"protein":180,"carbs":300,"fat":70},
             "rest":{"protein":180,"carbs":150,"fat":80},"notes":"  Bebe 3 litros  "}
            """;
    private static final String PATH = "/api/coach/clients/{linkId}/nutrition-plan";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;

    private final LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

    @Test
    void theCoachPlanReplacesTheClientTargetsByDayType() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT_ALL);

        mvc.perform(as(get(PATH, linkId), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/nutrition/macros"), client))
                .andExpect(jsonPath("$.coachName").doesNotExist())
                .andExpect(jsonPath("$.dayType").doesNotExist());

        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json").content(PLAN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.training.kcal").value(180 * 4 + 300 * 4 + 70 * 9))
                .andExpect(jsonPath("$.rest.carbs").value(150))
                .andExpect(jsonPath("$.notes").value("Bebe 3 litros"))
                .andExpect(jsonPath("$.coach.email").value(coach));
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coach.email").value(coach))
                .andExpect(jsonPath("$.rest.kcal").value(180 * 4 + 150 * 4 + 80 * 9));

        // Without a program every day is a rest day; a prescribed session makes it a training day.
        mvc.perform(as(get("/api/nutrition/macros").param("date", monday.toString()), client))
                .andExpect(jsonPath("$.dayType").value("REST"))
                .andExpect(jsonPath("$.carbs").value(150.0))
                .andExpect(jsonPath("$.coachName").value("Nutrition Test"));
        assign(coach, linkId, createProgram(coach), monday);
        mvc.perform(as(get("/api/nutrition/macros").param("date", monday.toString()), client))
                .andExpect(jsonPath("$.dayType").value("TRAINING"))
                .andExpect(jsonPath("$.kcal").value(180 * 4 + 300 * 4 + 70 * 9))
                .andExpect(jsonPath("$.carbs").value(300.0));
        mvc.perform(as(get("/api/nutrition/macros").param("date", monday.plusDays(1).toString()), client))
                .andExpect(jsonPath("$.dayType").value("REST"));

        // A change is a new plan: the previous one is kept as ended.
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                        .content("{\"training\":{\"protein\":200,\"carbs\":250,\"fat\":60},"
                                + "\"rest\":{\"protein\":200,\"carbs\":120,\"fat\":70}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").doesNotExist());
        assertThat(jdbc.queryForList("""
                SELECT p.status FROM nutrition_plans p JOIN users u ON u.id = p.client_user_id
                WHERE u.email = ? ORDER BY p.created_at
                """, String.class, client)).containsExactly("ENDED", "ACTIVE");

        mvc.perform(as(get("/api/user/export"), client))
                .andExpect(jsonPath("$.coaching.nutritionPlans.length()").value(2))
                .andExpect(jsonPath("$.coaching.nutritionPlans[0].role").value("CLIENT"))
                .andExpect(jsonPath("$.coaching.nutritionPlans[0].other.email").value(coach))
                .andExpect(jsonPath("$.coaching.nutritionPlans[0].status").value("ENDED"));
        mvc.perform(as(get("/api/user/export"), coach))
                .andExpect(jsonPath("$.coaching.nutritionPlans[1].role").value("COACH"))
                .andExpect(jsonPath("$.coaching.nutritionPlans[1].other.email").value(client))
                .andExpect(jsonPath("$.coaching.nutritionPlans[1].training.protein").value(200));

        mvc.perform(as(delete(PATH, linkId), coach)).andExpect(status().isNoContent());
        mvc.perform(as(delete(PATH, linkId), coach)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/nutrition/macros"), client)).andExpect(jsonPath("$.coachName").doesNotExist());
    }

    @Test
    void rejectsPlansWithoutTargets() throws Exception {
        String coach = coach();
        String linkId = accept(user(), invite(coach), EDIT_ALL);
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                .content("{\"training\":{\"protein\":-1,\"carbs\":0,\"fat\":0},"
                        + "\"rest\":{\"protein\":1,\"carbs\":0,\"fat\":0}}")).andExpect(status().isBadRequest());
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                .content("{\"training\":{\"protein\":100,\"carbs\":100,\"fat\":50}}")).andExpect(status().isBadRequest());
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                .content("{\"training\":{\"protein\":100,\"carbs\":100,\"fat\":50},"
                        + "\"rest\":{\"protein\":0,\"carbs\":0,\"fat\":0}}")).andExpect(status().isBadRequest());
    }

    @Test
    void thePlanOnlyAppliesWhileTheClientLetsTheCoachEditNutrition() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT_ALL);
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json").content(PLAN))
                .andExpect(status().isOk());

        // Another coach, or this coach through another client's link, cannot touch it.
        String otherCoach = coach();
        mvc.perform(as(get(PATH, linkId), otherCoach)).andExpect(status().isNotFound());
        mvc.perform(as(put(PATH, linkId), otherCoach).contentType("application/json").content(PLAN))
                .andExpect(status().isNotFound());
        String otherLink = accept(user(), invite(coach), EDIT_ALL);
        mvc.perform(as(get(PATH, otherLink), coach)).andExpect(status().isNoContent());
        mvc.perform(as(delete(PATH, otherLink), coach)).andExpect(status().isNotFound());

        // Seeing without editing: the coach still reads the plan but cannot change it, and it stops applying.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                .content(VIEW_ONLY)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH, linkId), coach)).andExpect(status().isOk());
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json").content(PLAN))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/nutrition/macros"), client)).andExpect(jsonPath("$.coachName").doesNotExist());

        // Editing without seeing nutrition is never stored.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                .content(EDIT_WITHOUT_VIEW)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/coaches"), client))
                .andExpect(jsonPath("$[0].permissions.editNutrition").value(false));
        mvc.perform(as(get(PATH, linkId), coach)).andExpect(status().isForbidden());

        // Granting it again brings the plan back, until the link ends.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                .content(EDIT_ALL)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client)).andExpect(status().isOk());
        mvc.perform(as(post("/api/coach/clients/{linkId}/end", linkId), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH, linkId), coach)).andExpect(status().isNotFound());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client)).andExpect(status().isNoContent());
    }

    @Test
    void mealsCopyTheCoachRecipesAndSurviveTheirDeletion() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT_ALL);
        String bowl = recipe(coach, "Bowl de pollo", "45", "60", "12.5");
        String toast = recipe(coach, "Tostadas", "20", "40", "10");
        String foreign = recipe(coach(), "Ajena", "10", "10", "10");

        String meals = """
                {"training":{"protein":180,"carbs":300,"fat":70},
                 "rest":{"protein":180,"carbs":150,"fat":80},
                 "meals":[{"dayType":"REST","slotName":"Cena","recipeId":"%s","servings":1},
                          {"dayType":"TRAINING","slotName":" Comida ","recipeId":"%s","servings":1.5},
                          {"dayType":"TRAINING","slotName":"Desayuno","recipeId":"%s","servings":2}]}
                """;
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                        .content(meals.formatted(bowl, bowl, foreign)))
                .andExpect(status().isNotFound());
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                        .content(meals.formatted(bowl, bowl, "not-a-uuid")))
                .andExpect(status().isBadRequest());
        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json")
                        .content(meals.formatted(bowl, bowl, toast)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meals.length()").value(3))
                .andExpect(jsonPath("$.meals[0].dayType").value("TRAINING"))
                .andExpect(jsonPath("$.meals[0].slotName").value("Comida"))
                .andExpect(jsonPath("$.meals[0].servings").value(1.5))
                .andExpect(jsonPath("$.meals[0].protein").value(67.5))
                .andExpect(jsonPath("$.meals[0].fat").value(18.8))
                .andExpect(jsonPath("$.meals[1].name").value("Tostadas"))
                .andExpect(jsonPath("$.meals[1].kcal").value(2 * (20 * 4 + 40 * 4 + 10 * 9)))
                .andExpect(jsonPath("$.meals[2].dayType").value("REST"));

        // Editing or deleting the recipe leaves the prescribed copy as it was.
        mvc.perform(as(delete("/api/coach/recipes/{id}", bowl), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meals[0].name").value("Bowl de pollo"))
                .andExpect(jsonPath("$.meals[0].recipeId").doesNotExist())
                .andExpect(jsonPath("$.meals[0].description").value("Receta de prueba"))
                .andExpect(jsonPath("$.meals[1].recipeId").value(toast));
        mvc.perform(as(get("/api/user/export"), client))
                .andExpect(jsonPath("$.coaching.nutritionPlans[0].meals.length()").value(3));
    }

    @Test
    void adherenceComparesWhatTheClientLoggedWithThePlanOfEachDay() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), EDIT_ALL);
        LocalDate today = LocalDate.now();
        log(client, today.minusDays(1), 2500, 100);

        // Before any plan the days carry no target and nothing counts.
        mvc.perform(as(get(PATH + "/adherence", linkId).param("weeks", "2"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].plannedDays").value(0))
                .andExpect(jsonPath("$[1].kcalPct").doesNotExist());

        mvc.perform(as(put(PATH, linkId), coach).contentType("application/json").content(PLAN))
                .andExpect(status().isOk());
        // Rest day without a program: 2040 kcal and 180 g of protein.
        log(client, today, 1500, 120);
        log(client, today, 500, 50);
        String body = mvc.perform(as(get(PATH + "/adherence", linkId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[3].plannedDays").value(1))
                .andExpect(jsonPath("$[3].loggedDays").value(1))
                .andExpect(jsonPath("$[3].onTargetDays").value(1))
                .andExpect(jsonPath("$[3].kcalPct").value(Math.round(2000 * 100.0 / 2040)))
                .andExpect(jsonPath("$[3].proteinPct").value(Math.round(170 * 100.0 / 180)))
                .andReturn().getResponse().getContentAsString();
        var days = json.readTree(body).get(3).get("days");
        var last = days.get(days.size() - 1);
        assertThat(last.get("date").asString()).isEqualTo(today.toString());
        assertThat(last.get("dayType").asString()).isEqualTo("REST");
        assertThat(last.get("target").get("kcal").asInt()).isEqualTo(2040);
        assertThat(last.get("intake").get("kcal").asInt()).isEqualTo(2000);
        assertThat(last.get("onTarget").asBoolean()).isTrue();

        // Without the consent to see nutrition the coach cannot read it.
        String other = accept(user(), invite(coach), VIEW_ONLY.replace("\"nutrition\":true", "\"nutrition\":false"));
        mvc.perform(as(get(PATH + "/adherence", other), coach)).andExpect(status().isForbidden());
    }

    private void log(String client, LocalDate date, int kcal, int protein) throws Exception {
        mvc.perform(as(post("/api/nutrition/logs"), client).contentType("application/json")
                        .content("{\"date\":\"" + date + "\",\"mealIndex\":0,\"product\":\"Prueba\","
                                + "\"quantity\":100,\"kcal\":" + kcal + ",\"protein\":" + protein
                                + ",\"carbs\":10,\"fat\":5}"))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void publicationKeepsHistoryAndRejectsStaleUpdatesAndWithdrawals() throws Exception {
        String coach = coach();
        String link = accept(user(), invite(coach), EDIT_ALL);
        String first = json.readTree(mvc.perform(as(post(PATH + "/publish", link), coach)
                        .contentType("application/json").content("{\"plan\":" + PLAN + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("id").asText();
        String updated = PLAN.replace("180", "190");
        String second = json.readTree(mvc.perform(as(post(PATH + "/publish", link), coach)
                        .contentType("application/json")
                        .content("{\"plan\":" + updated + ",\"expectedPlanId\":\"" + first + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("id").asText();
        mvc.perform(as(post(PATH + "/publish", link), coach).contentType("application/json")
                .content("{\"plan\":" + PLAN + ",\"expectedPlanId\":\"" + first + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(as(post(PATH + "/{id}/end", link, first), coach)).andExpect(status().isConflict());
        mvc.perform(as(get(PATH + "/history", link), coach)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(second)).andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].id").value(first)).andExpect(jsonPath("$[1].status").value("ENDED"));
        mvc.perform(as(get(PATH + "/history/{id}", link, first), coach))
                .andExpect(jsonPath("$.training.protein").value(180));
        mvc.perform(as(get(PATH, link), coach)).andExpect(jsonPath("$.training.protein").value(190));
        mvc.perform(as(post(PATH + "/{id}/end", link, second), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH + "/history", link), coach))
                .andExpect(jsonPath("$[0].status").value("ENDED"));
    }

    @Test
    void archivedRecipesStayReadableButHistoryNeverCrossesLinksOrPermissions() throws Exception {
        String coach = coach();
        String client = user();
        String link = accept(client, invite(coach), EDIT_ALL);
        String otherLink = accept(user(), invite(coach), EDIT_ALL);
        String recipeId = recipe(coach, "Comida original", "30", "40", "10");
        String withMeal = PLAN.strip().substring(0, PLAN.strip().length() - 1) + """
                ,"meals":[{"dayType":"TRAINING","slotName":"Comida","recipeId":"%s","servings":2}]}
                """.formatted(recipeId);
        String id = json.readTree(mvc.perform(as(post(PATH + "/publish", link), coach)
                        .contentType("application/json").content("{\"plan\":" + withMeal + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("id").asText();
        mvc.perform(as(post(PATH + "/{id}/end", link, id), coach)).andExpect(status().isNoContent());
        mvc.perform(as(delete("/api/coach/recipes/{id}", recipeId), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH + "/history/{id}", link, id), coach))
                .andExpect(jsonPath("$.meals[0].name").value("Comida original"))
                .andExpect(jsonPath("$.meals[0].protein").value(60))
                .andExpect(jsonPath("$.meals[0].recipeId").doesNotExist());
        mvc.perform(as(get(PATH + "/history/{id}", otherLink, id), coach)).andExpect(status().isNotFound());
        mvc.perform(as(get(PATH + "/history", link), coach())).andExpect(status().isNotFound());
        mvc.perform(as(patch("/api/coaching/coaches/{id}", link), client)
                .contentType("application/json").content(VIEW_ONLY)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH + "/history", link), coach)).andExpect(status().isOk());
        mvc.perform(as(post(PATH + "/publish", link), coach).contentType("application/json")
                .content("{\"plan\":" + PLAN + "}")).andExpect(status().isForbidden());
        mvc.perform(as(post(PATH + "/{id}/end", link, id), coach)).andExpect(status().isForbidden());
        mvc.perform(as(patch("/api/coaching/coaches/{id}", link), client)
                .contentType("application/json").content(EDIT_WITHOUT_VIEW)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH + "/history", link), coach)).andExpect(status().isForbidden());
        mvc.perform(as(get(PATH + "/history/{id}", link, id), coach)).andExpect(status().isForbidden());
    }

    @Test
    void publicationDoesNotOverwriteAnotherCoachsActivePlan() throws Exception {
        String coach = coach();
        String other = coach();
        String client = user();
        String link = accept(client, invite(coach), EDIT_ALL);
        String otherLink = accept(client, invite(other), EDIT_ALL);
        mvc.perform(as(post(PATH + "/publish", link), coach).contentType("application/json")
                .content("{\"plan\":" + PLAN + "}")).andExpect(status().isOk());
        mvc.perform(as(post(PATH + "/publish", otherLink), other).contentType("application/json")
                .content("{\"plan\":" + PLAN + "}")).andExpect(status().isConflict());
        mvc.perform(as(get(PATH, link), coach)).andExpect(status().isOk());
    }

    private String recipe(String coach, String name, String protein, String carbs, String fat) throws Exception {
        String body = "{\"name\":\"" + name + "\",\"description\":\"Receta de prueba\",\"protein\":" + protein
                + ",\"carbs\":" + carbs + ",\"fat\":" + fat + "}";
        return json.readTree(mvc.perform(as(post("/api/coach/recipes"), coach)
                        .contentType("application/json").content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
    }

    private void assign(String coach, String linkId, String programId, LocalDate start) throws Exception {
        mvc.perform(as(post("/api/coach/clients/{linkId}/programs", linkId), coach)
                        .contentType("application/json")
                        .content("{\"programId\":\"" + programId + "\",\"startDate\":\"" + start + "\"}"))
                .andExpect(status().isCreated());
    }

    private String createProgram(String coach) throws Exception {
        String program = """
                {"name":"Fuerza","status":"READY","weeks":1,"days":[
                  {"week":1,"dayIndex":1,"name":"Torso","exercises":[
                    {"exerciseId":"bench-press","exerciseName":"Press banca","sets":4}]}]}
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
        String email = UUID.randomUUID() + "@nutrition.test";
        users.ensureUserExists(email, "Nutrition Test", null);
        return email;
    }
}

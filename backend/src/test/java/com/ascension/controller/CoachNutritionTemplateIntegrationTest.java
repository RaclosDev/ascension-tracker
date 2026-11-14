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
class CoachNutritionTemplateIntegrationTest {
    private static final String PATH = "/api/coach/nutrition-templates";
    private static final String PLAN = """
            {"training":{"protein":180,"carbs":300,"fat":70},
             "rest":{"protein":180,"carbs":150,"fat":80},"notes":"Adaptar al atleta","meals":[]}
            """;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;

    @Test
    void libraryIsPrivateAndRejectsStaleUpdatesAndDeletes() throws Exception {
        String owner = coach();
        String other = coach();
        String id = create(owner, PLAN);
        mvc.perform(as(get(PATH), owner)).andExpect(jsonPath("$[0].trainingKcal").value(2550));
        mvc.perform(as(get(PATH), other)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(as(get(PATH + "/{id}", id), other)).andExpect(status().isNotFound());
        mvc.perform(as(put(PATH + "/{id}", id), other).contentType("application/json")
                .content(body(PLAN, 1))).andExpect(status().isNotFound());
        mvc.perform(as(delete(PATH + "/{id}", id).param("expectedVersion", "1"), other))
                .andExpect(status().isNotFound());
        mvc.perform(as(get(PATH), user())).andExpect(status().isForbidden());
        mvc.perform(as(put(PATH + "/{id}", id), owner).contentType("application/json")
                .content(body(PLAN.replace("180", "190"), 1))).andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2));
        mvc.perform(as(put(PATH + "/{id}", id), owner).contentType("application/json")
                .content(body(PLAN, 1))).andExpect(status().isConflict());
        mvc.perform(as(delete(PATH + "/{id}", id).param("expectedVersion", "1"), owner))
                .andExpect(status().isConflict());
        mvc.perform(as(get(PATH + "/{id}", id), owner)).andExpect(jsonPath("$.content.training.protein").value(190));
        mvc.perform(as(delete(PATH + "/{id}", id).param("expectedVersion", "2"), owner))
                .andExpect(status().isNoContent());
        mvc.perform(as(get(PATH + "/{id}", id), owner)).andExpect(status().isNotFound());
    }

    @Test
    void recipeSnapshotSurvivesDeletionAndCannotUseAnotherCoachsRecipe() throws Exception {
        String owner = coach();
        String recipe = json.readTree(mvc.perform(as(post("/api/coach/recipes"), owner).contentType("application/json")
                .content("{\"name\":\"Bowl\",\"protein\":45,\"carbs\":60,\"fat\":12.5}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
        String meals = PLAN.replace("\"meals\":[]", """
                "meals":[{"dayType":"TRAINING","slotName":" Comida ","recipeId":"%s","servings":1.5}]
                """.formatted(recipe).strip());
        mvc.perform(as(post(PATH), coach()).contentType("application/json").content(body(meals, null)))
                .andExpect(status().isNotFound());
        String id = create(owner, meals);
        mvc.perform(as(delete("/api/coach/recipes/{id}", recipe), owner)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH + "/{id}", id), owner))
                .andExpect(jsonPath("$.content.meals[0].name").value("Bowl"))
                .andExpect(jsonPath("$.content.meals[0].slotName").value("Comida"))
                .andExpect(jsonPath("$.content.meals[0].kcal").value(799))
                .andExpect(jsonPath("$.content.meals[0].fat").value(18.8));
        mvc.perform(as(put(PATH + "/{id}", id), owner).contentType("application/json").content(body(meals, 1)))
                .andExpect(status().isNotFound());
        mvc.perform(as(get(PATH + "/{id}", id), owner)).andExpect(jsonPath("$.version").value(1));
        mvc.perform(as(get("/api/user/export"), owner)).andExpect(status().isOk())
                .andExpect(jsonPath("$.nutritionTemplates[0].content.meals[0].name").value("Bowl"));
        jdbc.update("DELETE FROM users WHERE email = ?", owner);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_nutrition_templates WHERE id = ?", Integer.class, UUID.fromString(id))).isZero();
    }

    @Test
    void deletingLibraryEntryDoesNotChangePublishedCopy() throws Exception {
        String owner = coach();
        String client = user();
        String template = create(owner, PLAN);
        String token = json.readTree(mvc.perform(as(post("/api/coach/invitations"), owner))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
        String link = json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                .contentType("application/json").content("{\"training\":false,\"nutrition\":true,\"body\":false,\"editNutrition\":true,\"editTraining\":false}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
        mvc.perform(as(post("/api/coach/clients/{link}/nutrition-plan/publish", link), owner)
                .contentType("application/json").content("{\"plan\":" + PLAN + "}"))
                .andExpect(status().isOk());
        mvc.perform(as(put(PATH + "/{id}", template), owner).contentType("application/json")
                .content(body(PLAN.replace("180", "200"), 1))).andExpect(status().isOk());
        mvc.perform(as(delete(PATH + "/{id}", template).param("expectedVersion", "2"), owner))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coaching/nutrition-plan"), client))
                .andExpect(jsonPath("$.training.protein").value(180));
    }

    @Test
    void validatesCompletePlansAndBoundsLibrarySize() throws Exception {
        String owner = coach();
        mvc.perform(as(post(PATH), owner).contentType("application/json").content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());
        String zero = PLAN.replace("180", "0").replace("300", "0").replace("70", "0");
        mvc.perform(as(post(PATH), owner).contentType("application/json").content(body(zero, null)))
                .andExpect(status().isBadRequest());
        mvc.perform(as(post(PATH), owner).contentType("application/json").content(body(PLAN.replace("180", "1001"), null)))
                .andExpect(status().isBadRequest());
        UUID id = UUID.fromString(create(owner, PLAN));
        jdbc.update("""
                INSERT INTO coach_nutrition_templates (coach_user_id, name, content)
                SELECT coach_user_id, 'Otra ' || n, content FROM coach_nutrition_templates,
                    generate_series(1,99) n WHERE id = ?
                """, id);
        mvc.perform(as(post(PATH), owner).contentType("application/json").content(body(PLAN, null)))
                .andExpect(status().isBadRequest());
    }

    private String create(String email, String plan) throws Exception {
        return json.readTree(mvc.perform(as(post(PATH), email).contentType("application/json").content(body(plan, null)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
    }
    private String body(String plan, Integer version) {
        return "{\"name\":\" Pauta base \",\"expectedVersion\":" + version + ",\"plan\":" + plan + "}";
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
        String email = UUID.randomUUID() + "@nutrition-library.test";
        users.ensureUserExists(email, "Nutrition Library Test", null);
        return email;
    }
}

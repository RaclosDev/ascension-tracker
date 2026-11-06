package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserDataExportService;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
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

/** The coach's recipe library: CRUD, isolation between coaches and validation. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CoachRecipeIntegrationTest {

    private static final String RECIPE = """
            {"name":"  Bowl de arroz y pollo ","description":"150 g arroz, 200 g pollo",
             "protein":45.04,"carbs":60,"fat":12.5}
            """;

    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;
    @Autowired UserDataExportService exportService;

    @Test
    void theCoachKeepsRecipesWithDerivedKcal() throws Exception {
        String coach = coach();
        String id = create(coach, RECIPE);

        mvc.perform(as(get("/api/coach/recipes"), coach))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Bowl de arroz y pollo"))
                .andExpect(jsonPath("$[0].protein").value(45.0))
                .andExpect(jsonPath("$[0].kcal").value(Math.round(45.0 * 4 + 60 * 4 + 12.5 * 9)));

        mvc.perform(as(put("/api/coach/recipes/{id}", id), coach).contentType("application/json")
                        .content("{\"name\":\"Tortilla\",\"description\":\" \",\"protein\":20,\"carbs\":2,\"fat\":15}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tortilla"))
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(jsonPath("$.kcal").value(20 * 4 + 2 * 4 + 15 * 9));

        assertThat(exportService.exportUserData(coach).getCoachRecipes())
                .singleElement().satisfies(r -> assertThat(r.name()).isEqualTo("Tortilla"));

        mvc.perform(as(delete("/api/coach/recipes/{id}", id), coach)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/coach/recipes"), coach)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void anotherCoachsRecipeIsUnknownAndNonCoachesAreRefused() throws Exception {
        String owner = coach();
        String other = coach();
        String id = create(owner, RECIPE);

        mvc.perform(as(get("/api/coach/recipes"), other)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(as(put("/api/coach/recipes/{id}", id), other).contentType("application/json").content(RECIPE))
                .andExpect(status().isNotFound());
        mvc.perform(as(delete("/api/coach/recipes/{id}", id), other)).andExpect(status().isNotFound());

        String notCoach = user();
        mvc.perform(as(get("/api/coach/recipes"), notCoach)).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/coach/recipes"), notCoach).contentType("application/json").content(RECIPE))
                .andExpect(status().isForbidden());
        assertThat(exportService.exportUserData(other).getCoachRecipes()).isEmpty();
    }

    @Test
    void rejectsInvalidRecipes() throws Exception {
        String coach = coach();
        for (String body : new String[]{
                "{\"name\":\" \",\"protein\":1,\"carbs\":1,\"fat\":1}",
                "{\"name\":\"X\",\"carbs\":1,\"fat\":1}",
                "{\"name\":\"X\",\"protein\":-1,\"carbs\":1,\"fat\":1}",
                "{\"name\":\"X\",\"protein\":1,\"carbs\":1001,\"fat\":1}",
                "{\"name\":\"" + "x".repeat(121) + "\",\"protein\":1,\"carbs\":1,\"fat\":1}"}) {
            mvc.perform(as(post("/api/coach/recipes"), coach).contentType("application/json").content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    private String create(String coach, String body) throws Exception {
        String response = mvc.perform(as(post("/api/coach/recipes"), coach).contentType("application/json")
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asString();
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
        String email = UUID.randomUUID() + "@recipes.test";
        users.ensureUserExists(email, "Recipe Test", null);
        return email;
    }
}

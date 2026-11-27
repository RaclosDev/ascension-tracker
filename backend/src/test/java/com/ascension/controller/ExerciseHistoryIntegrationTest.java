package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class ExerciseHistoryIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserService users;

    private String workout(String name, long startedAt, String exerciseId, String weight) {
        return "{\"name\":\"" + name + "\",\"startedAt\":" + startedAt + ",\"finishedAt\":" + (startedAt + 60000)
                + ",\"durationMs\":60000,\"exercises\":[{\"exerciseId\":\"" + exerciseId + "\",\"sets\":["
                + "{\"type\":\"normal\",\"weight\":\"" + weight + "\",\"reps\":\"5\",\"completed\":true},"
                + "{\"type\":\"normal\",\"weight\":\"" + weight + "\",\"reps\":\"4\",\"completed\":true}]}]}";
    }

    @Test
    void exerciseHistoryWithSeveralSetsReturnsEachWorkoutOnceNewestFirstAndOnlyOwnData() throws Exception {
        String email = UUID.randomUUID() + "@history.test";
        String other = UUID.randomUUID() + "@history.test";
        users.ensureUserExists(email, "Atleta", null);
        users.ensureUserExists(other, "Otro", null);

        for (var w : new String[][] {{email, "Viejo", "1760000000000", "80"}, {email, "Nuevo", "1770000000000", "90"},
                {other, "Ajeno", "1765000000000", "200"}}) {
            mvc.perform(post("/api/workouts")
                    .with(jwt().jwt(j -> j.subject(w[0]).claim("email", w[0])))
                    .contentType("application/json")
                    .content(workout(w[1], Long.parseLong(w[2]), "ex-0001", w[3])))
                    .andExpect(status().is2xxSuccessful());
        }

        mvc.perform(get("/api/workouts/exercise-history/ex-0001")
                .with(jwt().jwt(j -> j.subject(email).claim("email", email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].sets.length()").value(2))
                .andExpect(jsonPath("$[0].sets[0].weight").value("90"))
                .andExpect(jsonPath("$[1].sets[0].weight").value("80"));
    }
}

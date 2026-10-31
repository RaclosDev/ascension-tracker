package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.CustomExerciseDTO;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class ExerciseMergeIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired CustomExerciseService custom;

    @Test
    void failureUpdatingTemplatesRollsBackHistoryAndKeepsCustomSource() throws Exception {
        String email = user();
        String source = custom.saveCustomExercise(email, CustomExerciseDTO.builder().name("Rollback").muscle("pecho").equipment("barra").build()).getId();
        fixture(email, source);
        String template = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO workout_templates(id,user_email,name) VALUES (?,?,?)", template, email, "Rollback");
        jdbc.update("INSERT INTO workout_template_exercises(template_id,exercise_id,order_index) VALUES (?,?,0)", template, source);
        jdbc.execute("ALTER TABLE workout_template_exercises ADD CONSTRAINT reject_merge_test CHECK (exercise_id <> 'merge-rejected-target')");
        try {
            var response = mvc.perform(post("/api/workouts/exercises/{id}/merge", source)
                    .with(jwt().jwt(j -> j.subject(email).claim("email", email)))
                    .contentType("application/json").content("{\"targetExerciseId\":\"merge-rejected-target\"}"))
                    .andReturn().getResponse();
            assertThat(response.getStatus()).isGreaterThanOrEqualTo(400);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workout_exercises WHERE exercise_id=?", Integer.class, source)).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT exercise_id FROM workout_template_exercises WHERE template_id=?", String.class, template)).isEqualTo(source);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM custom_exercises WHERE id=?", Integer.class, source)).isEqualTo(1);
        } finally {
            jdbc.execute("ALTER TABLE workout_template_exercises DROP CONSTRAINT reject_merge_test");
        }
    }

    @Test
    void cannotMergeIntoAnotherUsersCustomExercise() throws Exception {
        String email = user();
        String foreign = custom.saveCustomExercise(user(), CustomExerciseDTO.builder().name("Private").muscle("pecho").equipment("barra").build()).getId();
        fixture(email, "catalog-source");
        mvc.perform(post("/api/workouts/exercises/catalog-source/merge")
                .with(jwt().jwt(j -> j.subject(email).claim("email", email)))
                .contentType("application/json").content("{\"targetExerciseId\":\""+foreign+"\"}"))
                .andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workout_exercises e JOIN workouts w ON e.workout_id=w.id WHERE w.user_email=? AND e.exercise_id='catalog-source'", Integer.class, email)).isEqualTo(1);
    }

    @Test
    void mergesEveryWorkoutAndTemplateBeforeDeletingCustomSource() throws Exception {
        String email = user();
        String other = user();
        String source = custom.saveCustomExercise(email, CustomExerciseDTO.builder().name("Source").muscle("pecho").equipment("barra").build()).getId();
        for (int i = 0; i < 201; i++) fixture(email, source);
        fixture(other, source);
        String template = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO workout_templates(id,user_email,name) VALUES (?,?,?)", template, email, "Template");
        jdbc.update("INSERT INTO workout_template_exercises(template_id,exercise_id,order_index) VALUES (?,?,0)", template, source);

        var first = mvc.perform(post("/api/workouts/exercises/{id}/merge", source)
                .with(jwt().jwt(j -> j.subject(email).claim("email", email)))
                .header("Idempotency-Key", "merge-intent")
                .contentType("application/json").content("{\"targetExerciseId\":\"catalog-target\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var retry = mvc.perform(post("/api/workouts/exercises/{id}/merge", source)
                .with(jwt().jwt(j -> j.subject(email).claim("email", email)))
                .header("Idempotency-Key", "merge-intent")
                .contentType("application/json").content("{\"targetExerciseId\":\"catalog-target\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(retry).isEqualTo(first);

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workout_exercises e JOIN workouts w ON w.id=e.workout_id WHERE w.user_email=? AND e.exercise_id='catalog-target'", Integer.class, email)).isEqualTo(201);
        assertThat(jdbc.queryForObject("SELECT exercise_id FROM workout_template_exercises WHERE template_id=?", String.class, template)).isEqualTo("catalog-target");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM custom_exercises WHERE id=?", Integer.class, source)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workout_exercises e JOIN workouts w ON w.id=e.workout_id WHERE w.user_email=? AND e.exercise_id=?", Integer.class, other, source)).isEqualTo(1);
    }

    private String user() {
        String email = UUID.randomUUID()+"@merge.test";
        users.ensureUserExists(email, "Merge", null);
        return email;
    }

    private void fixture(String email, String source) {
        String workout = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO workouts(id,user_email,name,started_at) VALUES (?,?,?,0)", workout, email, "Workout");
        jdbc.update("INSERT INTO workout_exercises(id,workout_id,exercise_id,order_index) VALUES (?,?,?,0)", UUID.randomUUID().toString(), workout, source);
    }
}

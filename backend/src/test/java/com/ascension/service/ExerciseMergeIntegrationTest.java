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

    @Test
    void mergeAlsoRepointsOwnedProgramsAndPowerliftingMappings() throws Exception {
        String coach = user();
        String client = user();
        String source = custom.saveCustomExercise(coach, CustomExerciseDTO.builder().name("Old press").muscle("pecho").equipment("barra").build()).getId();
        String target = custom.saveCustomExercise(coach, CustomExerciseDTO.builder().name("New press").muscle("pecho").equipment("barra").build()).getId();
        UUID coachId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, coach);
        UUID clientId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, client);
        UUID program = UUID.randomUUID();
        UUID day = UUID.randomUUID();
        jdbc.update("INSERT INTO programs(id,owner_user_id,name,weeks) VALUES (?,?,?,4)", program, coachId, "Block");
        jdbc.update("INSERT INTO program_days(id,program_id,week,day_index,name) VALUES (?,?,1,1,'Day')", day, program);
        jdbc.update("INSERT INTO program_exercises(program_day_id,order_index,exercise_id,exercise_name,sets) VALUES (?,0,?,?,3)", day, source, "Old press");
        // Another coach's program that happens to use the same id must stay untouched.
        UUID foreignCoach = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, user());
        UUID foreignProgram = UUID.randomUUID();
        UUID foreignDay = UUID.randomUUID();
        jdbc.update("INSERT INTO programs(id,owner_user_id,name,weeks) VALUES (?,?,?,4)", foreignProgram, foreignCoach, "Other");
        jdbc.update("INSERT INTO program_days(id,program_id,week,day_index,name) VALUES (?,?,1,1,'Day')", foreignDay, foreignProgram);
        jdbc.update("INSERT INTO program_exercises(program_day_id,order_index,exercise_id,sets) VALUES (?,0,?,3)", foreignDay, source);

        UUID link = UUID.randomUUID();
        jdbc.update("INSERT INTO coach_clients(id,coach_user_id,client_user_id,status,can_view_training,can_view_nutrition,can_view_body) VALUES (?,?,?,'ACTIVE',true,true,true)", link, coachId, clientId);
        String mappings = "{\"exerciseMappings\":[{\"exerciseId\":\"" + source + "\",\"lift\":\"BENCH\",\"kind\":\"VARIATION\"},"
                + "{\"exerciseId\":\"" + target + "\",\"lift\":\"BENCH\",\"kind\":\"VARIATION\"},"
                + "{\"exerciseId\":\"" + source + "\",\"grip\":\"wide\",\"lift\":\"BENCH\",\"kind\":\"COMPETITION\"}]}";
        jdbc.update("INSERT INTO coach_powerlifting_profiles(link_id,content,version) VALUES (?,CAST(? AS jsonb),1)", link, mappings);

        mvc.perform(post("/api/workouts/exercises/{id}/merge", source)
                .with(jwt().jwt(j -> j.subject(coach).claim("email", coach)))
                .contentType("application/json").content("{\"targetExerciseId\":\"" + target + "\"}"))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject("SELECT exercise_id FROM program_exercises WHERE program_day_id=?", String.class, day)).isEqualTo(target);
        assertThat(jdbc.queryForObject("SELECT exercise_name FROM program_exercises WHERE program_day_id=?", String.class, day)).isEqualTo("New press");
        assertThat(jdbc.queryForObject("SELECT exercise_id FROM program_exercises WHERE program_day_id=?", String.class, foreignDay)).isEqualTo(source);
        // The plain variant already mapped to the target collapses; the grip variant is kept under the target.
        assertThat(jdbc.queryForObject("SELECT jsonb_array_length(content->'exerciseMappings') FROM coach_powerlifting_profiles WHERE link_id=?", Integer.class, link)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM coach_powerlifting_profiles p, jsonb_array_elements(p.content->'exerciseMappings') m WHERE p.link_id=? AND m->>'exerciseId'=?", Integer.class, link, source)).isZero();
        assertThat(jdbc.queryForObject("SELECT version FROM coach_powerlifting_profiles WHERE link_id=?", Integer.class, link)).isEqualTo(2);
    }

    @Test
    void cannotMergeIntoACustomIdThatDoesNotExist() throws Exception {
        String email = user();
        String source = custom.saveCustomExercise(email, CustomExerciseDTO.builder().name("Keep me").muscle("pecho").equipment("barra").build()).getId();
        fixture(email, source);

        mvc.perform(post("/api/workouts/exercises/{id}/merge", source)
                .with(jwt().jwt(j -> j.subject(email).claim("email", email)))
                .contentType("application/json").content("{\"targetExerciseId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isNotFound());

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM custom_exercises WHERE id=?", Integer.class, source)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workout_exercises WHERE exercise_id=?", Integer.class, source)).isEqualTo(1);
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

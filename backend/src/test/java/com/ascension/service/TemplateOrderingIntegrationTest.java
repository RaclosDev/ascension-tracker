package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.TemplateExerciseDTO;
import com.ascension.dto.WorkoutTemplateDTO;
import com.ascension.support.DisabledIfDockerUnavailable;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class TemplateOrderingIntegrationTest {
    @Autowired WorkoutTemplateService templates;
    @Autowired UserService users;
    @Autowired EntityManager entityManager;
    @Autowired JdbcTemplate jdbc;

    @Test
    @Transactional
    void preservesExerciseOrderAfterDatabaseRewritesPhysicalRows() {
        String email = "template-order@example.com";
        users.ensureUserExists(email, "Order", null);
        var saved = templates.saveTemplate(email, WorkoutTemplateDTO.builder().name("Ordered")
                .exercises(List.of(new TemplateExerciseDTO("first", null),
                        new TemplateExerciseDTO("second", null), new TemplateExerciseDTO("third", null))).build());
        entityManager.flush();
        jdbc.execute("CREATE INDEX template_order_test_idx ON workout_template_exercises (template_id, exercise_id DESC)");
        jdbc.execute("CLUSTER workout_template_exercises USING template_order_test_idx");
        jdbc.execute("SET LOCAL enable_indexscan = off");
        jdbc.execute("SET LOCAL enable_bitmapscan = off");
        entityManager.clear();
        assertThat(templates.getTemplates(email).get(0).getExercises())
                .extracting(TemplateExerciseDTO::getExerciseId).containsExactly("first", "second", "third");
    }
}

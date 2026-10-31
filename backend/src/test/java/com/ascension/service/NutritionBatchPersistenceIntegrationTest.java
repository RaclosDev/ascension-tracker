package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.FoodLogDTO;
import com.ascension.repository.FoodLogRepository;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class NutritionBatchPersistenceIntegrationTest {
    @Autowired NutritionLogService service;
    @Autowired FoodLogRepository repository;
    @Autowired UserService users;

    @Test
    void invalidSecondFoodRollsBackTheFirstInsert() {
        String email = "batch-rollback@example.com";
        users.ensureUserExists(email, "Batch", null);
        var first = food("rice");
        var invalid = food(null);
        assertThatThrownBy(() -> service.addFoodLogs(email, List.of(first, invalid)))
                .isInstanceOf(RuntimeException.class);
        assertThat(repository.countByUserEmail(email)).isZero();
    }

    @Test
    void savesCompleteBatchWithGeneratedIdentifiers() {
        String email = "batch-success@example.com";
        users.ensureUserExists(email, "Batch", null);
        var saved = service.addFoodLogs(email, List.of(food("rice"), food("beans")));
        assertThat(saved).hasSize(2).allSatisfy(item -> assertThat(item.getId()).isNotNull());
        assertThat(repository.countByUserEmail(email)).isEqualTo(2);
    }

    private FoodLogDTO food(String product) {
        return FoodLogDTO.builder().product(product).date(LocalDate.of(2026, 10, 31))
                .mealIndex(0).quantity(100.0).kcal(100.0).protein(5.0).carbs(15.0).fat(2.0).build();
    }
}

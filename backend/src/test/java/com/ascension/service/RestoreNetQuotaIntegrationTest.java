package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.*;
import com.ascension.model.RestoreMode;
import com.ascension.repository.FoodLogRepository;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties = "app.quotas.max-food-logs=2")
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class RestoreNetQuotaIntegrationTest {
    @Autowired UserService users;
    @Autowired UserDataRestoreService restore;
    @Autowired FoodLogRepository logs;

    @Test
    void repeatedMergeAtQuotaDoesNotCountDuplicatesAndOverflowRollsBack() {
        String email = "restore-quota@example.com";
        users.ensureUserExists(email, "Quota", null);
        var backup = UserDataExportDTO.builder().version("1.0")
                .foodLogs(List.of(food("rice"), food("apple"))).build();
        assertThat(restore.restoreUserData(email, RestoreMode.MERGE, false, backup).getFoodLogsRestored()).isEqualTo(2);
        assertThat(restore.restoreUserData(email, RestoreMode.MERGE, false, backup).getFoodLogsRestored()).isZero();
        backup.setFoodLogs(List.of(food("rice"), food("beans")));
        assertThatThrownBy(() -> restore.restoreUserData(email, RestoreMode.MERGE, false, backup))
                .isInstanceOf(com.ascension.exception.UserDataQuotaExceededException.class);
        assertThat(logs.findAllByUserEmailOrderByDateAscIdAsc(email)).extracting(com.ascension.model.FoodLog::getProduct)
                .containsExactly("rice", "apple");
    }

    private FoodLogDTO food(String name) {
        return FoodLogDTO.builder().product(name).mealIndex(0).date(LocalDate.now()).quantity(100).kcal(100).build();
    }
}

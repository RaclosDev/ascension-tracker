package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.FoodLogDTO;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class HistoricalMealIdentityIntegrationTest {
    @Autowired NutritionService meals;
    @Autowired NutritionLogService logs;
    @Autowired UserService users;

    @Test
    @Transactional
    void reorderingDoesNotRelabelPreviousFoodLogs() {
        String email = "historical-meals@example.com";
        users.ensureUserExists(email, "Meals", null);
        var configured = meals.getMeals(email);
        String originalName = configured.get(0).getName();
        logs.addFoodLog(email, FoodLogDTO.builder().date(LocalDate.now()).mealIndex(0)
                .product("Apple").quantity(100).kcal(50).build());
        configured.get(0).setSortOrder(10);
        meals.updateMeals(configured, email);
        var reordered = meals.getMeals(email);
        var historical = logs.getFoodLogsByDate(email, LocalDate.now()).get(0);
        assertThat(reordered.get(historical.getMealIndex()).getName()).isEqualTo(originalName);
        assertThat(historical.getMealKey()).isEqualTo(configured.get(0).getMealKey());
        meals.deleteMeal(configured.get(0).getId(), email);
        var archived = logs.getFoodLogsByDate(email, LocalDate.now()).get(0);
        assertThat(archived.getMealIndex()).isEqualTo(-1);
        assertThat(archived.getMealName()).isEqualTo(originalName);
        assertThat(archived.getMealKey()).isEqualTo(historical.getMealKey());
        archived.setQuantity(200);
        logs.updateFoodLog(email, archived);
        meals.resetDefaultMeals(email);
        assertThat(logs.getFoodLogsByDate(email, LocalDate.now()).get(0).getMealIndex()).isEqualTo(-1);
    }
}

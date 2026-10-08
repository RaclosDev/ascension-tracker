package com.ascension.service;

import com.ascension.model.Meal;
import com.ascension.repository.MealRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionServiceTest {

    @Mock
    private MealRepository mealRepository;

    @Mock
    private com.ascension.repository.FoodLogRepository foodLogRepository;

    @InjectMocks
    private NutritionService nutritionService;



    @Test
    void getWeeklyCalories_CalculatesCorrectly() {
        // Arrange
        com.ascension.model.FoodLog log1 = new com.ascension.model.FoodLog();
        log1.setDate(java.time.LocalDate.now());
        log1.setKcal(500.0);
        log1.setProtein(40.0);
        log1.setCarbs(30.0);
        log1.setFat(20.0);

        com.ascension.model.FoodLog log2 = new com.ascension.model.FoodLog();
        log2.setDate(java.time.LocalDate.now());
        log2.setKcal(300.0);
        log2.setProtein(10.0);
        log2.setCarbs(40.0);
        log2.setFat(10.0);

        Object[] row1 = new Object[] { java.time.LocalDate.now(), 800.0 };
        
        when(foodLogRepository.findDailyCaloriesByUserEmail("test@test.com"))
            .thenReturn(java.util.Collections.singletonList(row1));

        // Act
        java.util.List<com.ascension.dto.WeekSummaryDTO> result = nutritionService.getWeeklyCalories("test@test.com");

        // Assert
        org.junit.jupiter.api.Assertions.assertFalse(result.isEmpty());
        com.ascension.dto.WeekSummaryDTO currentWeek = result.get(result.size() - 1);
        org.junit.jupiter.api.Assertions.assertEquals(800.0, currentWeek.getAverage());
    }
}

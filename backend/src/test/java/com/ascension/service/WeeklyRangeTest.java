package com.ascension.service;

import com.ascension.model.*;
import com.ascension.repository.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class WeeklyRangeTest {
    private final LocalDate ancient = LocalDate.MIN;

    @Test
    void weightHistoryHasBoundedCalendarExpansion() {
        var repo = mock(WeightEntryRepository.class);
        when(repo.findAllByUserEmailOrderByDateAsc("user")).thenReturn(List.of(WeightEntry.builder().date(ancient).weight(80.0).build()));
        assertThat(new WeightService(repo, mock(SettingsService.class), mock(UserDataQuotaService.class)).getWeeklySummaries("user"))
                .hasSize(520);
    }

    @Test
    void stepsHistoryHasBoundedCalendarExpansion() {
        var repo = mock(StepsEntryRepository.class);
        var entry = new StepsEntry();
        entry.setDate(ancient);
        entry.setSteps(100);
        when(repo.findAllByUserEmailOrderByDateAsc("user")).thenReturn(List.of(entry));
        assertThat(new StepsService(repo, mock(UserDataQuotaService.class)).getWeeklySummaries("user")).hasSize(520);
    }

    @Test
    void caloriesHistoryHasBoundedCalendarExpansion() {
        var repo = mock(FoodLogRepository.class);
        when(repo.findDailyCaloriesByUserEmail("user")).thenReturn(java.util.Collections.singletonList(new Object[]{ancient, 100.0}));
        assertThat(new NutritionLogService(repo, mock(MealRepository.class), mock(SavedFoodRepository.class), mock(UserDataQuotaService.class))
                .getWeeklyCalories("user")).hasSize(520);
    }
}

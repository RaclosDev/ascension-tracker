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

    @InjectMocks
    private NutritionService nutritionService;

    @Test
    void deleteMeal_WhenNotOwner_ThrowsException() {
        Meal meal = new Meal();
        meal.setId(1L);
        meal.setUserEmail("owner@example.com");

        when(mealRepository.findById(1L)).thenReturn(Optional.of(meal));

        assertThrows(SecurityException.class, () -> {
            nutritionService.deleteMeal(1L, "intruder@example.com");
        });
    }
}

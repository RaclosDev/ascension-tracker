package com.ascension.service;

import com.ascension.dto.MealDTO;
import com.ascension.model.Meal;
import com.ascension.repository.MealRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NutritionServiceTest {

    @Mock
    private MealRepository mealRepository;

    @Mock
    private UserDataQuotaService userDataQuotaService;

    @InjectMocks
    private NutritionService nutritionService;

    private static final String USER_EMAIL = "test@ascension.app";

    @Test
    void getMeals_whenNoMealsExist_seedsDefaultMealsAndReturnsThem() {
        Meal meal1 = Meal.builder().id(1L).userEmail(USER_EMAIL).name("Desayuno").sortOrder(0).build();
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(USER_EMAIL))
                .thenReturn(Collections.emptyList())
                .thenReturn(List.of(meal1));

        List<MealDTO> result = nutritionService.getMeals(USER_EMAIL);

        verify(mealRepository).saveAll(anyList());
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Desayuno");
    }

    @Test
    void getMeals_whenMealsExist_returnsExistingWithoutSeeding() {
        Meal meal1 = Meal.builder().id(1L).userEmail(USER_EMAIL).name("Almuerzo").sortOrder(0).build();
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(USER_EMAIL))
                .thenReturn(List.of(meal1));

        List<MealDTO> result = nutritionService.getMeals(USER_EMAIL);

        verify(mealRepository, never()).saveAll(anyList());
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Almuerzo");
    }

    @Test
    void addMeal_appendsMealWithIncrementedSortOrder() {
        Meal existing = Meal.builder().id(1L).userEmail(USER_EMAIL).name("Cena").sortOrder(2).build();
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(USER_EMAIL))
                .thenReturn(List.of(existing));

        when(mealRepository.save(any(Meal.class))).thenAnswer(invocation -> {
            Meal m = invocation.getArgument(0);
            m.setId(99L);
            return m;
        });

        MealDTO newMeal = MealDTO.builder().name("Merienda").icon("🍏").build();
        MealDTO created = nutritionService.addMeal(newMeal, USER_EMAIL);

        assertThat(created.getId()).isEqualTo(99L);
        assertThat(created.getSortOrder()).isEqualTo(3);
        assertThat(created.getName()).isEqualTo("Merienda");
    }

    @Test
    void updateMeals_updatesFieldsAndReturnsRefreshedList() {
        Meal existing = Meal.builder().id(5L).userEmail(USER_EMAIL).name("Original").sortOrder(1).build();
        when(mealRepository.findByIdAndUserEmail(5L, USER_EMAIL)).thenReturn(Optional.of(existing));

        MealDTO updateDto = MealDTO.builder()
                .id(5L)
                .name("Nombre Modificado")
                .icon("🥑")
                .fixedProtein(30.0)
                .sortOrder(1)
                .build();

        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(USER_EMAIL))
                .thenReturn(List.of(existing));

        List<MealDTO> updated = nutritionService.updateMeals(List.of(updateDto), USER_EMAIL);

        verify(mealRepository).save(existing);
        assertThat(existing.getName()).isEqualTo("Nombre Modificado");
        assertThat(existing.getIcon()).isEqualTo("🥑");
        assertThat(existing.getFixedProtein()).isEqualTo(30.0);
        assertThat(updated).hasSize(1);
    }

    @Test
    void deleteMeal_whenRemainingEmpty_reseedsDefaults() {
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(USER_EMAIL))
                .thenReturn(Collections.emptyList());

        nutritionService.deleteMeal(10L, USER_EMAIL);

        verify(mealRepository).deleteByIdAndUserEmail(10L, USER_EMAIL);
        verify(mealRepository).saveAll(anyList());
    }

    @Test
    void resetDefaultMeals_deletesAllAndReseeds() {
        Meal m = Meal.builder().id(1L).userEmail(USER_EMAIL).name("Desayuno").sortOrder(0).build();
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(USER_EMAIL))
                .thenReturn(List.of(m));

        List<MealDTO> result = nutritionService.resetDefaultMeals(USER_EMAIL);

        verify(mealRepository).deleteAllByUserEmail(USER_EMAIL);
        verify(mealRepository).saveAll(anyList());
        assertThat(result).hasSize(1);
    }
}

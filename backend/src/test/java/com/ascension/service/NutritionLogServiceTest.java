package com.ascension.service;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.model.FoodLog;
import com.ascension.model.SavedFood;
import com.ascension.repository.FoodLogRepository;
import com.ascension.repository.SavedFoodRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NutritionLogServiceTest {

    @Mock
    private FoodLogRepository foodLogRepository;

    @Mock
    private SavedFoodRepository savedFoodRepository;

    @InjectMocks
    private NutritionLogService nutritionLogService;

    private static final String USER_EMAIL = "athlete@example.com";

    private FoodLog createFoodLog(Long id, String userEmail, LocalDate date, int mealIndex, String product, double qty, double kcal) {
        FoodLog fl = new FoodLog();
        fl.setId(id);
        fl.setUserEmail(userEmail);
        fl.setDate(date != null ? date : LocalDate.now());
        fl.setMealIndex(mealIndex);
        fl.setProduct(product);
        fl.setQuantity(qty);
        fl.setKcal(kcal);
        fl.setProtein(10.0);
        fl.setCarbs(20.0);
        fl.setFat(5.0);
        return fl;
    }

    @Test
    @DisplayName("getRecentDistinctFoods filters duplicates by product name and limits to 5")
    void getRecentDistinctFoods_filtersDuplicatesAndLimits() {
        List<FoodLog> logs = new ArrayList<>();
        logs.add(createFoodLog(1L, USER_EMAIL, null, 0, "Arroz", 100, 130));
        logs.add(createFoodLog(2L, USER_EMAIL, null, 0, "Pollo", 150, 165));
        logs.add(createFoodLog(3L, USER_EMAIL, null, 1, "Arroz", 100, 130)); // Duplicado
        logs.add(createFoodLog(4L, USER_EMAIL, null, 1, "Huevos", 120, 180));
        logs.add(createFoodLog(5L, USER_EMAIL, null, 2, "Avena", 50, 190));
        logs.add(createFoodLog(6L, USER_EMAIL, null, 2, "Platano", 100, 89));
        logs.add(createFoodLog(7L, USER_EMAIL, null, 3, "Atun", 80, 100)); // Excede limite 5

        when(foodLogRepository.findTop50ByUserEmailOrderByDateDesc(USER_EMAIL)).thenReturn(logs);

        List<FoodLogDTO> result = nutritionLogService.getRecentDistinctFoods(USER_EMAIL);

        assertThat(result).hasSize(5);
        List<String> products = result.stream().map(FoodLogDTO::getProduct).toList();
        assertThat(products).containsExactly("Arroz", "Pollo", "Huevos", "Avena", "Platano");
    }

    @Test
    @DisplayName("getFoodLogsByDate returns logs mapped to DTO")
    void getFoodLogsByDate_returnsMappedLogs() {
        LocalDate date = LocalDate.of(2026, 5, 20);
        FoodLog log = createFoodLog(100L, USER_EMAIL, date, 0, "Leche", 200.0, 120.0);

        when(foodLogRepository.findByUserEmailAndDateOrderByIdAsc(USER_EMAIL, date)).thenReturn(List.of(log));

        List<FoodLogDTO> result = nutritionLogService.getFoodLogsByDate(USER_EMAIL, date);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(100L);
        assertThat(result.get(0).getProduct()).isEqualTo("Leche");
        assertThat(result.get(0).getKcal()).isEqualTo(120.0);
    }

    @Test
    @DisplayName("addFoodLog saves entity and updates lastUsedAt on SavedFood if present")
    void addFoodLog_savesAndUpdatesSavedFood() {
        LocalDate date = LocalDate.of(2026, 5, 20);
        FoodLogDTO input = FoodLogDTO.builder()
                .date(date)
                .mealIndex(1)
                .product("Avena integral")
                .quantity(50.0)
                .kcal(180.0)
                .protein(6.5)
                .carbs(30.0)
                .fat(3.5)
                .build();

        FoodLog saved = createFoodLog(10L, USER_EMAIL, date, 1, "Avena integral", 50.0, 180.0);

        when(foodLogRepository.save(any(FoodLog.class))).thenReturn(saved);

        SavedFood existingSavedFood = SavedFood.builder()
                .id(99L)
                .userEmail(USER_EMAIL)
                .name("Avena integral")
                .build();
        when(savedFoodRepository.findFirstByUserEmailAndName(USER_EMAIL, "Avena integral"))
                .thenReturn(Optional.of(existingSavedFood));

        FoodLogDTO result = nutritionLogService.addFoodLog(USER_EMAIL, input);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getProduct()).isEqualTo("Avena integral");
        verify(foodLogRepository).save(any(FoodLog.class));
        verify(savedFoodRepository).save(existingSavedFood);
        assertThat(existingSavedFood.getLastUsedAt()).isNotNull();
    }

    @Test
    @DisplayName("updateFoodLog throws EntityNotFoundException when log is missing")
    void updateFoodLog_notFound() {
        FoodLogDTO dto = FoodLogDTO.builder().id(999L).product("Manzana").build();
        when(foodLogRepository.findByIdAndUserEmail(999L, USER_EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> nutritionLogService.updateFoodLog(USER_EMAIL, dto))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Log not found");
    }

    @Test
    @DisplayName("updateFoodLog updates fields when log exists")
    void updateFoodLog_success() {
        FoodLog existing = createFoodLog(15L, USER_EMAIL, LocalDate.now(), 0, "Manzana", 100.0, 52.0);
        when(foodLogRepository.findByIdAndUserEmail(15L, USER_EMAIL)).thenReturn(Optional.of(existing));

        FoodLogDTO updateDto = FoodLogDTO.builder()
                .id(15L)
                .product("Manzana Golden")
                .quantity(150.0)
                .kcal(78.0)
                .protein(0.5)
                .carbs(20.0)
                .fat(0.3)
                .mealIndex(2)
                .build();

        FoodLogDTO result = nutritionLogService.updateFoodLog(USER_EMAIL, updateDto);

        assertThat(result.getProduct()).isEqualTo("Manzana Golden");
        assertThat(result.getQuantity()).isEqualTo(150.0);
        assertThat(result.getKcal()).isEqualTo(78.0);
        assertThat(result.getMealIndex()).isEqualTo(2);
        verify(foodLogRepository).save(existing);
    }

    @Test
    @DisplayName("deleteFoodLog delegates to repository")
    void deleteFoodLog_delegates() {
        nutritionLogService.deleteFoodLog(USER_EMAIL, 42L);
        verify(foodLogRepository).deleteByIdAndUserEmail(42L, USER_EMAIL);
    }

    @Test
    @DisplayName("applyAssistantFoods processes map entries and delegates to addFoodLog")
    void applyAssistantFoods_processesFoods() {
        LocalDate date = LocalDate.of(2026, 6, 1);
        Map<String, Object> foodMap = new HashMap<>();
        foodMap.put("product", "Pechuga de pavo");
        foodMap.put("quantity", 120.0);
        foodMap.put("kcal", 130.0);
        foodMap.put("protein", 28.0);
        foodMap.put("carbs", 1.0);
        foodMap.put("fat", 2.0);
        foodMap.put("mealIndex", 0);

        when(foodLogRepository.save(any(FoodLog.class))).thenAnswer(inv -> {
            FoodLog fl = inv.getArgument(0);
            fl.setId(55L);
            return fl;
        });

        List<FoodLogDTO> result = nutritionLogService.applyAssistantFoods(USER_EMAIL, date, 0, List.of(foodMap));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProduct()).isEqualTo("Pechuga de pavo");
        assertThat(result.get(0).getProtein()).isEqualTo(28.0);
    }

    @Test
    @DisplayName("getWeeklyCalories returns empty list when no data is returned")
    void getWeeklyCalories_empty() {
        when(foodLogRepository.findDailyCaloriesByUserEmail(USER_EMAIL)).thenReturn(List.of());

        List<WeekSummaryDTO> result = nutritionLogService.getWeeklyCalories(USER_EMAIL);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getWeeklyCalories computes weekly summaries and deltas")
    void getWeeklyCalories_withData() {
        LocalDate monday = LocalDate.now().minusWeeks(1);
        Object[] row1 = new Object[]{monday, 2200.0};
        Object[] row2 = new Object[]{monday.plusDays(1), 2400.0};

        when(foodLogRepository.findDailyCaloriesByUserEmail(USER_EMAIL)).thenReturn(List.of(row1, row2));

        List<WeekSummaryDTO> result = nutritionLogService.getWeeklyCalories(USER_EMAIL);

        assertThat(result).isNotEmpty();
        WeekSummaryDTO firstWeek = result.get(0);
        assertThat(firstWeek.getEntries()).isEqualTo(2);
        assertThat(firstWeek.getAverage()).isEqualTo(2300.0);
    }

    @Test
    @DisplayName("Saved foods CRUD: get, add, update, delete")
    void savedFoodsCrud() {
        SavedFood sf = SavedFood.builder()
                .id(1L)
                .userEmail(USER_EMAIL)
                .name("Queso fresco")
                .brand("Hacendado")
                .kcalPer100g(100.0)
                .proteinPer100g(12.0)
                .carbsPer100g(4.0)
                .fatPer100g(3.0)
                .servingSize(100.0)
                .servingLabel("tarrina")
                .build();

        when(savedFoodRepository.findRecentByUserEmail(eq(USER_EMAIL), any(Pageable.class))).thenReturn(List.of(sf));

        List<SavedFoodDTO> savedFoods = nutritionLogService.getSavedFoods(USER_EMAIL);
        assertThat(savedFoods).hasSize(1);
        assertThat(savedFoods.get(0).getName()).isEqualTo("Queso fresco");

        // Add
        SavedFoodDTO newDto = SavedFoodDTO.builder().name("Atun claro").brand("Calvo").build();
        when(savedFoodRepository.save(any(SavedFood.class))).thenAnswer(inv -> {
            SavedFood s = inv.getArgument(0);
            s.setId(2L);
            return s;
        });

        SavedFoodDTO added = nutritionLogService.addSavedFood(USER_EMAIL, newDto);
        assertThat(added.getId()).isEqualTo(2L);

        // Update
        when(savedFoodRepository.findByIdAndUserEmail(1L, USER_EMAIL)).thenReturn(Optional.of(sf));
        SavedFoodDTO updateDto = SavedFoodDTO.builder().id(1L).name("Queso fresco batido").build();
        SavedFoodDTO updated = nutritionLogService.updateSavedFood(USER_EMAIL, updateDto);
        assertThat(updated.getName()).isEqualTo("Queso fresco batido");
        verify(savedFoodRepository, times(2)).save(any(SavedFood.class));

        // Delete
        nutritionLogService.deleteSavedFood(USER_EMAIL, 1L);
        verify(savedFoodRepository).deleteByIdAndUserEmail(1L, USER_EMAIL);
    }

    @Test
    @DisplayName("applyAssistantFoods parses numbers safely from strings, numbers and handles nulls")
    void applyAssistantFoods_parsesNumbersSafely() {
        Map<String, Object> foodItem = new HashMap<>();
        foodItem.put("mealIndex", "1");
        foodItem.put("product", "Avena");
        foodItem.put("quantity", "100.5");
        foodItem.put("kcal", 380);
        foodItem.put("protein", "13.5");
        foodItem.put("carbs", 65.0);
        foodItem.put("fat", null);

        when(foodLogRepository.save(any(FoodLog.class))).thenAnswer(inv -> {
            FoodLog fl = inv.getArgument(0);
            fl.setId(99L);
            return fl;
        });

        List<FoodLogDTO> result = nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 0, List.of(foodItem));

        assertThat(result).hasSize(1);
        FoodLogDTO dto = result.get(0);
        assertThat(dto.getProduct()).isEqualTo("Avena");
        assertThat(dto.getMealIndex()).isEqualTo(1);
        assertThat(dto.getQuantity()).isEqualTo(100.5);
        assertThat(dto.getKcal()).isEqualTo(380.0);
        assertThat(dto.getProtein()).isEqualTo(13.5);
        assertThat(dto.getCarbs()).isEqualTo(65.0);
        assertThat(dto.getFat()).isEqualTo(0.0);
    }
}

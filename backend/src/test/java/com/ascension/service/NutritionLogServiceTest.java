package com.ascension.service;

import com.ascension.dto.AiApplyRequestDTO;
import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NutritionLogServiceTest {

    @Mock
    private FoodLogRepository foodLogRepository;

    @Mock
    private SavedFoodRepository savedFoodRepository;

    @Mock
    private UserDataQuotaService userDataQuotaService;

    @Mock
    private com.ascension.repository.MealRepository mealRepository;

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
                .product("Avena Integral")
                .quantity(50.0)
                .kcal(190.0)
                .protein(6.5)
                .carbs(30.0)
                .fat(3.5)
                .build();

        FoodLog savedEntity = createFoodLog(10L, USER_EMAIL, date, 1, "Avena Integral", 50.0, 190.0);
        savedEntity.setProtein(6.5);
        savedEntity.setCarbs(30.0);
        savedEntity.setFat(3.5);

        when(foodLogRepository.save(any(FoodLog.class))).thenReturn(savedEntity);

        SavedFood sf = SavedFood.builder()
                .id(99L)
                .userEmail(USER_EMAIL)
                .name("Avena Integral")
                .build();
        when(savedFoodRepository.findFirstByUserEmailAndName(USER_EMAIL, "Avena Integral"))
                .thenReturn(Optional.of(sf));

        FoodLogDTO result = nutritionLogService.addFoodLog(USER_EMAIL, input);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getProduct()).isEqualTo("Avena Integral");
        verify(savedFoodRepository).save(sf);
        assertThat(sf.getLastUsedAt()).isNotNull();
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
        LocalDate monday = LocalDate.of(2026, 1, 5);
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
    @DisplayName("applyAssistantFoods batches items into saveAll and returns saved entities")
    void applyAssistantFoods_validBatchSavesInOneCall() {
        AiApplyRequestDTO.AppliedFoodItemDTO item1 = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Avena")
                .quantity(100.0)
                .kcal(380.0)
                .protein(13.0)
                .carbs(65.0)
                .fat(7.0)
                .mealIndex(1)
                .build();

        AiApplyRequestDTO.AppliedFoodItemDTO item2 = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Leche")
                .quantity(200.0)
                .kcal(120.0)
                .protein(6.0)
                .carbs(10.0)
                .fat(3.0)
                .mealIndex(1)
                .build();

        when(foodLogRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<FoodLog> toSave = inv.getArgument(0);
            long idCounter = 1L;
            for (FoodLog fl : toSave) {
                fl.setId(idCounter++);
            }
            return toSave;
        });

        List<FoodLogDTO> result = nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 0, List.of(item1, item2));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getProduct()).isEqualTo("Avena");
        assertThat(result.get(1).getProduct()).isEqualTo("Leche");
        verify(foodLogRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("applyAssistantFoods rejects negative nutritional values")
    void applyAssistantFoods_rejectsNegativeValues() {
        AiApplyRequestDTO.AppliedFoodItemDTO item = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Pollo")
                .quantity(-50.0)
                .kcal(100.0)
                .protein(20.0)
                .carbs(0.0)
                .fat(2.0)
                .build();

        InvalidInputException ex = assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 1, List.of(item))
        );
        assertThat(ex.getMessage()).contains("no pueden ser negativos");
    }

    @Test
    @DisplayName("applyAssistantFoods rejects NaN and Infinity")
    void applyAssistantFoods_rejectsNaNAndInfinity() {
        AiApplyRequestDTO.AppliedFoodItemDTO itemNaN = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Arroz")
                .quantity(Double.NaN)
                .kcal(130.0)
                .protein(2.5)
                .carbs(28.0)
                .fat(0.5)
                .build();

        assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 1, List.of(itemNaN))
        );

        AiApplyRequestDTO.AppliedFoodItemDTO itemInf = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Arroz")
                .quantity(100.0)
                .kcal(Double.POSITIVE_INFINITY)
                .protein(2.5)
                .carbs(28.0)
                .fat(0.5)
                .build();

        assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 1, List.of(itemInf))
        );
    }

    @Test
    @DisplayName("applyAssistantFoods rejects mealIndex out of range")
    void applyAssistantFoods_rejectsMealIndexOutOfRange() {
        AiApplyRequestDTO.AppliedFoodItemDTO item = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("Manzana")
                .quantity(150.0)
                .kcal(75.0)
                .protein(0.5)
                .carbs(19.0)
                .fat(0.2)
                .mealIndex(25) // Out of range (> 20)
                .build();

        assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 1, List.of(item))
        );

        assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), -1, List.of(item))
        );
    }

    @Test
    @DisplayName("applyAssistantFoods rejects list exceeding 50 items")
    void applyAssistantFoods_rejectsListExceeding50Items() {
        List<AiApplyRequestDTO.AppliedFoodItemDTO> hugeList = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            hugeList.add(AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                    .product("Item " + i)
                    .quantity(10.0)
                    .kcal(20.0)
                    .protein(1.0)
                    .carbs(2.0)
                    .fat(0.5)
                    .build());
        }

        assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 1, hugeList)
        );
    }

    @Test
    @DisplayName("applyAssistantFoods rejects product name exceeding 255 chars")
    void applyAssistantFoods_rejectsProductNameExceeding255Chars() {
        AiApplyRequestDTO.AppliedFoodItemDTO item = AiApplyRequestDTO.AppliedFoodItemDTO.builder()
                .product("P".repeat(256))
                .quantity(100.0)
                .kcal(200.0)
                .protein(10.0)
                .carbs(20.0)
                .fat(5.0)
                .build();

        assertThrows(InvalidInputException.class, () ->
                nutritionLogService.applyAssistantFoods(USER_EMAIL, LocalDate.now(), 1, List.of(item))
        );
    }
}

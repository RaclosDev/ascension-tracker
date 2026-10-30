package com.ascension.service;

import com.ascension.dto.AiApplyRequestDTO;
import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.exception.InvalidInputException;
import com.ascension.model.FoodLog;
import com.ascension.model.SavedFood;
import com.ascension.repository.FoodLogRepository;
import com.ascension.repository.SavedFoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NutritionLogService {

    private final FoodLogRepository foodLogRepository;
    private final SavedFoodRepository savedFoodRepository;
    private final UserDataQuotaService userDataQuotaService;

    public List<FoodLogDTO> getRecentDistinctFoods(String userEmail) {
        return foodLogRepository.findTop50ByUserEmailOrderByDateDesc(userEmail).stream()
                .filter(distinctByKey(FoodLog::getProduct))
                .limit(5)
                .map(this::toFoodLogDTO)
                .collect(Collectors.toList());
    }

    private static <T> Predicate<T> distinctByKey(Function<? super T, ?> keyExtractor) {
        Map<Object, Boolean> seen = new ConcurrentHashMap<>();
        return t -> seen.putIfAbsent(keyExtractor.apply(t), Boolean.TRUE) == null;
    }

    public List<FoodLogDTO> getFoodLogsByDate(String userEmail, LocalDate date) {
        return foodLogRepository.findByUserEmailAndDateOrderByIdAsc(userEmail, date).stream()
                .map(this::toFoodLogDTO)
                .collect(Collectors.toList());
    }

    public List<WeekSummaryDTO> getWeeklyCalories(String userEmail) {
        List<Object[]> dailyCalorieResults = foodLogRepository.findDailyCaloriesByUserEmail(userEmail);
        if (dailyCalorieResults.isEmpty()) return List.of();

        java.time.LocalDate firstMonday = ((java.time.LocalDate) dailyCalorieResults.get(0)[0]).with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        java.time.LocalDate currentMonday = java.time.LocalDate.now().with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));

        java.util.Map<java.time.LocalDate, Double> entryMap = dailyCalorieResults.stream()
                .collect(Collectors.toMap(
                        row -> (java.time.LocalDate) row[0],
                        row -> ((Number) row[1]).doubleValue()
                ));

        List<WeekSummaryDTO> summaries = new ArrayList<>();
        Double previousAvg = null;

        java.time.LocalDate monday = firstMonday;
        while (!monday.isAfter(currentMonday)) {
            List<Double> days = new ArrayList<>();
            List<Double> validValues = new ArrayList<>();

            for (int d = 0; d < 7; d++) {
                java.time.LocalDate day = monday.plusDays(d);
                Double cals = entryMap.get(day);
                days.add(cals);
                if (cals != null) validValues.add(cals);
            }

            Double average = validValues.isEmpty() ? null :
                    validValues.stream().mapToDouble(Double::doubleValue).average().getAsDouble();

            Double delta = null;
            if (average != null && previousAvg != null) {
                delta = (double) Math.round((average - previousAvg) * 100.0) / 100.0;
            }

            summaries.add(WeekSummaryDTO.builder()
                    .weekStart(monday)
                    .days(days)
                    .average(average != null ? (double) Math.round(average * 100.0) / 100.0 : null)
                    .delta(delta)
                    .entries(validValues.size())
                    .build());

            if (average != null) previousAvg = average;
            monday = monday.plusWeeks(1);
        }

        return summaries;
    }

    @Transactional
    public FoodLogDTO addFoodLog(String userEmail, FoodLogDTO dto) {
        userDataQuotaService.checkFoodLogQuota(userEmail, 1);
        FoodLog log = new FoodLog();
        log.setUserEmail(userEmail);
        log.setDate(dto.getDate());
        log.setMealIndex(dto.getMealIndex());
        log.setProduct(dto.getProduct());
        log.setQuantity(dto.getQuantity());
        log.setKcal(dto.getKcal());
        log.setProtein(dto.getProtein());
        log.setCarbs(dto.getCarbs());
        log.setFat(dto.getFat());
        log.setPortionsJson(dto.getPortionsJson());
        
        FoodLog saved = foodLogRepository.save(log);

        savedFoodRepository.findFirstByUserEmailAndName(userEmail, dto.getProduct())
            .ifPresent(sf -> {
                sf.setLastUsedAt(java.time.LocalDateTime.now());
                savedFoodRepository.save(sf);
            });

        return toFoodLogDTO(saved);
    }

    @Transactional
    public void deleteFoodLog(String userEmail, Long id) {
        foodLogRepository.deleteByIdAndUserEmail(id, userEmail);
    }

    @Transactional
    public FoodLogDTO updateFoodLog(String userEmail, FoodLogDTO dto) {
        FoodLog log = foodLogRepository.findByIdAndUserEmail(dto.getId(), userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Log not found"));

        if (!log.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        log.setProduct(dto.getProduct());
        log.setQuantity(dto.getQuantity());
        log.setKcal(dto.getKcal());
        log.setProtein(dto.getProtein());
        log.setCarbs(dto.getCarbs());
        log.setFat(dto.getFat());
        log.setPortionsJson(dto.getPortionsJson());
        if (dto.getMealIndex() != null) {
            log.setMealIndex(dto.getMealIndex());
        }

        foodLogRepository.save(log);
        return toFoodLogDTO(log);
    }

    @Transactional
    public List<FoodLogDTO> applyAssistantFoods(String userEmail, LocalDate date, int defaultMealIndex, List<AiApplyRequestDTO.AppliedFoodItemDTO> foods) {
        if (defaultMealIndex < 0 || defaultMealIndex > 20) {
            throw new InvalidInputException("El índice de la comida está fuera de rango: " + defaultMealIndex);
        }
        if (foods == null || foods.isEmpty()) {
            return Collections.emptyList();
        }
        if (foods.size() > 50) {
            throw new InvalidInputException("No se pueden añadir más de 50 alimentos a la vez");
        }

        userDataQuotaService.checkFoodLogQuota(userEmail, foods.size());

        List<FoodLog> entities = new ArrayList<>();
        for (AiApplyRequestDTO.AppliedFoodItemDTO item : foods) {
            int resolvedMeal = item.getMealIndex() != null ? item.getMealIndex() : defaultMealIndex;
            if (resolvedMeal < 0 || resolvedMeal > 20) {
                throw new InvalidInputException("El índice de comida " + resolvedMeal + " está fuera de rango");
            }
            if (!Double.isFinite(item.getQuantity()) || !Double.isFinite(item.getKcal()) ||
                !Double.isFinite(item.getProtein()) || !Double.isFinite(item.getCarbs()) ||
                !Double.isFinite(item.getFat())) {
                throw new InvalidInputException("Los valores nutricionales no pueden ser NaN ni infinitos");
            }
            if (item.getQuantity() < 0 || item.getKcal() < 0 ||
                item.getProtein() < 0 || item.getCarbs() < 0 || item.getFat() < 0) {
                throw new InvalidInputException("Los valores nutricionales no pueden ser negativos");
            }
            if (item.getProduct() == null || item.getProduct().isBlank()) {
                throw new InvalidInputException("El nombre del producto no puede estar vacío");
            }
            if (item.getProduct().length() > 255) {
                throw new InvalidInputException("El nombre del producto no puede superar los 255 caracteres");
            }

            FoodLog entity = new FoodLog();
            entity.setUserEmail(userEmail);
            entity.setDate(date);
            entity.setMealIndex(resolvedMeal);
            entity.setProduct(item.getProduct().trim());
            entity.setQuantity(item.getQuantity());
            entity.setKcal(item.getKcal());
            entity.setProtein(item.getProtein());
            entity.setCarbs(item.getCarbs());
            entity.setFat(item.getFat());
            entity.setPortionsJson(item.getPortionsJson());
            entities.add(entity);
        }

        List<FoodLog> saved = foodLogRepository.saveAll(entities);
        return saved.stream().map(this::toFoodLogDTO).collect(Collectors.toList());
    }

    private double parseDoubleSafe(Object val, double defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(val.toString().trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private int parseIntSafe(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(val.toString().trim());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private FoodLogDTO toFoodLogDTO(FoodLog log) {
        return FoodLogDTO.builder()
                .id(log.getId())
                .date(log.getDate())
                .mealIndex(log.getMealIndex())
                .product(log.getProduct())
                .quantity(log.getQuantity())
                .kcal(log.getKcal())
                .protein(log.getProtein())
                .carbs(log.getCarbs())
                .fat(log.getFat())
                .portionsJson(log.getPortionsJson())
                .build();
    }

    public List<SavedFoodDTO> getSavedFoods(String userEmail) {
        return savedFoodRepository.findRecentByUserEmail(userEmail, org.springframework.data.domain.PageRequest.of(0, 200)).stream()
                .map(f -> SavedFoodDTO.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .brand(f.getBrand())
                        .kcalPer100g(f.getKcalPer100g())
                        .proteinPer100g(f.getProteinPer100g())
                        .carbsPer100g(f.getCarbsPer100g())
                        .fatPer100g(f.getFatPer100g())
                        .servingSize(f.getServingSize())
                        .servingLabel(f.getServingLabel())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public SavedFoodDTO addSavedFood(String userEmail, SavedFoodDTO dto) {
        userDataQuotaService.checkSavedFoodQuota(userEmail, 1);
        SavedFood f = SavedFood.builder()
                .userEmail(userEmail)
                .name(dto.getName())
                .brand(dto.getBrand())
                .kcalPer100g(dto.getKcalPer100g())
                .proteinPer100g(dto.getProteinPer100g())
                .carbsPer100g(dto.getCarbsPer100g())
                .fatPer100g(dto.getFatPer100g())
                .servingSize(dto.getServingSize())
                .servingLabel(dto.getServingLabel())
                .build();
        f = savedFoodRepository.save(f);
        dto.setId(f.getId());
        return dto;
    }

    @Transactional
    public SavedFoodDTO updateSavedFood(String userEmail, SavedFoodDTO dto) {
        SavedFood f = savedFoodRepository.findByIdAndUserEmail(dto.getId(), userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Food not found"));
        
        if (!f.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        f.setName(dto.getName());
        f.setBrand(dto.getBrand());
        f.setKcalPer100g(dto.getKcalPer100g());
        f.setProteinPer100g(dto.getProteinPer100g());
        f.setCarbsPer100g(dto.getCarbsPer100g());
        f.setFatPer100g(dto.getFatPer100g());
        f.setServingSize(dto.getServingSize());
        f.setServingLabel(dto.getServingLabel());
        f.setLastUsedAt(java.time.LocalDateTime.now());
        
        savedFoodRepository.save(f);
        return dto;
    }

    @Transactional
    public void deleteSavedFood(String userEmail, Long id) {
        savedFoodRepository.deleteByIdAndUserEmail(id, userEmail);
    }
}

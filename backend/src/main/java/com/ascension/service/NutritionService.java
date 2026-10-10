package com.ascension.service;

import com.ascension.dto.MealDTO;
import com.ascension.model.Meal;
import com.ascension.repository.MealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NutritionService {

    private final MealRepository mealRepository;

    @Transactional
    public List<MealDTO> getMeals(String userEmail) {
        if (mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).isEmpty()) {
            seedDefaultMeals(userEmail);
        }
        return mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<MealDTO> updateMeals(List<MealDTO> dtos, String userEmail) {
        for (MealDTO dto : dtos) {
            if (dto.getId() != null) {
                mealRepository.findByIdAndUserEmail(dto.getId(), userEmail).ifPresent(meal -> {
                    if (!userEmail.equals(meal.getUserEmail())) return;
                    if (dto.getName() != null) meal.setName(dto.getName());
                    if (dto.getIcon() != null) meal.setIcon(dto.getIcon());
                    meal.setFixedProtein(dto.getFixedProtein());
                    meal.setProteinPct(dto.getProteinPct());
                    meal.setFixedCarbs(dto.getFixedCarbs());
                    meal.setCarbsPct(dto.getCarbsPct());
                    meal.setFixedFat(dto.getFixedFat());
                    meal.setFatPct(dto.getFatPct());
                    if (dto.getSortOrder() != null) meal.setSortOrder(dto.getSortOrder());
                    if (dto.getStartTime() != null) meal.setStartTime(dto.getStartTime());
                    if (dto.getEndTime() != null) meal.setEndTime(dto.getEndTime());
                    meal.setIsDefault(dto.getIsDefault());
                    mealRepository.save(meal);
                });
            }
        }
        return getMeals(userEmail);
    }

    @Transactional
    public MealDTO addMeal(MealDTO dto, String userEmail) {
        Integer maxOrder = mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).stream()
                .map(Meal::getSortOrder)
                .max(Integer::compareTo)
                .orElse(-1);

        Meal meal = Meal.builder()
                .name(dto.getName() != null ? dto.getName() : "Nueva Comida")
                .icon(dto.getIcon() != null ? dto.getIcon() : "🍽️")
                .sortOrder(maxOrder + 1)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .isDefault(dto.getIsDefault())
                .userEmail(userEmail)
                .build();

        return toDTO(mealRepository.save(meal));
    }

    @Transactional
    public void deleteMeal(Long id, String userEmail) {
        mealRepository.deleteByIdAndUserEmail(id, userEmail);
        if (mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).isEmpty()) {
            seedDefaultMeals(userEmail);
        }
    }

    @Transactional
    public List<MealDTO> resetDefaultMeals(String userEmail) {
        mealRepository.deleteAllByUserEmail(userEmail);
        seedDefaultMeals(userEmail);
        return getMeals(userEmail);
    }

    @Transactional
    public void seedDefaultMeals(String userEmail) {
        mealRepository.saveAll(List.of(
            Meal.builder().userEmail(userEmail).name("Desayuno").icon("☕").sortOrder(0).startTime("06:00").endTime("11:00").build(),
            Meal.builder().userEmail(userEmail).name("Comida").icon("🍽️").sortOrder(1).startTime("13:00").endTime("17:00").build(),
            Meal.builder().userEmail(userEmail).name("Cena").icon("🌙").sortOrder(2).startTime("20:00").endTime("05:59").build(),
            Meal.builder().userEmail(userEmail).name("Snacks").icon("🍎").sortOrder(3).startTime("11:00").endTime("13:00").isDefault(true).build()
        ));
    }

    private MealDTO toDTO(Meal meal) {
        return MealDTO.builder()
                .id(meal.getId())
                .name(meal.getName())
                .icon(meal.getIcon())
                .proteinPct(meal.getProteinPct())
                .fixedProtein(meal.getFixedProtein())
                .carbsPct(meal.getCarbsPct())
                .fixedCarbs(meal.getFixedCarbs())
                .fatPct(meal.getFatPct())
                .fixedFat(meal.getFixedFat())
                .sortOrder(meal.getSortOrder())
                .startTime(meal.getStartTime())
                .endTime(meal.getEndTime())
                .isDefault(meal.getIsDefault())
                .build();
    }
}

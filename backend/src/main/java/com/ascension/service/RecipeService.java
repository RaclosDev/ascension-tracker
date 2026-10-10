package com.ascension.service;

import com.ascension.dto.RecipeDTO;
import com.ascension.model.Recipe;
import com.ascension.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;

    public List<RecipeDTO> getRecipes(String userEmail) {
        return recipeRepository.findTop200ByUserEmailOrderByNameAsc(userEmail).stream()
                .map(r -> RecipeDTO.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .description(r.getDescription())
                        .totalKcal(r.getTotalKcal())
                        .totalProtein(r.getTotalProtein())
                        .totalCarbs(r.getTotalCarbs())
                        .totalFat(r.getTotalFat())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public RecipeDTO addRecipe(String userEmail, RecipeDTO dto) {
        Recipe r = Recipe.builder()
                .userEmail(userEmail)
                .name(dto.getName())
                .description(dto.getDescription())
                .totalKcal(dto.getTotalKcal())
                .totalProtein(dto.getTotalProtein())
                .totalCarbs(dto.getTotalCarbs())
                .totalFat(dto.getTotalFat())
                .build();
        r = recipeRepository.save(r);
        dto.setId(r.getId());
        return dto;
    }

    @Transactional
    public RecipeDTO updateRecipe(String userEmail, RecipeDTO dto) {
        Recipe r = recipeRepository.findByIdAndUserEmail(dto.getId(), userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Recipe not found"));

        if (!r.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        r.setName(dto.getName());
        r.setDescription(dto.getDescription());
        r.setTotalKcal(dto.getTotalKcal());
        r.setTotalProtein(dto.getTotalProtein());
        r.setTotalCarbs(dto.getTotalCarbs());
        r.setTotalFat(dto.getTotalFat());

        recipeRepository.save(r);
        return dto;
    }

    @Transactional
    public void deleteRecipe(String userEmail, Long id) {
        recipeRepository.deleteByIdAndUserEmail(id, userEmail);
    }
}

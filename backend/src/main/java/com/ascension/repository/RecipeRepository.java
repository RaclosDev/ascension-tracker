package com.ascension.repository;

import com.ascension.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findTop200ByUserEmailOrderByNameAsc(String userEmail);
    void deleteByIdAndUserEmail(Long id, String userEmail);
    java.util.Optional<Recipe> findByIdAndUserEmail(Long id, String userEmail);
}

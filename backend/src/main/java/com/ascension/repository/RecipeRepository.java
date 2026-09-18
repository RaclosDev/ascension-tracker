package com.ascension.repository;

import com.ascension.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByUserEmailOrderByNameAsc(String userEmail);
}

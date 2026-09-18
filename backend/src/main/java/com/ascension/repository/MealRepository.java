package com.ascension.repository;

import com.ascension.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    void deleteAllByUserEmail(String userEmail);

    List<Meal> findAllByUserEmailOrderBySortOrderAsc(String userEmail);
}


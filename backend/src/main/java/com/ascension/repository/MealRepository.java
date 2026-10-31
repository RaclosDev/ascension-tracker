package com.ascension.repository;

import com.ascension.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    void deleteAllByUserEmail(String userEmail);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM Meal m WHERE m.userEmail = ?1 ORDER BY m.sortOrder, m.id")
    List<Meal> findAllByUserEmailOrderBySortOrderAsc(String userEmail);
    void deleteByIdAndUserEmail(Long id, String userEmail);
    java.util.Optional<Meal> findByIdAndUserEmail(Long id, String userEmail);
    long countByUserEmail(String userEmail);
}


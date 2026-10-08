package com.ascension.repository;

import com.ascension.model.FoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {
    List<FoodLog> findByUserEmailAndDateOrderByIdAsc(String userEmail, LocalDate date);
    List<FoodLog> findTop20ByUserEmailOrderByDateDescIdDesc(String userEmail);
    List<FoodLog> findTop50ByUserEmailOrderByDateDesc(String userEmail);
    void deleteAllByUserEmail(String userEmail);
    void deleteByIdAndUserEmail(Long id, String userEmail);
    java.util.Optional<FoodLog> findByIdAndUserEmail(Long id, String userEmail);

    @org.springframework.data.jpa.repository.Query("SELECT f.date, SUM(f.kcal) FROM FoodLog f WHERE f.userEmail = ?1 GROUP BY f.date ORDER BY f.date ASC")
    List<Object[]> findDailyCaloriesByUserEmail(String userEmail);
}


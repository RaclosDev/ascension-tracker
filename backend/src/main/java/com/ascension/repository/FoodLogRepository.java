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
    List<FoodLog> findAllByUserEmailOrderByDateAsc(String userEmail);
    void deleteAllByUserEmail(String userEmail);
}


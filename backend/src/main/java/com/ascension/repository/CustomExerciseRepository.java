package com.ascension.repository;

import com.ascension.model.CustomExercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomExerciseRepository extends JpaRepository<CustomExercise, String> {
    List<CustomExercise> findByUserEmail(String userEmail);
    void deleteByUserEmailAndId(String userEmail, String id);
}

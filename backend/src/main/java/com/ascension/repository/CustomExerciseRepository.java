package com.ascension.repository;

import com.ascension.model.CustomExercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomExerciseRepository extends JpaRepository<CustomExercise, String> {
    List<CustomExercise> findByUserEmail(String userEmail);
    Optional<CustomExercise> findByUserEmailAndId(String userEmail, String id);
    void deleteByUserEmailAndId(String userEmail, String id);
    long countByUserEmail(String userEmail);
}

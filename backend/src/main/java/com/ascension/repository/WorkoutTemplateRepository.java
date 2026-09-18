package com.ascension.repository;

import com.ascension.model.WorkoutTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, String> {
    List<WorkoutTemplate> findByUserEmail(String userEmail);
    Optional<WorkoutTemplate> findByIdAndUserEmail(String id, String userEmail);
}

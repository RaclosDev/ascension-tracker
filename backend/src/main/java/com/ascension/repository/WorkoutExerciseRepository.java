package com.ascension.repository;

import com.ascension.model.WorkoutExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, String> {

    @Query("SELECT we FROM WorkoutExercise we JOIN FETCH we.sets WHERE we.workout.userEmail = :userEmail AND we.exerciseId = :exerciseId ORDER BY we.workout.startedAt DESC")
    List<WorkoutExercise> findByUserEmailAndExerciseIdOrderByDateDesc(String userEmail, String exerciseId);
}

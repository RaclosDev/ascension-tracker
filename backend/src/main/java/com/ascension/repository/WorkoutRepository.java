package com.ascension.repository;

import com.ascension.model.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutRepository extends JpaRepository<Workout, String> {
    
    org.springframework.data.domain.Page<Workout> findByUserEmailOrderByStartedAtDesc(String userEmail, org.springframework.data.domain.Pageable pageable);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"exercises", "exercises.sets"})
    List<Workout> findByUserEmailAndStartedAtGreaterThanEqualOrderByStartedAtDesc(String userEmail, Long startedAt);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"exercises", "exercises.sets"})
    Optional<Workout> findByIdAndUserEmail(String id, String userEmail);
    long countByUserEmail(String userEmail);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"exercises", "exercises.sets"})
    List<Workout> findAllByUserEmailOrderByStartedAtDesc(String userEmail);

    @Query(value = """
        SELECT
            (SELECT COUNT(*) FROM workouts WHERE user_email = :userEmail) AS totalWorkouts,
            (SELECT COALESCE(SUM(
                CASE
                    WHEN started_at IS NOT NULL AND finished_at IS NOT NULL AND finished_at > started_at THEN
                        CASE
                            WHEN started_at > 100000000000 THEN (finished_at - started_at) / 1000
                            ELSE (finished_at - started_at)
                        END
                    ELSE 0
                END
            ), 0) FROM workouts WHERE user_email = :userEmail) AS totalDurationSeconds,
            (SELECT COUNT(s.id)
             FROM workout_sets s
             JOIN workout_exercises e ON s.workout_exercise_id = e.id
             JOIN workouts w ON e.workout_id = w.id
             WHERE w.user_email = :userEmail) AS totalSets,
            (SELECT COALESCE(SUM(
                CASE
                    WHEN s.weight > 0 AND s.reps > 0 THEN s.weight * s.reps
                    ELSE 0
                END
            ), 0)
             FROM workout_sets s
             JOIN workout_exercises e ON s.workout_exercise_id = e.id
             JOIN workouts w ON e.workout_id = w.id
             WHERE w.user_email = :userEmail) AS totalVolume
        """, nativeQuery = true)
    WorkoutStatsProjection getWorkoutStats(@org.springframework.data.repository.query.Param("userEmail") String userEmail);
}

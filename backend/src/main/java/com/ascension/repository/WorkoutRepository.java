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
    List<Workout> findByUserEmailAndStartedAtGreaterThanEqualOrderByStartedAtDesc(String userEmail, Long startedAt);
    Optional<Workout> findByIdAndUserEmail(String id, String userEmail);
    long countByUserEmail(String userEmail);

    @Query("SELECT COUNT(w) FROM Workout w WHERE w.userEmail = :userEmail")
    long customCount(String userEmail); // Just in case
}

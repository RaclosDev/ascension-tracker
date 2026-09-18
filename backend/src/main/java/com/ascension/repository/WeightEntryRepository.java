package com.ascension.repository;

import com.ascension.model.WeightEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeightEntryRepository extends JpaRepository<WeightEntry, Long> {

    Optional<WeightEntry> findByUserEmailAndDate(String userEmail, LocalDate date);

    List<WeightEntry> findAllByUserEmailOrderByDateAsc(String userEmail);

    List<WeightEntry> findAllByOrderByDateAsc();

    List<WeightEntry> findByUserEmailAndDateBetweenOrderByDateAsc(String userEmail, LocalDate start, LocalDate end);

    Optional<WeightEntry> findTopByUserEmailOrderByDateDesc(String userEmail);

    boolean existsByUserEmailAndDate(String userEmail, LocalDate date);
}

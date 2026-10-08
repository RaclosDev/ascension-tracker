package com.ascension.repository;

import com.ascension.model.StepsEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StepsEntryRepository extends JpaRepository<StepsEntry, Long> {
    List<StepsEntry> findAllByUserEmailOrderByDateAsc(String userEmail);
    Optional<StepsEntry> findByUserEmailAndDate(String userEmail, LocalDate date);
    void deleteAllByUserEmail(String userEmail);
}



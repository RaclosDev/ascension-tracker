package com.ascension.repository;

import com.ascension.model.SavedFood;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedFoodRepository extends JpaRepository<SavedFood, Long> {
    @Query("SELECT s FROM SavedFood s WHERE s.userEmail = :userEmail ORDER BY s.lastUsedAt DESC NULLS LAST, s.id DESC")
    List<SavedFood> findRecentByUserEmail(@Param("userEmail") String userEmail, org.springframework.data.domain.Pageable pageable);

    Optional<SavedFood> findFirstByUserEmailAndName(String userEmail, String name);
    void deleteByIdAndUserEmail(Long id, String userEmail);
    Optional<SavedFood> findByIdAndUserEmail(Long id, String userEmail);
}

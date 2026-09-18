package com.ascension.repository;

import com.ascension.model.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {

    Optional<UserSettings> findByUserEmail(String userEmail);

    default Optional<UserSettings> findSettings(String userEmail) {
        return findByUserEmail(userEmail);
    }

    default Optional<UserSettings> findSettings() {
        return findByUserEmail("raclosdev@gmail.com");
    }
}

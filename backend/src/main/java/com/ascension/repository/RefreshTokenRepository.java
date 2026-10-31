package com.ascension.repository;

import com.ascension.model.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.time.Instant;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RefreshToken r WHERE r.token = :token")
    Optional<RefreshToken> findByTokenForUpdate(@Param("token") String token);

    void deleteByEmail(String email);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.email = :email")
    void deleteByUserEmail(@Param("email") String email);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.familyId = :familyId")
    void deleteByFamilyId(@Param("familyId") String familyId);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiryDate < :instant")
    void deleteByExpiryDateBefore(@Param("instant") Instant instant);

}

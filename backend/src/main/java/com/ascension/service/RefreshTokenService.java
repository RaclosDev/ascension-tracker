package com.ascension.service;

import com.ascension.model.RefreshToken;
import com.ascension.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long REFRESH_TOKEN_EXPIRATION_DAYS = 30;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(String email, String name, String picture) {
        return createRefreshToken(email, name, picture, null);
    }

    @Transactional
    public RefreshToken createRefreshToken(String email, String name, String picture, String familyId) {
        RefreshToken refreshToken = new RefreshToken(
                email, name, picture,
                Instant.now().plus(REFRESH_TOKEN_EXPIRATION_DAYS, ChronoUnit.DAYS),
                familyId
        );
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(noRollbackFor = com.ascension.exception.TokenRefreshException.class)
    public RefreshToken rotateRefreshToken(String requestRefreshToken) {
        String hashedToken = RefreshToken.hashToken(requestRefreshToken);
        var optionalToken = refreshTokenRepository.findByTokenForUpdate(hashedToken);
        
        if (optionalToken.isEmpty()) {
            throw new com.ascension.exception.TokenRefreshException("Refresh token not found");
        }

        RefreshToken refreshToken = optionalToken.get();
        
        if (refreshToken.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(refreshToken);
            throw new com.ascension.exception.TokenRefreshException("Refresh token expired");
        }

        if (refreshToken.getReplacedAt() != null) {
            Instant graceThreshold = refreshToken.getReplacedAt().plusSeconds(10);
            if (Instant.now().isBefore(graceThreshold) && !refreshToken.isGraceUsed()) {
                // Grace period: allow at most ONE additional emission
                refreshToken.setGraceUsed(true);
                refreshTokenRepository.save(refreshToken);
                return createRefreshToken(refreshToken.getEmail(), refreshToken.getName(), refreshToken.getPicture(), refreshToken.getFamilyId());
            }
            // Outside grace period or grace already consumed: reuse detected -> revoke whole family
            refreshTokenRepository.deleteByFamilyId(refreshToken.getFamilyId());
            throw new com.ascension.exception.TokenRefreshException("Session expired. Please log in again.");
        }

        refreshToken.setReplacedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);
        
        return createRefreshToken(refreshToken.getEmail(), refreshToken.getName(), refreshToken.getPicture(), refreshToken.getFamilyId());
    }

    @Transactional
    public RefreshToken save(RefreshToken refreshToken) {
        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new com.ascension.exception.TokenRefreshException("Refresh token is expired");
        }
        return token;
    }

    @Transactional
    public void deleteByEmail(String email) {
        refreshTokenRepository.deleteByEmail(email);
    }

    @Transactional
    public void delete(RefreshToken token) {
        refreshTokenRepository.delete(token);
    }
}

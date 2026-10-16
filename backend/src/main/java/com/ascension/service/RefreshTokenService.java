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
    private final UserService userService;
    private final long REFRESH_TOKEN_EXPIRATION_DAYS = 30;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserService userService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userService = userService;
    }

    @Transactional
    public RefreshToken createRefreshToken(String email) {
        return createRefreshToken(email, (String) null);
    }

    @Transactional
    public RefreshToken createRefreshToken(String email, String familyId) {
        RefreshToken refreshToken = new RefreshToken(
                email,
                Instant.now().plus(REFRESH_TOKEN_EXPIRATION_DAYS, ChronoUnit.DAYS),
                familyId
        );
        return refreshTokenRepository.save(refreshToken);
    }

    @Deprecated
    @Transactional
    public RefreshToken createRefreshToken(String email, String name, String picture) {
        return createRefreshToken(email, (String) null);
    }

    @Deprecated
    @Transactional
    public RefreshToken createRefreshToken(String email, String name, String picture, String familyId) {
        return createRefreshToken(email, familyId);
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
            if (Instant.now().isBefore(graceThreshold)) {
                // Grace period: allow concurrent cluster/tab refresh without deleting the family
                refreshToken.setGraceUsed(true);
                refreshTokenRepository.save(refreshToken);
                return createRefreshToken(refreshToken.getEmail(), refreshToken.getFamilyId());
            }
            // Outside grace period (10s elapsed): true token reuse attack detected -> revoke family and access tokens
            if (userService != null) {
                userService.updateTokensValidAfter(refreshToken.getEmail(), Instant.now());
            }
            refreshTokenRepository.deleteByFamilyId(refreshToken.getFamilyId());
            throw new com.ascension.exception.TokenRefreshException("Session expired. Please log in again.");
        }

        refreshToken.setReplacedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);
        
        return createRefreshToken(refreshToken.getEmail(), refreshToken.getFamilyId());
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

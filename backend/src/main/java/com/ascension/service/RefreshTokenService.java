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
    private final long REFRESH_TOKEN_EXPIRATION_DAYS = 7;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(String email, String name, String picture) {
        RefreshToken refreshToken = new RefreshToken(
                email, name, picture,
                Instant.now().plus(REFRESH_TOKEN_EXPIRATION_DAYS, ChronoUnit.DAYS)
        );
        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token is expired");
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


package com.ascension.service;

import com.ascension.exception.TokenRefreshException;
import com.ascension.model.RefreshToken;
import com.ascension.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private RefreshToken activeToken;
    private final String plainToken = "test-plain-token";
    private String hashedToken;

    @BeforeEach
    void setUp() {
        hashedToken = RefreshToken.hashToken(plainToken);
        activeToken = new RefreshToken(
                "user@example.com",
                "User Name",
                "https://example.com/pic.png",
                Instant.now().plus(30, ChronoUnit.DAYS)
        );
        activeToken.setToken(hashedToken);
    }

    @Test
    void createRefreshToken_savesAndReturnsToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken created = refreshTokenService.createRefreshToken("user@example.com", "User Name", "pic.png");

        assertNotNull(created);
        assertEquals("user@example.com", created.getEmail());
        assertNotNull(created.getPlainToken());
        assertNotNull(created.getToken());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void rotateRefreshToken_normalRotation_marksOldTokenReplacedAndCreatesNew() {
        when(refreshTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(activeToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken newRotated = refreshTokenService.rotateRefreshToken(plainToken);

        assertNotNull(newRotated);
        assertNotNull(activeToken.getReplacedAt());
        assertEquals("user@example.com", newRotated.getEmail());
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
        verify(refreshTokenRepository, never()).deleteByEmail(anyString());
    }

    @Test
    void rotateRefreshToken_withinGracePeriod_issuesFreshTokenWithoutDeletingAllUserTokens() {
        // Token was replaced 10 seconds ago (within 60s grace period)
        activeToken.setReplacedAt(Instant.now().minusSeconds(10));
        when(refreshTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(activeToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken graceResult = refreshTokenService.rotateRefreshToken(plainToken);

        assertNotNull(graceResult);
        assertEquals("user@example.com", graceResult.getEmail());
        assertNotNull(graceResult.getPlainToken());
        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
        verify(refreshTokenRepository, never()).deleteByEmail(anyString());
    }

    @Test
    void rotateRefreshToken_afterGracePeriod_revokesAllUserSessionsAndThrows() {
        // Token was replaced 90 seconds ago (past 60s grace period)
        activeToken.setReplacedAt(Instant.now().minusSeconds(90));
        when(refreshTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(activeToken));

        TokenRefreshException ex = assertThrows(TokenRefreshException.class, () ->
                refreshTokenService.rotateRefreshToken(plainToken)
        );

        assertTrue(ex.getMessage().contains("Session expired"));
        verify(refreshTokenRepository).deleteByUserEmail(activeToken.getEmail());
    }

    @Test
    void rotateRefreshToken_whenExpired_deletesTokenAndThrows() {
        activeToken.setExpiryDate(Instant.now().minusSeconds(3600));
        when(refreshTokenRepository.findByToken(hashedToken)).thenReturn(Optional.of(activeToken));

        TokenRefreshException ex = assertThrows(TokenRefreshException.class, () ->
                refreshTokenService.rotateRefreshToken(plainToken)
        );

        assertTrue(ex.getMessage().contains("expired"));
        verify(refreshTokenRepository).delete(activeToken);
        verify(refreshTokenRepository, never()).deleteByEmail(anyString());
    }

    @Test
    void rotateRefreshToken_whenNotFound_throwsException() {
        when(refreshTokenRepository.findByToken(hashedToken)).thenReturn(Optional.empty());

        assertThrows(TokenRefreshException.class, () ->
                refreshTokenService.rotateRefreshToken(plainToken)
        );
        verify(refreshTokenRepository, never()).delete(any(RefreshToken.class));
    }
}

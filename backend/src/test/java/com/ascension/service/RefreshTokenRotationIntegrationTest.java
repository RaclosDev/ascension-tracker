package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.exception.TokenRefreshException;
import com.ascension.model.RefreshToken;
import com.ascension.repository.RefreshTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.ascension.support.DisabledIfDockerUnavailable;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key"
})
class RefreshTokenRotationIntegrationTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenCleanupService cleanupService;

    @Test
    @DisplayName("Reusing a rotated refresh token past grace period revokes the entire token family in database")
    void reusingRotatedTokenPastGracePeriod_revokesEntireFamilyInDatabase() {
        String testEmail = "testuser@example.com";
        userService.ensureUserExists(testEmail, "Test User", null);

        // 1. Create initial refresh token for user
        RefreshToken initialToken = refreshTokenService.createRefreshToken(testEmail, "Test User", null);
        String plainToken1 = initialToken.getPlainToken();
        String familyId = initialToken.getFamilyId();

        assertThat(familyId).isNotNull();

        // 2. Rotate token normally
        RefreshToken rotatedToken = refreshTokenService.rotateRefreshToken(plainToken1);
        String plainToken2 = rotatedToken.getPlainToken();

        // Both tokens should exist in database, with same family_id
        List<RefreshToken> familyTokens = refreshTokenRepository.findAll().stream()
                .filter(t -> familyId.equals(t.getFamilyId()))
                .toList();
        assertThat(familyTokens).hasSize(2);

        // 3. Simulate passage of time past grace period (300s)
        RefreshToken oldTokenInDb = refreshTokenRepository.findByToken(RefreshToken.hashToken(plainToken1)).orElseThrow();
        oldTokenInDb.setReplacedAt(Instant.now().minusSeconds(360));
        refreshTokenRepository.save(oldTokenInDb);

        // 4. Attacker attempts to reuse the old rotated token (plainToken1)
        assertThrows(TokenRefreshException.class, () -> {
            refreshTokenService.rotateRefreshToken(plainToken1);
        });

        // 5. Verify the ENTIRE token family was deleted from the database
        List<RefreshToken> remainingFamilyTokens = refreshTokenRepository.findAll().stream()
                .filter(t -> familyId.equals(t.getFamilyId()))
                .toList();
        assertThat(remainingFamilyTokens).isEmpty();

        // Also ensure token 2 is no longer valid or present
        assertThat(refreshTokenRepository.findByToken(RefreshToken.hashToken(plainToken2))).isEmpty();
    }
    @Test
    void cleanupPreservesReplayDetectionUntilOriginalTokenExpires() {
        String email = "cleanup-replay@example.com";
        userService.ensureUserExists(email);
        RefreshToken original = refreshTokenService.createRefreshToken(email);
        RefreshToken successor = refreshTokenService.rotateRefreshToken(original.getPlainToken());
        RefreshToken stored = refreshTokenRepository.findByToken(original.getToken()).orElseThrow();
        stored.setReplacedAt(Instant.now().minusSeconds(360));
        refreshTokenRepository.save(stored);
        cleanupService.cleanupExpiredTokens();
        assertThat(refreshTokenRepository.findByToken(original.getToken())).isPresent();
        assertThrows(TokenRefreshException.class, () -> refreshTokenService.rotateRefreshToken(original.getPlainToken()));
        assertThat(refreshTokenRepository.findByToken(successor.getToken())).isEmpty();
    }

}

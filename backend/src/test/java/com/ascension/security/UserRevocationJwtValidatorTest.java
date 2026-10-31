package com.ascension.security;

import com.ascension.service.UserService;
import com.ascension.service.UserService.UserSecurityState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserRevocationJwtValidatorTest {

    private UserService userService;
    private UserRevocationJwtValidator validator;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        validator = new UserRevocationJwtValidator(userService);
    }

    private Jwt createJwt(String email, Instant issuedAt) {
        return new Jwt(
                "token-value",
                issuedAt,
                issuedAt.plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("email", email, "sub", email)
        );
    }

    @Test
    void validate_whenUserDoesNotExist_returnsFailure() {
        when(userService.getUserSecurityState("deleted@example.com"))
                .thenReturn(new UserSecurityState(false, null));

        Jwt jwt = createJwt("deleted@example.com", Instant.now());
        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isTrue();
        assertThat(result.getErrors()).anyMatch(e -> e.getDescription().contains("User does not exist"));
    }

    @Test
    void validate_whenIssuedBeforeTokensValidAfter_returnsFailure() {
        Instant tokensValidAfter = Instant.parse("2026-10-16T12:00:00Z");
        Instant issuedAt = tokensValidAfter.minusSeconds(10);

        when(userService.getUserSecurityState("revoked@example.com"))
                .thenReturn(new UserSecurityState(true, tokensValidAfter));

        Jwt jwt = createJwt("revoked@example.com", issuedAt);
        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isTrue();
        assertThat(result.getErrors()).anyMatch(e -> e.getDescription().contains("Token has been revoked"));
    }

    @Test
    void validate_whenIssuedAfterTokensValidAfter_returnsSuccess() {
        Instant tokensValidAfter = Instant.parse("2026-10-16T12:00:00Z");
        Instant issuedAt = tokensValidAfter.plusSeconds(10);

        when(userService.getUserSecurityState("valid@example.com"))
                .thenReturn(new UserSecurityState(true, tokensValidAfter));

        Jwt jwt = createJwt("valid@example.com", issuedAt);
        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isFalse();
    }

    @Test
    void validate_legacyTokenIssuedEarlierInSameSecondIsRevoked() {
        // tokensValidAfter with milliseconds
        Instant tokensValidAfter = Instant.parse("2026-10-16T12:00:00.789Z");
        // JWT issuedAt truncated to seconds as per JWT spec
        Instant issuedAt = Instant.parse("2026-10-16T12:00:00.000Z");

        when(userService.getUserSecurityState("valid@example.com"))
                .thenReturn(new UserSecurityState(true, tokensValidAfter));

        Jwt jwt = createJwt("valid@example.com", issuedAt);
        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void stalePreciseSecurityVersionIsRejectedEvenWithLaterIssuedAt() {
        Instant cutoff = Instant.parse("2026-10-16T12:00:00.789Z");
        when(userService.getUserSecurityState("valid@example.com")).thenReturn(new UserSecurityState(true, cutoff));
        Jwt jwt = Jwt.withTokenValue("signed-token").header("alg", "HS256")
                .subject("valid@example.com").issuedAt(cutoff.plusSeconds(1)).expiresAt(cutoff.plusSeconds(900))
                .claim("securityVersion", cutoff.minusMillis(1).toString()).build();
        assertThat(validator.validate(jwt).hasErrors()).isTrue();
    }

    @Test
    void matchingPreciseSecurityVersionAllowsImmediateNewLogin() {
        Instant cutoff = Instant.parse("2026-10-16T12:00:00.789Z");
        when(userService.getUserSecurityState("valid@example.com")).thenReturn(new UserSecurityState(true, cutoff));
        Jwt jwt = Jwt.withTokenValue("signed-token").header("alg", "HS256")
                .subject("valid@example.com").issuedAt(cutoff.truncatedTo(java.time.temporal.ChronoUnit.SECONDS))
                .expiresAt(cutoff.plusSeconds(900)).claim("securityVersion", cutoff.toString()).build();
        assertThat(validator.validate(jwt).hasErrors()).isFalse();
    }

    @Test
    void nonStringSecurityVersionIsRejected() {
        when(userService.getUserSecurityState("valid@example.com")).thenReturn(new UserSecurityState(true, null));
        Jwt jwt = Jwt.withTokenValue("signed-token").header("alg", "HS256")
                .subject("valid@example.com").issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(900))
                .claim("securityVersion", 123).build();
        assertThat(validator.validate(jwt).hasErrors()).isTrue();
    }

    @Test
    void validate_whenTokensValidAfterIsNull_returnsSuccess() {
        when(userService.getUserSecurityState("valid@example.com"))
                .thenReturn(new UserSecurityState(true, null));

        Jwt jwt = createJwt("valid@example.com", Instant.now());
        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isFalse();
    }

    @Test
    void validate_whenJwtHasNoEmailOrSubject_returnsFailure() {
        Jwt jwt = new Jwt(
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("other", "value")
        );

        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isTrue();
        assertThat(result.getErrors()).anyMatch(e -> e.getDescription().contains("missing"));
    }

    @Test
    void validate_whenIssuedAtIsNull_returnsFailure() {
        Jwt jwt = new Jwt(
                "token-value",
                null,
                Instant.now().plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("email", "valid@example.com", "sub", "valid@example.com")
        );

        when(userService.getUserSecurityState("valid@example.com"))
                .thenReturn(new UserSecurityState(true, null));

        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isTrue();
        assertThat(result.getErrors()).anyMatch(e -> e.getDescription().contains("missing"));
    }
}

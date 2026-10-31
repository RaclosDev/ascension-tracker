package com.ascension.security;

import com.ascension.service.UserService;
import com.ascension.service.UserService.UserSecurityState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class UserRevocationJwtValidator implements OAuth2TokenValidator<Jwt> {

    private static final Logger log = LoggerFactory.getLogger(UserRevocationJwtValidator.class);

    private static final OAuth2Error ERROR_USER_NOT_FOUND =
            new OAuth2Error("invalid_token", "User does not exist or has been deleted", null);
    private static final OAuth2Error ERROR_TOKEN_REVOKED =
            new OAuth2Error("invalid_token", "Token has been revoked", null);
    private static final OAuth2Error ERROR_INVALID_CLAIMS =
            new OAuth2Error("invalid_token", "Token is missing subject or email claim", null);

    private final UserService userService;

    public UserRevocationJwtValidator(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            email = jwt.getSubject();
        }
        if (email == null || email.isBlank()) {
            log.warn("JWT rejected: missing subject or identifier claim");
            return OAuth2TokenValidatorResult.failure(ERROR_INVALID_CLAIMS);
        }

        UserSecurityState state = userService.getUserSecurityState(email);
        if (!state.exists()) {
            log.warn("JWT rejected: user '{}' does not exist in database", com.ascension.util.PiiMasker.maskEmail(email));
            return OAuth2TokenValidatorResult.failure(ERROR_USER_NOT_FOUND);
        }

        Instant issuedAt = jwt.getIssuedAt();
        if (issuedAt == null) {
            log.warn("JWT rejected: missing issued-at (iat) claim for '{}'", com.ascension.util.PiiMasker.maskEmail(email));
            return OAuth2TokenValidatorResult.failure(ERROR_INVALID_CLAIMS);
        }

        Instant tokensValidAfter = state.tokensValidAfter();
        Object version = jwt.getClaims().get("securityVersion");
        String expectedVersion = tokensValidAfter != null ? tokensValidAfter.toString() : "";
        boolean revoked = jwt.getClaims().containsKey("securityVersion")
                ? !(version instanceof String text && text.equals(expectedVersion))
                : tokensValidAfter != null && issuedAt.isBefore(tokensValidAfter);
        if (revoked) {
            log.warn("JWT rejected: token for '{}' issued at {} is prior to tokens_valid_after {}",
                    com.ascension.util.PiiMasker.maskEmail(email), issuedAt, tokensValidAfter);
            return OAuth2TokenValidatorResult.failure(ERROR_TOKEN_REVOKED);
        }

        return OAuth2TokenValidatorResult.success();
    }
}

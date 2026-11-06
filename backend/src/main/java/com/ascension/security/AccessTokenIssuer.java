package com.ascension.security;

import com.ascension.exception.TokenRefreshException;
import com.ascension.service.UserService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

/**
 * Issues the short-lived access JWT. Each token carries the account's security version, so
 * revoking sessions (logout everywhere, account deletion) invalidates tokens issued before it.
 */
@Component
public class AccessTokenIssuer {

    private final JwtEncoder jwtEncoder;
    private final UserService userService;
    private final long expirationMs;

    public AccessTokenIssuer(JwtEncoder jwtEncoder, UserService userService,
                             @Value("${app.jwt.expiration-ms:900000}") long expirationMs) {
        this.jwtEncoder = jwtEncoder;
        this.userService = userService;
        this.expirationMs = expirationMs;
    }

    /** Token for a fresh login, bound to the account's current security version. */
    public String issue(String email, String name, String picture) {
        return encode(email, name, picture, currentSecurityVersion(email));
    }

    /**
     * Token for a refresh. The version authorised when the refresh token was rotated must still be
     * current; otherwise the session was revoked in between and the refresh is refused.
     */
    public String issueForRefresh(String email, String name, String picture, String authorizedVersion) {
        String expected = authorizedVersion != null ? authorizedVersion : "";
        if (!expected.equals(currentSecurityVersion(email))) {
            throw new TokenRefreshException("Session was revoked during refresh. Please log in again.");
        }
        return encode(email, name, picture, expected);
    }

    private String currentSecurityVersion(String email) {
        var state = userService.getUserSecurityState(email);
        if (!state.exists()) {
            throw new TokenRefreshException("User account no longer exists");
        }
        return state.tokensValidAfter() != null ? state.tokensValidAfter().toString() : "";
    }

    private String encode(String email, String name, String picture, String securityVersion) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ascension-backend")
                .issuedAt(now)
                .expiresAt(now.plus(expirationMs, ChronoUnit.MILLIS))
                .subject(email)
                .claim("email", email)
                .claim("securityVersion", securityVersion)
                .claim("name", name != null ? name : "")
                .claim("picture", picture != null ? picture : "")
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}

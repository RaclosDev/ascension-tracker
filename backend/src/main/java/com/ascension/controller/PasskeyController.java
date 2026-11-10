package com.ascension.controller;

import com.ascension.security.SessionIssuer;
import com.ascension.security.TrustedOrigins;
import com.ascension.service.auth.PasskeyService;
import com.ascension.service.auth.PasskeyService.Ceremony;
import com.ascension.service.auth.PasskeyService.PasskeyView;
import com.ascension.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

/**
 * Passkeys: signing in with one (public, under /api/auth) and managing those of the account
 * (signed in, under /api/passkeys).
 */
@RestController
public class PasskeyController {

    public record LoginRequest(String requestId, JsonNode credential) {
    }

    public record RegisterRequest(String requestId, JsonNode credential, String name) {
    }

    private final PasskeyService passkeys;
    private final SessionIssuer sessions;
    private final TrustedOrigins trustedOrigins;
    private final ObjectMapper objectMapper;

    public PasskeyController(PasskeyService passkeys, SessionIssuer sessions, TrustedOrigins trustedOrigins,
                             ObjectMapper objectMapper) {
        this.passkeys = passkeys;
        this.sessions = sessions;
        this.trustedOrigins = trustedOrigins;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/api/auth/passkeys/login/options")
    public Map<String, Object> loginOptions() {
        return ceremony(passkeys.startLogin());
    }

    @PostMapping("/api/auth/passkeys/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest body, HttpServletRequest request) {
        if (!trustedOrigins.allows(request)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Origen no permitido.");
        }
        return passkeys.finishLogin(body.requestId(), json(body.credential()))
                .map(account -> sessions.open(account.email(), account.name(), account.picture(), request))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "No se ha podido entrar con la llave de acceso."));
    }

    @GetMapping("/api/passkeys")
    public List<PasskeyView> list(@AuthenticationPrincipal Jwt jwt) {
        return passkeys.list(SecurityUtils.extractEmail(jwt));
    }

    @PostMapping("/api/passkeys/options")
    public Map<String, Object> registrationOptions(@AuthenticationPrincipal Jwt jwt) {
        return ceremony(passkeys.startRegistration(SecurityUtils.extractEmail(jwt)));
    }

    @PostMapping("/api/passkeys")
    public ResponseEntity<PasskeyView> register(@AuthenticationPrincipal Jwt jwt, @RequestBody RegisterRequest body) {
        PasskeyView created = passkeys.finishRegistration(SecurityUtils.extractEmail(jwt), body.requestId(),
                json(body.credential()), body.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/api/passkeys/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return passkeys.delete(SecurityUtils.extractEmail(jwt), id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    private Map<String, Object> ceremony(Ceremony ceremony) {
        return Map.of("requestId", ceremony.requestId(), "options", objectMapper.readTree(ceremony.optionsJson()));
    }

    private String json(JsonNode credential) {
        return credential == null || credential.isNull() ? null : objectMapper.writeValueAsString(credential);
    }
}

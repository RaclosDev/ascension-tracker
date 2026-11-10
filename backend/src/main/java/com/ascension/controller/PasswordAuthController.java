package com.ascension.controller;

import com.ascension.security.SessionIssuer;
import com.ascension.security.TrustedOrigins;
import com.ascension.service.auth.AuthAccounts.Account;
import com.ascension.service.auth.PasswordAuthService;
import com.ascension.service.auth.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Sign-up, sign-in and password reset with email and password. */
@RestController
@RequestMapping("/api/auth/password")
public class PasswordAuthController {

    static final String CHECK_EMAIL = "Si el email es correcto, te hemos enviado un correo. Revisa también la carpeta de spam.";

    public record RegisterRequest(String email, String password) {
        @Override
        public String toString() {
            return "RegisterRequest[]";
        }
    }

    public record LoginRequest(String email, String password) {
        @Override
        public String toString() {
            return "LoginRequest[]";
        }
    }

    public record ResetRequest(String email) {
        @Override
        public String toString() {
            return "ResetRequest[]";
        }
    }

    public record NewPasswordRequest(String token, String password) {
        @Override
        public String toString() {
            return "NewPasswordRequest[]";
        }
    }

    private final PasswordAuthService passwords;
    private final PasswordResetService resets;
    private final SessionIssuer sessions;
    private final TrustedOrigins trustedOrigins;

    public PasswordAuthController(PasswordAuthService passwords, PasswordResetService resets,
                                  SessionIssuer sessions, TrustedOrigins trustedOrigins) {
        this.passwords = passwords;
        this.resets = resets;
        this.sessions = sessions;
        this.trustedOrigins = trustedOrigins;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest body, HttpServletRequest request) {
        requireTrustedOrigin(request);
        return open(passwords.register(body.email(), body.password()), request);
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest body, HttpServletRequest request) {
        requireTrustedOrigin(request);
        return open(passwords.login(body.email(), body.password()), request);
    }

    @PostMapping("/reset-request")
    public ResponseEntity<Map<String, String>> resetRequest(@RequestBody ResetRequest body) {
        resets.requestReset(body.email());
        return ResponseEntity.accepted().body(Map.of("message", CHECK_EMAIL));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> reset(@RequestBody NewPasswordRequest body, HttpServletRequest request) {
        requireTrustedOrigin(request);
        return open(resets.reset(body.token(), body.password()), request);
    }

    private ResponseEntity<Map<String, String>> open(Account account, HttpServletRequest request) {
        return sessions.open(account.email(), account.name(), account.picture(), request);
    }

    private void requireTrustedOrigin(HttpServletRequest request) {
        if (!trustedOrigins.allows(request)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Origen no permitido.");
        }
    }
}

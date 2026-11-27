package com.ascension.service.auth;

import com.ascension.service.auth.AuthAccounts.Account;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class IdentityConfirmationTest {

    static final String PASSWORD = "caballo-bateria-grapa";

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final PasswordAuthService passwords = mock(PasswordAuthService.class);
    private final GoogleIdTokenVerifier verifier = mock(GoogleIdTokenVerifier.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private IdentityConfirmation identity;

    @BeforeEach
    void setUp() {
        when(passwords.encoder()).thenReturn(encoder);
        identity = new IdentityConfirmation(passwords, verifier, jdbc);
    }

    @Test
    void anAccountWithAPasswordNeedsThatPassword() {
        Account account = account(encoder.encode(PASSWORD));

        assertThatCode(() -> identity.confirm(account, PASSWORD, null)).doesNotThrowAnyException();
        assertStatus(() -> identity.confirm(account, "otra-clave-distinta", null), HttpStatus.FORBIDDEN);
        assertStatus(() -> identity.confirm(account, null, null), HttpStatus.FORBIDDEN);
        assertStatus(() -> identity.confirm(account, "", null), HttpStatus.FORBIDDEN);
        assertStatus(() -> identity.confirm(account, "x".repeat(73), null), HttpStatus.FORBIDDEN);
        // A Google credential is not a substitute while the account has a password.
        assertStatus(() -> identity.confirm(account, null, "credential"), HttpStatus.FORBIDDEN);
    }

    @Test
    void tenFailuresLockTheAccountEvenForTheRightPassword() {
        Account account = account(encoder.encode(PASSWORD));
        for (int i = 0; i < IdentityConfirmation.MAX_FAILURES; i++) {
            assertStatus(() -> identity.confirm(account, "no-es-esta-clave", null), HttpStatus.FORBIDDEN);
        }
        assertStatus(() -> identity.confirm(account, PASSWORD, null), HttpStatus.TOO_MANY_REQUESTS);
        // Another account is not affected.
        assertThatCode(() -> identity.confirm(account(encoder.encode(PASSWORD)), PASSWORD, null)).doesNotThrowAnyException();
    }

    @Test
    void aGoogleOnlyAccountNeedsAFreshCredentialOfItsOwnIdentity() throws Exception {
        Account account = account(null);
        when(jdbc.queryForList(anyString(), eq(String.class), eq(account.id()))).thenReturn(List.of("sub-1"));

        GoogleIdToken t_good = token("sub-1", true, now());
        when(verifier.verify("good")).thenReturn(t_good);
        assertThatCode(() -> identity.confirm(account, null, "good")).doesNotThrowAnyException();

        GoogleIdToken t_other_person = token("sub-2", true, now());
        when(verifier.verify("other-person")).thenReturn(t_other_person);
        assertStatus(() -> identity.confirm(account, null, "other-person"), HttpStatus.FORBIDDEN);

        GoogleIdToken t_unverified = token("sub-1", false, now());
        when(verifier.verify("unverified")).thenReturn(t_unverified);
        assertStatus(() -> identity.confirm(account, null, "unverified"), HttpStatus.FORBIDDEN);

        GoogleIdToken t_old = token("sub-1", true, now() - 3600);
        when(verifier.verify("old")).thenReturn(t_old);
        assertStatus(() -> identity.confirm(account, null, "old"), HttpStatus.FORBIDDEN);

        when(verifier.verify("invalid")).thenReturn(null);
        assertStatus(() -> identity.confirm(account, null, "invalid"), HttpStatus.FORBIDDEN);

        assertStatus(() -> identity.confirm(account, null, null), HttpStatus.FORBIDDEN);
        assertStatus(() -> identity.confirm(account, PASSWORD, null), HttpStatus.FORBIDDEN);
    }

    @Test
    void anAccountWithoutPasswordNorGoogleIdentityCannotConfirm() throws Exception {
        Account account = account(null);
        when(jdbc.queryForList(anyString(), eq(String.class), eq(account.id()))).thenReturn(List.of());
        GoogleIdToken t_good = token("sub-1", true, now());
        when(verifier.verify("good")).thenReturn(t_good);

        assertStatus(() -> identity.confirm(account, null, "good"), HttpStatus.FORBIDDEN);
    }

    private static void assertStatus(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, HttpStatus expected) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(expected.value()));
    }

    private static Account account(String passwordHash) {
        return new Account(UUID.randomUUID(), "ana@example.com", "Ana", null, passwordHash);
    }

    private static long now() {
        return Instant.now().getEpochSecond();
    }

    private static GoogleIdToken token(String subject, boolean emailVerified, long issuedAt) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setSubject(subject);
        payload.setEmailVerified(emailVerified);
        payload.setIssuedAtTimeSeconds(issuedAt);
        GoogleIdToken token = mock(GoogleIdToken.class);
        when(token.getPayload()).thenReturn(payload);
        return token;
    }
}

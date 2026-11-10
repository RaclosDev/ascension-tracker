package com.ascension.service.auth;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthHelpersTest {

    /** A clock the test moves by hand. */
    static final class ManualClock extends Clock {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Test
    void passwordPolicyRejectsWeakPasswords() {
        assertThatCode(() -> PasswordPolicy.validate("caballo-bateria-grapa", "ana@example.com")).doesNotThrowAnyException();
        assertThatThrownBy(() -> PasswordPolicy.validate(null, "ana@example.com")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("corta", "ana@example.com")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("aaaaaaaaaa", "ana@example.com")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("password123", "ana@example.com")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("anamaria", "anamaria@example.com")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("ana@example.com", "ANA@example.com")).isInstanceOf(ResponseStatusException.class);
        // 72 bytes is the most BCrypt reads: longer passwords would be silently cut.
        assertThat(PasswordPolicy.tooLong("ñ".repeat(37))).isTrue();
        assertThat(PasswordPolicy.tooLong("ñ".repeat(36))).isFalse();
    }

    @Test
    void limiterCountsPerKeyWithinTheWindow() {
        ManualClock clock = new ManualClock();
        EmailKeyedLimiter limiter = new EmailKeyedLimiter(2, Duration.ofMinutes(1), clock);
        assertThat(limiter.tryRecord("a")).isTrue();
        assertThat(limiter.exhausted("a")).isFalse();
        limiter.record("a");
        assertThat(limiter.exhausted("a")).isTrue();
        assertThat(limiter.tryRecord("a")).isFalse();
        assertThat(limiter.tryRecord("b")).isTrue();

        clock.now = clock.now.plus(Duration.ofMinutes(1));
        assertThat(limiter.exhausted("a")).isFalse();
        limiter.record("a");
        assertThat(limiter.tryRecord("a")).isTrue();
        limiter.reset("a");
        assertThat(limiter.exhausted("a")).isFalse();
    }

    @Test
    void throttleAllowsOneEmailPerAddressAndMinute() {
        AccountEmailThrottle throttle = new AccountEmailThrottle();
        String email = UUID.randomUUID() + "@example.com";
        assertThat(throttle.tryAcquire(email)).isTrue();
        assertThat(throttle.tryAcquire(email)).isFalse();
    }

    @Test
    void hashesAndTokens() {
        assertThat(AuthHashes.sha256("x")).isEqualTo(AuthHashes.sha256("x")).hasSize(64);
        assertThat(AuthHashes.sameHash(AuthHashes.sha256("x"), AuthHashes.sha256("x"))).isTrue();
        assertThat(AuthHashes.sameHash(AuthHashes.sha256("x"), AuthHashes.sha256("y"))).isFalse();
        assertThat(AuthHashes.sameHash(null, "y")).isFalse();
        assertThat(AuthHashes.randomToken(32)).matches("[A-Za-z0-9_-]{43}");
        assertThat(AuthHashes.sixDigitCode()).matches("\\d{6}");
        assertThat(AuthHashes.randomBytes(16)).hasSize(16);
    }

    @Test
    void passkeyNamesAreCleaned() {
        assertThat(PasskeyService.cleanName(null)).isEqualTo("Llave de acceso");
        assertThat(PasskeyService.cleanName("  \u0007 ")).isEqualTo("Llave de acceso");
        assertThat(PasskeyService.cleanName(" Portátil\n")).isEqualTo("Portátil");
        assertThat(PasskeyService.cleanName("x".repeat(80))).hasSize(PasskeyService.MAX_NAME_LENGTH);
    }

    @Test
    void emailsEscapeHtmlAndCarryTheLink() {
        EmailSender.Email reset = AccountEmails.resetLink("ana@example.com", "https://a.test/r#token=<x>");
        assertThat(reset.to()).isEqualTo("ana@example.com");
        assertThat(reset.html()).contains("&lt;x&gt;").doesNotContain("<x>");
        assertThat(reset.toString()).doesNotContain("token");
        assertThat(AccountEmails.signUpCode("ana@example.com", "123456").text()).contains("123456");
        assertThat(AccountEmails.alreadyRegistered("ana@example.com", "https://a.test").text()).contains("https://a.test");
        assertThat(AccountEmails.signInWithGoogle("ana@example.com", "https://a.test").text()).contains("Google");
    }

    @Test
    @SuppressWarnings("unchecked")
    void resendSenderPostsJsonOnlyWhenConfigured() {
        HttpClient client = mock(HttpClient.class);
        ObjectMapper mapper = new ObjectMapper();
        EmailSender.Email email = new EmailSender.Email("ana@example.com", "Asunto", "texto", "<p>html</p>");

        ResendEmailSender disabled = new ResendEmailSender("  ", "Ascension <no-reply@a.test>", mapper, client);
        assertThat(disabled.enabled()).isFalse();
        disabled.send(email);
        verify(client, never()).sendAsync(any(), any());

        HttpResponse<String> rejected = mock(HttpResponse.class);
        when(rejected.statusCode()).thenReturn(422);
        when(client.sendAsync(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenReturn(CompletableFuture.completedFuture(rejected))
                .thenReturn(CompletableFuture.failedFuture(new java.io.IOException("down")));
        ResendEmailSender sender = new ResendEmailSender("re_test", "Ascension <no-reply@a.test>", mapper, client);
        assertThat(sender.enabled()).isTrue();
        assertThat(mapper.readTree(sender.body(email)).get("to").get(0).asString()).isEqualTo("ana@example.com");
        sender.send(email);
        sender.send(email);
        assertThat(email.toString()).contains("Asunto").doesNotContain("ana@example.com");
    }
}

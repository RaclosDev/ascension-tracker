package com.ascension.util;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PiiMaskerTest {

    @AfterEach
    void cleanupProperty() {
        System.clearProperty("APP_PII_SALT");
    }

    @Test
    void maskEmail_whenNullOrEmpty_returnsAnonymous() {
        assertThat(PiiMasker.maskEmail(null)).isEqualTo("[anonymous]");
        assertThat(PiiMasker.maskEmail("")).isEqualTo("[anonymous]");
        assertThat(PiiMasker.maskEmail("   ")).isEqualTo("[anonymous]");
    }

    @Test
    void maskEmail_producesMaskedPrefixAndHidesRawEmail() {
        String email = "athlete@example.com";
        String masked = PiiMasker.maskEmail(email);

        assertThat(masked).startsWith("usr_");
        assertThat(masked).doesNotContain("@");
        assertThat(masked).doesNotContain("athlete");
        assertThat(masked).doesNotContain("example");
        assertThat(masked).hasSize("usr_".length() + 16); // 16 hex chars (64 bits)
    }

    @Test
    void maskEmail_isDeterministicAndCaseInsensitive() {
        String emailLower = "athlete@example.com";
        String emailUpper = "ATHLETE@EXAMPLE.COM";
        String emailSpaced = "  athlete@example.com  ";

        String maskedLower = PiiMasker.maskEmail(emailLower);
        String maskedUpper = PiiMasker.maskEmail(emailUpper);
        String maskedSpaced = PiiMasker.maskEmail(emailSpaced);

        assertThat(maskedLower).isEqualTo(maskedUpper);
        assertThat(maskedLower).isEqualTo(maskedSpaced);
    }

    @Test
    void maskEmail_differentEmailsProduceDifferentPseudonyms() {
        String masked1 = PiiMasker.maskEmail("alice@example.com");
        String masked2 = PiiMasker.maskEmail("bob@example.com");

        assertThat(masked1).isNotEqualTo(masked2);
    }

    @Test
    void maskEmail_withCustomSaltProperty_changesPseudonym() {
        String email = "athlete@example.com";
        String defaultMasked = PiiMasker.maskEmail(email);

        System.setProperty("APP_PII_SALT", "super-secret-salt-for-testing-12345678");
        String customMasked = PiiMasker.maskEmail(email);

        assertThat(customMasked).startsWith("usr_");
        assertThat(customMasked).isNotEqualTo(defaultMasked);
    }

    @Test
    void maskSubject_hidesRawSubjectAndIsDeterministic() {
        String subject = "109876543210";
        String masked = PiiMasker.maskSubject(subject);

        assertThat(masked).startsWith("sub_");
        assertThat(masked).doesNotContain(subject);
        assertThat(masked).hasSize("sub_".length() + 16);
        assertThat(PiiMasker.maskSubject(" 109876543210 ")).isEqualTo(masked);
    }

    @Test
    void maskSubject_whenNullOrBlank_returnsAnonymous() {
        assertThat(PiiMasker.maskSubject(null)).isEqualTo("[anonymous]");
        assertThat(PiiMasker.maskSubject("  ")).isEqualTo("[anonymous]");
    }
}

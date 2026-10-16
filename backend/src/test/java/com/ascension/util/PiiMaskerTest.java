package com.ascension.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PiiMaskerTest {

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
        assertThat(masked).hasSize("usr_".length() + 16); // 16 hex chars (64 bits) prefix
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
}

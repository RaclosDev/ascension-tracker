package com.ascension.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.ascension.exception.EntityNotFoundException;
import org.junit.jupiter.api.Test;

class EmailsTest {

    @Test
    void normalizeTrimsAndLowerCases() {
        assertThat(Emails.normalize("  Ana.Lopez@Example.COM ")).isEqualTo("ana.lopez@example.com");
    }

    @Test
    void normalizeIgnoresTheDefaultLocale() {
        java.util.Locale previous = java.util.Locale.getDefault();
        try {
            java.util.Locale.setDefault(java.util.Locale.forLanguageTag("tr"));
            assertThat(Emails.normalize("IGNACIO@MAIL.COM")).isEqualTo("ignacio@mail.com");
        } finally {
            java.util.Locale.setDefault(previous);
        }
    }

    @Test
    void normalizeKeepsNull() {
        assertThat(Emails.normalize(null)).isNull();
    }

    @Test
    void normalizeRequiredRejectsMissingEmail() {
        assertThatThrownBy(() -> Emails.normalizeRequired(null)).isInstanceOf(EntityNotFoundException.class);
        assertThatThrownBy(() -> Emails.normalizeRequired("  ")).isInstanceOf(EntityNotFoundException.class);
        assertThat(Emails.normalizeRequired(" A@B.C ")).isEqualTo("a@b.c");
    }
}

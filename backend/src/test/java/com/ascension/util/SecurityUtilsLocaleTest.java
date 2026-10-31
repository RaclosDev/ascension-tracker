package com.ascension.util;

import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import static org.assertj.core.api.Assertions.assertThat;

class SecurityUtilsLocaleTest {
    @Test
    void accountIdentityDoesNotDependOnServerLocale() {
        Locale original = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            Jwt jwt = Jwt.withTokenValue("test").header("alg", "HS256")
                    .subject(" IVAN@example.com ").build();
            assertThat(SecurityUtils.extractEmail(jwt)).isEqualTo("ivan@example.com");
            assertThat(PiiMasker.maskEmail("IVAN@example.com"))
                    .isEqualTo(PiiMasker.maskEmail("ivan@example.com"));
        } finally {
            Locale.setDefault(original);
        }
    }
}

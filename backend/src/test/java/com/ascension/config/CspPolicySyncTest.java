package com.ascension.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class CspPolicySyncTest {

    private Path resolveFile(String relativeFromRoot) {
        Path p1 = Path.of("..", relativeFromRoot);
        if (Files.exists(p1)) {
            return p1;
        }
        Path p2 = Path.of(relativeFromRoot);
        if (Files.exists(p2)) {
            return p2;
        }
        throw new IllegalStateException("Could not resolve path: " + relativeFromRoot);
    }

    @Test
    @DisplayName("SecurityConfig.CSP_POLICY must not contain wildcard origins or open https: for images")
    void securityConfigCsp_mustNotContainWildcards() {
        String csp = SecurityConfig.CSP_POLICY;

        assertThat(csp).doesNotContain("*.herokuapp.com");
        assertThat(csp).doesNotContain("*.raclos.es");
        assertThat(csp).doesNotContain("img-src 'self' data: blob: https:;");

        assertThat(csp).contains("img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.openfoodfacts.org;");
        assertThat(csp).contains("connect-src 'self' https://ascension-backend-7dd8e6190a75.herokuapp.com https://ascension.raclos.es https://accounts.google.com;");
    }

    @Test
    @DisplayName("frontend/security-headers.conf must match SecurityConfig.CSP_POLICY exactly")
    void nginxSecurityHeadersConf_mustMatchSecurityConfig() throws IOException {
        Path nginxPath = resolveFile("frontend/security-headers.conf");
        String content = Files.readString(nginxPath);

        Pattern pattern = Pattern.compile("add_header\\s+Content-Security-Policy\\s+\"([^\"]+)\"\\s+always;");
        Matcher matcher = pattern.matcher(content);

        assertThat(matcher.find()).isTrue();
        String nginxCsp = matcher.group(1);

        assertThat(nginxCsp).isEqualTo(SecurityConfig.CSP_POLICY);
    }

    @Test
    @DisplayName("frontend/vercel.json must match SecurityConfig.CSP_POLICY exactly")
    void vercelJson_mustMatchSecurityConfig() throws IOException {
        Path vercelPath = resolveFile("frontend/vercel.json");
        String content = Files.readString(vercelPath);

        Pattern pattern = Pattern.compile("\"key\":\\s*\"Content-Security-Policy\",\\s*\"value\":\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(content);

        assertThat(matcher.find()).isTrue();
        String vercelCsp = matcher.group(1);

        assertThat(vercelCsp).isEqualTo(SecurityConfig.CSP_POLICY);
    }
}

package com.ascension.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;

class PushConfigTest {
    @Test void absentKeysDisablePush() {
        assertThat(new PushConfig().pushService()).isNull();
    }

    @Test void partiallyConfiguredKeysFailStartup() {
        var config = new PushConfig();
        ReflectionTestUtils.setField(config, "vapidPublicKey", "configured");
        assertThatThrownBy(config::pushService).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Both VAPID keys");
    }

    @Test void invalidKeysFailStartupInsteadOfPretendingPushIsEnabled() {
        var config = new PushConfig();
        ReflectionTestUtils.setField(config, "vapidPublicKey", "invalid");
        ReflectionTestUtils.setField(config, "vapidPrivateKey", "invalid");
        assertThatThrownBy(config::pushService).isInstanceOf(IllegalStateException.class)
                .hasMessage("Invalid VAPID configuration");
    }
}

package com.ascension.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import static org.assertj.core.api.Assertions.assertThat;

class RateLimitStoreConfigurationTest {
    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(RateLimitProperties.class)
    static class Binding { }

    @Test
    void unsupportedStoreFailsStartupInsteadOfSilentlyUsingMemory() {
        new ApplicationContextRunner().withUserConfiguration(Binding.class)
                .withPropertyValues("app.rate-limit.store=postgre")
                .run(context -> assertThat(context).hasFailed());
    }
}

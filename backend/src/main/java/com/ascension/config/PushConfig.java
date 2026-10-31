package com.ascension.config;

import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.security.Security;

@Configuration
public class PushConfig {

    @Value("${app.push.vapid-public-key:}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key:}")
    private String vapidPrivateKey;

    @Value("${app.push.vapid-subject:mailto:admin@example.com}")
    private String vapidSubject;

    @Bean(name = "pushNotificationExecutor")
    public ThreadPoolTaskExecutor pushNotificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("push-worker-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }

    @Bean
    @ConditionalOnMissingBean
    public PushService pushService() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        boolean publicConfigured = configured(vapidPublicKey);
        boolean privateConfigured = configured(vapidPrivateKey);
        if (!publicConfigured && !privateConfigured) return null;
        if (!publicConfigured || !privateConfigured) {
            throw new IllegalStateException("Both VAPID keys must be configured to enable push notifications");
        }
        try {
            return new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid VAPID configuration", exception);
        }
    }

    private static boolean configured(String value) {
        return value != null && !value.isBlank() && !"CHANGE_ME".equals(value);
    }
}

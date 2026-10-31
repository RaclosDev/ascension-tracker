package com.ascension.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@org.springframework.validation.annotation.Validated
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {
    @jakarta.validation.constraints.NotNull
    @jakarta.validation.constraints.Pattern(regexp = "postgres|memory")
    private String store = "postgres";
    private int loginLimit = 20;
    private int refreshLimit = 30;
    private int logoutLimit = 30;
    private int importLimit = 5;
    private int restoreLimit = 5;
    private int exportLimit = 10;
    private int userWriteLimit = 60;
    private int userLimit = 10;
    private int aiLimit = 20;
    private int foodExternalLimit = 20;
    private int pushLimit = 20;
    private int maxRequestsPerMinute = 20;
}

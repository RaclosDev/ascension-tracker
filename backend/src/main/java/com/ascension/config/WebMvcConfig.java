package com.ascension.config;

import com.ascension.interceptor.ConsentInterceptor;
import com.ascension.interceptor.RateLimitInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;
    private final ConsentInterceptor consentInterceptor;

    public WebMvcConfig(RateLimitInterceptor rateLimitInterceptor, ConsentInterceptor consentInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
        this.consentInterceptor = consentInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**");
        registry.addInterceptor(consentInterceptor)
                .addPathPatterns("/api/weights/**", "/api/progress-photos/**", "/api/nutrition/logs/**",
                        "/api/nutrition/ai/**", "/api/user/restore", "/api/coaching/coaches/*/checkin");
    }
}

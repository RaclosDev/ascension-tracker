package com.ascension.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Kept off the application class so test slices such as {@code @WebMvcTest}, which since Spring
 * Boot 4 no longer auto-configure a cache manager, do not need one.
 */
@Configuration(proxyBeanMethods = false)
@EnableCaching
public class CacheConfig {
}

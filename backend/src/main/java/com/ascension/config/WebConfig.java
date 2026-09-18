package com.ascension.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        var mapping = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .exposedHeaders("Content-Type", "Authorization");

        if (origins.length == 1 && "*".equals(origins[0].trim())) {
            // Wildcard: allow all origins (no credentials with wildcard)
            mapping.allowedOriginPatterns("*");
        } else {
            // Specific origins: allow credentials
            mapping.allowedOrigins(origins)
                   .allowCredentials(true);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        // No interceptar llamadas a endpoints de API ni archivos estáticos inexistentes
                        if (resourcePath.startsWith("api") || resourcePath.contains(".")) {
                            return null;
                        }
                        Resource indexResource = location.createRelative("index.html");
                        return (indexResource.exists() && indexResource.isReadable())
                                ? indexResource
                                : new ClassPathResource("/static/index.html");
                    }
                });
    }
}


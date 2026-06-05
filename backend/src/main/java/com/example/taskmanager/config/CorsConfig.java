package com.example.taskmanager.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Development CORS config for the local frontend/backend setup.
 *
 * This allows the Next.js app on http://localhost:3000 to call API endpoints
 * served by Spring Boot on localhost:8080. Browsers enforce same-origin policy,
 * so this configuration is necessary during development.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Limit CORS to API routes only.
                .allowedOrigins("http://localhost:3000")
                // Allow the methods used by the SPA.
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // Accept common JSON request headers from the browser.
                .allowedHeaders("Content-Type", "Accept")
                // Allow credentials if the frontend needs cookies or auth headers.
                .allowCredentials(true)
                // Cache preflight responses for one hour.
                .maxAge(3600);
    }
}







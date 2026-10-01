package com.example.taskmanager.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS config for the frontend/backend setup.
 *
 * Allows the Next.js app on http://localhost:3000 (development) and the public
 * frontend URL plus its www. variant (production) to call the API. Browsers
 * enforce same-origin policy, so this configuration is necessary.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String frontendUrl;

    public CorsConfig(@Value("${app.frontend-url}") String frontendUrl) {
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String wwwVariant = frontendUrl.replaceFirst("^(https?://)(?!www\\.)", "$1www.");
        registry.addMapping("/api/**")
                // Limit CORS to API routes only.
                .allowedOrigins("http://localhost:3000", frontendUrl, wwwVariant)
                // Allow the methods used by the SPA.
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // Accept common JSON request headers from the browser.
                .allowedHeaders("Content-Type", "Accept", "Authorization")
                // Allow credentials if the frontend needs cookies or auth headers.
                .allowCredentials(true)
                // Cache preflight responses for one hour.
                .maxAge(3600);
    }
}







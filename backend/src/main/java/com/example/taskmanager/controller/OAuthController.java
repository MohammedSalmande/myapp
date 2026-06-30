package com.example.taskmanager.controller;

import com.example.taskmanager.security.JwtTokenProvider;
import com.example.taskmanager.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/oauth")
public class OAuthController {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    @Value("${oauth.google.client-id:}")
    private String googleClientId;

    @Value("${oauth.google.redirect-uri:http://localhost:8080/oauth/google/callback}")
    private String googleRedirectUri;

    public OAuthController(UserService userService, JwtTokenProvider tokenProvider) {
        this.userService = userService;
        this.tokenProvider = tokenProvider;
    }

    @GetMapping("/google")
    public void redirectToGoogle(HttpServletResponse response) throws IOException {
        if (googleClientId == null || googleClientId.isBlank()) {
            response.sendError(HttpStatus.SERVICE_UNAVAILABLE.value(), "Google OAuth is not configured");
            return;
        }

        String authorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + String.join("&",
                "client_id=" + URLEncoder.encode(googleClientId, StandardCharsets.UTF_8),
                "redirect_uri=" + URLEncoder.encode(googleRedirectUri, StandardCharsets.UTF_8),
                "response_type=code",
                "scope=" + URLEncoder.encode("openid email profile", StandardCharsets.UTF_8),
                "access_type=online",
                "prompt=select_account"
        );

        response.sendRedirect(authorizationUrl);
    }

    @GetMapping("/google/callback")
    public ResponseEntity<Map<String, Object>> googleCallback(@RequestParam(value = "code", required = false) String code) {
        if (code == null || code.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Missing authorization code"));
        }

        String username = "google-user-" + System.currentTimeMillis() + "@example.com";
        var user = userService.registerOAuthUser(username);
        String token = tokenProvider.createToken(user.getUsername());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "expiresIn", tokenProvider.getExpirationMs(),
                "message", "Google OAuth registration completed"
        ));
    }
}

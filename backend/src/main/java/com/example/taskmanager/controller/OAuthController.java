package com.example.taskmanager.controller;

import com.example.taskmanager.security.GoogleOAuthClient;
import com.example.taskmanager.security.JwtTokenProvider;
import com.example.taskmanager.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@RestController
@RequestMapping("/oauth")
public class OAuthController {

    private static final Logger log = LoggerFactory.getLogger(OAuthController.class);
    private static final String STATE_COOKIE = "oauth_state";
    private static final String STATE_COOKIE_PATH = "/oauth/google";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final GoogleOAuthClient googleClient;
    private final String frontendUrl;

    public OAuthController(UserService userService,
                           JwtTokenProvider tokenProvider,
                           GoogleOAuthClient googleClient,
                           @Value("${app.frontend-url}") String frontendUrl) {
        this.userService = userService;
        this.tokenProvider = tokenProvider;
        this.googleClient = googleClient;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping("/google")
    public void redirectToGoogle(HttpServletResponse response) throws IOException {
        if (!googleClient.isConfigured()) {
            response.sendError(HttpStatus.SERVICE_UNAVAILABLE.value(), "Google OAuth is not configured");
            return;
        }

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String state = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        setStateCookie(response, state, Duration.ofMinutes(10));
        response.sendRedirect(googleClient.authorizationUrl(state));
    }

    /**
     * Google redirects here after consent. On success the browser is sent back to the
     * frontend with the JWT in the URL fragment (fragments never reach server logs).
     */
    @GetMapping("/google/callback")
    public void googleCallback(@RequestParam(value = "code", required = false) String code,
                               @RequestParam(value = "state", required = false) String state,
                               @RequestParam(value = "error", required = false) String error,
                               @CookieValue(value = STATE_COOKIE, required = false) String expectedState,
                               HttpServletResponse response) throws IOException {
        setStateCookie(response, "", Duration.ZERO);

        if (error != null) {
            redirectToFrontend(response, "oauth_error=google_denied");
            return;
        }
        if (code == null || code.isBlank() || !stateMatches(state, expectedState)) {
            redirectToFrontend(response, "oauth_error=invalid_request");
            return;
        }

        try {
            String email = googleClient.fetchVerifiedEmail(code);
            var user = userService.registerOAuthUser(email);
            String token = tokenProvider.createToken(user.getUsername());
            redirectToFrontend(response, "oauth_token=" + encode(token) + "&oauth_user=" + encode(user.getUsername()));
        } catch (IllegalStateException ex) {
            log.warn("Google login refused: {}", ex.getMessage());
            redirectToFrontend(response, "oauth_error=account_conflict");
        } catch (Exception ex) {
            log.error("Google login failed", ex);
            redirectToFrontend(response, "oauth_error=google_failed");
        }
    }

    private boolean stateMatches(String state, String expectedState) {
        if (state == null || expectedState == null || expectedState.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                state.getBytes(StandardCharsets.UTF_8),
                expectedState.getBytes(StandardCharsets.UTF_8));
    }

    private void setStateCookie(HttpServletResponse response, String value, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(STATE_COOKIE, value)
                .httpOnly(true)
                .secure(googleClient.usesHttps())
                .sameSite("Lax")
                .path(STATE_COOKIE_PATH)
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void redirectToFrontend(HttpServletResponse response, String fragment) throws IOException {
        response.sendRedirect(frontendUrl + "/#" + fragment);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

package com.example.taskmanager.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Minimal Google OpenID Connect client for the authorization-code flow:
 * builds the consent URL, exchanges the returned code for an access token,
 * and reads the user's verified email from Google's userinfo endpoint.
 */
@Component
public class GoogleOAuthClient {

    private static final String AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final RestClient restClient = RestClient.create();

    public GoogleOAuthClient(@Value("${oauth.google.client-id:}") String clientId,
                             @Value("${oauth.google.client-secret:}") String clientSecret,
                             @Value("${oauth.google.redirect-uri}") String redirectUri) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    public boolean usesHttps() {
        return redirectUri.startsWith("https://");
    }

    public String authorizationUrl(String state) {
        return AUTHORIZATION_ENDPOINT + "?" + String.join("&",
                "client_id=" + encode(clientId),
                "redirect_uri=" + encode(redirectUri),
                "response_type=code",
                "scope=" + encode("openid email"),
                "state=" + encode(state),
                "access_type=online",
                "prompt=select_account"
        );
    }

    /**
     * Exchanges the authorization code and returns the account's email, lower-cased.
     * Throws if Google rejects the code or the email is not verified.
     */
    public String fetchVerifiedEmail(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        Map<?, ?> tokenResponse = restClient.post()
                .uri(TOKEN_ENDPOINT)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);
        Object accessToken = tokenResponse == null ? null : tokenResponse.get("access_token");
        if (!(accessToken instanceof String token) || token.isBlank()) {
            throw new IllegalStateException("Google token response did not include an access token");
        }

        Map<?, ?> userInfo = restClient.get()
                .uri(USERINFO_ENDPOINT)
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(Map.class);
        if (userInfo == null
                || !Boolean.TRUE.equals(userInfo.get("email_verified"))
                || !(userInfo.get("email") instanceof String email)
                || email.isBlank()) {
            throw new IllegalStateException("Google account has no verified email");
        }
        return email.trim().toLowerCase();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

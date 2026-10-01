package com.example.taskmanager.service;

import com.example.taskmanager.dto.RegisterRequest;
import com.example.taskmanager.model.User;
import com.example.taskmanager.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Returns the OAuth-only user for this verified email, creating it on first login.
     * Refuses to hand out a password account with the same name, so nobody can pre-register
     * someone else's email and later share that person's Google login.
     */
    public User registerOAuthUser(String username) {
        var existing = userRepository.findByUsername(username);
        if (existing.isPresent()) {
            if (!existing.get().isOauthOnly()) {
                throw new IllegalStateException("A password account already uses this username");
            }
            return existing.get();
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(null);
        user.setOauthOnly(true);
        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // OAuth-only users have no password; Spring's User rejects null, so give them a value
        // that is not a BCrypt hash and therefore can never match a password login.
        String password = user.getPassword() != null ? user.getPassword() : "oauth-only-" + UUID.randomUUID();

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                password,
                Collections.emptyList()
        );
    }
}

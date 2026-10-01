package com.example.taskmanager.service;

import com.example.taskmanager.model.User;
import com.example.taskmanager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void registerOAuthUserCreatesUserWithNullPasswordAndOauthOnlyFlag() {
        when(userRepository.findByUsername("alice@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = userService.registerOAuthUser("alice@example.com");

        assertNotNull(user);
        assertEquals("alice@example.com", user.getUsername());
        assertNull(user.getPassword());
        assertTrue(user.isOauthOnly());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("alice@example.com", userCaptor.getValue().getUsername());
    }

    @Test
    void registerOAuthUserReturnsExistingOauthUser() {
        User existing = new User();
        existing.setUsername("alice@example.com");
        existing.setOauthOnly(true);
        when(userRepository.findByUsername("alice@example.com")).thenReturn(Optional.of(existing));

        assertSame(existing, userService.registerOAuthUser("alice@example.com"));
    }

    @Test
    void registerOAuthUserRefusesPasswordAccountWithSameUsername() {
        User passwordUser = new User();
        passwordUser.setUsername("alice@example.com");
        passwordUser.setPassword("$2a$10$hash");
        when(userRepository.findByUsername("alice@example.com")).thenReturn(Optional.of(passwordUser));

        assertThrows(IllegalStateException.class, () -> userService.registerOAuthUser("alice@example.com"));
    }
}

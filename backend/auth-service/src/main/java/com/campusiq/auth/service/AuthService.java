package com.campusiq.auth.service;

import com.campusiq.auth.dto.request.LoginRequest;
import com.campusiq.auth.dto.request.RegisterRequest;
import com.campusiq.auth.dto.response.AuthResponse;
import com.campusiq.auth.entity.User;
import com.campusiq.auth.repository.UserRepository;
import com.campusiq.common.enums.Role;
import com.campusiq.common.exception.BadRequestException;
import com.campusiq.common.exception.ResourceConflictException;
import com.campusiq.common.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new ResourceConflictException("Email already in use");
        if (userRepository.existsByUsername(req.getUsername()))
            throw new ResourceConflictException("Username already taken");

        User user = User.builder()
                .username(req.getUsername())
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole() != null ? req.getRole() : Role.STUDENT)
                .phoneNumber(req.getPhoneNumber())
                .department(req.getDepartment())
                .enrollmentNumber(req.getEnrollmentNumber())
                .active(true)
                .twoFactorEnabled(false)
                .build();
        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCaseOrEnrollmentNumberIgnoreCase(req.getUsername(), req.getUsername(), req.getUsername())
                .or(() -> userRepository.findByUsername(req.getUsername()))
                .or(() -> userRepository.findByEmail(req.getUsername()))
                .orElseThrow(() -> new BadRequestException("User not found"));

        log.info("Login successful: {} ({})", user.getUsername(), user.getRole());
        return buildAuthResponse(user);
    }

    public AuthResponse buildAuthResponse(User user) {
        String token = tokenProvider.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        String refresh = tokenProvider.generateRefreshToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(refresh)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .twoFactorEnabled(user.isTwoFactorEnabled())
                .twoFactorRequired(false)
                .build();
    }
}

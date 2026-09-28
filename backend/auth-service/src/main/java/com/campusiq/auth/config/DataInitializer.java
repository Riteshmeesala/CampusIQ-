package com.campusiq.auth.config;

import com.campusiq.auth.entity.User;
import com.campusiq.auth.repository.UserRepository;
import com.campusiq.common.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking default stakeholder accounts in Auth database...");

        // 1. System Admin
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .name("System Admin")
                    .email("admin@campusiq.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .phoneNumber("9000000001")
                    .department("Administration")
                    .active(true)
                    .build());
            log.info("Initialized default Admin account: admin / Admin@123");
        }

        // 2. Faculty
        if (!userRepository.existsByUsername("faculty_raj")) {
            userRepository.save(User.builder()
                    .username("faculty_raj")
                    .name("Dr. Rajesh Sharma")
                    .email("rajesh.sharma@campusiq.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.FACULTY)
                    .phoneNumber("9000000012")
                    .department("Computer Science")
                    .active(true)
                    .build());
            log.info("Initialized default Faculty account: faculty_raj / Admin@123");
        }

        // 3. Student
        if (!userRepository.existsByUsername("24CS001")) {
            userRepository.save(User.builder()
                    .username("24CS001")
                    .name("Aarav Varma")
                    .email("aarav.varma@campusiq.edu")
                    .password(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT)
                    .phoneNumber("9000000013")
                    .department("Computer Science")
                    .enrollmentNumber("24CS001")
                    .semester(5)
                    .section("Section A")
                    .active(true)
                    .build());
            log.info("Initialized default Student account: 24CS001 / Student@123");
        }

        log.info("Stakeholder verification completed.");
    }
}

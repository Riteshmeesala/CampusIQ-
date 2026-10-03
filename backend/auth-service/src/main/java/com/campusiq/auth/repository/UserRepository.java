package com.campusiq.auth.repository;

import com.campusiq.auth.entity.User;
import com.campusiq.common.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEnrollmentNumber(String enrollmentNumber);
    boolean existsByEnrollmentNumberIgnoreCase(String enrollmentNumber);
    Optional<User> findByEnrollmentNumberIgnoreCase(String enrollmentNumber);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    Optional<User> findByUsernameOrEmail(String username, String email);
    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCaseOrEnrollmentNumberIgnoreCase(String username, String email, String enrollmentNumber);
}

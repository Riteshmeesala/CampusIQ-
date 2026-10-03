package com.campusiq.auth.repository;

import com.campusiq.auth.entity.StudentRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRegistrationRepository extends JpaRepository<StudentRegistration, Long> {

    List<StudentRegistration> findAllByOrderByCreatedAtDesc();

    List<StudentRegistration> findByStatusOrderByCreatedAtDesc(String status);

    Optional<StudentRegistration> findByEnrollmentNumber(String enrollmentNumber);

    Optional<StudentRegistration> findByEmail(String email);

    Optional<StudentRegistration> findByEnrollmentNumberIgnoreCase(String enrollmentNumber);

    Optional<StudentRegistration> findByEmailIgnoreCase(String email);

    Optional<StudentRegistration> findByUsernameIgnoreCase(String username);

    boolean existsByEnrollmentNumber(String enrollmentNumber);

    boolean existsByEnrollmentNumberIgnoreCase(String enrollmentNumber);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    long countByStatus(String status);
}

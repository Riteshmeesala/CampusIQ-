package com.campusiq.auth.controller;

import com.campusiq.auth.entity.StudentRegistration;
import com.campusiq.auth.entity.User;
import com.campusiq.auth.repository.StudentRegistrationRepository;
import com.campusiq.auth.repository.UserRepository;
import com.campusiq.auth.service.OtpService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/registrations")
public class StudentRegistrationController {

    private static final Logger log = LoggerFactory.getLogger(StudentRegistrationController.class);

    private final StudentRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    public StudentRegistrationController(StudentRegistrationRepository registrationRepository,
                                         UserRepository userRepository,
                                         PasswordEncoder passwordEncoder,
                                         OtpService otpService) {
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
    }

    /**
     * Stage 1: Student Registration Initiation
     * Validates identity, official @vvitu.net email, normalizes roll number,
     * checks duplicate accounts, generates OTP and dispatches it to official email.
     * Does NOT activate or create User account in `users` table yet.
     */
    @PostMapping("/initiate")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> initiateRegistration(@RequestBody Map<String, Object> payload) {
        try {
            String name             = (String) payload.getOrDefault("name", "");
            String enrollmentNumber = (String) payload.getOrDefault("enrollmentNumber", "");
            String email            = (String) payload.getOrDefault("email", "");
            String phoneNumber      = (String) payload.getOrDefault("phoneNumber", "");
            String department       = (String) payload.getOrDefault("department", "Computer Science");
            String course           = (String) payload.getOrDefault("course", "B.Tech Computer Science");
            String year             = (String) payload.getOrDefault("year", "1st Year");
            String semester         = (String) payload.getOrDefault("semester", "1-1");
            String section          = (String) payload.getOrDefault("section", "Section A");
            String batchYear        = (String) payload.getOrDefault("batchYear", "");
            String rawPassword      = (String) payload.getOrDefault("password", "");

            // 1. Mandatory Presence Validations
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Student Name is required."));
            }
            if (enrollmentNumber == null || enrollmentNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Enrollment / Roll Number is required."));
            }
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Official College Email Address is required."));
            }
            if (rawPassword == null || rawPassword.trim().length() < 6) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 6 characters long."));
            }

            // 2. Normalization
            enrollmentNumber = enrollmentNumber.trim().toUpperCase();
            email = email.trim().toLowerCase();
            name = name.trim();
            String username = enrollmentNumber; // Rule: username = enrollmentNumber.toUpperCase()

            // 3. Official Email Domain Validation (@vvit.net)
            if (!email.endsWith("@vvit.net") && !email.endsWith("@vvitu.net")) {
                return ResponseEntity.badRequest().body(ApiResponse.error(
                        "Registration requires an official college email ending with @vvit.net. Personal emails (Gmail, Yahoo, etc.) are strictly rejected."
                ));
            }

            // 4. Application-Level Duplicate Checks in Active Users Table
            if (userRepository.existsByEnrollmentNumberIgnoreCase(enrollmentNumber)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                        "A student account with Roll Number '" + enrollmentNumber + "' is already registered and active in the system. Please proceed to login."
                ));
            }
            if (userRepository.existsByEmailIgnoreCase(email)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                        "A user account with official email '" + email + "' already exists in the system. Please proceed to login."
                ));
            }
            if (userRepository.existsByUsernameIgnoreCase(username)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                        "Username '" + username + "' is already registered. Please proceed to login."
                ));
            }

            // 5. Check in student_registrations table (by enrollment number or email)
            Optional<StudentRegistration> existingRegOpt = registrationRepository.findByEnrollmentNumberIgnoreCase(enrollmentNumber);
            if (existingRegOpt.isEmpty()) {
                existingRegOpt = registrationRepository.findByEmailIgnoreCase(email);
            }

            StudentRegistration reg;
            String encodedPassword = passwordEncoder.encode(rawPassword);

            String dateOfBirth      = (String) payload.getOrDefault("dateOfBirth", "");
            String gender           = (String) payload.getOrDefault("gender", "");
            String address          = (String) payload.getOrDefault("address", "");
            String emergencyContact = (String) payload.getOrDefault("emergencyContact", "");
            String guardianName     = (String) payload.getOrDefault("guardianName", "");
            String guardianPhone    = (String) payload.getOrDefault("guardianPhone", "");
            String guardianEmail    = (String) payload.getOrDefault("guardianEmail", "");
            String guardianRelation = (String) payload.getOrDefault("guardianRelation", "");
            String admissionQuota   = (String) payload.getOrDefault("admissionQuota", "Convenor Quota");

            String otp = otpService.generateRegistrationOtp();
            LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(otpService.getOtpExpiryMinutes());

            if (existingRegOpt.isPresent()) {
                reg = existingRegOpt.get();
                // If already registered and user was created
                if ("REGISTERED".equalsIgnoreCase(reg.getStatus()) || "APPROVED".equalsIgnoreCase(reg.getStatus())) {
                    if (userRepository.existsByEnrollmentNumberIgnoreCase(enrollmentNumber) || userRepository.existsByEmailIgnoreCase(email)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                                "Student registration for Roll Number '" + enrollmentNumber + "' or email '" + email + "' has already been completed. Please log in."
                        ));
                    }
                }

                // If pending verification, check cooldown (minimum 15 seconds)
                if (reg.getLastResendAt() != null && reg.getLastResendAt().isAfter(LocalDateTime.now().minusSeconds(15))) {
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(
                            "Please wait 15 seconds before requesting another OTP."
                    ));
                }

                // Update registration record with refreshed details & new OTP
                reg.setName(name);
                reg.setEnrollmentNumber(enrollmentNumber);
                reg.setEmail(email);
                reg.setPhoneNumber(phoneNumber != null ? phoneNumber.trim() : null);
                reg.setDepartment(department);
                reg.setCourse(course);
                reg.setYear(year);
                reg.setSemester(semester);
                reg.setSection(section);
                reg.setBatchYear(batchYear);
                reg.setUsername(username);
                reg.setPassword(encodedPassword);
                reg.setDateOfBirth(dateOfBirth);
                reg.setGender(gender);
                reg.setAddress(address);
                reg.setEmergencyContact(emergencyContact);
                reg.setGuardianName(guardianName);
                reg.setGuardianPhone(guardianPhone);
                reg.setGuardianEmail(guardianEmail);
                reg.setGuardianRelation(guardianRelation);
                reg.setAdmissionQuota(admissionQuota);
                reg.setOtpCode(otp);
                reg.setOtpExpiry(otpExpiry);
                reg.setOtpAttempts(0);
                reg.setResendCount((reg.getResendCount() != null ? reg.getResendCount() : 0) + 1);
                reg.setLastResendAt(LocalDateTime.now());
                reg.setStatus("PENDING_VERIFICATION");
            } else {
                // Create new pending registration
                reg = StudentRegistration.builder()
                        .name(name)
                        .enrollmentNumber(enrollmentNumber)
                        .email(email)
                        .phoneNumber(phoneNumber != null ? phoneNumber.trim() : null)
                        .department(department)
                        .course(course)
                        .year(year)
                        .semester(semester)
                        .section(section)
                        .batchYear(batchYear)
                        .username(username)
                        .password(encodedPassword)
                        .dateOfBirth(dateOfBirth)
                        .gender(gender)
                        .address(address)
                        .emergencyContact(emergencyContact)
                        .guardianName(guardianName)
                        .guardianPhone(guardianPhone)
                        .guardianEmail(guardianEmail)
                        .guardianRelation(guardianRelation)
                        .admissionQuota(admissionQuota)
                        .otpCode(otp)
                        .otpExpiry(otpExpiry)
                        .otpAttempts(0)
                        .resendCount(0)
                        .lastResendAt(LocalDateTime.now())
                        .status("PENDING_VERIFICATION")
                        .build();
            }

            StudentRegistration savedReg = registrationRepository.save(reg);

            // Send OTP to official email
            boolean emailSent = otpService.sendRegistrationOtpEmail(email, name, otp);

            Map<String, Object> resp = new HashMap<>();
            resp.put("registrationId", savedReg.getId());
            resp.put("enrollmentNumber", savedReg.getEnrollmentNumber());
            resp.put("email", savedReg.getEmail());
            resp.put("username", savedReg.getUsername());
            resp.put("name", savedReg.getName());
            resp.put("department", savedReg.getDepartment());
            resp.put("semester", savedReg.getSemester());
            resp.put("section", savedReg.getSection());
            resp.put("expiresInMinutes", otpService.getOtpExpiryMinutes());
            resp.put("status", "OTP_SENT");
            resp.put("emailSent", emailSent);
            resp.put("otpCode", otp);

            String userMsg = emailSent
                    ? "OTP has been dispatched to your official college email (" + email + "). Please verify OTP to complete registration."
                    : "OTP verification code generated (" + otp + "). Enter code below to complete registration.";

            return ResponseEntity.ok(ApiResponse.success(resp, userMsg));

        } catch (DataIntegrityViolationException ex) {
            log.warn("Concurrent duplicate registration attempt: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                    "Student with this Roll Number or Email is already registered in the system."
            ));
        } catch (Exception ex) {
            log.error("Error during registration initiation: ", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(
                    "Failed to process registration initiation. Please verify details and try again."
            ));
        }
    }

    /**
     * Resend OTP for Pending Registration
     */
    @PostMapping("/resend-otp")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendOtp(@RequestBody Map<String, String> payload) {
        String enrollmentNumber = payload.getOrDefault("enrollmentNumber", "");
        String email = payload.getOrDefault("email", "");

        if (enrollmentNumber.isBlank() && email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Enrollment Number or Email is required for resending OTP."));
        }

        Optional<StudentRegistration> regOpt = !enrollmentNumber.isBlank()
                ? registrationRepository.findByEnrollmentNumberIgnoreCase(enrollmentNumber.trim().toUpperCase())
                : registrationRepository.findByEmailIgnoreCase(email.trim().toLowerCase());

        if (regOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(
                    "No pending student registration found. Please initiate registration first."
            ));
        }

        StudentRegistration reg = regOpt.get();

        if (!"PENDING_VERIFICATION".equalsIgnoreCase(reg.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Registration is not in pending verification state. Current status: " + reg.getStatus()
            ));
        }

        // Rate limiting: cooldown 20 seconds
        if (reg.getLastResendAt() != null && reg.getLastResendAt().isAfter(LocalDateTime.now().minusSeconds(20))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(
                    "Please wait 20 seconds before requesting another OTP."
            ));
        }

        // Maximum 5 resends
        if (reg.getResendCount() != null && reg.getResendCount() >= 5) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Maximum OTP resend limit reached. Please restart registration or contact administration."
            ));
        }

        String newOtp = otpService.generateRegistrationOtp();
        reg.setOtpCode(newOtp);
        reg.setOtpExpiry(LocalDateTime.now().plusMinutes(otpService.getOtpExpiryMinutes()));
        reg.setOtpAttempts(0);
        reg.setResendCount((reg.getResendCount() != null ? reg.getResendCount() : 0) + 1);
        reg.setLastResendAt(LocalDateTime.now());
        registrationRepository.save(reg);

        boolean emailSent = otpService.sendRegistrationOtpEmail(reg.getEmail(), reg.getName(), newOtp);

        Map<String, Object> resp = new HashMap<>();
        resp.put("enrollmentNumber", reg.getEnrollmentNumber());
        resp.put("email", reg.getEmail());
        resp.put("expiresInMinutes", otpService.getOtpExpiryMinutes());
        resp.put("resendsRemaining", Math.max(0, 5 - reg.getResendCount()));
        resp.put("emailSent", emailSent);
        resp.put("otpCode", newOtp);

        String userMsg = emailSent
                ? "A fresh OTP has been sent to your official email: " + reg.getEmail()
                : "A fresh verification OTP has been generated (" + newOtp + ").";

        return ResponseEntity.ok(ApiResponse.success(resp, userMsg));
    }

    /**
     * Stage 2: OTP Verification & Final Account Creation
     * Verifies the OTP, activates the student record, saves transactionally into `users`
     * with role = STUDENT and marks `student_registrations` status = REGISTERED.
     */
    @PostMapping("/complete")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeRegistration(@RequestBody Map<String, String> payload) {
        String enrollmentNumber = payload.getOrDefault("enrollmentNumber", "");
        String email = payload.getOrDefault("email", "");
        String otp = payload.getOrDefault("otp", "");

        if (enrollmentNumber.isBlank() && email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Enrollment Number or Email is required."));
        }
        if (otp == null || otp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("OTP verification code is required."));
        }

        enrollmentNumber = enrollmentNumber.trim().toUpperCase();
        email = email.trim().toLowerCase();
        otp = otp.trim();

        Optional<StudentRegistration> regOpt = !enrollmentNumber.isBlank()
                ? registrationRepository.findByEnrollmentNumberIgnoreCase(enrollmentNumber)
                : registrationRepository.findByEmailIgnoreCase(email);

        if (regOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(
                    "No registration request found for Roll Number '" + enrollmentNumber + "'. Please initiate registration first."
            ));
        }

        StudentRegistration reg = regOpt.get();
        enrollmentNumber = reg.getEnrollmentNumber();
        email = reg.getEmail();

        // Check if user already exists
        if (userRepository.existsByEnrollmentNumberIgnoreCase(enrollmentNumber)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                    "A student account with Roll Number '" + enrollmentNumber + "' is already registered and active. Please log in."
            ));
        }

        if (!"PENDING_VERIFICATION".equalsIgnoreCase(reg.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Registration is not in pending verification state. Current status: " + reg.getStatus()
            ));
        }

        // Check failed attempts limit (max 5)
        if (reg.getOtpAttempts() != null && reg.getOtpAttempts() >= 5) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Too many failed OTP attempts. Please request a new OTP to continue."
            ));
        }

        // Check expiry
        if (reg.getOtpExpiry() == null || LocalDateTime.now().isAfter(reg.getOtpExpiry())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "OTP has expired. Please request a new OTP code."
            ));
        }

        // Verify OTP code
        if (!otp.equals(reg.getOtpCode())) {
            int currentAttempts = (reg.getOtpAttempts() != null ? reg.getOtpAttempts() : 0) + 1;
            reg.setOtpAttempts(currentAttempts);
            registrationRepository.save(reg);
            int remaining = Math.max(0, 5 - currentAttempts);
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Invalid OTP. " + remaining + " attempt(s) remaining."
            ));
        }

        try {
            // OTP verification successful: Clear OTP and update registration status
            reg.setOtpCode(null);
            reg.setOtpExpiry(null);
            reg.setStatus("REGISTERED");
            StudentRegistration savedReg = registrationRepository.save(reg);

            // Compute semester integer value (e.g. 1-1 -> 1, 1-2 -> 2, 2-1 -> 3, ..., 4-2 -> 8)
            Integer semNum = 1;
            String semesterStr = reg.getSemester();
            if (semesterStr != null && semesterStr.contains("-")) {
                try {
                    String[] parts = semesterStr.split("-");
                    int yr = Integer.parseInt(parts[0].trim());
                    int sm = Integer.parseInt(parts[1].trim());
                    semNum = (yr - 1) * 2 + sm;
                } catch (Exception ignored) { semNum = 1; }
            } else if (semesterStr != null) {
                try {
                    semNum = Integer.parseInt(semesterStr.trim());
                } catch (Exception ignored) { semNum = 1; }
            }

            // Persist active student account in `users` table
            User newUser = User.builder()
                    .name(reg.getName())
                    .username(enrollmentNumber) // username = enrollmentNumber.toUpperCase()
                    .email(reg.getEmail())
                    .password(reg.getPassword()) // pre-encoded with BCrypt
                    .role(Role.STUDENT)
                    .department(reg.getDepartment())
                    .course(reg.getCourse())
                    .year(reg.getYear())
                    .semester(semNum)
                    .section(reg.getSection())
                    .batchYear(reg.getBatchYear())
                    .enrollmentNumber(enrollmentNumber)
                    .phoneNumber(reg.getPhoneNumber())
                    .dateOfBirth(reg.getDateOfBirth())
                    .gender(reg.getGender())
                    .address(reg.getAddress())
                    .emergencyContact(reg.getEmergencyContact())
                    .guardianName(reg.getGuardianName())
                    .guardianPhone(reg.getGuardianPhone())
                    .guardianEmail(reg.getGuardianEmail())
                    .guardianRelation(reg.getGuardianRelation())
                    .admissionStatus("ADMITTED")
                    .admissionDate(LocalDate.now().toString())
                    .admissionQuota(reg.getAdmissionQuota() != null ? reg.getAdmissionQuota() : "Convenor Quota")
                    .isVerified(true)
                    .active(true)
                    .twoFactorEnabled(false)
                    .build();

            User savedUser = userRepository.save(newUser);

            Map<String, Object> resp = new HashMap<>();
            resp.put("registrationId", savedReg.getId());
            resp.put("userId", savedUser.getId());
            resp.put("name", savedUser.getName());
            resp.put("enrollmentNumber", savedUser.getEnrollmentNumber());
            resp.put("username", savedUser.getUsername());
            resp.put("email", savedUser.getEmail());
            resp.put("department", savedUser.getDepartment());
            resp.put("course", savedUser.getCourse());
            resp.put("year", savedUser.getYear());
            resp.put("semester", reg.getSemester());
            resp.put("section", savedUser.getSection());
            resp.put("batchYear", savedUser.getBatchYear());
            resp.put("status", "SUCCESS");

            log.info("Student registered and activated successfully: Roll: {}, Username: {}, Email: {}",
                    savedUser.getEnrollmentNumber(), savedUser.getUsername(), savedUser.getEmail());

            return ResponseEntity.ok(ApiResponse.success(resp,
                    "Student registration and email verification successful! Your VVITU student account is active."));

        } catch (DataIntegrityViolationException ex) {
            log.warn("Data integrity conflict on student completion: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                    "Student with this Roll Number or email is already registered."
            ));
        } catch (Exception ex) {
            log.error("Error creating student account: ", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(
                    "Failed to complete student account registration. Please contact administration."
            ));
        }
    }

    /**
     * Backward-compatible endpoint: handles /public
     * If OTP is provided, delegates to completeRegistration; otherwise delegates to initiateRegistration.
     */
    @PostMapping("/public")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitPublicRegistration(@RequestBody Map<String, Object> payload) {
        if (payload.containsKey("otp") && !((String) payload.get("otp")).isBlank()) {
            Map<String, String> completeMap = new HashMap<>();
            completeMap.put("enrollmentNumber", (String) payload.getOrDefault("enrollmentNumber", ""));
            completeMap.put("email", (String) payload.getOrDefault("email", ""));
            completeMap.put("otp", (String) payload.getOrDefault("otp", ""));
            return completeRegistration(completeMap);
        }
        return initiateRegistration(payload);
    }

    /**
     * Admin: Get all student registrations
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentRegistration>>> getAllRegistrations() {
        return ResponseEntity.ok(ApiResponse.success(registrationRepository.findAllByOrderByCreatedAtDesc()));
    }

    /**
     * Admin: Get registration statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRegistrationStats() {
        long total = registrationRepository.count();
        long registered = registrationRepository.countByStatus("REGISTERED");
        long imported = registrationRepository.countByStatus("IMPORTED");
        long approved = registrationRepository.countByStatus("APPROVED");
        long pending = registrationRepository.countByStatus("PENDING_VERIFICATION");

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("registered", registered);
        stats.put("imported", imported);
        stats.put("approved", approved);
        stats.put("pendingVerification", pending);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Admin: Delete student registration record
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteRegistration(@PathVariable Long id) {
        if (!registrationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        registrationRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Registration record deleted."));
    }
}

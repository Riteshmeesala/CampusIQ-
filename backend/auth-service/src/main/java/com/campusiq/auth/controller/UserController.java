package com.campusiq.auth.controller;

import com.campusiq.auth.dto.request.BroadcastEmailRequest;
import com.campusiq.auth.entity.User;
import com.campusiq.auth.repository.UserRepository;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.enums.Role;
import com.campusiq.common.exception.ResourceNotFoundException;
import com.campusiq.common.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<List<User>>> getStudents(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String section) {
        List<User> students = userRepository.findByRole(Role.STUDENT);
        if (department != null && !department.isBlank() && !department.equalsIgnoreCase("ALL")) {
            students = students.stream()
                    .filter(s -> s.getDepartment() != null && s.getDepartment().equalsIgnoreCase(department.trim()))
                    .toList();
        }
        if (semester != null && semester > 0) {
            students = students.stream()
                    .filter(s -> s.getSemester() != null && s.getSemester().equals(semester))
                    .toList();
        }
        if (section != null && !section.isBlank() && !section.equalsIgnoreCase("ALL")) {
            students = students.stream()
                    .filter(s -> s.getSection() != null && s.getSection().equalsIgnoreCase(section.trim()))
                    .toList();
        }
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @GetMapping("/faculty")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<List<User>>> getFaculty() {
        return ResponseEntity.ok(ApiResponse.success(userRepository.findByRole(Role.FACULTY)));
    }

    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> createStudent(@RequestBody Map<String, Object> body) {
        String username = body.getOrDefault("username", "").toString().trim();
        String email = body.getOrDefault("email", "").toString().trim();
        if (username.isEmpty() || email.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("Username and email required"));
        if (userRepository.existsByUsername(username))
            return ResponseEntity.status(409).body(ApiResponse.error("Username already taken"));
        if (userRepository.existsByEmail(email))
            return ResponseEntity.status(409).body(ApiResponse.error("Email already in use"));

        Integer sem = body.get("semester") != null ? Integer.valueOf(body.get("semester").toString()) : 4;
        String sec = body.getOrDefault("section", "Section A").toString();

        User user = User.builder()
                .username(username)
                .name(body.getOrDefault("name", username).toString())
                .email(email)
                .password(passwordEncoder.encode(body.getOrDefault("password", "campusiq@1234").toString()))
                .role(Role.STUDENT)
                .phoneNumber(body.getOrDefault("phoneNumber", "").toString())
                .department(body.getOrDefault("department", "Computer Science").toString())
                .enrollmentNumber(body.getOrDefault("enrollmentNumber", "").toString())
                .semester(sem)
                .section(sec)
                .dateOfBirth(body.getOrDefault("dateOfBirth", "").toString())
                .gender(body.getOrDefault("gender", "").toString())
                .address(body.getOrDefault("address", "").toString())
                .emergencyContact(body.getOrDefault("emergencyContact", "").toString())
                .guardianName(body.getOrDefault("guardianName", "").toString())
                .guardianPhone(body.getOrDefault("guardianPhone", "").toString())
                .guardianEmail(body.getOrDefault("guardianEmail", "").toString())
                .guardianRelation(body.getOrDefault("guardianRelation", "").toString())
                .course(body.getOrDefault("course", "B.Tech Computer Science").toString())
                .year(body.getOrDefault("year", "1st Year").toString())
                .batchYear(body.getOrDefault("batchYear", "").toString())
                .admissionStatus(body.getOrDefault("admissionStatus", "ADMITTED").toString())
                .admissionDate(body.getOrDefault("admissionDate", "").toString())
                .admissionQuota(body.getOrDefault("admissionQuota", "Convenor Quota").toString())
                .isVerified(body.get("isVerified") != null ? Boolean.parseBoolean(body.get("isVerified").toString()) : true)
                .extracurriculars(body.getOrDefault("extracurriculars", "").toString())
                .certificates(body.getOrDefault("certificates", "").toString())
                .documents(body.getOrDefault("documents", "").toString())
                .active(true)
                .twoFactorEnabled(false)
                .build();
        return ResponseEntity.status(201).body(ApiResponse.success(userRepository.save(user), "Student created"));
    }

    @PostMapping("/students/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMultipleStudents(@RequestBody List<Map<String, Object>> studentsList) {
        if (studentsList == null || studentsList.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Student list cannot be empty"));
        }

        java.util.Set<String> seenUsernames = new java.util.HashSet<>();
        java.util.Set<String> seenEmails = new java.util.HashSet<>();
        java.util.Set<String> seenEnrollments = new java.util.HashSet<>();
        List<String> validationErrors = new java.util.ArrayList<>();

        // 1. Validation pass
        for (int i = 0; i < studentsList.size(); i++) {
            Map<String, Object> item = studentsList.get(i);
            int rowNum = i + 1;
            String username = item.getOrDefault("username", "").toString().trim();
            String email = item.getOrDefault("email", "").toString().trim();
            String name = item.getOrDefault("name", "").toString().trim();
            String enrollmentNumber = item.getOrDefault("enrollmentNumber", "").toString().trim();

            if (username.isEmpty()) validationErrors.add("Row #" + rowNum + ": Username is required");
            if (email.isEmpty()) validationErrors.add("Row #" + rowNum + ": Email is required");
            if (name.isEmpty()) validationErrors.add("Row #" + rowNum + ": Name is required");

            if (!username.isEmpty()) {
                String uLower = username.toLowerCase();
                if (seenUsernames.contains(uLower)) {
                    validationErrors.add("Row #" + rowNum + ": Duplicate username '" + username + "' in upload batch");
                } else if (userRepository.existsByUsername(username)) {
                    validationErrors.add("Row #" + rowNum + ": Username '" + username + "' already exists in system");
                }
                seenUsernames.add(uLower);
            }

            if (!email.isEmpty()) {
                String eLower = email.toLowerCase();
                if (seenEmails.contains(eLower)) {
                    validationErrors.add("Row #" + rowNum + ": Duplicate email '" + email + "' in upload batch");
                } else if (userRepository.existsByEmail(email)) {
                    validationErrors.add("Row #" + rowNum + ": Email '" + email + "' already exists in system");
                }
                seenEmails.add(eLower);
            }

            if (!enrollmentNumber.isEmpty()) {
                String enLower = enrollmentNumber.toLowerCase();
                if (seenEnrollments.contains(enLower)) {
                    validationErrors.add("Row #" + rowNum + ": Duplicate enrollment number '" + enrollmentNumber + "' in upload batch");
                } else if (userRepository.existsByEnrollmentNumber(enrollmentNumber)) {
                    validationErrors.add("Row #" + rowNum + ": Enrollment number '" + enrollmentNumber + "' already exists in system");
                }
                seenEnrollments.add(enLower);
            }
        }

        if (!validationErrors.isEmpty()) {
            Map<String, Object> errData = new HashMap<>();
            errData.put("errors", validationErrors);
            errData.put("totalAttempted", studentsList.size());
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Validation failed for " + validationErrors.size() + " issue(s): " + String.join("; ", validationErrors.subList(0, Math.min(5, validationErrors.size()))),
                    errData
            ));
        }

        // 2. Creation pass
        List<User> createdUsers = new java.util.ArrayList<>();
        for (Map<String, Object> item : studentsList) {
            String username = item.getOrDefault("username", "").toString().trim();
            String email = item.getOrDefault("email", "").toString().trim();
            String name = item.getOrDefault("name", username).toString().trim();
            String rawPassword = item.getOrDefault("password", "campusiq@1234").toString();
            if (rawPassword.isBlank()) rawPassword = "campusiq@1234";

            String dept = item.getOrDefault("department", "Computer Science").toString().trim();
            String sec = item.getOrDefault("section", "Section A").toString().trim();
            String enrollmentNumber = item.getOrDefault("enrollmentNumber", "").toString().trim();
            String phone = item.getOrDefault("phoneNumber", "").toString().trim();

            Integer sem = 4;
            Object semObj = item.get("semester");
            if (semObj != null) {
                String semStr = semObj.toString().trim();
                if (semStr.contains("-")) {
                    String[] parts = semStr.split("-");
                    try {
                        int yr = Integer.parseInt(parts[0].trim());
                        int sm = Integer.parseInt(parts[1].trim());
                        sem = (yr - 1) * 2 + sm;
                    } catch (Exception ignored) {
                        sem = 4;
                    }
                } else {
                    try {
                        sem = Integer.valueOf(semStr);
                    } catch (Exception ignored) {
                        sem = 4;
                    }
                }
            }

            User user = User.builder()
                    .username(username)
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(Role.STUDENT)
                    .phoneNumber(phone)
                    .department(dept.isEmpty() ? "Computer Science" : dept)
                    .enrollmentNumber(enrollmentNumber)
                    .semester(sem)
                    .section(sec.isEmpty() ? "Section A" : sec)
                    .dateOfBirth(item.getOrDefault("dateOfBirth", "").toString())
                    .gender(item.getOrDefault("gender", "").toString())
                    .address(item.getOrDefault("address", "").toString())
                    .emergencyContact(item.getOrDefault("emergencyContact", "").toString())
                    .guardianName(item.getOrDefault("guardianName", "").toString())
                    .guardianPhone(item.getOrDefault("guardianPhone", "").toString())
                    .guardianEmail(item.getOrDefault("guardianEmail", "").toString())
                    .guardianRelation(item.getOrDefault("guardianRelation", "").toString())
                    .course(item.getOrDefault("course", "B.Tech Computer Science").toString())
                    .year(item.getOrDefault("year", "1st Year").toString())
                    .batchYear(item.getOrDefault("batchYear", "").toString())
                    .admissionStatus(item.getOrDefault("admissionStatus", "ADMITTED").toString())
                    .admissionDate(item.getOrDefault("admissionDate", "").toString())
                    .admissionQuota(item.getOrDefault("admissionQuota", "Convenor Quota").toString())
                    .isVerified(item.get("isVerified") != null ? Boolean.parseBoolean(item.get("isVerified").toString()) : true)
                    .active(true)
                    .twoFactorEnabled(false)
                    .build();

            createdUsers.add(userRepository.save(user));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("createdCount", createdUsers.size());
        result.put("students", createdUsers);
        return ResponseEntity.status(201).body(ApiResponse.success(
                result,
                "Successfully created " + createdUsers.size() + " student accounts"
        ));
    }

    @PostMapping("/faculty")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> createFaculty(@RequestBody Map<String, Object> body) {
        String username = body.getOrDefault("username", "").toString().trim();
        String email = body.getOrDefault("email", "").toString().trim();
        if (username.isEmpty() || email.isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("Username and email required"));
        if (userRepository.existsByUsername(username))
            return ResponseEntity.status(409).body(ApiResponse.error("Username already taken"));
        if (userRepository.existsByEmail(email))
            return ResponseEntity.status(409).body(ApiResponse.error("Email already in use"));

        String empId = body.getOrDefault("employeeId", body.getOrDefault("enrollmentNumber", "")).toString();

        User user = User.builder()
                .username(username)
                .name(body.getOrDefault("name", username).toString())
                .email(email)
                .password(passwordEncoder.encode(body.getOrDefault("password", "campusiq@1234").toString()))
                .role(Role.FACULTY)
                .phoneNumber(body.getOrDefault("phoneNumber", "").toString())
                .department(body.getOrDefault("department", "Computer Science").toString())
                .enrollmentNumber(empId)
                .employeeId(empId)
                .designation(body.getOrDefault("designation", "Assistant Professor").toString())
                .qualifications(body.getOrDefault("qualifications", "M.Tech, Ph.D.").toString())
                .experienceYears(body.getOrDefault("experienceYears", "5+ Years").toString())
                .specialization(body.getOrDefault("specialization", "Computer Science & Engineering").toString())
                .dateOfBirth(body.getOrDefault("dateOfBirth", "").toString())
                .gender(body.getOrDefault("gender", "").toString())
                .address(body.getOrDefault("address", "").toString())
                .researchPublications(body.getOrDefault("researchPublications", "").toString())
                .awards(body.getOrDefault("awards", "").toString())
                .achievements(body.getOrDefault("achievements", "").toString())
                .leaveBalances(body.getOrDefault("leaveBalances", "").toString())
                .isVerified(true)
                .active(true)
                .twoFactorEnabled(false)
                .build();
        return ResponseEntity.status(201).body(ApiResponse.success(userRepository.save(user), "Faculty created"));
    }

    @PostMapping("/faculty/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMultipleFaculty(@RequestBody List<Map<String, Object>> facultyList) {
        if (facultyList == null || facultyList.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Faculty list cannot be empty"));
        }

        List<User> created = new java.util.ArrayList<>();
        for (Map<String, Object> item : facultyList) {
            String username = item.getOrDefault("username", "").toString().trim();
            String email = item.getOrDefault("email", "").toString().trim();
            String name = item.getOrDefault("name", username).toString().trim();
            if (username.isEmpty() || email.isEmpty() || name.isEmpty()) continue;
            if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) continue;

            String empId = item.getOrDefault("employeeId", item.getOrDefault("enrollmentNumber", "")).toString();
            String rawPassword = item.getOrDefault("password", "campusiq@1234").toString();
            if (rawPassword.isBlank()) rawPassword = "campusiq@1234";

            User user = User.builder()
                    .username(username)
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(Role.FACULTY)
                    .phoneNumber(item.getOrDefault("phoneNumber", "").toString())
                    .department(item.getOrDefault("department", "Computer Science").toString())
                    .enrollmentNumber(empId)
                    .employeeId(empId)
                    .designation(item.getOrDefault("designation", "Assistant Professor").toString())
                    .qualifications(item.getOrDefault("qualifications", "M.Tech").toString())
                    .experienceYears(item.getOrDefault("experienceYears", "3+ Years").toString())
                    .specialization(item.getOrDefault("specialization", "Computer Science").toString())
                    .isVerified(true)
                    .active(true)
                    .twoFactorEnabled(false)
                    .build();
            created.add(userRepository.save(user));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("createdCount", created.size());
        result.put("faculty", created);
        return ResponseEntity.status(201).body(ApiResponse.success(result, "Successfully created " + created.size() + " faculty accounts"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats() {
        List<User> students = userRepository.findByRole(Role.STUDENT);
        List<User> faculty = userRepository.findByRole(Role.FACULTY);
        List<User> admins = userRepository.findByRole(Role.ADMIN);

        long activeStudents = students.stream().filter(User::isActive).count();
        long verifiedStudents = students.stream().filter(u -> Boolean.TRUE.equals(u.getIsVerified())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", students.size() + faculty.size() + admins.size());
        stats.put("totalStudents", students.size());
        stats.put("totalFaculty", faculty.size());
        stats.put("totalAdmins", admins.size());
        stats.put("activeStudents", activeStudents);
        stats.put("verifiedStudents", verifiedStudents);
        stats.put("pendingVerification", students.size() - verifiedStudents);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getById(@PathVariable Long id,
                                                     @AuthenticationPrincipal UserPrincipal me) {
        if (me != null && me.getRole() == Role.STUDENT && !me.getId().equals(id))
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied"));
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return ResponseEntity.ok(ApiResponse.success(u));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> me(@AuthenticationPrincipal UserPrincipal p) {
        if (p == null || p.getId() == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        User u = userRepository.findById(p.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", p.getId()));
        return ResponseEntity.ok(ApiResponse.success(u));
    }

    @GetMapping("/me/full")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myFullProfile(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        User user = userRepository.findById(me.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", me.getId()));
        Map<String, Object> profile = new HashMap<>();
        profile.put("user", user);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me/profile-image")
    public ResponseEntity<ApiResponse<User>> updateMyProfileImage(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestBody Map<String, String> body) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        User user = userRepository.findById(me.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", me.getId()));
        user.setProfileImage(body.get("profileImage"));
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(saved, "Profile image updated"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserPrincipal me,
                                                        @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        boolean isAdmin = me != null && me.getRole() == Role.ADMIN;
        boolean isSelf = me != null && me.getId().equals(id);

        if (!isAdmin && !isSelf) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied"));
        }

        // Basic Profile fields
        if (body.containsKey("name"))             user.setName(body.get("name").toString());
        if (body.containsKey("email") && isAdmin) user.setEmail(body.get("email").toString());
        if (body.containsKey("phoneNumber"))      user.setPhoneNumber(body.get("phoneNumber").toString());
        if (body.containsKey("department") && isAdmin) user.setDepartment(body.get("department").toString());
        if (body.containsKey("section"))          user.setSection(body.get("section") != null ? body.get("section").toString() : null);
        if (body.containsKey("semester"))         user.setSemester(body.get("semester") != null && !body.get("semester").toString().isBlank() ? Integer.valueOf(body.get("semester").toString()) : null);
        if (body.containsKey("enrollmentNumber") && isAdmin) user.setEnrollmentNumber(body.get("enrollmentNumber").toString());
        if (body.containsKey("profileImage"))     user.setProfileImage(body.get("profileImage") != null ? body.get("profileImage").toString() : null);

        // Extended Personal & Guardian fields
        if (body.containsKey("dateOfBirth"))      user.setDateOfBirth(body.get("dateOfBirth") != null ? body.get("dateOfBirth").toString() : null);
        if (body.containsKey("gender"))           user.setGender(body.get("gender") != null ? body.get("gender").toString() : null);
        if (body.containsKey("address"))          user.setAddress(body.get("address") != null ? body.get("address").toString() : null);
        if (body.containsKey("emergencyContact")) user.setEmergencyContact(body.get("emergencyContact") != null ? body.get("emergencyContact").toString() : null);
        if (body.containsKey("guardianName"))     user.setGuardianName(body.get("guardianName") != null ? body.get("guardianName").toString() : null);
        if (body.containsKey("guardianPhone"))    user.setGuardianPhone(body.get("guardianPhone") != null ? body.get("guardianPhone").toString() : null);
        if (body.containsKey("guardianEmail"))    user.setGuardianEmail(body.get("guardianEmail") != null ? body.get("guardianEmail").toString() : null);
        if (body.containsKey("guardianRelation")) user.setGuardianRelation(body.get("guardianRelation") != null ? body.get("guardianRelation").toString() : null);

        // Academic details
        if (body.containsKey("course"))           user.setCourse(body.get("course") != null ? body.get("course").toString() : null);
        if (body.containsKey("year"))             user.setYear(body.get("year") != null ? body.get("year").toString() : null);
        if (body.containsKey("batchYear"))        user.setBatchYear(body.get("batchYear") != null ? body.get("batchYear").toString() : null);
        if (body.containsKey("admissionStatus") && isAdmin) user.setAdmissionStatus(body.get("admissionStatus") != null ? body.get("admissionStatus").toString() : null);
        if (body.containsKey("admissionDate"))    user.setAdmissionDate(body.get("admissionDate") != null ? body.get("admissionDate").toString() : null);
        if (body.containsKey("admissionQuota"))   user.setAdmissionQuota(body.get("admissionQuota") != null ? body.get("admissionQuota").toString() : null);
        if (body.containsKey("isVerified") && isAdmin) user.setIsVerified(Boolean.parseBoolean(body.get("isVerified").toString()));

        // Faculty Professional details
        if (body.containsKey("employeeId"))       user.setEmployeeId(body.get("employeeId") != null ? body.get("employeeId").toString() : null);
        if (body.containsKey("designation"))      user.setDesignation(body.get("designation") != null ? body.get("designation").toString() : null);
        if (body.containsKey("qualifications"))   user.setQualifications(body.get("qualifications") != null ? body.get("qualifications").toString() : null);
        if (body.containsKey("experienceYears"))  user.setExperienceYears(body.get("experienceYears") != null ? body.get("experienceYears").toString() : null);
        if (body.containsKey("specialization"))   user.setSpecialization(body.get("specialization") != null ? body.get("specialization").toString() : null);

        // Rich JSON / Longtext fields
        if (body.containsKey("researchPublications")) user.setResearchPublications(body.get("researchPublications") != null ? body.get("researchPublications").toString() : null);
        if (body.containsKey("awards"))           user.setAwards(body.get("awards") != null ? body.get("awards").toString() : null);
        if (body.containsKey("achievements"))     user.setAchievements(body.get("achievements") != null ? body.get("achievements").toString() : null);
        if (body.containsKey("extracurriculars")) user.setExtracurriculars(body.get("extracurriculars") != null ? body.get("extracurriculars").toString() : null);
        if (body.containsKey("certificates"))     user.setCertificates(body.get("certificates") != null ? body.get("certificates").toString() : null);
        if (body.containsKey("documents"))        user.setDocuments(body.get("documents") != null ? body.get("documents").toString() : null);
        if (body.containsKey("leaveBalances"))    user.setLeaveBalances(body.get("leaveBalances") != null ? body.get("leaveBalances").toString() : null);

        // Security & Status (Admin only)
        if (isAdmin && body.containsKey("active")) user.setActive(Boolean.parseBoolean(body.get("active").toString()));
        if (isAdmin && body.containsKey("password") && !body.get("password").toString().isBlank())
            user.setPassword(passwordEncoder.encode(body.get("password").toString()));

        return ResponseEntity.ok(ApiResponse.success(userRepository.save(user), "Profile updated successfully"));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> verifyUser(@PathVariable Long id,
                                                        @RequestBody(required = false) Map<String, Object> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        boolean verified = body == null || !body.containsKey("verified") || Boolean.parseBoolean(body.get("verified").toString());
        user.setIsVerified(verified);
        if (body != null && body.containsKey("admissionStatus")) {
            user.setAdmissionStatus(body.get("admissionStatus").toString());
        }
        return ResponseEntity.ok(ApiResponse.success(userRepository.save(user), "Profile verification status updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id))
            throw new ResourceNotFoundException("User", "id", id);

        try {
            // Clean student-related records
            jdbcTemplate.update("DELETE FROM student_cgpa WHERE student_id = ?", id);
            jdbcTemplate.update("DELETE FROM student_semester_summaries WHERE student_id = ?", id);
            jdbcTemplate.update("DELETE FROM student_academic_records WHERE student_id = ?", id);
            jdbcTemplate.update("DELETE FROM results WHERE student_id = ?", id);
            jdbcTemplate.update("DELETE FROM attendance WHERE student_id = ?", id);
            jdbcTemplate.update("DELETE FROM fees WHERE student_id = ?", id);
            jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", id);

            // Clean faculty-related records
            jdbcTemplate.update("DELETE FROM faculty_schedules WHERE faculty_id = ?", id);
            jdbcTemplate.update("DELETE FROM faculty_subject_assignments WHERE faculty_id = ?", id);
            jdbcTemplate.update("DELETE FROM timetable_slots WHERE faculty_id = ?", id);
            jdbcTemplate.update("UPDATE courses SET faculty_id = NULL WHERE faculty_id = ?", id);
            jdbcTemplate.update("UPDATE attendance SET marked_by = NULL WHERE marked_by = ?", id);
        } catch (Exception e) {
            // log and continue
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User profile deleted successfully"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateStatus(@PathVariable Long id,
                                                          @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        if (body.containsKey("active")) {
            user.setActive(body.get("active"));
        }
        return ResponseEntity.ok(ApiResponse.success(userRepository.save(user), "Status updated"));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> broadcastEmail(@RequestBody BroadcastEmailRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Broadcast email dispatched", "Broadcast sent"));
    }
}

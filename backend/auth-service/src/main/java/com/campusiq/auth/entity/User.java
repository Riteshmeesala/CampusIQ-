package com.campusiq.auth.entity;

import com.campusiq.common.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_username", columnList = "username", unique = true),
        @Index(name = "idx_users_role", columnList = "role")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank
    @Email
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @NotBlank
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "home_department", length = 100)
    private String homeDepartment;

    @Column(name = "section", length = 50)
    private String section;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "enrollment_number", unique = true, length = 50)
    private String enrollmentNumber;

    @Column(name = "profile_image", columnDefinition = "LONGTEXT")
    private String profileImage;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_two_factor_enabled")
    private boolean twoFactorEnabled = false;

    @JsonIgnore
    @Column(name = "otp_code", length = 10)
    private String otpCode;

    @JsonIgnore
    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @JsonIgnore
    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @Column(name = "date_of_birth", length = 30)
    private String dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "emergency_contact", length = 50)
    private String emergencyContact;

    @Column(name = "guardian_name", length = 100)
    private String guardianName;

    @Column(name = "guardian_phone", length = 20)
    private String guardianPhone;

    @Column(name = "guardian_email", length = 150)
    private String guardianEmail;

    @Column(name = "guardian_relation", length = 50)
    private String guardianRelation;

    @Column(name = "course", length = 150)
    private String course;

    @Column(name = "year", length = 30)
    private String year;

    @Column(name = "batch_year", length = 30)
    private String batchYear;

    @Column(name = "admission_status", length = 30)
    private String admissionStatus = "ADMITTED";

    @Column(name = "admission_date", length = 30)
    private String admissionDate;

    @Column(name = "admission_quota", length = 50)
    private String admissionQuota;

    @Column(name = "is_verified")
    private Boolean isVerified = true;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "qualifications", columnDefinition = "TEXT")
    private String qualifications;

    @Column(name = "experience_years", length = 50)
    private String experienceYears;

    @Column(name = "specialization", columnDefinition = "TEXT")
    private String specialization;

    @Column(name = "research_publications", columnDefinition = "LONGTEXT")
    private String researchPublications;

    @Column(name = "awards", columnDefinition = "LONGTEXT")
    private String awards;

    @Column(name = "achievements", columnDefinition = "LONGTEXT")
    private String achievements;

    @Column(name = "extracurriculars", columnDefinition = "LONGTEXT")
    private String extracurriculars;

    @Column(name = "certificates", columnDefinition = "LONGTEXT")
    private String certificates;

    @Column(name = "documents", columnDefinition = "LONGTEXT")
    private String documents;

    @Column(name = "leave_balances", columnDefinition = "LONGTEXT")
    private String leaveBalances;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getHomeDepartment() { return homeDepartment; }
    public void setHomeDepartment(String homeDepartment) { this.homeDepartment = homeDepartment; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public boolean isActive() { return active; }
    public boolean getActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }
    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    public LocalDateTime getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }
    public String getFcmToken() { return fcmToken; }
    public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getGuardianName() { return guardianName; }
    public void setGuardianName(String guardianName) { this.guardianName = guardianName; }
    public String getGuardianPhone() { return guardianPhone; }
    public void setGuardianPhone(String guardianPhone) { this.guardianPhone = guardianPhone; }
    public String getGuardianEmail() { return guardianEmail; }
    public void setGuardianEmail(String guardianEmail) { this.guardianEmail = guardianEmail; }
    public String getGuardianRelation() { return guardianRelation; }
    public void setGuardianRelation(String guardianRelation) { this.guardianRelation = guardianRelation; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public String getBatchYear() { return batchYear; }
    public void setBatchYear(String batchYear) { this.batchYear = batchYear; }
    public String getAdmissionStatus() { return admissionStatus; }
    public void setAdmissionStatus(String admissionStatus) { this.admissionStatus = admissionStatus; }
    public String getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(String admissionDate) { this.admissionDate = admissionDate; }
    public String getAdmissionQuota() { return admissionQuota; }
    public void setAdmissionQuota(String admissionQuota) { this.admissionQuota = admissionQuota; }
    public Boolean getIsVerified() { return isVerified != null ? isVerified : true; }
    public void setIsVerified(Boolean verified) { isVerified = verified; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }
    public String getExperienceYears() { return experienceYears; }
    public void setExperienceYears(String experienceYears) { this.experienceYears = experienceYears; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getResearchPublications() { return researchPublications; }
    public void setResearchPublications(String researchPublications) { this.researchPublications = researchPublications; }
    public String getAwards() { return awards; }
    public void setAwards(String awards) { this.awards = awards; }
    public String getAchievements() { return achievements; }
    public void setAchievements(String achievements) { this.achievements = achievements; }
    public String getExtracurriculars() { return extracurriculars; }
    public void setExtracurriculars(String extracurriculars) { this.extracurriculars = extracurriculars; }
    public String getCertificates() { return certificates; }
    public void setCertificates(String certificates) { this.certificates = certificates; }
    public String getDocuments() { return documents; }
    public void setDocuments(String documents) { this.documents = documents; }
    public String getLeaveBalances() { return leaveBalances; }
    public void setLeaveBalances(String leaveBalances) { this.leaveBalances = leaveBalances; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final User user = new User();
        public Builder id(Long id) { user.setId(id); return this; }
        public Builder username(String username) { user.setUsername(username); return this; }
        public Builder name(String name) { user.setName(name); return this; }
        public Builder email(String email) { user.setEmail(email); return this; }
        public Builder password(String password) { user.setPassword(password); return this; }
        public Builder role(Role role) { user.setRole(role); return this; }
        public Builder phoneNumber(String phoneNumber) { user.setPhoneNumber(phoneNumber); return this; }
        public Builder department(String department) { user.setDepartment(department); return this; }
        public Builder homeDepartment(String homeDepartment) { user.setHomeDepartment(homeDepartment); return this; }
        public Builder section(String section) { user.setSection(section); return this; }
        public Builder semester(Integer semester) { user.setSemester(semester); return this; }
        public Builder enrollmentNumber(String enrollmentNumber) { user.setEnrollmentNumber(enrollmentNumber); return this; }
        public Builder profileImage(String profileImage) { user.setProfileImage(profileImage); return this; }
        public Builder active(boolean active) { user.setActive(active); return this; }
        public Builder twoFactorEnabled(boolean twoFactorEnabled) { user.setTwoFactorEnabled(twoFactorEnabled); return this; }
        public Builder dateOfBirth(String dob) { user.setDateOfBirth(dob); return this; }
        public Builder gender(String gender) { user.setGender(gender); return this; }
        public Builder address(String address) { user.setAddress(address); return this; }
        public Builder emergencyContact(String ec) { user.setEmergencyContact(ec); return this; }
        public Builder guardianName(String gn) { user.setGuardianName(gn); return this; }
        public Builder guardianPhone(String gp) { user.setGuardianPhone(gp); return this; }
        public Builder guardianEmail(String ge) { user.setGuardianEmail(ge); return this; }
        public Builder guardianRelation(String gr) { user.setGuardianRelation(gr); return this; }
        public Builder course(String course) { user.setCourse(course); return this; }
        public Builder year(String year) { user.setYear(year); return this; }
        public Builder batchYear(String batchYear) { user.setBatchYear(batchYear); return this; }
        public Builder admissionStatus(String as) { user.setAdmissionStatus(as); return this; }
        public Builder admissionDate(String ad) { user.setAdmissionDate(ad); return this; }
        public Builder admissionQuota(String aq) { user.setAdmissionQuota(aq); return this; }
        public Builder isVerified(Boolean isVerified) { user.setIsVerified(isVerified); return this; }
        public Builder employeeId(String employeeId) { user.setEmployeeId(employeeId); return this; }
        public Builder designation(String designation) { user.setDesignation(designation); return this; }
        public Builder qualifications(String qualifications) { user.setQualifications(qualifications); return this; }
        public Builder experienceYears(String ey) { user.setExperienceYears(ey); return this; }
        public Builder specialization(String specialization) { user.setSpecialization(specialization); return this; }
        public Builder researchPublications(String rp) { user.setResearchPublications(rp); return this; }
        public Builder awards(String awards) { user.setAwards(awards); return this; }
        public Builder achievements(String achievements) { user.setAchievements(achievements); return this; }
        public Builder extracurriculars(String ec) { user.setExtracurriculars(ec); return this; }
        public Builder certificates(String certs) { user.setCertificates(certs); return this; }
        public Builder documents(String docs) { user.setDocuments(docs); return this; }
        public Builder leaveBalances(String lb) { user.setLeaveBalances(lb); return this; }
        public User build() { return user; }
    }
}

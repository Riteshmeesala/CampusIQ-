package com.campusiq.academic.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_biometric_attendance", indexes = {
        @Index(name = "idx_fba_faculty", columnList = "faculty_id"),
        @Index(name = "idx_fba_date", columnList = "punch_date")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_faculty_date", columnNames = {"faculty_id", "punch_date"})
})
public class FacultyBiometricAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "faculty_id", nullable = false)
    private Long facultyId;

    @Column(name = "faculty_name", nullable = false, length = 150)
    private String facultyName;

    @Column(length = 100)
    private String department;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

    @Column(length = 100)
    private String designation;

    @Column(name = "punch_date", nullable = false)
    private LocalDate punchDate;

    @Column(name = "punch_in_time", length = 20)
    private String punchInTime;

    @Column(name = "punch_out_time", length = 20)
    private String punchOutTime;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "working_hours", length = 20)
    private String workingHours;

    @Column(name = "device_id", length = 50)
    private String deviceId;

    @Column(length = 100)
    private String location;

    @Column(length = 255)
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public FacultyBiometricAttendance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getPunchDate() { return punchDate; }
    public void setPunchDate(LocalDate punchDate) { this.punchDate = punchDate; }

    public String getPunchInTime() { return punchInTime; }
    public void setPunchInTime(String punchInTime) { this.punchInTime = punchInTime; }

    public String getPunchOutTime() { return punchOutTime; }
    public void setPunchOutTime(String punchOutTime) { this.punchOutTime = punchOutTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

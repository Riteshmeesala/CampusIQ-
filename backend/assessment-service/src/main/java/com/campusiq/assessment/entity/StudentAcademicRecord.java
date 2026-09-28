package com.campusiq.assessment.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_academic_records", indexes = {
        @Index(name = "idx_acad_student", columnList = "student_id"),
        @Index(name = "idx_acad_sem_code", columnList = "semester_code"),
        @Index(name = "idx_acad_subject_code", columnList = "subject_code")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_sem_subject", columnNames = {"student_id", "semester_code", "subject_code"})
})
public class StudentAcademicRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private User student;

    @Column(name = "semester_code", nullable = false, length = 10)
    private String semesterCode; // "1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"

    @Column(name = "semester_num", nullable = false)
    private Integer semesterNum; // 1 to 8

    @Column(name = "subject_code", nullable = false, length = 30)
    private String subjectCode;

    @Column(name = "subject_name", nullable = false, length = 200)
    private String subjectName;

    @Column(name = "faculty_name", length = 100)
    private String facultyName;

    @Column(name = "credit_hours")
    private Integer creditHours = 3;

    // ── MID-1 EXAMINATION (Continuous Assessment 1) ──
    @Column(name = "mid1_descriptive_marks", precision = 5, scale = 2)
    private BigDecimal mid1DescriptiveMarks = BigDecimal.valueOf(27.00); // Max 30 (/3 -> 9)

    @Column(name = "mid1_open_book_marks", precision = 5, scale = 2)
    private BigDecimal mid1OpenBookMarks = BigDecimal.valueOf(16.00); // Max 20 (/4 -> 4)

    @Column(name = "mid1_objective_marks", precision = 5, scale = 2)
    private BigDecimal mid1ObjectiveMarks = BigDecimal.valueOf(18.00); // Max 20 (/2 -> 9)

    @Column(name = "mid1_assignment_marks", precision = 5, scale = 2)
    private BigDecimal mid1AssignmentMarks = BigDecimal.valueOf(5.00); // Max 5

    @Column(name = "mid1_total_marks", precision = 5, scale = 2)
    private BigDecimal mid1TotalMarks = BigDecimal.valueOf(22.00); // Max 30 (10+5+5+10)

    // ── MID-2 EXAMINATION (Continuous Assessment 2) ──
    @Column(name = "mid2_descriptive_marks", precision = 5, scale = 2)
    private BigDecimal mid2DescriptiveMarks = BigDecimal.valueOf(28.50); // Max 30 (/3 -> 9.5)

    @Column(name = "mid2_open_book_marks", precision = 5, scale = 2)
    private BigDecimal mid2OpenBookMarks = BigDecimal.valueOf(18.00); // Max 20 (/4 -> 4.5)

    @Column(name = "mid2_objective_marks", precision = 5, scale = 2)
    private BigDecimal mid2ObjectiveMarks = BigDecimal.valueOf(19.00); // Max 20 (/2 -> 9.5)

    @Column(name = "mid2_assignment_marks", precision = 5, scale = 2)
    private BigDecimal mid2AssignmentMarks = BigDecimal.valueOf(5.00); // Max 5

    @Column(name = "mid2_total_marks", precision = 5, scale = 2)
    private BigDecimal mid2TotalMarks = BigDecimal.valueOf(23.50); // Max 30

    // ── COMBINED INTERNAL EVALUATION (Max 30) ──
    @Column(name = "converted_internal_marks", precision = 5, scale = 2)
    private BigDecimal convertedInternalMarks = BigDecimal.valueOf(27.00);

    // Legacy fields for backward compatibility
    @Column(name = "descriptive_marks", precision = 5, scale = 2)
    private BigDecimal descriptiveMarks = BigDecimal.valueOf(27.00);

    @Column(name = "open_book_marks", precision = 5, scale = 2)
    private BigDecimal openBookMarks = BigDecimal.valueOf(16.00);

    @Column(name = "objective_marks", precision = 5, scale = 2)
    private BigDecimal objectiveMarks = BigDecimal.valueOf(18.00);

    @Column(name = "assignment_marks", precision = 5, scale = 2)
    private BigDecimal assignmentMarks = BigDecimal.valueOf(5.00);

    @Column(name = "mid_marks", precision = 5, scale = 2)
    private BigDecimal midMarks = BigDecimal.valueOf(27.00);

    @Column(name = "internal_marks", precision = 5, scale = 2)
    private BigDecimal internalMarks = BigDecimal.valueOf(27.00);

    // ── SEMESTER / EXTERNAL EXAMINATION (Max 70) ──
    @Column(name = "semester_marks", precision = 5, scale = 2)
    private BigDecimal semesterMarks = BigDecimal.valueOf(65.00);

    // ── FINAL SUBJECT TOTAL (Converted Internal + Semester Exam, Max 100) ──
    @Column(name = "total_marks", precision = 5, scale = 2)
    private BigDecimal totalMarks = BigDecimal.valueOf(87.75);

    // Institutional Grade: S, A, B, C, D, E, F
    @Column(name = "grade", length = 5)
    private String grade = "A";

    // Grade Point: S=10, A=9, B=8, C=7, D=6, E=5, F=0
    @Column(name = "grade_point", precision = 4, scale = 2)
    private BigDecimal gradePoint = BigDecimal.valueOf(9.00);

    @Column(name = "attendance_percentage", precision = 5, scale = 2)
    private BigDecimal attendancePercentage = BigDecimal.valueOf(88.00);

    @Column(name = "updated_by")
    private Long updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public StudentAcademicRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public String getSemesterCode() { return semesterCode; }
    public void setSemesterCode(String semesterCode) { this.semesterCode = semesterCode; }
    public Integer getSemesterNum() { return semesterNum; }
    public void setSemesterNum(Integer semesterNum) { this.semesterNum = semesterNum; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    public Integer getCreditHours() { return creditHours; }
    public void setCreditHours(Integer creditHours) { this.creditHours = creditHours; }

    public BigDecimal getMid1DescriptiveMarks() { return mid1DescriptiveMarks; }
    public void setMid1DescriptiveMarks(BigDecimal mid1DescriptiveMarks) { this.mid1DescriptiveMarks = mid1DescriptiveMarks; }
    public BigDecimal getMid1OpenBookMarks() { return mid1OpenBookMarks; }
    public void setMid1OpenBookMarks(BigDecimal mid1OpenBookMarks) { this.mid1OpenBookMarks = mid1OpenBookMarks; }
    public BigDecimal getMid1ObjectiveMarks() { return mid1ObjectiveMarks; }
    public void setMid1ObjectiveMarks(BigDecimal mid1ObjectiveMarks) { this.mid1ObjectiveMarks = mid1ObjectiveMarks; }
    public BigDecimal getMid1TotalMarks() { return mid1TotalMarks; }
    public void setMid1TotalMarks(BigDecimal mid1TotalMarks) { this.mid1TotalMarks = mid1TotalMarks; }

    public BigDecimal getMid2DescriptiveMarks() { return mid2DescriptiveMarks; }
    public void setMid2DescriptiveMarks(BigDecimal mid2DescriptiveMarks) { this.mid2DescriptiveMarks = mid2DescriptiveMarks; }
    public BigDecimal getMid2OpenBookMarks() { return mid2OpenBookMarks; }
    public void setMid2OpenBookMarks(BigDecimal mid2OpenBookMarks) { this.mid2OpenBookMarks = mid2OpenBookMarks; }
    public BigDecimal getMid2ObjectiveMarks() { return mid2ObjectiveMarks; }
    public void setMid2ObjectiveMarks(BigDecimal mid2ObjectiveMarks) { this.mid2ObjectiveMarks = mid2ObjectiveMarks; }
    public BigDecimal getMid2TotalMarks() { return mid2TotalMarks; }
    public void setMid2TotalMarks(BigDecimal mid2TotalMarks) { this.mid2TotalMarks = mid2TotalMarks; }

    public BigDecimal getMid1AssignmentMarks() { return mid1AssignmentMarks; }
    public void setMid1AssignmentMarks(BigDecimal mid1AssignmentMarks) { this.mid1AssignmentMarks = mid1AssignmentMarks; }
    public BigDecimal getMid2AssignmentMarks() { return mid2AssignmentMarks; }
    public void setMid2AssignmentMarks(BigDecimal mid2AssignmentMarks) { this.mid2AssignmentMarks = mid2AssignmentMarks; }
    public BigDecimal getAssignmentMarks() { return assignmentMarks; }
    public void setAssignmentMarks(BigDecimal assignmentMarks) { this.assignmentMarks = assignmentMarks; }

    public BigDecimal getConvertedInternalMarks() { return convertedInternalMarks; }
    public void setConvertedInternalMarks(BigDecimal convertedInternalMarks) { this.convertedInternalMarks = convertedInternalMarks; }
    public BigDecimal getDescriptiveMarks() { return descriptiveMarks; }
    public void setDescriptiveMarks(BigDecimal descriptiveMarks) { this.descriptiveMarks = descriptiveMarks; }
    public BigDecimal getOpenBookMarks() { return openBookMarks; }
    public void setOpenBookMarks(BigDecimal openBookMarks) { this.openBookMarks = openBookMarks; }
    public BigDecimal getObjectiveMarks() { return objectiveMarks; }
    public void setObjectiveMarks(BigDecimal objectiveMarks) { this.objectiveMarks = objectiveMarks; }
    public BigDecimal getMidMarks() { return midMarks; }
    public void setMidMarks(BigDecimal midMarks) { this.midMarks = midMarks; }
    public BigDecimal getInternalMarks() { return internalMarks; }
    public void setInternalMarks(BigDecimal internalMarks) { this.internalMarks = internalMarks; }
    public BigDecimal getSemesterMarks() { return semesterMarks; }
    public void setSemesterMarks(BigDecimal semesterMarks) { this.semesterMarks = semesterMarks; }
    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public BigDecimal getGradePoint() { return gradePoint; }
    public void setGradePoint(BigDecimal gradePoint) { this.gradePoint = gradePoint; }
    public BigDecimal getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(BigDecimal attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    public Long getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(Long updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final StudentAcademicRecord r = new StudentAcademicRecord();
        public Builder id(Long id) { r.setId(id); return this; }
        public Builder student(User s) { r.setStudent(s); return this; }
        public Builder semesterCode(String sc) { r.setSemesterCode(sc); return this; }
        public Builder semesterNum(Integer sn) { r.setSemesterNum(sn); return this; }
        public Builder subjectCode(String sc) { r.setSubjectCode(sc); return this; }
        public Builder subjectName(String sn) { r.setSubjectName(sn); return this; }
        public Builder facultyName(String fn) { r.setFacultyName(fn); return this; }
        public Builder creditHours(Integer ch) { r.setCreditHours(ch); return this; }
        public Builder mid1DescriptiveMarks(BigDecimal m1d) { r.setMid1DescriptiveMarks(m1d); return this; }
        public Builder mid1OpenBookMarks(BigDecimal m1ob) { r.setMid1OpenBookMarks(m1ob); return this; }
        public Builder mid1ObjectiveMarks(BigDecimal m1obj) { r.setMid1ObjectiveMarks(m1obj); return this; }
        public Builder mid1AssignmentMarks(BigDecimal m1as) { r.setMid1AssignmentMarks(m1as); return this; }
        public Builder mid1TotalMarks(BigDecimal m1t) { r.setMid1TotalMarks(m1t); return this; }
        public Builder mid2DescriptiveMarks(BigDecimal m2d) { r.setMid2DescriptiveMarks(m2d); return this; }
        public Builder mid2OpenBookMarks(BigDecimal m2ob) { r.setMid2OpenBookMarks(m2ob); return this; }
        public Builder mid2ObjectiveMarks(BigDecimal m2obj) { r.setMid2ObjectiveMarks(m2obj); return this; }
        public Builder mid2AssignmentMarks(BigDecimal m2as) { r.setMid2AssignmentMarks(m2as); return this; }
        public Builder mid2TotalMarks(BigDecimal m2t) { r.setMid2TotalMarks(m2t); return this; }
        public Builder convertedInternalMarks(BigDecimal cim) { r.setConvertedInternalMarks(cim); return this; }
        public Builder descriptiveMarks(BigDecimal dm) { r.setDescriptiveMarks(dm); return this; }
        public Builder openBookMarks(BigDecimal obm) { r.setOpenBookMarks(obm); return this; }
        public Builder objectiveMarks(BigDecimal om) { r.setObjectiveMarks(om); return this; }
        public Builder assignmentMarks(BigDecimal am) { r.setAssignmentMarks(am); return this; }
        public Builder midMarks(BigDecimal mm) { r.setMidMarks(mm); return this; }
        public Builder internalMarks(BigDecimal im) { r.setInternalMarks(im); return this; }
        public Builder semesterMarks(BigDecimal sm) { r.setSemesterMarks(sm); return this; }
        public Builder totalMarks(BigDecimal tm) { r.setTotalMarks(tm); return this; }
        public Builder grade(String g) { r.setGrade(g); return this; }
        public Builder gradePoint(BigDecimal gp) { r.setGradePoint(gp); return this; }
        public Builder attendancePercentage(BigDecimal att) { r.setAttendancePercentage(att); return this; }
        public Builder updatedBy(Long ub) { r.setUpdatedBy(ub); return this; }
        public StudentAcademicRecord build() { return r; }
    }
}

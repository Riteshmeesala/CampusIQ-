package com.campusiq.assessment.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "results", indexes = {
        @Index(name = "idx_results_student", columnList = "student_id"),
        @Index(name = "idx_results_exam", columnList = "exam_id"),
        @Index(name = "idx_results_type", columnList = "result_type")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_result_student_exam", columnNames = {"student_id", "exam_id"})
})
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnoreProperties({"results", "hibernateLazyInitializer", "handler"})
    private Exam exam;

    @Column(name = "result_type", nullable = false, length = 10)
    private String resultType = "MID";

    @Column(name = "marks_obtained", nullable = false, precision = 6, scale = 2)
    private BigDecimal marksObtained;

    // ── Criteria Components ──
    @Column(name = "descriptive_marks", precision = 5, scale = 2)
    private BigDecimal descriptiveMarks; // Max 30 (/3 -> 10)

    @Column(name = "open_book_marks", precision = 5, scale = 2)
    private BigDecimal openBookMarks; // Max 20 (/4 -> 5)

    @Column(name = "assignment_marks", precision = 5, scale = 2)
    private BigDecimal assignmentMarks; // Max 5

    @Column(name = "objective_marks", precision = 5, scale = 2)
    private BigDecimal objectiveMarks; // Max 20 (/2 -> 10)

    @Column(name = "mid_marks", precision = 5, scale = 2)
    private BigDecimal midMarks; // Overall Mid Max 30 (10+5+5+10)

    @Column(name = "sem_marks", precision = 5, scale = 2)
    private BigDecimal semMarks; // Semester End Exam Max 70

    @Column(name = "total_marks", precision = 5, scale = 2)
    private BigDecimal totalMarks; // Total Max 100 (Sem 70 + Mid 30)

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "grade_points", precision = 4, scale = 2)
    private BigDecimal gradePoints;

    @Column(length = 5)
    private String grade;

    @Column(name = "is_pass")
    private Boolean pass;

    @Column(length = 500)
    private String remarks;

    @Column(name = "published_by")
    private Long publishedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Result() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Exam getExam() { return exam; }
    public void setExam(Exam exam) { this.exam = exam; }
    public String getResultType() { return resultType; }
    public void setResultType(String resultType) { this.resultType = resultType; }
    public BigDecimal getMarksObtained() { return marksObtained; }
    public void setMarksObtained(BigDecimal marksObtained) { this.marksObtained = marksObtained; }
    public BigDecimal getPercentage() { return percentage; }
    public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
    public BigDecimal getGradePoints() { return gradePoints; }
    public void setGradePoints(BigDecimal gradePoints) { this.gradePoints = gradePoints; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Boolean getPass() { return pass; }
    public void setPass(Boolean pass) { this.pass = pass; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getPublishedBy() { return publishedBy; }
    public void setPublishedBy(Long publishedBy) { this.publishedBy = publishedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public BigDecimal getDescriptiveMarks() { return descriptiveMarks; }
    public void setDescriptiveMarks(BigDecimal descriptiveMarks) { this.descriptiveMarks = descriptiveMarks; }
    public BigDecimal getOpenBookMarks() { return openBookMarks; }
    public void setOpenBookMarks(BigDecimal openBookMarks) { this.openBookMarks = openBookMarks; }
    public BigDecimal getAssignmentMarks() { return assignmentMarks; }
    public void setAssignmentMarks(BigDecimal assignmentMarks) { this.assignmentMarks = assignmentMarks; }
    public BigDecimal getObjectiveMarks() { return objectiveMarks; }
    public void setObjectiveMarks(BigDecimal objectiveMarks) { this.objectiveMarks = objectiveMarks; }
    public BigDecimal getMidMarks() { return midMarks; }
    public void setMidMarks(BigDecimal midMarks) { this.midMarks = midMarks; }
    public BigDecimal getSemMarks() { return semMarks; }
    public void setSemMarks(BigDecimal semMarks) { this.semMarks = semMarks; }
    public BigDecimal getTotalMarks() { return totalMarks; }
    public void setTotalMarks(BigDecimal totalMarks) { this.totalMarks = totalMarks; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final Result res = new Result();
        public Builder id(Long id) { res.setId(id); return this; }
        public Builder student(User student) { res.setStudent(student); return this; }
        public Builder exam(Exam exam) { res.setExam(exam); return this; }
        public Builder resultType(String type) { res.setResultType(type); return this; }
        public Builder marksObtained(BigDecimal marks) { res.setMarksObtained(marks); return this; }
        public Builder descriptiveMarks(BigDecimal dm) { res.setDescriptiveMarks(dm); return this; }
        public Builder openBookMarks(BigDecimal obm) { res.setOpenBookMarks(obm); return this; }
        public Builder assignmentMarks(BigDecimal am) { res.setAssignmentMarks(am); return this; }
        public Builder objectiveMarks(BigDecimal om) { res.setObjectiveMarks(om); return this; }
        public Builder midMarks(BigDecimal mm) { res.setMidMarks(mm); return this; }
        public Builder semMarks(BigDecimal sm) { res.setSemMarks(sm); return this; }
        public Builder totalMarks(BigDecimal tm) { res.setTotalMarks(tm); return this; }
        public Builder percentage(BigDecimal pct) { res.setPercentage(pct); return this; }
        public Builder gradePoints(BigDecimal gp) { res.setGradePoints(gp); return this; }
        public Builder grade(String g) { res.setGrade(g); return this; }
        public Builder pass(Boolean p) { res.setPass(p); return this; }
        public Builder remarks(String r) { res.setRemarks(r); return this; }
        public Builder publishedBy(Long pub) { res.setPublishedBy(pub); return this; }
        public Result build() { return res; }
    }
}

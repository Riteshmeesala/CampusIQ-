package com.campusiq.assessment.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;

public class ResultRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotNull(message = "Student marks map is required")
    private Map<Long, BigDecimal> studentMarks;

    // Optional breakdown per student:
    // "descriptive" (max 30, scaled /3 -> 10)
    // "openBook" (max 20, scaled /4 -> 5)
    // "assignment" (max 5)
    // "objective" (max 20, scaled /2 -> 10)
    // "sem" (max 70)
    private Map<Long, Map<String, BigDecimal>> studentBreakdowns;

    private String remarks;
    private String resultType;
    private Integer midTerm; // 1 for Mid-1, 2 for Mid-2

    public ResultRequest() {}

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public Map<Long, BigDecimal> getStudentMarks() { return studentMarks; }
    public void setStudentMarks(Map<Long, BigDecimal> studentMarks) { this.studentMarks = studentMarks; }
    public Map<Long, Map<String, BigDecimal>> getStudentBreakdowns() { return studentBreakdowns; }
    public void setStudentBreakdowns(Map<Long, Map<String, BigDecimal>> studentBreakdowns) { this.studentBreakdowns = studentBreakdowns; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getResultType() { return resultType; }
    public void setResultType(String resultType) { this.resultType = resultType; }
    public Integer getMidTerm() { return midTerm; }
    public void setMidTerm(Integer midTerm) { this.midTerm = midTerm; }
}

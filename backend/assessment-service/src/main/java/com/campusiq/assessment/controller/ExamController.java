package com.campusiq.assessment.controller;

import com.campusiq.assessment.dto.ExamRequest;
import com.campusiq.assessment.entity.Exam;
import com.campusiq.assessment.service.ExamService;
import com.campusiq.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Exam>> create(@Valid @RequestBody ExamRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(examService.createExam(req), "Exam created"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Exam>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(examService.getAllExams()));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<Exam>>> upcoming() {
        return ResponseEntity.ok(ApiResponse.success(examService.getUpcoming()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Exam>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(examService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Exam>> update(@PathVariable Long id, @Valid @RequestBody ExamRequest req) {
        return ResponseEntity.ok(ApiResponse.success(examService.updateExam(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<Exam>>> byCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(examService.getByCourse(courseId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Exam>>> myExams() {
        // Returns all exams — student-specific filtering can be added later
        return ResponseEntity.ok(ApiResponse.success(examService.getAllExams()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Exam>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Exam exam = examService.getById(id);
        try {
            exam.setStatus(Exam.ExamStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid status: " + status));
        }
        return ResponseEntity.ok(ApiResponse.success(examService.updateExam(id, null)));
    }
}

package com.campusiq.assessment.controller;

import com.campusiq.assessment.dto.ResultRequest;
import com.campusiq.assessment.entity.Result;
import com.campusiq.assessment.service.ResultService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    @GetMapping({"", "/all"})
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<List<Result>>> allResults() {
        return ResponseEntity.ok(ApiResponse.success(resultService.getAllResults()));
    }

    @PostMapping("/publish/mid")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<List<Result>>> publishMid(
            @RequestBody ResultRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long publisherId = me != null ? me.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(
                resultService.publishResults(req, "MID", publisherId),
                "Mid-semester results published successfully"));
    }

    @PostMapping("/publish/sem")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Result>>> publishSem(
            @RequestBody ResultRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long publisherId = me != null ? me.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(
                resultService.publishResults(req, "SEM", publisherId),
                "Semester results published successfully"));
    }

    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<List<Result>>> publish(
            @RequestBody ResultRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long publisherId = me != null ? me.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(
                resultService.publishResults(req, "MID", publisherId)));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Result>>> myResults(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getStudentResults(me.getId())));
    }

    @GetMapping("/my/mid")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<Result>>> myMidResults(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getStudentResultsByType(me.getId(), "MID")));
    }

    @GetMapping("/my/sem")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<Result>>> mySemResults(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getStudentResultsByType(me.getId(), "SEM")));
    }

    @GetMapping("/my/gpa")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myGpa(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getStudentGPA(me.getId())));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<List<Result>>> byStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getStudentResults(studentId)));
    }

    @GetMapping("/student/{studentId}/gpa")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> studentGpa(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getStudentGPA(studentId)));
    }

    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<List<Result>>> byExam(@PathVariable Long examId) {
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getExamResults(examId)));
    }

    @GetMapping("/student/{studentId}/semester/{semester}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> studentSemesterGpa(
            @PathVariable Long studentId,
            @PathVariable String semester) {
        int sem = 1;
        try {
            String digits = semester != null ? semester.replaceAll("[^0-9]", "") : "";
            if (!digits.isEmpty()) {
                sem = Integer.parseInt(digits);
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(ApiResponse.success(
                resultService.getSemesterGPA(studentId, sem)));
    }
}

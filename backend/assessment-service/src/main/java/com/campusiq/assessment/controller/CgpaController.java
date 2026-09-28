package com.campusiq.assessment.controller;

import com.campusiq.assessment.dto.CgpaUploadRequest;
import com.campusiq.assessment.entity.StudentCgpa;
import com.campusiq.assessment.service.CgpaService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cgpa")
public class CgpaController {

    private final CgpaService cgpaService;

    public CgpaController(CgpaService cgpaService) {
        this.cgpaService = cgpaService;
    }

    @PostMapping("/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentCgpa>>> publishCgpa(
            @RequestBody CgpaUploadRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long adminId = me != null ? me.getId() : 1L;
        List<StudentCgpa> result = cgpaService.publishCgpa(req, adminId);
        return ResponseEntity.ok(ApiResponse.success(
                result,
                result.size() + " student CGPA record(s) published successfully"));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<StudentCgpa>>> getMyCgpa(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(cgpaService.getStudentCgpa(me.getId())));
    }

    @GetMapping("/student/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT','FACULTY')")
    public ResponseEntity<ApiResponse<List<StudentCgpa>>> getStudentCgpa(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cgpaService.getStudentCgpa(id)));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentCgpa>>> getAllCgpa() {
        return ResponseEntity.ok(ApiResponse.success(cgpaService.getAllCgpa()));
    }
}

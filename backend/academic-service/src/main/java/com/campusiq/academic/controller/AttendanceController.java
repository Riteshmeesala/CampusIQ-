package com.campusiq.academic.controller;

import com.campusiq.academic.dto.AttendanceRequest;
import com.campusiq.academic.entity.Attendance;
import com.campusiq.academic.service.AttendanceService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/mark")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<List<Attendance>>> mark(
            @Valid @RequestBody AttendanceRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long markerId = me != null ? me.getId() : null;
        var records = attendanceService.markAttendance(req, markerId);
        return ResponseEntity.ok(ApiResponse.success(records, "Marked " + records.size() + " records"));
    }

    @GetMapping({"", "/all"})
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<List<Attendance>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAllAttendance()));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Attendance>>> myAttendance(@AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getStudentAttendance(me.getId())));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<List<Attendance>>> studentAttendance(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getStudentAttendance(studentId)));
    }

    @GetMapping("/student/{studentId}/course/{courseId}/percentage")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<BigDecimal>> percentage(
            @PathVariable Long studentId, @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getPercentage(studentId, courseId)));
    }

    @GetMapping("/course/{courseId}/date/{date}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<List<Attendance>>> courseByDate(
            @PathVariable Long courseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getCourseAttendanceByDate(courseId, date)));
    }
}

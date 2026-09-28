package com.campusiq.academic.controller;

import com.campusiq.academic.entity.TimetableSlot;
import com.campusiq.academic.service.TimetableService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/timetable", "/timetables"})
public class TimetableController {

    private final TimetableService timetableService;

    public TimetableController(TimetableService timetableService) {
        this.timetableService = timetableService;
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN','STUDENT')")
    public ResponseEntity<ApiResponse<List<TimetableSlot>>> getMyTimetable(
            @AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        if (me.getRole() != null && me.getRole().name().equals("STUDENT")) {
            return ResponseEntity.ok(ApiResponse.success(timetableService.getStudentTimetable(me.getId())));
        }
        return ResponseEntity.ok(ApiResponse.success(timetableService.getFacultyTimetable(me.getId())));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN','STUDENT')")
    public ResponseEntity<ApiResponse<List<TimetableSlot>>> getFacultyTimetable(
            @PathVariable Long facultyId) {
        return ResponseEntity.ok(ApiResponse.success(timetableService.getFacultyTimetable(facultyId)));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN','STUDENT')")
    public ResponseEntity<ApiResponse<List<TimetableSlot>>> getCourseTimetable(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(timetableService.getCourseTimetable(courseId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<TimetableSlot>> addSlot(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestBody Map<String, Object> req) {
        Long facultyId = me != null && me.getRole().name().equals("ADMIN") && req.containsKey("facultyId")
                ? Long.valueOf(req.get("facultyId").toString())
                : (me != null ? me.getId() : 1L);
        TimetableSlot slot = timetableService.addSlot(facultyId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(slot, "Timetable slot added successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<TimetableSlot>> updateSlot(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req) {
        TimetableSlot slot = timetableService.updateSlot(id, req);
        return ResponseEntity.ok(ApiResponse.success(slot, "Timetable slot updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(@PathVariable Long id) {
        timetableService.deleteSlot(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Timetable slot deleted"));
    }
}

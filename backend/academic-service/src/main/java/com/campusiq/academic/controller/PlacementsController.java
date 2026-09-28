package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/placements")
public class PlacementsController {

    private final List<Map<String, Object>> drives = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> applications = new CopyOnWriteArrayList<>();

    public PlacementsController() {
        initSampleData();
    }

    private void initSampleData() {
        drives.add(Map.of(
                "id", "DRV-2026-01",
                "company", "Google Cloud India",
                "role", "Software Engineer - Backend & Cloud",
                "ctc", "₹ 24.5 LPA",
                "eligibilityCgpa", 8.0,
                "deadline", "15 Sep 2026",
                "interviewDate", "22 Sep 2026",
                "status", "Applications Open"
        ));
        drives.add(Map.of(
                "id", "DRV-2026-02",
                "company", "Microsoft IDC",
                "role", "Full Stack Engineer (Core Services)",
                "ctc", "₹ 21.0 LPA",
                "eligibilityCgpa", 7.5,
                "deadline", "18 Sep 2026",
                "interviewDate", "25 Sep 2026",
                "status", "Applications Open"
        ));
    }

    @GetMapping({"", "/drives"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDrives() {
        return ResponseEntity.ok(ApiResponse.success(drives));
    }

    @PostMapping("/apply/{driveId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyDrive(
            @PathVariable String driveId,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> app = new HashMap<>(body);
        app.put("appId", "APP-PL-" + (1000 + new Random().nextInt(9000)));
        app.put("driveId", driveId);
        app.put("appliedDate", LocalDate.now().toString());
        app.put("status", "Shortlisted for Online Assessment");
        applications.add(0, app);
        return ResponseEntity.ok(ApiResponse.success(app, "Application submitted for placement drive"));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPlacementCalendar() {
        List<Map<String, Object>> calendar = List.of(
                Map.of("title", "Google Cloud Pre-Placement Talk", "date", "2026-09-12", "time", "03:00 PM", "venue", "Main Auditorium"),
                Map.of("title", "Microsoft IDC Coding Round", "date", "2026-09-20", "time", "10:00 AM", "venue", "Online Proctored Lab"),
                Map.of("title", "Amazon AWS Technical Interviews", "date", "2026-09-28", "time", "09:00 AM", "venue", "Placement Cell Cabin 1-4")
        );
        return ResponseEntity.ok(ApiResponse.success(calendar));
    }
}

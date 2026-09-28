package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/department-events")
public class DepartmentEventsController {

    private final List<Map<String, Object>> events = new CopyOnWriteArrayList<>();

    public DepartmentEventsController() {
        initSampleData();
    }

    private void initSampleData() {
        events.add(Map.of(
                "id", "EVT-2026-01",
                "title", "National Symposium on Generative AI & High-Performance Computing",
                "category", "Technical Symposium",
                "department", "Computer Science & Engineering",
                "startDate", "2026-09-18",
                "endDate", "2026-09-19",
                "venue", "Main Auditorium & Computing Lab 4",
                "coordinator", "Dr. S. K. Sharma",
                "status", "Upcoming"
        ));
        events.add(Map.of(
                "id", "EVT-2026-02",
                "title", "Annual 24-Hour Smart Campus Hackathon",
                "category", "Hackathon",
                "department", "Computer Science & Engineering",
                "startDate", "2026-10-05",
                "endDate", "2026-10-06",
                "venue", "Incubation Center Block-A",
                "coordinator", "Prof. Ananya Sen",
                "status", "Registrations Open"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEvents() {
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publishEvent(@RequestBody Map<String, Object> req) {
        Map<String, Object> ev = new HashMap<>(req);
        ev.put("id", "EVT-2026-" + (10 + new Random().nextInt(90)));
        ev.put("status", "Published");
        events.add(0, ev);
        return ResponseEntity.ok(ApiResponse.success(ev, "Department event published successfully"));
    }
}

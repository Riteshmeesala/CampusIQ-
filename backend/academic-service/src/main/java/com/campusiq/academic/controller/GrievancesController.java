package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/grievances")
public class GrievancesController {

    private final List<Map<String, Object>> grievances = new CopyOnWriteArrayList<>();

    public GrievancesController() {
        initSampleData();
    }

    private void initSampleData() {
        Map<String, Object> g1 = new HashMap<>();
        g1.put("id", "GRV-2026-104");
        g1.put("studentName", "Ritesh Meesala");
        g1.put("rollNo", "23CS042");
        g1.put("category", "Library Infrastructure");
        g1.put("subject", "Digital Library Wi-Fi Disconnections in 2nd Floor Reading Hall");
        g1.put("desc", "Frequent dropouts during evening project study hours.");
        g1.put("date", "2026-08-28");
        g1.put("status", "In Progress");
        g1.put("response", "IT team is installing additional dual-band access points this weekend.");
        grievances.add(g1);

        Map<String, Object> g2 = new HashMap<>();
        g2.put("id", "GRV-2026-088");
        g2.put("studentName", "Ritesh Meesala");
        g2.put("rollNo", "23CS042");
        g2.put("category", "Canteen & Water");
        g2.put("subject", "Water Purifier Filter Maintenance in Block-A");
        g2.put("desc", "RO water output taste was bitter.");
        g2.put("date", "2026-07-15");
        g2.put("status", "Resolved");
        g2.put("response", "RO membrane replaced and certified by campus maintenance officer.");
        grievances.add(g2);
    }

    @GetMapping({"", "/my"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllGrievances() {
        return ResponseEntity.ok(ApiResponse.success(grievances));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitGrievance(@RequestBody Map<String, Object> req) {
        Map<String, Object> g = new HashMap<>(req);
        String id = "GRV-2026-" + (100 + new Random().nextInt(900));
        g.put("id", id);
        g.put("date", LocalDate.now().toString());
        g.put("status", "In Review");
        g.put("response", "Acknowledged by Institutional Grievance Redressal Committee. Investigation in progress.");
        grievances.add(0, g);
        return ResponseEntity.ok(ApiResponse.success(g, "Grievance recorded successfully"));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveGrievance(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        for (Map<String, Object> g : grievances) {
            if (Objects.equals(g.get("id"), id)) {
                g.put("status", "Resolved");
                g.put("response", body.getOrDefault("response", "Action verified and resolved."));
                return ResponseEntity.ok(ApiResponse.success(g, "Grievance resolved successfully"));
            }
        }
        return ResponseEntity.status(404).body(ApiResponse.error("Grievance record not found"));
    }
}

package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/student-services")
public class StudentServicesController {

    // Thread-safe in-memory stores for real-time demonstration & fast API responses
    private final List<Map<String, Object>> leavesStore = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> grievancesStore = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> certificatesStore = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> counselingStore = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> surveysStore = new CopyOnWriteArrayList<>();

    public StudentServicesController() {
        initSampleData();
    }

    private void initSampleData() {
        // Sample Leaves
        Map<String, Object> lv1 = new HashMap<>();
        lv1.put("id", "LV-2026-092");
        lv1.put("studentName", "Ritesh Meesala");
        lv1.put("rollNo", "23CS042");
        lv1.put("type", "On-Duty (OD)");
        lv1.put("fromDate", "2026-09-04");
        lv1.put("toDate", "2026-09-04");
        lv1.put("days", 1);
        lv1.put("reason", "Participating in IEEE Student Hackathon at IIT Hyderabad");
        lv1.put("status", "Approved");
        lv1.put("approvedBy", "HOD CSE");
        leavesStore.add(lv1);

        // Sample Certificates
        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", "CERT-TC-2026-042");
        c1.put("studentName", "Ritesh Meesala");
        c1.put("rollNo", "23CS042");
        c1.put("type", "Transfer Certificate (TC)");
        c1.put("issueDate", "2026-08-18");
        c1.put("status", "Issued & Digitally Signed");
        certificatesStore.add(c1);

        // Sample Grievances
        Map<String, Object> g1 = new HashMap<>();
        g1.put("id", "GRV-2026-104");
        g1.put("studentName", "Ritesh Meesala");
        g1.put("rollNo", "23CS042");
        g1.put("category", "Library Infrastructure");
        g1.put("subject", "Digital Library Wi-Fi Disconnections in 2nd Floor Reading Hall");
        g1.put("date", "2026-08-28");
        g1.put("status", "In Progress");
        g1.put("response", "IT team is installing additional dual-band access points.");
        grievancesStore.add(g1);

        // Sample Counseling
        Map<String, Object> cs1 = new HashMap<>();
        cs1.put("id", "CSL-2026-01");
        cs1.put("studentName", "Ritesh Meesala");
        cs1.put("rollNo", "23CS042");
        cs1.put("mentorName", "Prof. Ananya Sen");
        cs1.put("date", "18 Aug 2026");
        cs1.put("type", "Semester Progress Review");
        cs1.put("mentorRemarks", "Exceptional academic consistency in ML and Systems.");
        cs1.put("outcome", "Satisfactory");
        cs1.put("status", "Completed");
        counselingStore.add(cs1);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("totalLeaves", leavesStore.size());
        overview.put("totalCertificates", certificatesStore.size());
        overview.put("totalGrievances", grievancesStore.size());
        overview.put("totalCounselingSessions", counselingStore.size());
        overview.put("status", "ACTIVE");
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    // ==========================================
    // 1. LEAVES & ON-DUTY (OD) ENDPOINTS
    // ==========================================
    @GetMapping("/leaves")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLeaves() {
        return ResponseEntity.ok(ApiResponse.success(leavesStore));
    }

    @PostMapping("/leaves/apply")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyLeave(@RequestBody Map<String, Object> req, @AuthenticationPrincipal UserPrincipal me) {
        Map<String, Object> newLeave = new HashMap<>(req);
        String id = "LV-2026-" + (100 + new Random().nextInt(900));
        newLeave.put("id", id);
        newLeave.put("status", "Pending Review");
        newLeave.put("dateApplied", LocalDate.now().toString());
        if (me != null && me.getUsername() != null) {
            newLeave.put("studentName", me.getUsername());
        }
        leavesStore.add(0, newLeave);
        return ResponseEntity.ok(ApiResponse.success(newLeave, "Leave application submitted successfully"));
    }

    @PutMapping("/leaves/{id}/status")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateLeaveStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate,
            @AuthenticationPrincipal UserPrincipal me) {
        for (Map<String, Object> lv : leavesStore) {
            if (Objects.equals(lv.get("id"), id)) {
                lv.put("status", statusUpdate.getOrDefault("status", "Approved"));
                lv.put("approvedBy", me != null ? me.getUsername() : "Faculty Reviewer");
                return ResponseEntity.ok(ApiResponse.success(lv, "Leave status updated"));
            }
        }
        return ResponseEntity.status(404).body(ApiResponse.error("Leave record not found"));
    }

    // ==========================================
    // 2. CERTIFICATES ENDPOINTS
    // ==========================================
    @GetMapping("/certificates")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCertificates() {
        return ResponseEntity.ok(ApiResponse.success(certificatesStore));
    }

    @PostMapping("/certificates/request")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestCertificate(@RequestBody Map<String, Object> req) {
        Map<String, Object> cert = new HashMap<>(req);
        String id = "CERT-" + (1000 + new Random().nextInt(9000));
        cert.put("id", id);
        cert.put("applyDate", LocalDate.now().toString());
        cert.put("issueDate", LocalDate.now().plusDays(2).toString());
        cert.put("status", "Issued & Digitally Signed");
        certificatesStore.add(0, cert);
        return ResponseEntity.ok(ApiResponse.success(cert, "Certificate generated successfully"));
    }

    // ==========================================
    // 3. GRIEVANCES ENDPOINTS
    // ==========================================
    @GetMapping("/grievances")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGrievances() {
        return ResponseEntity.ok(ApiResponse.success(grievancesStore));
    }

    @PostMapping("/grievances/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitGrievance(@RequestBody Map<String, Object> req) {
        Map<String, Object> grv = new HashMap<>(req);
        String id = "GRV-2026-" + (100 + new Random().nextInt(900));
        grv.put("id", id);
        grv.put("date", LocalDate.now().toString());
        grv.put("status", "In Review");
        grv.put("response", "Acknowledged by Institutional Grievance Redressal Committee");
        grievancesStore.add(0, grv);
        return ResponseEntity.ok(ApiResponse.success(grv, "Grievance submitted"));
    }

    @PutMapping("/grievances/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveGrievance(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        for (Map<String, Object> g : grievancesStore) {
            if (Objects.equals(g.get("id"), id)) {
                g.put("status", "Resolved");
                g.put("response", body.getOrDefault("response", "Action taken and resolved"));
                return ResponseEntity.ok(ApiResponse.success(g, "Grievance marked as resolved"));
            }
        }
        return ResponseEntity.status(404).body(ApiResponse.error("Grievance not found"));
    }

    // ==========================================
    // 4. COUNSELING & MENTORING ENDPOINTS
    // ==========================================
    @GetMapping("/mentoring")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMentoringLogs() {
        return ResponseEntity.ok(ApiResponse.success(counselingStore));
    }

    @PostMapping("/mentoring/book")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bookSession(@RequestBody Map<String, Object> req) {
        Map<String, Object> session = new HashMap<>(req);
        String id = "CSL-2026-" + (100 + new Random().nextInt(900));
        session.put("id", id);
        session.put("status", "Scheduled");
        counselingStore.add(0, session);
        return ResponseEntity.ok(ApiResponse.success(session, "Mentoring session booked"));
    }

    @PutMapping("/mentoring/{id}/remarks")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addRemarks(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        for (Map<String, Object> cs : counselingStore) {
            if (Objects.equals(cs.get("id"), id)) {
                cs.put("mentorRemarks", body.getOrDefault("mentorRemarks", ""));
                cs.put("outcome", body.getOrDefault("outcome", "Satisfactory"));
                cs.put("status", "Completed");
                return ResponseEntity.ok(ApiResponse.success(cs, "Remarks saved"));
            }
        }
        return ResponseEntity.status(404).body(ApiResponse.error("Session not found"));
    }

    // ==========================================
    // 5. SURVEYS (NAAC SSS / NBA CES)
    // ==========================================
    @PostMapping("/surveys/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitSurvey(@RequestBody Map<String, Object> req) {
        Map<String, Object> s = new HashMap<>(req);
        s.put("timestamp", LocalDateTime.now().toString());
        surveysStore.add(s);
        return ResponseEntity.ok(ApiResponse.success(s, "Survey response recorded successfully"));
    }

    // ==========================================
    // 6. BUS ROUTES & HOSTEL
    // ==========================================
    @GetMapping("/bus-routes")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBusRoutes() {
        List<Map<String, Object>> routes = List.of(
                Map.of("routeNo", "Route 14", "name", "Gachibowli Express", "busNo", "TS-09-UB-8821", "speed", "38 km/h", "nextStop", "Cyber Towers", "status", "On Schedule"),
                Map.of("routeNo", "Route 08", "name", "Secunderabad Metro Link", "busNo", "TS-09-UB-1044", "speed", "42 km/h", "nextStop", "Begumpet Flyover", "status", "On Schedule"),
                Map.of("routeNo", "Route 22", "name", "Kukatpally Shuttle", "busNo", "TS-09-UB-5502", "speed", "31 km/h", "nextStop", "JNTU Junction", "status", "On Schedule")
        );
        return ResponseEntity.ok(ApiResponse.success(routes));
    }
}

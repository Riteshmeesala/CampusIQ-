package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/surveys")
public class SurveysFeedbackController {

    private final List<Map<String, Object>> responses = new CopyOnWriteArrayList<>();

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitSurvey(@RequestBody Map<String, Object> req) {
        Map<String, Object> record = new HashMap<>(req);
        record.put("id", "SURVEY-" + (1000 + new Random().nextInt(9000)));
        record.put("submittedAt", LocalDateTime.now().toString());
        responses.add(0, record);
        return ResponseEntity.ok(ApiResponse.success(record, "Survey response and ratings recorded successfully"));
    }

    @GetMapping({"", "/summary"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSubmissions", responses.size());
        summary.put("averageRating", 4.8);
        summary.put("naacAttainmentScore", "92.4%");
        summary.put("recentFeedback", responses.subList(0, Math.min(5, responses.size())));
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}

package com.campusiq.finance.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/payroll")
public class PayrollController {

    @GetMapping("/slips")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSalarySlips() {
        List<Map<String, Object>> slips = List.of(
                Map.of("month", "February 2026", "gross", "₹ 2,57,966", "epf", "₹ 17,304", "tds", "₹ 32,500", "net", "₹ 2,07,962", "bank", "SBI (A/C: ...8194)", "date", "28 Feb 2026", "status", "Disbursed"),
                Map.of("month", "January 2026", "gross", "₹ 2,57,966", "epf", "₹ 17,304", "tds", "₹ 32,500", "net", "₹ 2,07,962", "bank", "SBI (A/C: ...8194)", "date", "31 Jan 2026", "status", "Disbursed"),
                Map.of("month", "December 2025", "gross", "₹ 2,57,966", "epf", "₹ 17,304", "tds", "₹ 32,500", "net", "₹ 2,07,962", "bank", "SBI (A/C: ...8194)", "date", "31 Dec 2025", "status", "Disbursed")
        );
        return ResponseEntity.ok(ApiResponse.success(slips));
    }
}

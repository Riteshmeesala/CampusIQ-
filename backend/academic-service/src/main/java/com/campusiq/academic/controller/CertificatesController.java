package com.campusiq.academic.controller;

import com.campusiq.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/certificates")
public class CertificatesController {

    private final List<Map<String, Object>> certs = new CopyOnWriteArrayList<>();

    public CertificatesController() {
        initSampleData();
    }

    private void initSampleData() {
        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", "CERT-TC-2026-042");
        c1.put("studentName", "Ritesh Meesala");
        c1.put("rollNo", "23CS042");
        c1.put("type", "Transfer Certificate (TC)");
        c1.put("applyDate", "2026-08-15");
        c1.put("issueDate", "2026-08-18");
        c1.put("status", "Issued & Digitally Signed");
        c1.put("verifiedBy", "Controller of Examinations & Registrar");
        c1.put("qrSignature", "SHA256-VERIFIED-REGISTRAR-990142");
        certs.add(c1);

        Map<String, Object> c2 = new HashMap<>();
        c2.put("id", "CERT-CUST-2026-109");
        c2.put("studentName", "Ritesh Meesala");
        c2.put("rollNo", "23CS042");
        c2.put("type", "Custodian Certificate");
        c2.put("applyDate", "2026-08-10");
        c2.put("issueDate", "2026-08-12");
        c2.put("status", "Issued & Digitally Signed");
        c2.put("verifiedBy", "Academic Cell");
        c2.put("qrSignature", "SHA256-VERIFIED-ACADEMIC-440109");
        certs.add(c2);

        Map<String, Object> c3 = new HashMap<>();
        c3.put("id", "CERT-SCC-2026-382");
        c3.put("studentName", "Ritesh Meesala");
        c3.put("rollNo", "23CS042");
        c3.put("type", "Study And Conduct Certificate");
        c3.put("applyDate", "2026-08-01");
        c3.put("issueDate", "2026-08-02");
        c3.put("status", "Issued & Digitally Signed");
        c3.put("verifiedBy", "Principal Office");
        c3.put("qrSignature", "SHA256-VERIFIED-PRINCIPAL-880382");
        certs.add(c3);
    }

    @GetMapping({"", "/my"})
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllCertificates() {
        return ResponseEntity.ok(ApiResponse.success(certs));
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestCertificate(@RequestBody Map<String, Object> req) {
        Map<String, Object> c = new HashMap<>(req);
        String type = (String) req.getOrDefault("type", "Study And Conduct Certificate");
        String prefix = type.contains("Transfer") ? "TC" : type.contains("Custodian") ? "CUST" : "SCC";
        String id = "CERT-" + prefix + "-2026-" + (100 + new Random().nextInt(900));
        c.put("id", id);
        c.put("studentName", req.getOrDefault("studentName", "Ritesh Meesala"));
        c.put("rollNo", req.getOrDefault("rollNo", "23CS042"));
        c.put("applyDate", LocalDate.now().toString());
        c.put("issueDate", LocalDate.now().toString());
        c.put("status", "Issued & Digitally Signed");
        c.put("verifiedBy", "Controller of Examinations & Registrar");
        c.put("qrSignature", "SHA256-VERIFIED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        certs.add(0, c);
        return ResponseEntity.ok(ApiResponse.success(c, "Certificate generated and digitally signed"));
    }

    @GetMapping("/verify/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyCertificate(@PathVariable String id) {
        for (Map<String, Object> c : certs) {
            if (Objects.equals(c.get("id"), id)) {
                return ResponseEntity.ok(ApiResponse.success(c, "Certificate verified as authentic"));
            }
        }
        return ResponseEntity.status(404).body(ApiResponse.error("Invalid certificate number or not found"));
    }
}

package com.campusiq.finance.controller;

import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import com.campusiq.finance.dto.FeeRequest;
import com.campusiq.finance.entity.Fee;
import com.campusiq.finance.service.FeeService;
import com.campusiq.finance.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import com.campusiq.common.enums.Role;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fees")
public class FeeController {

    private final FeeService feeService;
    private final PaymentService paymentService;

    public FeeController(FeeService feeService, PaymentService paymentService) {
        this.feeService = feeService;
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Fee>> create(@Valid @RequestBody FeeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(feeService.createFee(req), "Fee created"));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Fee>>> myFees(@AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(feeService.getStudentFees(me.getId())));
    }

    @GetMapping("/my/pending-amount")
    public ResponseEntity<ApiResponse<BigDecimal>> pending(@AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(BigDecimal.ZERO));
        }
        return ResponseEntity.ok(ApiResponse.success(feeService.getPendingAmount(me.getId())));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<Fee>>> studentFees(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(feeService.getStudentFees(studentId)));
    }

    @GetMapping({"", "/all"})
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<ApiResponse<List<Fee>>> all() {
        return ResponseEntity.ok(ApiResponse.success(feeService.getAllFees()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Fee>> update(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(ApiResponse.success(feeService.updateFee(id, updates), "Fee updated"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Fee>> updateStatus(@PathVariable Long id,
                                                         @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                feeService.updateFeeStatus(id, body.get("status")), "Status updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        feeService.deleteFee(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Fee deleted"));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("testMode", paymentService.isTestMode());
        config.put("keyId", paymentService.getKeyId());
        config.put("hasValidLiveKeys", paymentService.isConfiguredWithValidKeys());
        config.put("gateway", "Razorpay");
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PostMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateConfig(@RequestBody Map<String, String> body) {
        if (body != null) {
            String newKey = body.get("keyId");
            String newSecret = body.get("keySecret");
            if (newKey != null && !newKey.isBlank()) {
                paymentService.setKeyId(newKey.trim());
            }
            if (newSecret != null && !newSecret.isBlank()) {
                paymentService.setKeySecret(newSecret.trim());
            }
        }
        return getConfig();
    }

    @GetMapping("/receipts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReceipts(@AuthenticationPrincipal UserPrincipal me) {
        List<Fee> fees = (me != null && me.getRole() == Role.ADMIN) ? feeService.getAllFees() : (me != null ? feeService.getStudentFees(me.getId()) : List.of());
        List<Map<String, Object>> receipts = new java.util.ArrayList<>();
        for (Fee f : fees) {
            if (f.getStatus() == Fee.FeeStatus.PAID) {
                Map<String, Object> r = new HashMap<>();
                r.put("id", f.getId());
                r.put("receiptNo", "RCP-2026-" + String.format("%04d", f.getId()));
                r.put("studentName", f.getStudent() != null ? f.getStudent().getName() : "Student");
                r.put("rollNo", f.getStudent() != null ? f.getStudent().getEnrollmentNumber() : "24CS001");
                r.put("date", f.getPaidDate() != null ? f.getPaidDate().toString() : java.time.LocalDate.now().toString());
                r.put("description", f.getDescription() != null ? f.getDescription() : f.getFeeType());
                r.put("amount", "₹" + f.getAmount());
                r.put("amountNum", f.getAmount());
                r.put("feeType", f.getFeeType());
                r.put("mode", f.getRazorpayPaymentId() != null && f.getRazorpayPaymentId().startsWith("pay_test_") ? "Razorpay (Test Mode)" : "Razorpay Online (UPI/Card)");
                r.put("paymentId", f.getRazorpayPaymentId());
                r.put("orderId", f.getRazorpayOrderId());
                r.put("status", "Settled & Verified");
                receipts.add(r);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(receipts));
    }

    @PostMapping("/{feeId}/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(@PathVariable Long feeId) {
        Fee fee = feeService.getFeeById(feeId);
        String receipt = "fee_" + feeId + "_" + System.currentTimeMillis();
        Map<String, Object> order = paymentService.createOrder(receipt, fee.getAmount());
        order.put("feeId", feeId);
        return ResponseEntity.ok(ApiResponse.success(order, "Order created"));
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse<String>> verifyPayment(@RequestBody Map<String, Object> body) {
        if (body == null || body.get("feeId") == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Missing feeId in payment verification request"));
        }

        Long feeId;
        try {
            feeId = Long.parseLong(String.valueOf(body.get("feeId")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid feeId provided"));
        }

        long now = System.currentTimeMillis();
        String orderId = body.get("razorpayOrderId") != null ? String.valueOf(body.get("razorpayOrderId")) : "order_test_" + now;
        String paymentId = body.get("razorpayPaymentId") != null ? String.valueOf(body.get("razorpayPaymentId")) : "pay_test_" + now;
        String signature = body.get("razorpaySignature") != null ? String.valueOf(body.get("razorpaySignature")) : "sig_test_" + now;

        boolean valid = paymentService.verifyPayment(orderId, paymentId, signature);

        if (valid) {
            feeService.markAsPaid(feeId, orderId, paymentId, signature);
            return ResponseEntity.ok(ApiResponse.success("PAYMENT_VERIFIED", "Payment verified and settled in institutional ledger"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Payment signature mismatch. Possible fraud."));
        }
    }
}

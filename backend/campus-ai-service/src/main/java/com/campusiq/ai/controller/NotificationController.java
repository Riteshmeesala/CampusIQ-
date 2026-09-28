package com.campusiq.ai.controller;

import com.campusiq.ai.dto.BroadcastEmailRequest;
import com.campusiq.ai.entity.Notification;
import com.campusiq.ai.entity.Notification.NotificationType;
import com.campusiq.ai.service.NotificationService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping({"", "/my"})
    public ResponseEntity<ApiResponse<List<Notification>>> getAll(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(notificationService.getAll(me.getId(), page, size)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<Notification>>> unread(@AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnread(me.getId())));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> count(@AuthenticationPrincipal UserPrincipal me) {
        if (me == null || me.getId() == null) {
            return ResponseEntity.ok(ApiResponse.success(0L));
        }
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(me.getId())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Marked as read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal UserPrincipal me) {
        if (me != null && me.getId() != null) {
            notificationService.markAllRead(me.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "All marked as read"));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> broadcast(
            @Valid @RequestBody BroadcastEmailRequest req) {

        NotificationType type = NotificationType.GENERAL;
        String lower = req.getSubject().toLowerCase();
        if (lower.contains("holiday") || lower.contains("leave")) {
            type = NotificationType.HOLIDAY;
        } else if (lower.contains("event") || lower.contains("fest") || lower.contains("seminar")) {
            type = NotificationType.EVENT;
        }

        int count = notificationService.broadcastToStudents(
                req.getSubject(), req.getMessage(), req.getTargetRole(), type);

        return ResponseEntity.ok(ApiResponse.success(
                Map.of("notified", count, "subject", req.getSubject()),
                "Broadcast sent to " + count + " users"));
    }
}

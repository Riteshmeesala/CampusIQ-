package com.campusiq.ai.service;

import com.campusiq.ai.dto.AnnouncementRequest;
import com.campusiq.ai.entity.Notification;
import com.campusiq.ai.entity.Notification.NotificationType;
import com.campusiq.ai.entity.User;
import com.campusiq.ai.repository.NotificationRepository;
import com.campusiq.ai.repository.UserRepository;
import com.campusiq.common.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnnouncementService {

    private static final Logger log = LoggerFactory.getLogger(AnnouncementService.class);

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public record AnnouncementResult(
            int totalStudents,
            int emailsSent,
            int notificationsSaved,
            int failures
    ) {}

    public AnnouncementService(UserRepository userRepository, NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public AnnouncementResult send(AnnouncementRequest req) {
        List<User> targets;
        if (req.getTargetUserIds() != null && !req.getTargetUserIds().isEmpty()) {
            targets = userRepository.findAllById(req.getTargetUserIds());
        } else {
            targets = userRepository.findByRole(Role.STUDENT);
        }

        int emails = 0, notifs = 0, fails = 0;
        String icon = typeIcon(req.getType());

        for (User user : targets) {
            if (req.isSaveNotification()) {
                try {
                    Notification n = Notification.builder()
                            .user(user)
                            .title(icon + " " + req.getSubject())
                            .message(req.getBody())
                            .type(NotificationType.GENERAL)
                            .read(false)
                            .build();
                    notificationRepository.save(n);
                    notifs++;
                } catch (Exception e) {
                    log.warn("Failed to save notification for {}: {}", user.getUsername(), e.getMessage());
                    fails++;
                }
            }
        }

        log.info("Announcement '{}' sent to {} students (notifs saved: {})",
                req.getSubject(), targets.size(), notifs);

        return new AnnouncementResult(targets.size(), emails, notifs, fails);
    }

    private String typeIcon(String type) {
        if (type == null) return "📢";
        return switch (type.toUpperCase()) {
            case "HOLIDAY" -> "🏖️";
            case "EXAM" -> "📝";
            case "EVENT" -> "🎉";
            case "URGENT" -> "🚨";
            case "FEE" -> "💳";
            default -> "📢";
        };
    }

    public List<Notification> getAllAnnouncements() {
        return notificationRepository.findAll();
    }
}

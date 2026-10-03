package com.campusiq.ai.controller;

import com.campusiq.ai.dto.ChatRequest;
import com.campusiq.ai.entity.ChatSession;
import com.campusiq.ai.entity.User;
import com.campusiq.ai.repository.UserRepository;
import com.campusiq.ai.service.AIChatbotService;
import com.campusiq.common.dto.ApiResponse;
import com.campusiq.common.enums.Role;
import com.campusiq.common.security.UserPrincipal;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chatbot")
public class ChatbotController {

    private static final Logger log = LoggerFactory.getLogger(ChatbotController.class);

    private final AIChatbotService aiChatbotService;
    private final UserRepository userRepository;

    public ChatbotController(AIChatbotService aiChatbotService, UserRepository userRepository) {
        this.aiChatbotService = aiChatbotService;
        this.userRepository = userRepository;
    }

    private User resolveUser(UserPrincipal currentUser) {
        User user = null;
        if (currentUser != null && currentUser.getId() != null) {
            user = userRepository.findById(currentUser.getId())
                    .or(() -> userRepository.findByUsername(currentUser.getUsername()))
                    .or(() -> userRepository.findByEmail(currentUser.getEmail()))
                    .orElse(null);
        }

        if (user == null) {
            user = new User();
            if (currentUser != null) {
                user.setId(currentUser.getId() != null ? currentUser.getId() : 11L);
                user.setUsername(currentUser.getUsername() != null ? currentUser.getUsername() : "admin");
                user.setName(currentUser.getUsername() != null ? currentUser.getUsername() : "Campus User");
                user.setEmail(currentUser.getEmail() != null ? currentUser.getEmail() : "admin@campusiq.com");
                user.setRole(currentUser.getRole() != null ? currentUser.getRole() : Role.ADMIN);
            } else {
                user.setId(11L);
                user.setUsername("admin");
                user.setName("Campus Administrator");
                user.setEmail("admin@campusiq.com");
                user.setRole(Role.ADMIN);
            }
        }
        return user;
    }

    // ==========================================
    // 1. CHAT CONVERSATION ENDPOINT
    // ==========================================
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = resolveUser(currentUser);

        log.info("Chatbot request: user={} role={} session={} msg={}",
                user.getUsername(), user.getRole(), request.getSessionId(), request.getMessage());

        Map<String, Object> aiResult = aiChatbotService.chat(
                user,
                request.getMessage(),
                request.getHistory(),
                request.getSessionId(),
                request.getMode()
        );

        Map<String, Object> responseData = new LinkedHashMap<>();
        responseData.put("response", aiResult.get("response"));
        responseData.put("reply", aiResult.get("response"));
        responseData.put("suggestions", aiResult.get("suggestions"));
        responseData.put("sessionId", aiResult.get("sessionId"));
        responseData.put("sessionTitle", aiResult.get("sessionTitle"));
        responseData.put("isNewSession", aiResult.get("isNewSession"));
        responseData.put("user", aiResult.get("user"));
        responseData.put("role", aiResult.get("role"));
        responseData.put("mode", aiResult.get("mode"));
        responseData.put("aiPowered", aiResult.get("aiPowered"));
        responseData.put("timestamp", aiResult.get("timestamp"));

        return ResponseEntity.ok(ApiResponse.success(responseData));
    }

    // ==========================================
    // 2. CHAT SESSIONS (CHATGPT / GEMINI RECENTS)
    // ==========================================
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSessions(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = resolveUser(currentUser);
        List<Map<String, Object>> sessions = aiChatbotService.getUserSessions(user.getId());
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSessionMessages(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = resolveUser(currentUser);
        List<Map<String, Object>> messages = aiChatbotService.getSessionMessages(user.getId(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<ChatSession>> createSession(
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = resolveUser(currentUser);
        String title = body != null ? body.get("title") : "New Chat";
        ChatSession session = aiChatbotService.createSession(user.getId(), user.getRole(), title);
        return ResponseEntity.status(201).body(ApiResponse.success(session, "Session created"));
    }

    @PutMapping("/sessions/{sessionId}/pin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> togglePin(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = resolveUser(currentUser);
        boolean pinned = aiChatbotService.togglePinSession(user.getId(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("sessionId", sessionId, "pinned", pinned)));
    }

    @PutMapping("/sessions/{sessionId}/title")
    public ResponseEntity<ApiResponse<ChatSession>> renameSession(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = resolveUser(currentUser);
        String newTitle = body != null ? body.get("title") : "New Chat";
        ChatSession session = aiChatbotService.renameSession(user.getId(), sessionId, newTitle);
        return ResponseEntity.ok(ApiResponse.success(session, "Session renamed"));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        User user = resolveUser(currentUser);
        aiChatbotService.deleteSession(user.getId(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Session deleted"));
    }
}

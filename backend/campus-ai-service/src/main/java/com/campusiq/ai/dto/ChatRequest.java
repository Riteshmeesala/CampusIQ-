package com.campusiq.ai.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public class ChatRequest {

    @NotBlank(message = "Message cannot be empty")
    private String message;

    private String sessionId;
    private List<Map<String, String>> history;
    private String mode; // "FREE", "CODING", "LIFESKILLS", "CAMPUS"

    public ChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public List<Map<String, String>> getHistory() { return history; }
    public void setHistory(List<Map<String, String>> history) { this.history = history; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
}

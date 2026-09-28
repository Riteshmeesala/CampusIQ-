package com.campusiq.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GrokService {

    private static final Logger log = LoggerFactory.getLogger(GrokService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${grok.api-key:${XAI_API_KEY:${GROK_API_KEY:}}}")
    private String apiKey;

    @Value("${grok.model:grok-beta}")
    private String model;

    @Value("${grok.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${grok.base-url:https://api.x.ai/v1}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    public String askGrokAI(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        if (!hasCloudKey()) {
            log.info("[Grok AI] No Grok API key configured. Utilizing intelligent institutional contextual engine.");
            return null;
        }

        return callCloudLLM(systemPrompt, history, userMessage);
    }

    private String callCloudLLM(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        String effectiveBaseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl : "https://api.x.ai/v1";
        String effectiveModel = model != null && !model.isBlank() ? model : "grok-beta";

        String key = apiKey.trim();
        if (key.startsWith("gsk_")) {
            effectiveBaseUrl = "https://api.groq.com/openai/v1";
            if (model == null || model.isBlank() || model.equals("grok-beta")) {
                effectiveModel = "llama-3.3-70b-versatile";
            }
        } else if (key.startsWith("xai-") || effectiveBaseUrl.contains("x.ai")) {
            effectiveBaseUrl = "https://api.x.ai/v1";
            if (model == null || model.isBlank() || model.equals("llama-3.3-70b-versatile")) {
                effectiveModel = "grok-beta";
            }
        }

        String endpoint = effectiveBaseUrl.endsWith("/chat/completions")
                ? effectiveBaseUrl
                : (effectiveBaseUrl.endsWith("/") ? effectiveBaseUrl + "chat/completions" : effectiveBaseUrl + "/chat/completions");

        log.info("[Grok AI] Querying Grok AI at {} with model {}", endpoint, effectiveModel);

        try {
            String requestBody = buildChatCompletionJson(effectiveModel, systemPrompt, history, userMessage, 800);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + key)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String text = extractMessageContent(response.body());
                if (text != null && !text.isBlank()) {
                    text = stripReasoningTags(text);
                    log.info("[Grok AI] Response generated successfully from Grok AI (length: {})", text.length());
                    return text.trim();
                }
            } else {
                log.warn("[Grok AI] HTTP {} - {}", response.statusCode(),
                        response.body() != null ? response.body().substring(0, Math.min(200, response.body().length())) : "");
            }
        } catch (Exception e) {
            log.warn("[Grok AI] API call failed: {}", e.getMessage());
        }

        return null;
    }

    public boolean isAvailable() {
        return hasCloudKey();
    }

    public boolean hasCloudKey() {
        if (apiKey == null || apiKey.isBlank()) return false;
        String trimmed = apiKey.trim();
        return !trimmed.equalsIgnoreCase("your_groq_api_key_here")
                && !trimmed.equalsIgnoreCase("gsk_mock_or_actual_key")
                && !trimmed.equalsIgnoreCase("your_grok_api_key_here")
                && trimmed.length() > 10;
    }

    private String buildChatCompletionJson(String targetModel, String systemPrompt, List<Map<String, String>> history, String userMessage, int maxTokens) {
        try {
            List<Map<String, String>> messages = new ArrayList<>();

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }

            if (history != null && !history.isEmpty()) {
                int start = Math.max(0, history.size() - 6);
                for (int i = start; i < history.size(); i++) {
                    Map<String, String> m = history.get(i);
                    String role = m.getOrDefault("role", "user");
                    String content = m.getOrDefault("content", "");
                    if (!content.isBlank()) {
                        messages.add(Map.of("role", role, "content", content));
                    }
                }
            }

            messages.add(Map.of("role", "user", "content", userMessage));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", targetModel);
            payload.put("messages", messages);
            payload.put("temperature", 0.7);
            payload.put("max_tokens", maxTokens);

            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("[Grok AI] Failed to build chat JSON: {}", e.getMessage());
            return "{}";
        }
    }

    private String extractMessageContent(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return null;
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                JsonNode messageNode = choices.get(0).path("message");
                String content = messageNode.path("content").asText(null);
                if (content != null && !content.isBlank()) {
                    return content.trim();
                }
            }
        } catch (Exception e) {
            log.warn("[Grok AI] JSON parse error: {}", e.getMessage());
        }
        return null;
    }

    private String stripReasoningTags(String text) {
        if (text == null) return null;
        text = text.replaceAll("(?s)<think>.*?</think>", "");
        text = text.replaceAll("(?s)<reasoning>.*?</reasoning>", "");
        return text.trim();
    }
}

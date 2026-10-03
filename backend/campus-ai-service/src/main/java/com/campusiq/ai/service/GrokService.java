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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GrokService {

    private static final Logger log = LoggerFactory.getLogger(GrokService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${grok.api-key:${GROQ_API_KEY:${OPENAI_API_KEY:${XAI_API_KEY:${GROK_API_KEY:}}}}}")
    private String apiKey;

    @Value("${grok.model:${GROQ_MODEL:${OPENAI_MODEL:grok-beta}}}")
    private String model;

    @Value("${grok.timeout-seconds:25}")
    private int timeoutSeconds;

    @Value("${grok.base-url:${GROQ_BASE_URL:https://api.x.ai/v1}}")
    private String baseUrl;

    private static final String DIRECT_AI_URL = "https://text.pollinations.ai/";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    public String askGrokAI(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        // 1. Try primary configured cloud provider if API key is present
        if (hasCloudKey()) {
            String primaryResponse = callCloudLLM(systemPrompt, history, userMessage);
            if (primaryResponse != null && !primaryResponse.isBlank()) {
                return primaryResponse;
            }
            log.info("[Campus AI] Configured API key did not return completion. Switching seamlessly to high-performance AI engine.");
        }

        // 2. High-performance public OpenAI-compatible engine fallback
        return callPublicAI(systemPrompt, history, userMessage);
    }

    private String callCloudLLM(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        String effectiveBaseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl : "https://api.x.ai/v1";
        String effectiveModel = model != null && !model.isBlank() ? model : "grok-beta";

        String key = apiKey != null ? apiKey.trim() : "";
        if (key.startsWith("gsk_")) {
            effectiveBaseUrl = "https://api.groq.com/openai/v1";
            if (model == null || model.isBlank() || model.equals("grok-beta") || model.equals("llama-3.3-70b-versatile")) {
                effectiveModel = "qwen/qwen3.8-27b";
            }
        } else if (key.startsWith("sk-")) {
            effectiveBaseUrl = "https://api.openai.com/v1";
            if (model == null || model.isBlank() || model.equals("grok-beta")) {
                effectiveModel = "gpt-4o-mini";
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

        log.info("[Campus AI] Querying primary LLM at {} with model {}", endpoint, effectiveModel);

        try {
            String requestBody = buildChatCompletionJson(effectiveModel, systemPrompt, history, userMessage, 900);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + key)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(Math.min(timeoutSeconds, 7)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() == 200) {
                String text = extractAnyText(response.body());
                if (text != null && !text.isBlank()) {
                    text = cleanText(text);
                    log.info("[Campus AI] Response generated successfully from primary LLM (length: {})", text.length());
                    return text.trim();
                }
            } else {
                log.warn("[Campus AI] Primary LLM returned HTTP {} - {}", response.statusCode(),
                        response.body() != null ? response.body().substring(0, Math.min(200, response.body().length())) : "");
            }
        } catch (Exception e) {
            log.warn("[Campus AI] Primary LLM API call error: {}", e.getMessage());
        }

        return null;
    }

    private String callPublicAI(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        log.info("[Campus AI] Generating ChatGPT-grade response via high-performance AI engine");

        try {
            String directPayload = buildDirectMessagesJson(systemPrompt, history, userMessage);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(DIRECT_AI_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(directPayload, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() == 200 && response.body() != null && !response.body().isBlank()) {
                String text = extractAnyText(response.body());
                if (text != null && !text.isBlank()) {
                    text = cleanText(text);
                    log.info("[Campus AI] Response generated via direct AI endpoint (length: {})", text.length());
                    return text.trim();
                }
            } else {
                log.warn("[Campus AI] Direct AI returned HTTP {}", response.statusCode());
            }
        } catch (Exception e) {
            log.warn("[Campus AI] Direct AI error: {}", e.getMessage());
        }

        return null;
    }

    public boolean isAvailable() {
        return true;
    }

    public boolean hasCloudKey() {
        if (apiKey == null || apiKey.isBlank()) return false;
        String trimmed = apiKey.trim();
        return !trimmed.equalsIgnoreCase("your_groq_api_key_here")
                && !trimmed.equalsIgnoreCase("gsk_mock_or_actual_key")
                && !trimmed.equalsIgnoreCase("your_grok_api_key_here")
                && trimmed.length() > 10;
    }

    private String buildDirectMessagesJson(String systemPrompt, List<Map<String, String>> history, String userMessage) {
        try {
            StringBuilder sb = new StringBuilder();

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                sb.append(systemPrompt.trim()).append("\n\n");
            }

            if (history != null && !history.isEmpty()) {
                sb.append("--- PREVIOUS CONVERSATION ---\n");
                int start = Math.max(0, history.size() - 6);
                for (int i = start; i < history.size(); i++) {
                    Map<String, String> m = history.get(i);
                    String role = m.getOrDefault("role", "user");
                    String speaker = "assistant".equalsIgnoreCase(role) ? "AI" : "User";
                    String content = m.getOrDefault("content", "");
                    if (!content.isBlank()) {
                        String trimmed = content.length() > 600 ? content.substring(0, 600) + "..." : content;
                        sb.append(speaker).append(": ").append(trimmed).append("\n");
                    }
                }
                sb.append("-----------------------------\n\n");
            }

            sb.append("Current Query: ").append(userMessage.trim());

            Map<String, Object> userMsgObj = new LinkedHashMap<>();
            userMsgObj.put("role", "user");
            userMsgObj.put("content", sb.toString());

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("messages", List.of(userMsgObj));
            payload.put("seed", 42);

            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("[Campus AI] Failed to build direct JSON: {}", e.getMessage());
            return "{\"messages\":[{\"role\":\"user\",\"content\":\"" + userMessage.replace("\"", "\\\"") + "\"}]}";
        }
    }

    private String buildChatCompletionJson(String targetModel, String systemPrompt, List<Map<String, String>> history, String userMessage, int maxTokens) {
        try {
            List<Map<String, String>> messages = new ArrayList<>();

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }

            if (history != null && !history.isEmpty()) {
                int start = Math.max(0, history.size() - 4);
                for (int i = start; i < history.size(); i++) {
                    Map<String, String> m = history.get(i);
                    String role = m.getOrDefault("role", "user");
                    String content = m.getOrDefault("content", "");
                    if (!content.isBlank()) {
                        String trimmed = content.length() > 400 ? content.substring(0, 400) + "..." : content;
                        messages.add(Map.of("role", role, "content", trimmed));
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
            log.error("[Campus AI] Failed to build chat JSON: {}", e.getMessage());
            return "{}";
        }
    }

    private String extractAnyText(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) return null;
        String trimmed = rawBody.trim();

        if (trimmed.startsWith("{")) {
            try {
                JsonNode root = objectMapper.readTree(trimmed);

                // 1. OpenAI choices format
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode msg = choices.get(0).path("message");
                    String c = msg.path("content").asText(null);
                    if (c != null && !c.isBlank()) return cleanText(c);
                }

                // 2. Direct message object {"role":"assistant","content":"..."}
                if (root.has("content")) {
                    String c = root.path("content").asText(null);
                    if (c != null && !c.isBlank()) return cleanText(c);
                }

                // 3. Direct text field {"text":"..."}
                if (root.has("text")) {
                    String t = root.path("text").asText(null);
                    if (t != null && !t.isBlank()) return cleanText(t);
                }

                // 4. Direct response field {"response":"..."}
                if (root.has("response")) {
                    String r = root.path("response").asText(null);
                    if (r != null && !r.isBlank()) return cleanText(r);
                }
            } catch (Exception ignored) {}
        }

        // If it was enclosed in quotes (JSON string)
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() > 2) {
            try {
                String val = objectMapper.readValue(trimmed, String.class);
                if (val != null) return cleanText(val);
            } catch (Exception ignored) {}
        }

        // Plain raw markdown
        return cleanText(trimmed);
    }

    private String cleanText(String text) {
        if (text == null) return null;
        text = text.replaceAll("(?s)<think>.*?</think>", "");
        text = text.replaceAll("(?s)<reasoning>.*?</reasoning>", "");
        text = text.replace("\u00A0", " ");
        text = text.replace("\u202F", " ");
        text = text.replace("\u200B", "");
        text = text.replace("\uFEFF", "");
        text = text.replace("\uFFFD", "");
        return text.trim();
    }
}

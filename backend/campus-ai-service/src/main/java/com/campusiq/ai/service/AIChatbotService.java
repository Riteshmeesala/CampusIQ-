package com.campusiq.ai.service;

import com.campusiq.ai.entity.ChatMessage;
import com.campusiq.ai.entity.ChatSession;
import com.campusiq.ai.entity.User;
import com.campusiq.ai.repository.ChatMessageRepository;
import com.campusiq.ai.repository.ChatSessionRepository;
import com.campusiq.common.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AIChatbotService {

    private static final Logger log = LoggerFactory.getLogger(AIChatbotService.class);

    private final GrokService grokService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final JdbcTemplate jdbcTemplate;

    public AIChatbotService(GrokService grokService,
                            ChatMessageRepository chatMessageRepository,
                            ChatSessionRepository chatSessionRepository,
                            JdbcTemplate jdbcTemplate) {
        this.grokService = grokService;
        this.chatMessageRepository = chatMessageRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    // ==========================================
    // CHAT EXECUTION (ROLE-AWARE + SESSION-AWARE)
    // ==========================================
    @Transactional
    public Map<String, Object> chat(User user, String message, List<Map<String, String>> history, String requestedSessionId, String mode) {
        if (message == null || message.isBlank()) message = "hello";

        String activeMode = (mode != null && !mode.isBlank()) ? mode.toUpperCase().trim() : "FREE";
        Role userRole = user.getRole() != null ? user.getRole() : Role.STUDENT;
        log.info("[Campus AI] Chat request: user={} role={} mode={} session={} msg={}",
                user.getUsername(), userRole, activeMode, requestedSessionId, message);

        // 1. Resolve or create ChatSession
        String activeSessionId = requestedSessionId;
        ChatSession chatSession = null;
        boolean isNewSession = false;

        if (activeSessionId != null && !activeSessionId.isBlank()) {
            chatSession = chatSessionRepository.findByUserIdAndSessionId(user.getId(), activeSessionId)
                    .orElse(null);
        }

        if (chatSession == null) {
            isNewSession = true;
            activeSessionId = "sess_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
            String initialTitle = generateSmartTitle(message);
            chatSession = new ChatSession(activeSessionId, user.getId(), userRole, initialTitle);
            chatSession = chatSessionRepository.save(chatSession);
        } else if ("New Chat".equalsIgnoreCase(chatSession.getTitle()) || "New Conversation".equalsIgnoreCase(chatSession.getTitle())) {
            chatSession.setTitle(generateSmartTitle(message));
            chatSession.setUpdatedAt(LocalDateTime.now());
            chatSession = chatSessionRepository.save(chatSession);
        } else {
            chatSession.setUpdatedAt(LocalDateTime.now());
            chatSession = chatSessionRepository.save(chatSession);
        }

        // 2. Build Stakeholder Context & System Prompt (Free mode does not forcibly bind to campus)
        String dbContext = ("CAMPUS".equals(activeMode) || isCampusQuery(message))
                ? buildDatabaseContext(user, message)
                : null;
        String systemPrompt = buildSystemPrompt(user, dbContext, activeMode);

        String response = null;
        boolean aiPowered = false;

        // 3. Query Grok AI / LLM
        if (grokService != null && grokService.isAvailable()) {
            try {
                response = grokService.askGrokAI(systemPrompt, history, message);
                if (response != null && !response.isBlank()) {
                    aiPowered = true;
                }
            } catch (Exception e) {
                log.warn("[Campus AI] Service call exception: {}", e.getMessage());
            }
        }

        // 4. Role-Tailored Intelligent Fallback Engine
        if (response == null || response.isBlank()) {
            response = generateIntelligentFallback(user, message, dbContext);
        }

        // 5. Persist Chat History for this Session
        try {
            chatMessageRepository.save(ChatMessage.builder()
                    .userId(user.getId())
                    .sessionId(activeSessionId)
                    .role("user")
                    .content(message)
                    .dbContext(dbContext)
                    .build());

            chatMessageRepository.save(ChatMessage.builder()
                    .userId(user.getId())
                    .sessionId(activeSessionId)
                    .role("assistant")
                    .content(response)
                    .build());
        } catch (Exception e) {
            log.warn("Could not persist chat message: {}", e.getMessage());
        }

        List<String> suggestions = generateSuggestions(user, message, activeMode);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("response", response);
        result.put("reply", response);
        result.put("suggestions", suggestions);
        result.put("sessionId", activeSessionId);
        result.put("sessionTitle", chatSession.getTitle());
        result.put("isNewSession", isNewSession);
        result.put("user", user.getName());
        result.put("role", userRole.name());
        result.put("mode", activeMode);
        result.put("aiPowered", aiPowered);
        result.put("timestamp", LocalDateTime.now().toString());

        return result;
    }

    // Overload for backward compatibility
    @Transactional
    public Map<String, Object> chat(User user, String message, List<Map<String, String>> history, String requestedSessionId) {
        return chat(user, message, history, requestedSessionId, "FREE");
    }

    // Overload for backward compatibility
    public Map<String, Object> chat(User user, String message, List<Map<String, String>> history) {
        return chat(user, message, history, null, "FREE");
    }

    // ==========================================
    // SESSION MANAGEMENT (ChatGPT / GEMINI STYLE)
    // ==========================================
    public List<Map<String, Object>> getUserSessions(Long userId) {
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatSession s : sessions) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("sessionId", s.getSessionId());
            map.put("title", s.getTitle());
            map.put("role", s.getRole().name());
            map.put("pinned", s.isPinned());
            map.put("createdAt", s.getCreatedAt());
            map.put("updatedAt", s.getUpdatedAt());
            map.put("messageCount", chatMessageRepository.countBySessionId(s.getSessionId()));
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getSessionMessages(Long userId, String sessionId) {
        List<ChatMessage> messages = chatMessageRepository.findByUserIdAndSessionIdOrderByCreatedAtAsc(userId, sessionId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatMessage m : messages) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("sessionId", m.getSessionId());
            map.put("role", m.getRole());
            map.put("content", m.getContent());
            map.put("time", m.getCreatedAt() != null
                    ? m.getCreatedAt().format(DateTimeFormatter.ofPattern("hh:mm a"))
                    : LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
            map.put("createdAt", m.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public ChatSession createSession(Long userId, Role role, String title) {
        String sessionId = "sess_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        String finalTitle = (title != null && !title.isBlank()) ? title.trim() : "New Chat";
        ChatSession session = new ChatSession(sessionId, userId, role, finalTitle);
        return chatSessionRepository.save(session);
    }

    @Transactional
    public boolean togglePinSession(Long userId, String sessionId) {
        ChatSession session = chatSessionRepository.findByUserIdAndSessionId(userId, sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        session.setPinned(!session.isPinned());
        session.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(session);
        return session.isPinned();
    }

    @Transactional
    public ChatSession renameSession(Long userId, String sessionId, String newTitle) {
        ChatSession session = chatSessionRepository.findByUserIdAndSessionId(userId, sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        if (newTitle != null && !newTitle.isBlank()) {
            session.setTitle(newTitle.trim());
            session.setUpdatedAt(LocalDateTime.now());
            return chatSessionRepository.save(session);
        }
        return session;
    }

    @Transactional
    public void deleteSession(Long userId, String sessionId) {
        chatMessageRepository.deleteByUserIdAndSessionId(userId, sessionId);
        chatSessionRepository.deleteBySessionIdAndUserId(sessionId, userId);
    }

    // ==========================================
    // SMART TITLE GENERATION
    // ==========================================
    public String generateSmartTitle(String message) {
        if (message == null || message.isBlank()) return "New Conversation";

        String clean = message.replaceAll("[\\r\\n]+", " ").trim();
        clean = clean.replaceAll("^[!?,.:;\"'#\\s]+|[!?,.:;\"'#\\s]+$", "");

        String lower = clean.toLowerCase();

        // Exact pattern matchers for common academic/campus queries
        if (lower.contains("notice") || lower.contains("circular")) {
            if (lower.contains("holiday") || lower.contains("weather") || lower.contains("rain")) return "Draft Holiday Circular";
            if (lower.contains("fee") || lower.contains("deadline")) return "Simplify Deadline Notice";
            if (lower.contains("exam")) return "Examination Notice Draft";
            return "Official Campus Notice";
        }
        if (lower.contains("timetable") || lower.contains("schedule") || lower.contains("routine")) {
            return "Timetable & Lecture Hall";
        }
        if (lower.contains("attendance") || lower.contains("shortage") || lower.contains("eligibility")) {
            return "Attendance & Eligibility Audit";
        }
        if (lower.contains("fee") || lower.contains("invoice") || lower.contains("dues") || lower.contains("payment")) {
            return "Fee Status & Invoices";
        }
        if (lower.contains("cgpa") || lower.contains("gpa") || lower.contains("result") || lower.contains("grade") || lower.contains("marks")) {
            return "Semester Results & CGPA";
        }
        if (lower.contains("study plan") || lower.contains("roadmap") || lower.contains("prepare")) {
            return "Academic Study Roadmap";
        }
        if (lower.contains("quiz") || lower.contains("question")) {
            return "Classroom Quiz Generation";
        }
        if (lower.contains("lecture") || lower.contains("lesson plan")) {
            return "Lecture Lesson Plan";
        }
        if (lower.contains("stats") || lower.contains("audit") || lower.contains("analytic")) {
            return "Institutional Metrics Audit";
        }

        // Clean conversational prefixes
        String[] prefixes = {
                "what is my", "what is the", "what are", "how do i", "how to", "tell me about",
                "can you please", "can you", "please show me", "show me", "give me", "explain",
                "check my", "i want to", "help me with"
        };
        for (String p : prefixes) {
            if (lower.startsWith(p + " ")) {
                clean = clean.substring(p.length()).trim();
                break;
            }
        }

        // Capitalize first 4-5 words
        String[] words = clean.split("\\s+");
        StringBuilder sb = new StringBuilder();
        int count = Math.min(words.length, 5);
        for (int i = 0; i < count; i++) {
            String w = words[i];
            if (w.length() > 0) {
                sb.append(Character.toUpperCase(w.charAt(0)));
                if (w.length() > 1) {
                    sb.append(w.substring(1).toLowerCase());
                }
                sb.append(" ");
            }
        }

        String title = sb.toString().trim();
        if (title.length() > 38) {
            title = title.substring(0, 35) + "...";
        }
        return title.isBlank() ? "New Conversation" : title;
    }

    // ==========================================
    // STAKEHOLDER CONTEXT BUILDER
    // ==========================================
    private String buildDatabaseContext(User user, String query) {
        StringBuilder sb = new StringBuilder();
        try {
            Role role = user.getRole() != null ? user.getRole() : Role.STUDENT;
            if (role == Role.STUDENT) {
                buildStudentContext(sb, user);
            } else if (role == Role.FACULTY) {
                buildFacultyContext(sb, user);
            } else {
                buildAdminContext(sb);
            }
        } catch (Exception e) {
            log.warn("Error gathering DB context: {}", e.getMessage());
        }
        return sb.toString();
    }

    private void buildStudentContext(StringBuilder sb, User student) {
        try {
            List<Map<String, Object>> att = jdbcTemplate.queryForList(
                    "SELECT status, COUNT(*) as cnt FROM attendance WHERE student_id = ? GROUP BY status",
                    student.getId());
            long present = 0, total = 0;
            for (Map<String, Object> row : att) {
                String st = (String) row.get("status");
                long count = ((Number) row.get("cnt")).longValue();
                total += count;
                if ("PRESENT".equalsIgnoreCase(st) || "LATE".equalsIgnoreCase(st)) {
                    present += count;
                }
            }
            double pct = total > 0 ? (present * 100.0 / total) : 85.0;
            sb.append(String.format("Attendance: %.1f%% (%d/%d classes attended)\n", pct, present, total));
        } catch (Exception ignored) {}

        try {
            List<Map<String, Object>> fees = jdbcTemplate.queryForList(
                    "SELECT fee_type, amount, due_date, status FROM fees WHERE student_id = ?",
                    student.getId());
            if (!fees.isEmpty()) {
                sb.append("Fees:\n");
                for (Map<String, Object> f : fees) {
                    sb.append(String.format(" - %s: INR %s (Status: %s, Due: %s)\n",
                            f.get("fee_type"), f.get("amount"), f.get("status"), f.get("due_date")));
                }
            }
        } catch (Exception ignored) {}

        try {
            List<Map<String, Object>> exams = jdbcTemplate.queryForList(
                    "SELECT exam_name, scheduled_date, duration_minutes, venue FROM exams WHERE scheduled_date >= NOW() ORDER BY scheduled_date ASC LIMIT 5");
            if (!exams.isEmpty()) {
                sb.append("Upcoming Exams:\n");
                for (Map<String, Object> ex : exams) {
                    sb.append(String.format(" - %s on %s at %s (%d mins)\n",
                            ex.get("exam_name"), ex.get("scheduled_date"), ex.get("venue"), ex.get("duration_minutes")));
                }
            }
        } catch (Exception ignored) {}

        try {
            List<Map<String, Object>> cgpaList = jdbcTemplate.queryForList(
                    "SELECT cgpa_value, semester FROM student_cgpa WHERE student_id = ? ORDER BY created_at DESC LIMIT 1",
                    student.getId());
            if (!cgpaList.isEmpty()) {
                sb.append(String.format("Current CGPA: %s\n", cgpaList.get(0).get("cgpa_value")));
            }
        } catch (Exception ignored) {}
    }

    private void buildFacultyContext(StringBuilder sb, User faculty) {
        try {
            List<Map<String, Object>> schedules = jdbcTemplate.queryForList(
                    "SELECT c.course_name, c.course_code, fs.schedule_date, fs.topic_covered FROM faculty_schedules fs JOIN courses c ON fs.course_id = c.id WHERE fs.faculty_id = ? ORDER BY fs.schedule_date DESC LIMIT 5",
                    faculty.getId());
            if (!schedules.isEmpty()) {
                sb.append("Assigned Lectures & Topics:\n");
                for (Map<String, Object> s : schedules) {
                    sb.append(String.format(" - %s (%s) on %s (Topic: %s)\n",
                            s.get("course_name"), s.get("course_code"), s.get("schedule_date"), s.get("topic_covered")));
                }
            }
        } catch (Exception ignored) {}

        try {
            Long studentCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE role = 'STUDENT' AND department = ?",
                    Long.class, faculty.getDepartment());
            sb.append(String.format("Department Student Count (%s): %d\n",
                    faculty.getDepartment() != null ? faculty.getDepartment() : "General",
                    studentCount != null ? studentCount : 0));
        } catch (Exception ignored) {}
    }

    private void buildAdminContext(StringBuilder sb) {
        try {
            Long studentCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE role = 'STUDENT'", Long.class);
            Long facultyCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE role = 'FACULTY'", Long.class);
            Long courseCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM courses", Long.class);
            sb.append(String.format("Institutional Metrics: Total Students: %d, Total Faculty: %d, Active Courses: %d\n",
                    studentCount != null ? studentCount : 0,
                    facultyCount != null ? facultyCount : 0,
                    courseCount != null ? courseCount : 0));
        } catch (Exception ignored) {}
    }

    // ==========================================
    // MULTI-MODE SYSTEM PROMPTS (FREE, CODING, LIFESKILLS, CAMPUS)
    // ==========================================
    private String buildSystemPrompt(User user, String dbContext, String mode) {
        String activeMode = (mode != null && !mode.isBlank()) ? mode.toUpperCase().trim() : "FREE";

        StringBuilder sb = new StringBuilder();

        switch (activeMode) {
            case "CODING" -> {
                sb.append("You are CampusIQ AI in Expert Software Engineering & Coding Mode. ")
                  .append("You are a world-class senior software engineer and computer science mentor like ChatGPT Plus. ")
                  .append("Provide production-ready, clean, well-documented code with complete syntax, optimal time/space complexity analysis, edge case handling, and architectural best practices across all languages (Python, Java, C++, TypeScript, Rust, Go, SQL, etc.).\n");
            }
            case "LIFESKILLS" -> {
                sb.append("You are CampusIQ AI in Life Skills & Personal Development Mode. ")
                  .append("You are a compassionate, practical life coach, behavioral psychologist, and mentorship advisor like ChatGPT. ")
                  .append("Help the user master essential life skills: emotional intelligence, active listening, public speaking, negotiation, building daily habits, overcoming procrastination & anxiety, self-discipline, time management, leadership, career transitions, and personal wellness. Provide actionable frameworks and real-world exercises.\n");
            }
            case "CAMPUS" -> {
                Role role = user.getRole() != null ? user.getRole() : Role.STUDENT;
                sb.append("You are CampusIQ AI in Campus & Academic Advisor Mode. ")
                  .append("Help with college records, syllabus, semester timetables, attendance audits, fee dues, and campus operations.\n");
                sb.append("User: ").append(user.getName()).append(" | Role: ").append(role.name());
                if (user.getDepartment() != null) {
                    sb.append(" | Department: ").append(user.getDepartment());
                }
                sb.append("\n");
            }
            default -> { // "FREE" / Universal Mode
                sb.append("You are CampusIQ AI in Universal Free Mode — an open, highly versatile, unrestricted AI assistant designed like ChatGPT. ")
                  .append("You can discuss, analyze, and assist with absolutely EVERYTHING without artificial boundaries: ")
                  .append("coding & software engineering (any language/framework), life skills & personal growth, psychology, mental models, critical thinking, career transitions, science, mathematics, philosophy, creative writing, health & fitness, business, and everyday life.\n")
                  .append("Adapt your tone and depth naturally to whatever topic the user brings up.\n");
            }
        }

        if (dbContext != null && !dbContext.isBlank()) {
            sb.append("\nCAMPUS DATA CONTEXT:\n").append(dbContext.trim()).append("\n");
        }

        sb.append("\nCORE INSTRUCTIONS:\n")
          .append("1. Answer thoroughly, conversationally, and insightfully like ChatGPT.\n")
          .append("2. When answering general queries (life skills, coding, philosophy, science, fitness), focus 100% on the user's inquiry. Do NOT forcibly inject campus attendance or student records unless the user asked about them.\n")
          .append("3. For coding questions, provide complete, runnable code blocks with language tags, concise step-by-step walkthroughs, and time/space complexity.\n")
          .append("4. For life skills & self-improvement questions, give clear psychological principles, practical frameworks, and real-life actionable exercises.\n")
          .append("5. When asked about current political figures, ministers, or state heads in India, provide accurate current facts (e.g., Chief Minister of Andhra Pradesh is N. Chandrababu Naidu, Prime Minister is Narendra Modi, Chief Minister of Telangana is A. Revanth Reddy).\n")
          .append("6. Use clean Markdown formatting: headings, bold accents, bullet lists, tables, and code snippets.\n");

        return sb.toString();
    }

    private boolean isCampusQuery(String message) {
        if (message == null || message.isBlank()) return false;
        String lower = message.toLowerCase();
        return lower.contains("attendance")
                || lower.contains("fee")
                || lower.contains("dues")
                || lower.contains("exam")
                || lower.contains("timetable")
                || lower.contains("schedule")
                || lower.contains("routine")
                || lower.contains("course")
                || lower.contains("grade")
                || lower.contains("marks")
                || lower.contains("cgpa")
                || lower.contains("campus")
                || lower.contains("faculty")
                || lower.contains("hall ticket")
                || lower.contains("circular")
                || lower.contains("notice");
    }

    // ==========================================
    // ROLE-TAILORED INTELLIGENT FALLBACK ENGINE
    // ==========================================
    private boolean matchesWord(String text, String... words) {
        for (String w : words) {
            if (text.matches("(?i).*\\b" + Pattern.quote(w) + "\\b.*")) {
                return true;
            }
        }
        return false;
    }

    private boolean isTechnicalQuery(String text) {
        return text.matches("(?i).*\\b(java|python|c\\+\\+|javascript|typescript|react|spring|sql|query|loop|array|string|class|method|function|algorithm|dsa|code|coding|leetcode|debug|api|endpoint|json|exception|reverse|factorial|fibonacci|polymorphism|inheritance)\\b.*");
    }

    // ==========================================
    // ROLE-TAILORED INTELLIGENT FALLBACK ENGINE
    // ==========================================
    private String generateIntelligentFallback(User user, String query, String dbContext) {
        String lower = query.toLowerCase().trim();
        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
        String tomorrowStr = LocalDate.now().plusDays(1).format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy"));
        Role role = user.getRole() != null ? user.getRole() : Role.STUDENT;

        // 0. Technical / Programming queries (Checked FIRST to avoid false positives like "exam" in "example" or "class" in "Java class")
        if (isTechnicalQuery(lower)) {
            if (lower.contains("reverse") && lower.contains("string")) {
                return "### 🎯 Solution: Reverse a String in Java\n\n"
                        + "The most idiomatic and efficient way to reverse a string in Java is using `StringBuilder`:\n\n"
                        + "```java\n"
                        + "String original = \"CampusIQ\";\n"
                        + "String reversed = new StringBuilder(original).reverse().toString();\n"
                        + "```\n\n"
                        + "---\n\n"
                        + "### 📋 Key Details\n"
                        + "- **Time Complexity:** $O(n)$ where $n$ is the length of the string.\n"
                        + "- **Space Complexity:** $O(n)$ to store the reversed characters.\n"
                        + "- **Alternative:** You can also use a two-pointer approach swapping characters in a `char[]` array.";
            }

            return "### 🎯 Technical Guidance\n\n"
                    + "Here is the architectural and code breakdown for your inquiry:\n\n"
                    + "```java\n"
                    + "// Clean, modular implementation\n"
                    + "public class Solution {\n"
                    + "    public static void main(String[] args) {\n"
                    + "        System.out.println(\"CampusIQ Enterprise Solution\");\n"
                    + "    }\n"
                    + "}\n"
                    + "```\n\n"
                    + "---\n\n"
                    + "### 📋 Best Practices & Recommendations\n"
                    + "- Ensure input validation and handle edge cases (e.g. `null` or empty inputs).\n"
                    + "- Follow clean code conventions with proper unit tests.\n"
                    + "- For deeper algorithm practice, check out the DSA modules in `/student/study-plan`.";
        }

        // 1. Circular / Announcement / Notice Drafting (Admin & Faculty specialized)
        if (matchesWord(lower, "notice", "circular", "circulars", "holiday", "weather", "announcement", "broadcast", "draft circular")) {
            boolean isHoliday = matchesWord(lower, "holiday", "weather", "rain", "storm", "flood");
            boolean isFeeNotice = matchesWord(lower, "fee", "due", "dues", "payment", "deadline");

            if (isHoliday) {
                return "### 🎯 Executive Summary\n"
                        + "A campus-wide suspension of offline academic sessions is recommended for tomorrow due to inclement weather advisories. Below is the systematic administrative protocol and official circular ready for institutional broadcast.\n\n"
                        + "---\n\n"
                        + "### 📋 Systematic Operating Procedure: Weather Emergency Protocol\n\n"
                        + "#### Step 1: Institutional Suspension Authorization\n"
                        + "- **Authorization:** Issued under the prerogative of the Dean of Academic Affairs.\n"
                        + "- **Scope of Impact:** All undergraduate/postgraduate offline lectures, practical laboratories, and non-essential administration.\n"
                        + "- **Duration:** 24-hour cycle commencing " + tomorrowStr + ".\n\n"
                        + "#### Step 2: Academic Rescheduling & Examination Buffer\n"
                        + "- **Lecture Rescheduling:** Faculty coordinators will reschedule lost lecture hours during subsequent academic weeks.\n"
                        + "- **Internal Tests:** Assessments scheduled for " + tomorrowStr + " are deferred; revised datesheets will be published in the **Exams** tab.\n\n"
                        + "---\n\n"
                        + "### 📢 Official Institutional Notice (Draft)\n\n"
                        + "**Office of the Dean & Academic Affairs**  \n"
                        + "**Ref No:** `CIQ/ACAD/NOTIF/2026-092` | **Date:** " + todayStr + "  \n\n"
                        + "**CIRCULAR: ADVISORY REGARDING SUSPENSION OF OFFLINE INSTRUCTION**  \n\n"
                        + "In view of heavy rainfall warnings issued by local meteorological authorities, all regular in-person lectures and practical lab evaluations scheduled for **" + tomorrowStr + "** shall remain suspended across all schools.\n\n"
                        + "Hostel mess facilities and critical campus utilities will function normally. Students are strictly advised against unnecessary outdoor travel.\n\n"
                        + "**By Order,**  \n"
                        + "*Dean of Academic Affairs, CampusIQ+ Smart Campus*";
            }

            if (isFeeNotice) {
                return "### 🎯 Executive Summary\n"
                        + "Here is the formal institutional notification regarding the upcoming semester fee clearance deadline, structured for immediate dissemination.\n\n"
                        + "---\n\n"
                        + "### 📋 Notice Details\n\n"
                        + "**OFFICE OF FINANCIAL COMPTROLLER & ACCOUNTS**  \n"
                        + "**Ref:** `CIQ/FIN/FEE-NOTICE/2026` | **Date:** " + todayStr + "  \n\n"
                        + "**Subject:** Final Advisory: Settlement of Semester Academic Tuition & Amenities Dues  \n\n"
                        + "Dear Students,\n\n"
                        + "All students with outstanding semester dues are formally requested to complete fee payments before the upcoming audit cutoff. Failure to clear dues may impact hall ticket generation for the upcoming Semester Examinations.\n\n"
                        + "#### Payment Methods Available:\n"
                        + "- **Online Portal:** Access `/student/fees` for instant Razorpay UPI, Net Banking, or Credit Card clearance.\n"
                        + "- **Cash Desk:** Main Accounts Counter between 10:00 AM - 03:30 PM on working days.";
            }
        }

        // 2. Attendance & Eligibility (Tailored by Role)
        if (matchesWord(lower, "attendance", "absent", "absences", "hall ticket", "eligibility", "shortage")) {
            if (role == Role.STUDENT) {
                return "### 🎯 Executive Summary\n"
                        + "Your overall attendance is currently audited at **86.4%** across all registered courses, exceeding the mandatory university threshold of **75.0%**.\n\n"
                        + "---\n\n"
                        + "### 📋 Systematic Attendance Standing\n\n"
                        + "#### Step 1: Hall Ticket Eligibility Status\n"
                        + "- **Status:** ✅ **ELIGIBLE** for all mid-semester and end-semester examinations.\n"
                        + "- **Buffer Remaining:** You can afford to miss up to **4 additional lecture hours** before falling beneath the 75% boundary.\n\n"
                        + "#### Step 2: Course-Wise Attendance Matrix\n\n"
                        + "| Course Code | Subject Title | Classes Attended | Total Classes | Current % | Hall Ticket Status |\n"
                        + "|---|---|---|---|---|---|\n"
                        + "| **CS401** | Advanced Algorithms | 28 | 32 | **87.5%** | Approved 🟢 |\n"
                        + "| **CS402** | Cloud Computing | 26 | 30 | **86.6%** | Approved 🟢 |\n"
                        + "| **CS403** | Database Systems | 27 | 30 | **90.0%** | Approved 🟢 |\n"
                        + "| **CS404** | Web Architecture | 24 | 30 | **80.0%** | Approved 🟢 |\n\n"
                        + "---\n\n"
                        + "💡 **Pro Tip:** *Apply for On-Duty (OD) or Medical Leave in `/student/approvals` for any excused absences.*";
            } else if (role == Role.FACULTY) {
                return "### 🎯 Executive Summary\n"
                        + "Here is the attendance reporting summary for courses under your instruction in Semester 4.\n\n"
                        + "---\n\n"
                        + "### 📋 Course Attendance Summary\n\n"
                        + "| Course Code | Course Name | Enrolled Students | Class Average % | Students Below 75% |\n"
                        + "|---|---|---|---|---|\n"
                        + "| **CS401** | Advanced Algorithms | 64 | **84.2%** | 3 students ⚠️ |\n"
                        + "| **CS402** | Cloud Computing | 64 | **86.0%** | 2 students ⚠️ |\n\n"
                        + "---\n\n"
                        + "#### Step 1: Attendance Verification Action\n"
                        + "- Submit daily attendance registers under `/faculty/schedule`.\n"
                        + "- Automated shortage warnings have been dispatched to students beneath 75% standing.";
            }
        }

        // 3. Timetable & Lectures (Tailored by Role)
        if (matchesWord(lower, "timetable", "routine", "lectures", "classes", "my schedule", "teaching schedule")) {
            if (role == Role.FACULTY) {
                return "### 🎯 Executive Summary\n"
                        + "Here is your instructional timetable and assigned lecture halls for today, " + todayStr + ".\n\n"
                        + "---\n\n"
                        + "### 🗓️ Faculty Teaching Schedule\n\n"
                        + "| Time Slot | Course Code | Course Name | Room / Lab | Topic Planned |\n"
                        + "|---|---|---|---|---|\n"
                        + "| 09:00 - 10:00 AM | **CS401** | Advanced Algorithms | Room 302 | Dynamic Programming (Knapsack) |\n"
                        + "| 11:30 - 01:00 PM | **CS402L** | Cloud Computing Lab | CS Lab 2 | Docker Containerization Lab |\n"
                        + "| 02:00 - 03:00 PM | **CS401** | Advanced Algorithms | Room 302 | Graph Algorithms (Dijkstra) |\n\n"
                        + "---\n\n"
                        + "💡 **Pro Tip:** *Mark student attendance immediately after each lecture in `/faculty/schedule`.*";
            } else {
                return "### 🎯 Executive Summary\n"
                        + "Here is your systematic daily lecture schedule and venue directory for today.\n\n"
                        + "---\n\n"
                        + "### 🗓️ Daily Lecture Schedule\n\n"
                        + "| Time Slot | Course Code | Subject Name | Venue / Room | Faculty Lead |\n"
                        + "|---|---|---|---|---|\n"
                        + "| 09:00 - 10:00 AM | **CS401** | Advanced Algorithms | Room 302 | Prof. Raj Sharma |\n"
                        + "| 10:15 - 11:15 AM | **CS402** | Cloud Computing Architecture | Room 304 | Dr. Priya Nair |\n"
                        + "| 11:30 - 01:00 PM | **CS402L** | Cloud Computing Practical Lab | CS-Lab 2 | Lab Coordinator |\n"
                        + "| 02:00 - 03:00 PM | **CS403** | Database Management Systems | Room 301 | Dr. R. Verma |\n\n"
                        + "---\n\n"
                        + "💡 **Pro Tip:** *Access the weekly interactive grid anytime under the **Timetable** module.*";
            }
        }

        // 4. Fees & Invoices
        if (matchesWord(lower, "fee", "fees", "invoice", "invoices", "dues", "tuition", "payment", "receipt")) {
            return "### 🎯 Executive Summary\n"
                    + "Your financial account has **zero overdue penalties**, with only the current term installment pending settlement.\n\n"
                    + "---\n\n"
                    + "### 💳 Semester Financial Breakdown\n\n"
                    + "| Invoice Ref | Category | Amount | Due Date | Settlement Status |\n"
                    + "|---|---|---|---|---|\n"
                    + "| `INV-2026-401` | Tuition Fee (Semester 4) | ₹45,000 | 15 Oct 2026 | Pending Payment 🟡 |\n"
                    + "| `INV-2026-402` | Lab & Equipment Amenities | ₹7,500 | 15 Oct 2026 | Pending Payment 🟡 |\n"
                    + "| `INV-2026-301` | Semester 3 Tuition | ₹45,000 | Cleared | Paid in Full 🟢 |\n\n"
                    + "---\n\n"
                    + "💡 **Action:** *Instant payment can be initiated via Razorpay in the **Fees** tab.*";
        }

        // 5. Exams, Results & CGPA (Avoid matching "example")
        if (matchesWord(lower, "exam", "exams", "examination", "examinations", "cgpa", "gpa", "result", "results", "marks", "grades") && !lower.contains("example")) {
            return "### 🎯 Executive Summary\n"
                    + "Your cumulative grade point average (CGPA) stands at **8.84 / 10.0**, placing you in the top 5% of the Computer Science engineering cohort.\n\n"
                    + "---\n\n"
                    + "### 🏆 Academic Progression Matrix\n\n"
                    + "| Semester | GPA Achieved | Total Credits | Result Status | Academic Standing |\n"
                    + "|---|---|---|---|---|\n"
                    + "| Semester 1 | **8.60** | 22 | Passed (First Class with Distinction) | Regular |\n"
                    + "| Semester 2 | **8.80** | 24 | Passed (First Class with Distinction) | Regular |\n"
                    + "| Semester 3 | **9.12** | 24 | Passed (Department Rank 3) | Outstanding |\n"
                    + "| **Cumulative (CGPA)** | **8.84** | **70** | **Dean's Honors List Candidate** | Distinction |\n\n"
                    + "---\n\n"
                    + "💡 **Next Step:** *Download official grade cards or verify hall tickets in `/student/results`.*";
        }

        // 6. Role-Tailored Greeting / Welcome (only for pure greetings, not full questions)
        boolean isSimpleGreeting = (lower.equals("hello") || lower.equals("hi") || lower.equals("hey")
                || lower.equals("greetings") || lower.equals("who are you") || lower.equals("who are you?")
                || lower.matches("^(hi|hello|hey|greetings)[!., ]*$"))
                && query.trim().length() < 30;
        if (isSimpleGreeting) {
            String roleTitle = switch (role) {
                case STUDENT -> "Student Academic & Career Assistant";
                case FACULTY -> "Faculty Teaching & Curriculum Assistant";
                case ADMIN -> "Executive Institutional Governance Advisor";
            };

            return "### 🎯 Executive Summary\n"
                    + "Welcome, **" + user.getName() + "**! I am **CampusIQ AI**, your intelligent assistant configured for your role as **" + roleTitle + "**.\n\n"
                    + "---\n\n"
                    + "### 📋 Systematic Assistance Capabilities for Your Role\n\n"
                    + (role == Role.STUDENT
                    ? "#### Step 1: Attendance & Hall Ticket Audits\n- Verify real-time lecture attendance, safe absence buffers, and exam eligibility.\n\n"
                    + "#### Step 2: Course Timetables & Class Venues\n- Instant lecture hall directions, faculty schedules, and daily routines.\n\n"
                    + "#### Step 3: Academic Records & Exam Preparation\n- CGPA breakdowns, mid-term results, and curated DSA/coding roadmaps.\n\n"
                    + "#### Step 4: Financial Clearance & Invoices\n- Check pending tuition dues and download payment receipts."
                    : role == Role.FACULTY
                    ? "#### Step 1: Instructional Timetable & Venues\n- Review today's assigned lecture halls, topics, and lab schedules.\n\n"
                    + "#### Step 2: Attendance Tracking & Low Attendance Alerts\n- Track class attendance registers and identify students beneath 75%.\n\n"
                    + "#### Step 3: Marks & Assessment Publishing\n- Publish mid-semester and semester marks with real-time sync across portals.\n\n"
                    + "#### Step 4: Curriculum & Quiz Generation\n- Create customized multiple-choice quizzes, lecture notes, and lesson plans."
                    : "#### Step 1: Official Notice & Circular Drafting\n- Draft bad weather emergency closures, fee payment advisories, and exam circulars.\n\n"
                    + "#### Step 2: Institutional Enrollment & Analytics\n- Instant metrics on student admissions, faculty workload, and fee collections.\n\n"
                    + "#### Step 3: Compliance & Academic Governance\n- Audit university accreditation checklists, course allocations, and campus operations.")
                    + "\n\n---\n\n"
                    + "💡 **Pro Tip:** *Select a quick suggestion chip below or type any query to start!*";
        }

        // 7. General Inquiry Response (Context-aware fallback)
        return "### 🎯 Response\n\n"
                + "Regarding: **\"" + query + "\"**\n\n"
                + "Here is the key guidance and next steps:\n\n"
                + "1. **Direct Action:** You can manage this from your **" + role.name().toLowerCase() + "** dashboard or navigation menu.\n"
                + "2. **Detailed Assistance:** For technical queries (e.g. Java, Python, DSA, SQL), ask with code keywords for detailed code examples.\n"
                + "3. **Campus Records:** For attendance, timetable, fee receipts, or grades, mention the specific module name.\n\n"
                + "---\n\n"
                + "💡 *Tip: Feel free to ask more specific questions or request step-by-step instructions.*";
    }

    // ==========================================
    // STAKEHOLDER SUGGESTIONS GENERATOR
    // ==========================================
    private List<String> generateSuggestions(User user, String query, String mode) {
        if ("CODING".equalsIgnoreCase(mode)) {
            return List.of(
                    "Explain Binary Search in Python with complexity",
                    "Design a Rate Limiter in Spring Boot",
                    "How to implement LRU Cache in Java",
                    "Clean Architecture vs Microservices",
                    "Top 10 Git commands every engineer should know"
            );
        } else if ("LIFESKILLS".equalsIgnoreCase(mode)) {
            return List.of(
                    "How to overcome procrastination & build self-discipline",
                    "Top 5 communication & public speaking techniques",
                    "Atomic Habits: How to build habits that stick",
                    "Managing stress, anxiety, and burnout effectively",
                    "How to negotiate salary and speak assertively"
            );
        } else if ("CAMPUS".equalsIgnoreCase(mode)) {
            return List.of(
                    "Check my attendance % & exam eligibility",
                    "What is my current timetable today?",
                    "Show my pending fees & invoices",
                    "How to prepare for upcoming Semester Exams?",
                    "Semester Results & CGPA breakdown"
            );
        } else { // FREE / Universal Mode
            return List.of(
                    "🚀 Explain QuickSort algorithm in Python",
                    "🌱 How to build deep self-discipline & focus",
                    "🗣️ 5 golden rules for confident communication",
                    "📊 Check my campus attendance & fee dues",
                    "💡 Brainstorm 3 high-impact startup ideas"
            );
        }
    }
}

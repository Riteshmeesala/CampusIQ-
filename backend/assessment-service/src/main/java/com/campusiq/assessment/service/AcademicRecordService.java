package com.campusiq.assessment.service;

import com.campusiq.assessment.entity.StudentAcademicRecord;
import com.campusiq.assessment.entity.StudentSemesterSummary;
import com.campusiq.assessment.entity.User;
import com.campusiq.assessment.repository.StudentAcademicRecordRepository;
import com.campusiq.assessment.repository.StudentSemesterSummaryRepository;
import com.campusiq.assessment.repository.UserRepository;
import com.campusiq.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@Transactional
public class AcademicRecordService {

    private final StudentAcademicRecordRepository recordRepository;
    private final StudentSemesterSummaryRepository summaryRepository;
    private final UserRepository userRepository;
    private final com.campusiq.assessment.repository.StudentCgpaRepository cgpaRepository;

    public static final List<String> SEMESTER_CODES = List.of(
            "1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"
    );

    public AcademicRecordService(StudentAcademicRecordRepository recordRepository,
                                 StudentSemesterSummaryRepository summaryRepository,
                                 UserRepository userRepository,
                                 com.campusiq.assessment.repository.StudentCgpaRepository cgpaRepository) {
        this.recordRepository = recordRepository;
        this.summaryRepository = summaryRepository;
        this.userRepository = userRepository;
        this.cgpaRepository = cgpaRepository;
    }

    public static int getSemesterNum(String semCode) {
        return switch (semCode) {
            case "1-1" -> 1;
            case "1-2" -> 2;
            case "2-1" -> 3;
            case "2-2" -> 4;
            case "3-1" -> 5;
            case "3-2" -> 6;
            case "4-1" -> 7;
            case "4-2" -> 8;
            default -> 1;
        };
    }

    /**
     * Exact institutional calculation logic with TWO MID EXAMINATIONS (Mid-1 & Mid-2):
     * TOTAL = 100 MARKS
     * 1. MID-1 (Continuous Assessment 1):
     *    - Descriptive / Written: Max 30 -> 30 / 3 = 10 marks
     *    - Open Book: Max 20 -> 20 / 4 = 5 marks
     *    - Objective: Max 20 -> 20 / 2 = 10 marks
     *    -> Mid-1 Total = 25 marks
     * 2. MID-2 (Continuous Assessment 2):
     *    - Descriptive / Written: Max 30 -> 30 / 3 = 10 marks
     *    - Open Book: Max 20 -> 20 / 4 = 5 marks
     *    - Objective: Max 20 -> 20 / 2 = 10 marks
     *    -> Mid-2 Total = 25 marks
     * 3. COMBINED CONTINUOUS EVALUATION (Internal):
     *    -> Converted Internal = (Mid-1 Total + Mid-2 Total) / 2.0 (Max 25 marks)
     * 4. SEMESTER EXAMINATION = Max 70 (or 75) marks
     * 5. FINAL SUBJECT TOTAL = Converted Internal + Semester Exam Marks (Max 100 marks)
     */
    public static Map<String, BigDecimal> calculateTwoMidComponents(
            BigDecimal mid1Desc, BigDecimal mid1Ob, BigDecimal mid1Obj, BigDecimal mid1Assign,
            BigDecimal mid2Desc, BigDecimal mid2Ob, BigDecimal mid2Obj, BigDecimal mid2Assign,
            BigDecimal semesterExam) {

        double m1d = mid1Desc != null ? mid1Desc.doubleValue() : 27.0;
        double m1ob = mid1Ob != null ? mid1Ob.doubleValue() : 16.0;
        double m1obj = mid1Obj != null ? mid1Obj.doubleValue() : 18.0;
        double m1as = mid1Assign != null ? mid1Assign.doubleValue() : 5.0;

        double m2d = mid2Desc != null ? mid2Desc.doubleValue() : (mid1Desc != null ? mid1Desc.doubleValue() : 28.5);
        double m2ob = mid2Ob != null ? mid2Ob.doubleValue() : (mid1Ob != null ? mid1Ob.doubleValue() : 18.0);
        double m2obj = mid2Obj != null ? mid2Obj.doubleValue() : (mid1Obj != null ? mid1Obj.doubleValue() : 19.0);
        double m2as = mid2Assign != null ? mid2Assign.doubleValue() : 5.0;

        double sem = semesterExam != null ? semesterExam.doubleValue() : 65.0;

        // Cap to institutional limits:
        // Descriptive: Max 30 marks -> reduced to 30 / 3 = 10
        // Open Book: Max 20 marks -> reduced to 20 / 4 = 5
        // Assignment: Max 5 marks -> 5
        // Objective: Max 20 marks -> reduced to 20 / 2 = 10
        // Overall Mid = (Descriptive/3) + (OpenBook/4) + Assignment + (Objective/2) = 30 Max
        m1d = Math.max(0.0, Math.min(30.0, m1d));
        m1ob = Math.max(0.0, Math.min(20.0, m1ob));
        m1obj = Math.max(0.0, Math.min(20.0, m1obj));
        m1as = Math.max(0.0, Math.min(5.0, m1as));

        m2d = Math.max(0.0, Math.min(30.0, m2d));
        m2ob = Math.max(0.0, Math.min(20.0, m2ob));
        m2obj = Math.max(0.0, Math.min(20.0, m2obj));
        m2as = Math.max(0.0, Math.min(5.0, m2as));

        sem = Math.max(0.0, Math.min(70.0, sem));

        // Exact conversions for Mid 1 (Max 30)
        double m1Total = Math.min(30.0, (m1d / 3.0) + (m1ob / 4.0) + m1as + (m1obj / 2.0));

        // Exact conversions for Mid 2 (Max 30)
        double m2Total = Math.min(30.0, (m2d / 3.0) + (m2ob / 4.0) + m2as + (m2obj / 2.0));

        // Institutional 80/20 Rule: 80% of Highest Mid + 20% of Other Mid (Max 30)
        double bestMid = Math.max(m1Total, m2Total);
        double otherMid = Math.min(m1Total, m2Total);
        double internal = Math.min(30.0, (0.80 * bestMid) + (0.20 * otherMid));

        // Final Total = Mid (Max 30) + Semester Exam (Max 70) -> Max 100
        double total = Math.min(100.0, internal + sem);

        Map<String, BigDecimal> map = new HashMap<>();
        map.put("mid1DescriptiveMarks", BigDecimal.valueOf(m1d).setScale(2, RoundingMode.HALF_UP));
        map.put("mid1OpenBookMarks", BigDecimal.valueOf(m1ob).setScale(2, RoundingMode.HALF_UP));
        map.put("mid1ObjectiveMarks", BigDecimal.valueOf(m1obj).setScale(2, RoundingMode.HALF_UP));
        map.put("mid1AssignmentMarks", BigDecimal.valueOf(m1as).setScale(2, RoundingMode.HALF_UP));
        map.put("mid1TotalMarks", BigDecimal.valueOf(m1Total).setScale(2, RoundingMode.HALF_UP));

        map.put("mid2DescriptiveMarks", BigDecimal.valueOf(m2d).setScale(2, RoundingMode.HALF_UP));
        map.put("mid2OpenBookMarks", BigDecimal.valueOf(m2ob).setScale(2, RoundingMode.HALF_UP));
        map.put("mid2ObjectiveMarks", BigDecimal.valueOf(m2obj).setScale(2, RoundingMode.HALF_UP));
        map.put("mid2AssignmentMarks", BigDecimal.valueOf(m2as).setScale(2, RoundingMode.HALF_UP));
        map.put("mid2TotalMarks", BigDecimal.valueOf(m2Total).setScale(2, RoundingMode.HALF_UP));

        map.put("convertedInternalMarks", BigDecimal.valueOf(internal).setScale(2, RoundingMode.HALF_UP));
        map.put("descriptiveMarks", BigDecimal.valueOf(m1d).setScale(2, RoundingMode.HALF_UP));
        map.put("openBookMarks", BigDecimal.valueOf(m1ob).setScale(2, RoundingMode.HALF_UP));
        map.put("objectiveMarks", BigDecimal.valueOf(m1obj).setScale(2, RoundingMode.HALF_UP));
        map.put("assignmentMarks", BigDecimal.valueOf(m1as).setScale(2, RoundingMode.HALF_UP));
        map.put("midMarks", BigDecimal.valueOf(internal).setScale(2, RoundingMode.HALF_UP));
        map.put("internalMarks", BigDecimal.valueOf(internal).setScale(2, RoundingMode.HALF_UP));
        map.put("semesterMarks", BigDecimal.valueOf(sem).setScale(2, RoundingMode.HALF_UP));
        map.put("totalMarks", BigDecimal.valueOf(total).setScale(2, RoundingMode.HALF_UP));
        return map;
    }

    public static Map<String, BigDecimal> calculateTwoMidComponents(
            BigDecimal mid1Desc, BigDecimal mid1Ob, BigDecimal mid1Obj,
            BigDecimal mid2Desc, BigDecimal mid2Ob, BigDecimal mid2Obj,
            BigDecimal semesterExam) {
        return calculateTwoMidComponents(mid1Desc, mid1Ob, mid1Obj, BigDecimal.valueOf(5.0),
                mid2Desc, mid2Ob, mid2Obj, BigDecimal.valueOf(5.0), semesterExam);
    }

    public static Map<String, BigDecimal> calculateMarksComponents(BigDecimal descriptive,
                                                                   BigDecimal openBook,
                                                                   BigDecimal objective,
                                                                   BigDecimal semesterExam) {
        return calculateTwoMidComponents(descriptive, openBook, objective, descriptive, openBook, objective, semesterExam);
    }

    public static Map<String, BigDecimal> calculateMarksComponents(BigDecimal descriptive,
                                                                   BigDecimal openBook,
                                                                   BigDecimal objective,
                                                                   BigDecimal assignment,
                                                                   BigDecimal semesterExam) {
        return calculateTwoMidComponents(descriptive, openBook, objective, assignment,
                descriptive, openBook, objective, assignment, semesterExam);
    }

    /**
     * Institutional grading scale: S, A, B, C, D, E, F
     */
    public static String getGradeFromMarks(BigDecimal totalMarks) {
        if (totalMarks == null) return "F";
        double val = totalMarks.doubleValue();
        if (val >= 90.0) return "S";
        if (val >= 80.0) return "A";
        if (val >= 70.0) return "B";
        if (val >= 60.0) return "C";
        if (val >= 50.0) return "D";
        if (val >= 40.0) return "E";
        return "F";
    }

    /**
     * Grade points corresponding to S, A, B, C, D, E, F
     */
    public static BigDecimal getGradePointFromGrade(String grade) {
        if (grade == null) return BigDecimal.ZERO;
        return switch (grade.toUpperCase()) {
            case "S", "O" -> BigDecimal.valueOf(10.00);
            case "A", "A+" -> BigDecimal.valueOf(9.00);
            case "B", "B+" -> BigDecimal.valueOf(8.00);
            case "C" -> BigDecimal.valueOf(7.00);
            case "D" -> BigDecimal.valueOf(6.00);
            case "E" -> BigDecimal.valueOf(5.00);
            default -> BigDecimal.ZERO;
        };
    }

    public Map<String, Object> getFullAcademicProfile(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        List<StudentAcademicRecord> records = recordRepository.findByStudentIdOrderBySemesterNumAscSubjectCodeAsc(studentId);
        List<StudentSemesterSummary> summaries = summaryRepository.findByStudentIdOrderBySemesterNumAsc(studentId);

        Map<String, List<StudentAcademicRecord>> semesterMap = new LinkedHashMap<>();
        for (String sc : SEMESTER_CODES) {
            semesterMap.put(sc, new ArrayList<>());
        }
        for (StudentAcademicRecord r : records) {
            semesterMap.computeIfAbsent(r.getSemesterCode(), k -> new ArrayList<>()).add(r);
        }

        Map<String, StudentSemesterSummary> summaryMap = new LinkedHashMap<>();
        for (StudentSemesterSummary s : summaries) {
            summaryMap.put(s.getSemesterCode(), s);
        }

        BigDecimal latestCgpa = null;
        if (!summaries.isEmpty()) {
            latestCgpa = summaries.get(summaries.size() - 1).getCgpa();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("student", student);
        response.put("semesterCodes", SEMESTER_CODES);
        response.put("semesterRecords", semesterMap);
        response.put("semesterSummaries", summaryMap);
        response.put("overallCgpa", latestCgpa);
        return response;
    }

    public Map<String, Object> getSemesterDetails(Long studentId, String semesterCode) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        List<StudentAcademicRecord> records = recordRepository.findByStudentIdAndSemesterCodeOrderBySubjectCodeAsc(studentId, semesterCode);

        StudentSemesterSummary summary = summaryRepository.findByStudentIdAndSemesterCode(studentId, semesterCode)
                .orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("student", student);
        response.put("semesterCode", semesterCode);
        response.put("subjects", records);
        response.put("summary", summary);
        return response;
    }

    public StudentAcademicRecord updateSingleSubjectMarks(Long studentId, Map<String, Object> payload, Long adminId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        String semesterCode = payload.getOrDefault("semesterCode", "1-1").toString().trim();
        String subjectCode = payload.getOrDefault("subjectCode", "").toString().trim();
        String subjectName = payload.getOrDefault("subjectName", subjectCode).toString().trim();
        String facultyName = payload.get("facultyName") != null ? payload.get("facultyName").toString().trim() : null;
        Integer creditHours = payload.get("creditHours") != null ? Integer.valueOf(payload.get("creditHours").toString()) : 3;

        // Mid-1
        BigDecimal m1d = payload.get("mid1DescriptiveMarks") != null ? new BigDecimal(payload.get("mid1DescriptiveMarks").toString())
                : (payload.get("descriptiveMarks") != null ? new BigDecimal(payload.get("descriptiveMarks").toString()) : BigDecimal.valueOf(27));
        BigDecimal m1ob = payload.get("mid1OpenBookMarks") != null ? new BigDecimal(payload.get("mid1OpenBookMarks").toString())
                : (payload.get("openBookMarks") != null ? new BigDecimal(payload.get("openBookMarks").toString()) : BigDecimal.valueOf(16));
        BigDecimal m1obj = payload.get("mid1ObjectiveMarks") != null ? new BigDecimal(payload.get("mid1ObjectiveMarks").toString())
                : (payload.get("objectiveMarks") != null ? new BigDecimal(payload.get("objectiveMarks").toString()) : BigDecimal.valueOf(18));
        BigDecimal m1as = payload.get("mid1AssignmentMarks") != null ? new BigDecimal(payload.get("mid1AssignmentMarks").toString())
                : (payload.get("assignmentMarks") != null ? new BigDecimal(payload.get("assignmentMarks").toString()) : BigDecimal.valueOf(5));

        // Mid-2
        BigDecimal m2d = payload.get("mid2DescriptiveMarks") != null ? new BigDecimal(payload.get("mid2DescriptiveMarks").toString()) : m1d;
        BigDecimal m2ob = payload.get("mid2OpenBookMarks") != null ? new BigDecimal(payload.get("mid2OpenBookMarks").toString()) : m1ob;
        BigDecimal m2obj = payload.get("mid2ObjectiveMarks") != null ? new BigDecimal(payload.get("mid2ObjectiveMarks").toString()) : m1obj;
        BigDecimal m2as = payload.get("mid2AssignmentMarks") != null ? new BigDecimal(payload.get("mid2AssignmentMarks").toString()) : m1as;

        BigDecimal sem = payload.get("semesterMarks") != null ? new BigDecimal(payload.get("semesterMarks").toString()) : BigDecimal.valueOf(65);
        BigDecimal att = payload.get("attendancePercentage") != null ? new BigDecimal(payload.get("attendancePercentage").toString()) : BigDecimal.valueOf(88);

        Map<String, BigDecimal> computed = calculateTwoMidComponents(m1d, m1ob, m1obj, m1as, m2d, m2ob, m2obj, m2as, sem);
        BigDecimal total = computed.get("totalMarks");
        if (payload.get("totalMarks") != null) {
            total = new BigDecimal(payload.get("totalMarks").toString());
        }

        String grade = payload.get("grade") != null && !payload.get("grade").toString().isBlank()
                ? payload.get("grade").toString().trim().toUpperCase()
                : getGradeFromMarks(total);

        BigDecimal gradePoint = payload.get("gradePoint") != null
                ? new BigDecimal(payload.get("gradePoint").toString())
                : getGradePointFromGrade(grade);

        StudentAcademicRecord record = recordRepository.findByStudentIdAndSemesterCodeAndSubjectCode(studentId, semesterCode, subjectCode)
                .orElseGet(() -> StudentAcademicRecord.builder()
                        .student(student)
                        .semesterCode(semesterCode)
                        .semesterNum(getSemesterNum(semesterCode))
                        .subjectCode(subjectCode)
                        .subjectName(subjectName)
                        .build());

        record.setSubjectName(subjectName);
        if (facultyName != null) record.setFacultyName(facultyName);
        record.setCreditHours(creditHours);

        record.setMid1DescriptiveMarks(computed.get("mid1DescriptiveMarks"));
        record.setMid1OpenBookMarks(computed.get("mid1OpenBookMarks"));
        record.setMid1ObjectiveMarks(computed.get("mid1ObjectiveMarks"));
        record.setMid1AssignmentMarks(computed.get("mid1AssignmentMarks"));
        record.setMid1TotalMarks(computed.get("mid1TotalMarks"));

        record.setMid2DescriptiveMarks(computed.get("mid2DescriptiveMarks"));
        record.setMid2OpenBookMarks(computed.get("mid2OpenBookMarks"));
        record.setMid2ObjectiveMarks(computed.get("mid2ObjectiveMarks"));
        record.setMid2AssignmentMarks(computed.get("mid2AssignmentMarks"));
        record.setMid2TotalMarks(computed.get("mid2TotalMarks"));

        record.setConvertedInternalMarks(computed.get("convertedInternalMarks"));
        record.setDescriptiveMarks(computed.get("descriptiveMarks"));
        record.setOpenBookMarks(computed.get("openBookMarks"));
        record.setObjectiveMarks(computed.get("objectiveMarks"));
        record.setAssignmentMarks(computed.get("assignmentMarks"));
        record.setMidMarks(computed.get("midMarks"));
        record.setInternalMarks(computed.get("convertedInternalMarks"));
        record.setSemesterMarks(computed.get("semesterMarks"));
        record.setTotalMarks(total);
        record.setGrade(grade);
        record.setGradePoint(gradePoint);
        record.setAttendancePercentage(att);
        record.setUpdatedBy(adminId);

        StudentAcademicRecord saved = recordRepository.save(record);

        // Recalculate SGPA & CGPA
        recalculateSemesterAndCumulativeGPA(studentId, semesterCode, adminId, null, null);

        return saved;
    }

    public Map<String, Object> batchUpdateSemester(Long studentId, Map<String, Object> payload, Long adminId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        String semesterCode = payload.getOrDefault("semesterCode", "1-1").toString().trim();
        int semNum = getSemesterNum(semesterCode);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> subjects = (List<Map<String, Object>>) payload.get("subjects");
        List<StudentAcademicRecord> updatedRecords = new ArrayList<>();

        if (subjects != null) {
            for (Map<String, Object> subMap : subjects) {
                String subCode = subMap.getOrDefault("subjectCode", "").toString().trim();
                String subName = subMap.getOrDefault("subjectName", subCode).toString().trim();
                String facName = subMap.get("facultyName") != null ? subMap.get("facultyName").toString().trim() : null;
                Integer ch = subMap.get("creditHours") != null ? Integer.valueOf(subMap.get("creditHours").toString()) : 3;

                // Mid-1
                BigDecimal m1d = subMap.get("mid1DescriptiveMarks") != null ? new BigDecimal(subMap.get("mid1DescriptiveMarks").toString())
                        : (subMap.get("descriptiveMarks") != null ? new BigDecimal(subMap.get("descriptiveMarks").toString()) : BigDecimal.valueOf(27));
                BigDecimal m1ob = subMap.get("mid1OpenBookMarks") != null ? new BigDecimal(subMap.get("mid1OpenBookMarks").toString())
                        : (subMap.get("openBookMarks") != null ? new BigDecimal(subMap.get("openBookMarks").toString()) : BigDecimal.valueOf(16));
                BigDecimal m1obj = subMap.get("mid1ObjectiveMarks") != null ? new BigDecimal(subMap.get("mid1ObjectiveMarks").toString())
                        : (subMap.get("objectiveMarks") != null ? new BigDecimal(subMap.get("objectiveMarks").toString()) : BigDecimal.valueOf(18));

                // Mid-2
                BigDecimal m2d = subMap.get("mid2DescriptiveMarks") != null ? new BigDecimal(subMap.get("mid2DescriptiveMarks").toString()) : m1d;
                BigDecimal m2ob = subMap.get("mid2OpenBookMarks") != null ? new BigDecimal(subMap.get("mid2OpenBookMarks").toString()) : m1ob;
                BigDecimal m2obj = subMap.get("mid2ObjectiveMarks") != null ? new BigDecimal(subMap.get("mid2ObjectiveMarks").toString()) : m1obj;

                BigDecimal sem = subMap.get("semesterMarks") != null ? new BigDecimal(subMap.get("semesterMarks").toString()) : BigDecimal.valueOf(65);
                BigDecimal att = subMap.get("attendancePercentage") != null ? new BigDecimal(subMap.get("attendancePercentage").toString()) : BigDecimal.valueOf(88);

                Map<String, BigDecimal> computed = calculateTwoMidComponents(m1d, m1ob, m1obj, m2d, m2ob, m2obj, sem);
                BigDecimal total = computed.get("totalMarks");
                if (subMap.get("totalMarks") != null) {
                    total = new BigDecimal(subMap.get("totalMarks").toString());
                }

                String grade = subMap.get("grade") != null && !subMap.get("grade").toString().isBlank()
                        ? subMap.get("grade").toString().trim().toUpperCase()
                        : getGradeFromMarks(total);

                BigDecimal gp = subMap.get("gradePoint") != null
                        ? new BigDecimal(subMap.get("gradePoint").toString())
                        : getGradePointFromGrade(grade);

                StudentAcademicRecord record = recordRepository.findByStudentIdAndSemesterCodeAndSubjectCode(studentId, semesterCode, subCode)
                        .orElseGet(() -> StudentAcademicRecord.builder()
                                .student(student)
                                .semesterCode(semesterCode)
                                .semesterNum(semNum)
                                .subjectCode(subCode)
                                .subjectName(subName)
                                .build());

                record.setSubjectName(subName);
                if (facName != null) record.setFacultyName(facName);
                record.setCreditHours(ch);

                record.setMid1DescriptiveMarks(computed.get("mid1DescriptiveMarks"));
                record.setMid1OpenBookMarks(computed.get("mid1OpenBookMarks"));
                record.setMid1ObjectiveMarks(computed.get("mid1ObjectiveMarks"));
                record.setMid1TotalMarks(computed.get("mid1TotalMarks"));

                record.setMid2DescriptiveMarks(computed.get("mid2DescriptiveMarks"));
                record.setMid2OpenBookMarks(computed.get("mid2OpenBookMarks"));
                record.setMid2ObjectiveMarks(computed.get("mid2ObjectiveMarks"));
                record.setMid2TotalMarks(computed.get("mid2TotalMarks"));

                record.setConvertedInternalMarks(computed.get("convertedInternalMarks"));
                record.setDescriptiveMarks(computed.get("descriptiveMarks"));
                record.setOpenBookMarks(computed.get("openBookMarks"));
                record.setObjectiveMarks(computed.get("objectiveMarks"));
                record.setMidMarks(computed.get("mid1TotalMarks"));
                record.setInternalMarks(computed.get("convertedInternalMarks"));
                record.setSemesterMarks(computed.get("semesterMarks"));
                record.setTotalMarks(total);
                record.setGrade(grade);
                record.setGradePoint(gp);
                record.setAttendancePercentage(att);
                record.setUpdatedBy(adminId);

                updatedRecords.add(recordRepository.save(record));
            }
        }

        BigDecimal manualSgpa = payload.get("sgpa") != null ? new BigDecimal(payload.get("sgpa").toString()) : null;
        BigDecimal manualCgpa = payload.get("cgpa") != null ? new BigDecimal(payload.get("cgpa").toString()) : null;
        BigDecimal semAttendance = payload.get("attendancePercentage") != null ? new BigDecimal(payload.get("attendancePercentage").toString()) : null;
        String remarks = payload.get("remarks") != null ? payload.get("remarks").toString() : null;

        StudentSemesterSummary summary = recalculateSemesterAndCumulativeGPA(studentId, semesterCode, adminId, manualSgpa, manualCgpa);
        if (semAttendance != null) {
            summary.setAttendancePercentage(semAttendance);
        }
        if (remarks != null) {
            summary.setRemarks(remarks);
        }
        summaryRepository.save(summary);

        Map<String, Object> res = new HashMap<>();
        res.put("semesterCode", semesterCode);
        res.put("records", updatedRecords);
        res.put("summary", summary);
        return res;
    }

    public StudentSemesterSummary recalculateSemesterAndCumulativeGPA(Long studentId, String semesterCode, Long adminId, BigDecimal manualSgpa, BigDecimal manualCgpa) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        List<StudentAcademicRecord> semRecords = recordRepository.findByStudentIdAndSemesterCodeOrderBySubjectCodeAsc(studentId, semesterCode);
        int totalCredits = 0;
        int earnedCredits = 0;
        BigDecimal weightedPoints = BigDecimal.ZERO;
        BigDecimal totalAtt = BigDecimal.ZERO;

        for (StudentAcademicRecord r : semRecords) {
            int ch = r.getCreditHours() != null ? r.getCreditHours() : 3;
            totalCredits += ch;
            BigDecimal gp = r.getGradePoint() != null ? r.getGradePoint() : BigDecimal.ZERO;
            if (gp.compareTo(BigDecimal.ZERO) > 0) {
                earnedCredits += ch;
            }
            weightedPoints = weightedPoints.add(gp.multiply(BigDecimal.valueOf(ch)));
            if (r.getAttendancePercentage() != null) {
                totalAtt = totalAtt.add(r.getAttendancePercentage());
            }
        }

        BigDecimal calculatedSgpa = totalCredits > 0
                ? weightedPoints.divide(BigDecimal.valueOf(totalCredits), 2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(8.50);

        BigDecimal finalSgpa = manualSgpa != null ? manualSgpa : calculatedSgpa;
        BigDecimal avgAtt = semRecords.isEmpty() ? BigDecimal.valueOf(88.00) : totalAtt.divide(BigDecimal.valueOf(semRecords.size()), 2, RoundingMode.HALF_UP);

        StudentSemesterSummary summary = summaryRepository.findByStudentIdAndSemesterCode(studentId, semesterCode)
                .orElseGet(() -> StudentSemesterSummary.builder()
                        .student(student)
                        .semesterCode(semesterCode)
                        .semesterNum(getSemesterNum(semesterCode))
                        .build());

        summary.setSgpa(finalSgpa);
        summary.setTotalCredits(totalCredits);
        summary.setEarnedCredits(earnedCredits);
        summary.setAttendancePercentage(avgAtt);
        summary.setUpdatedBy(adminId);

        // Recalculate overall CGPA across all semesters
        List<StudentSemesterSummary> allSummaries = summaryRepository.findByStudentIdOrderBySemesterNumAsc(studentId);
        BigDecimal sumSgpa = finalSgpa;
        int semCount = 1;
        for (StudentSemesterSummary s : allSummaries) {
            if (!s.getSemesterCode().equals(semesterCode) && s.getSgpa() != null) {
                sumSgpa = sumSgpa.add(s.getSgpa());
                semCount++;
            }
        }
        BigDecimal calculatedCgpa = sumSgpa.divide(BigDecimal.valueOf(semCount), 2, RoundingMode.HALF_UP);
        BigDecimal finalCgpa = manualCgpa != null ? manualCgpa : calculatedCgpa;

        summary.setCgpa(finalCgpa);
        StudentSemesterSummary savedSummary = summaryRepository.save(summary);

        // Single Source of Truth: update StudentCgpa record for student
        try {
            List<com.campusiq.assessment.entity.StudentCgpa> existingCgpa = cgpaRepository.findCgpaByStudentId(studentId);
            com.campusiq.assessment.entity.StudentCgpa cgpaRec;
            if (!existingCgpa.isEmpty()) {
                cgpaRec = existingCgpa.get(0);
                for (int i = 1; i < existingCgpa.size(); i++) {
                    cgpaRepository.delete(existingCgpa.get(i));
                }
            } else {
                cgpaRec = new com.campusiq.assessment.entity.StudentCgpa();
                cgpaRec.setStudent(student);
                cgpaRec.setSemester(null);
            }
            cgpaRec.setCgpaValue(finalCgpa);
            cgpaRec.setPublishedBy(adminId);
            cgpaRec.setRemarks("Academic Record Update");
            cgpaRepository.save(cgpaRec);
        } catch (Exception ex) {
            // Ignored if async or log warning
        }

        return savedSummary;
    }

    public void initializeCurriculumForStudent(User student) {
        List<SemesterCurriculum> curriculum = getDefaultCurriculum();
        for (SemesterCurriculum sc : curriculum) {
            for (SubjectDef sub : sc.subjects) {
                if (recordRepository.findByStudentIdAndSemesterCodeAndSubjectCode(student.getId(), sc.semesterCode, sub.code).isEmpty()) {
                    Map<String, BigDecimal> computed = calculateTwoMidComponents(
                            BigDecimal.valueOf(sub.defaultDescriptive),
                            BigDecimal.valueOf(sub.defaultOpenBook),
                            BigDecimal.valueOf(sub.defaultObjective),
                            BigDecimal.valueOf(Math.min(30.0, sub.defaultDescriptive + 1.0)),
                            BigDecimal.valueOf(Math.min(20.0, sub.defaultOpenBook + 1.0)),
                            BigDecimal.valueOf(Math.min(20.0, sub.defaultObjective + 1.0)),
                            BigDecimal.valueOf(sub.defaultSem)
                    );

                    StudentAcademicRecord rec = StudentAcademicRecord.builder()
                            .student(student)
                            .semesterCode(sc.semesterCode)
                            .semesterNum(sc.semesterNum)
                            .subjectCode(sub.code)
                            .subjectName(sub.name)
                            .facultyName(sub.faculty)
                            .creditHours(sub.credits)
                            .mid1DescriptiveMarks(computed.get("mid1DescriptiveMarks"))
                            .mid1OpenBookMarks(computed.get("mid1OpenBookMarks"))
                            .mid1ObjectiveMarks(computed.get("mid1ObjectiveMarks"))
                            .mid1TotalMarks(computed.get("mid1TotalMarks"))
                            .mid2DescriptiveMarks(computed.get("mid2DescriptiveMarks"))
                            .mid2OpenBookMarks(computed.get("mid2OpenBookMarks"))
                            .mid2ObjectiveMarks(computed.get("mid2ObjectiveMarks"))
                            .mid2TotalMarks(computed.get("mid2TotalMarks"))
                            .convertedInternalMarks(computed.get("convertedInternalMarks"))
                            .descriptiveMarks(computed.get("descriptiveMarks"))
                            .openBookMarks(computed.get("openBookMarks"))
                            .objectiveMarks(computed.get("objectiveMarks"))
                            .midMarks(computed.get("mid1TotalMarks"))
                            .internalMarks(computed.get("convertedInternalMarks"))
                            .semesterMarks(computed.get("semesterMarks"))
                            .totalMarks(computed.get("totalMarks"))
                            .grade(sub.defaultGrade)
                            .gradePoint(getGradePointFromGrade(sub.defaultGrade))
                            .attendancePercentage(BigDecimal.valueOf(sub.defaultAttendance))
                            .build();
                    recordRepository.save(rec);
                }
            }

            if (summaryRepository.findByStudentIdAndSemesterCode(student.getId(), sc.semesterCode).isEmpty()) {
                StudentSemesterSummary summary = StudentSemesterSummary.builder()
                        .student(student)
                        .semesterCode(sc.semesterCode)
                        .semesterNum(sc.semesterNum)
                        .sgpa(BigDecimal.valueOf(sc.defaultSgpa))
                        .cgpa(BigDecimal.valueOf(sc.defaultCgpa))
                        .totalCredits(sc.totalCredits)
                        .earnedCredits(sc.totalCredits)
                        .attendancePercentage(BigDecimal.valueOf(sc.defaultAttendance))
                        .remarks("Completed")
                        .build();
                summaryRepository.save(summary);
            }
        }
    }

    private static class SubjectDef {
        String code;
        String name;
        String faculty;
        int credits;
        double defaultDescriptive; // Max 30
        double defaultOpenBook;    // Max 20
        double defaultObjective;   // Max 20
        double defaultSem;         // Max 70
        String defaultGrade;
        double defaultAttendance;

        SubjectDef(String code, String name, String faculty, int credits, double desc, double ob, double obj, double sem, String grade, double att) {
            this.code = code;
            this.name = name;
            this.faculty = faculty;
            this.credits = credits;
            this.defaultDescriptive = desc;
            this.defaultOpenBook = ob;
            this.defaultObjective = obj;
            this.defaultSem = sem;
            this.defaultGrade = grade;
            this.defaultAttendance = att;
        }
    }

    private static class SemesterCurriculum {
        String semesterCode;
        int semesterNum;
        int totalCredits;
        double defaultSgpa;
        double defaultCgpa;
        double defaultAttendance;
        List<SubjectDef> subjects;

        SemesterCurriculum(String semesterCode, int semesterNum, int totalCredits, double sgpa, double cgpa, double att, List<SubjectDef> subjects) {
            this.semesterCode = semesterCode;
            this.semesterNum = semesterNum;
            this.totalCredits = totalCredits;
            this.defaultSgpa = sgpa;
            this.defaultCgpa = cgpa;
            this.defaultAttendance = att;
            this.subjects = subjects;
        }
    }

    private List<SemesterCurriculum> getDefaultCurriculum() {
        List<SemesterCurriculum> list = new ArrayList<>();

        // 1-1 (Sem 1)
        list.add(new SemesterCurriculum("1-1", 1, 20, 8.85, 8.85, 91.0, List.of(
                new SubjectDef("MA101", "Engineering Mathematics - I", "Dr. Robert Smith", 4, 28, 18, 19, 64, "S", 92),
                new SubjectDef("PH101", "Engineering Physics", "Dr. Ellen Vance", 3, 26, 17, 18, 62, "A", 88),
                new SubjectDef("CS101", "Programming for Problem Solving (C)", "Prof. Sarah Connor", 4, 29, 19, 20, 66, "S", 95),
                new SubjectDef("EE101", "Basic Electrical Engineering", "Prof. Alan Grant", 3, 25, 16, 17, 60, "A", 86),
                new SubjectDef("EN101", "English for Communication", "Dr. Laura Croft", 2, 27, 18, 18, 63, "A", 90),
                new SubjectDef("CS102", "C Programming Lab", "Prof. Sarah Connor", 2, 29, 19, 20, 68, "S", 96),
                new SubjectDef("PH102", "Physics Laboratory", "Dr. Ellen Vance", 2, 28, 18, 19, 65, "S", 91)
        )));

        // 1-2 (Sem 2)
        list.add(new SemesterCurriculum("1-2", 2, 20, 8.90, 8.88, 90.5, List.of(
                new SubjectDef("MA102", "Engineering Mathematics - II", "Dr. Robert Smith", 4, 28, 18, 19, 63, "A", 90),
                new SubjectDef("CH101", "Engineering Chemistry", "Dr. Walter White", 3, 26, 16, 17, 61, "A", 87),
                new SubjectDef("CS103", "Data Structures & Algorithms", "Prof. Linus Torvalds", 4, 29, 19, 20, 66, "S", 94),
                new SubjectDef("EC101", "Basic Electronics Engineering", "Dr. Bruce Banner", 3, 27, 17, 18, 63, "A", 88),
                new SubjectDef("ME101", "Engineering Graphics & Design", "Prof. Tony Stark", 2, 26, 16, 17, 60, "A", 85),
                new SubjectDef("CS104", "Data Structures Lab", "Prof. Linus Torvalds", 2, 30, 20, 20, 68, "S", 95),
                new SubjectDef("CH102", "Chemistry Laboratory", "Dr. Walter White", 2, 28, 18, 18, 64, "A", 89)
        )));

        // 2-1 (Sem 3)
        list.add(new SemesterCurriculum("2-1", 3, 21, 8.95, 8.90, 92.0, List.of(
                new SubjectDef("CS201", "Object Oriented Programming (Java)", "Prof. James Gosling", 4, 29, 19, 20, 66, "S", 94),
                new SubjectDef("CS202", "Discrete Mathematical Structures", "Dr. Donald Knuth", 4, 27, 17, 18, 62, "A", 88),
                new SubjectDef("CS203", "Database Management Systems", "Dr. Edgar Codd", 4, 29, 18, 19, 65, "S", 92),
                new SubjectDef("EC201", "Digital Logic & Computer Organization", "Prof. John Hennessy", 3, 26, 16, 17, 60, "A", 86),
                new SubjectDef("CS204", "Software Engineering Principles", "Prof. Fred Brooks", 3, 28, 18, 19, 64, "A", 90),
                new SubjectDef("CS205", "Java & DBMS Laboratory", "Prof. James Gosling", 3, 30, 20, 20, 68, "S", 96)
        )));

        // 2-2 (Sem 4)
        list.add(new SemesterCurriculum("2-2", 4, 21, 9.05, 8.94, 93.0, List.of(
                new SubjectDef("CS206", "Operating Systems", "Prof. Andrew Tanenbaum", 4, 29, 19, 20, 65, "S", 93),
                new SubjectDef("CS207", "Design & Analysis of Algorithms", "Dr. Thomas Cormen", 4, 28, 18, 19, 64, "A", 91),
                new SubjectDef("CS208", "Computer Networks", "Dr. Vint Cerf", 4, 29, 19, 20, 66, "S", 95),
                new SubjectDef("CS209", "Formal Languages & Automata", "Dr. Michael Sipser", 3, 26, 16, 17, 60, "A", 85),
                new SubjectDef("HS201", "Universal Human Values & Ethics", "Dr. Laura Croft", 3, 28, 18, 18, 63, "A", 92),
                new SubjectDef("CS210", "OS & Networks Laboratory", "Prof. Andrew Tanenbaum", 3, 30, 20, 20, 68, "S", 96)
        )));

        // 3-1 (Sem 5)
        list.add(new SemesterCurriculum("3-1", 5, 22, 9.10, 8.97, 92.5, List.of(
                new SubjectDef("CS301", "Web Technologies & Full Stack", "Prof. Tim Berners-Lee", 4, 30, 19, 20, 67, "S", 96),
                new SubjectDef("CS302", "Artificial Intelligence & Expert Systems", "Dr. Stuart Russell", 4, 29, 19, 19, 65, "S", 92),
                new SubjectDef("CS303", "Compiler Design", "Dr. Alfred Aho", 4, 27, 17, 18, 62, "A", 87),
                new SubjectDef("CS304", "Information Security & Cryptography", "Dr. Bruce Schneier", 3, 28, 18, 18, 63, "A", 89),
                new SubjectDef("OE301", "Open Elective - I (Cloud Computing)", "Prof. Werner Vogels", 3, 28, 18, 19, 64, "A", 91),
                new SubjectDef("CS305", "Web Tech & AI Laboratory", "Prof. Tim Berners-Lee", 4, 30, 20, 20, 68, "S", 97)
        )));

        // 3-2 (Sem 6)
        list.add(new SemesterCurriculum("3-2", 6, 22, 9.20, 9.01, 93.5, List.of(
                new SubjectDef("CS306", "Machine Learning & Deep Learning", "Dr. Yann LeCun", 4, 30, 20, 20, 67, "S", 95),
                new SubjectDef("CS307", "Distributed Systems & Microservices", "Dr. Martin Fowler", 4, 29, 19, 20, 66, "S", 93),
                new SubjectDef("CS308", "DevOps & Cloud Native Architecture", "Prof. Gene Kim", 3, 28, 18, 19, 64, "A", 90),
                new SubjectDef("PE301", "Professional Elective - II (Data Analytics)", "Dr. Peter Norvig", 3, 29, 18, 19, 65, "S", 89),
                new SubjectDef("OE302", "Open Elective - II (Cyber Physical Systems)", "Dr. Radia Perlman", 3, 27, 17, 18, 62, "A", 88),
                new SubjectDef("CS309", "Machine Learning & Cloud Native Lab", "Dr. Yann LeCun", 3, 30, 20, 20, 69, "S", 96),
                new SubjectDef("CS310", "Mini Project & Technical Seminar", "Dr. Stuart Russell", 2, 30, 20, 20, 69, "S", 98)
        )));

        // 4-1 (Sem 7)
        list.add(new SemesterCurriculum("4-1", 7, 20, 9.25, 9.05, 94.0, List.of(
                new SubjectDef("CS401", "Big Data Analytics & Hadoop Ecosystem", "Dr. Doug Cutting", 4, 29, 19, 20, 66, "S", 94),
                new SubjectDef("CS402", "Internet of Things & Embedded Systems", "Prof. Kevin Ashton", 3, 28, 18, 19, 64, "A", 90),
                new SubjectDef("PE401", "Professional Elective - III (Natural Language Processing)", "Dr. Christopher Manning", 3, 29, 19, 20, 65, "S", 93),
                new SubjectDef("PE402", "Professional Elective - IV (Blockchain Technology)", "Dr. Gavin Wood", 3, 28, 18, 19, 63, "A", 91),
                new SubjectDef("CS403", "Project Work Phase - I (Capstone)", "Prof. Sarah Connor", 5, 30, 20, 20, 69, "S", 97),
                new SubjectDef("CS404", "Industrial Internship / Practical Training", "Dr. Robert Smith", 2, 30, 20, 20, 69, "S", 99)
        )));

        // 4-2 (Sem 8)
        list.add(new SemesterCurriculum("4-2", 8, 16, 9.40, 9.09, 96.0, List.of(
                new SubjectDef("PE403", "Professional Elective - V (Quantum Computing & AI)", "Dr. David Deutsch", 3, 30, 19, 20, 66, "S", 95),
                new SubjectDef("HS401", "Management Science & Entrepreneurship", "Prof. Clayton Christensen", 3, 29, 18, 19, 64, "A", 92),
                new SubjectDef("CS405", "Major Project Work Phase - II (Capstone)", "Prof. Sarah Connor", 8, 30, 20, 20, 69, "S", 98),
                new SubjectDef("CS406", "Comprehensive Viva Voce & Publication", "Dr. Donald Knuth", 2, 30, 20, 20, 70, "S", 99)
        )));

        return list;
    }

    public Map<String, Object> importAcademicRecordsFromCsv(List<Map<String, Object>> rows, Long userId, String userRole) {
        int importedCount = 0;
        int skippedCount = 0;
        List<String> errors = new ArrayList<>();
        Set<String> affectedSemesters = new HashSet<>();
        Set<Long> affectedStudents = new HashSet<>();

        boolean isFaculty = "FACULTY".equalsIgnoreCase(userRole);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);

        if (rows == null || rows.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("importedCount", 0);
            res.put("skippedCount", 0);
            res.put("errors", List.of("No CSV rows provided"));
            return res;
        }

        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            int lineNum = i + 1;
            try {
                String enroll = row.getOrDefault("enrollmentNumber", row.getOrDefault("enrollment", "")).toString().trim();
                String email = row.getOrDefault("email", "").toString().trim();
                String semCode = row.getOrDefault("semesterCode", row.getOrDefault("semester", "1-1")).toString().trim();
                String subCode = row.getOrDefault("subjectCode", "").toString().trim();
                String subName = row.getOrDefault("subjectName", subCode).toString().trim();

                if (subCode.isEmpty()) {
                    errors.add("Row " + lineNum + ": Missing subject code");
                    skippedCount++;
                    continue;
                }

                User student = null;
                if (!enroll.isEmpty()) {
                    student = userRepository.findByEnrollmentNumber(enroll).orElse(null);
                }
                if (student == null && !email.isEmpty()) {
                    student = userRepository.findByEmail(email).orElse(null);
                }
                if (student == null && row.get("studentId") != null) {
                    student = userRepository.findById(Long.valueOf(row.get("studentId").toString())).orElse(null);
                }
                if (student == null) {
                    errors.add("Row " + lineNum + ": Student not found for enrollment: " + enroll);
                    skippedCount++;
                    continue;
                }

                final User resolvedStudent = student;
                Long sId = resolvedStudent.getId();
                affectedStudents.add(sId);
                affectedSemesters.add(semCode);

                StudentAcademicRecord record = recordRepository.findByStudentIdAndSemesterCodeAndSubjectCode(sId, semCode, subCode)
                        .orElseGet(() -> StudentAcademicRecord.builder()
                                .student(resolvedStudent)
                                .semesterCode(semCode)
                                .semesterNum(getSemesterNum(semCode))
                                .subjectCode(subCode)
                                .subjectName(subName)
                                .build());

                record.setSubjectName(subName);
                if (row.get("creditHours") != null) {
                    record.setCreditHours(Integer.valueOf(row.get("creditHours").toString()));
                }
                if (row.get("facultyName") != null) {
                    record.setFacultyName(row.get("facultyName").toString().trim());
                }

                // If Faculty or Admin, parse Mid marks
                BigDecimal m1d = row.get("mid1DescriptiveMarks") != null ? new BigDecimal(row.get("mid1DescriptiveMarks").toString()) : record.getMid1DescriptiveMarks();
                BigDecimal m1ob = row.get("mid1OpenBookMarks") != null ? new BigDecimal(row.get("mid1OpenBookMarks").toString()) : record.getMid1OpenBookMarks();
                BigDecimal m1obj = row.get("mid1ObjectiveMarks") != null ? new BigDecimal(row.get("mid1ObjectiveMarks").toString()) : record.getMid1ObjectiveMarks();

                BigDecimal m2d = row.get("mid2DescriptiveMarks") != null ? new BigDecimal(row.get("mid2DescriptiveMarks").toString()) : record.getMid2DescriptiveMarks();
                BigDecimal m2ob = row.get("mid2OpenBookMarks") != null ? new BigDecimal(row.get("mid2OpenBookMarks").toString()) : record.getMid2OpenBookMarks();
                BigDecimal m2obj = row.get("mid2ObjectiveMarks") != null ? new BigDecimal(row.get("mid2ObjectiveMarks").toString()) : record.getMid2ObjectiveMarks();

                // Semester final marks: updated if Admin or not explicitly faculty-restricted
                BigDecimal sem = (isAdmin || !isFaculty) && row.get("semesterMarks") != null
                        ? new BigDecimal(row.get("semesterMarks").toString())
                        : record.getSemesterMarks();

                BigDecimal att = row.get("attendancePercentage") != null
                        ? new BigDecimal(row.get("attendancePercentage").toString())
                        : record.getAttendancePercentage();

                Map<String, BigDecimal> computed = calculateTwoMidComponents(m1d, m1ob, m1obj, m2d, m2ob, m2obj, sem);
                BigDecimal total = computed.get("totalMarks");
                if (row.get("totalMarks") != null && isAdmin) {
                    total = new BigDecimal(row.get("totalMarks").toString());
                }
                String grade = getGradeFromMarks(total);
                BigDecimal gp = getGradePointFromGrade(grade);

                record.setMid1DescriptiveMarks(computed.get("mid1DescriptiveMarks"));
                record.setMid1OpenBookMarks(computed.get("mid1OpenBookMarks"));
                record.setMid1ObjectiveMarks(computed.get("mid1ObjectiveMarks"));
                record.setMid1TotalMarks(computed.get("mid1TotalMarks"));
                record.setMid2DescriptiveMarks(computed.get("mid2DescriptiveMarks"));
                record.setMid2OpenBookMarks(computed.get("mid2OpenBookMarks"));
                record.setMid2ObjectiveMarks(computed.get("mid2ObjectiveMarks"));
                record.setMid2TotalMarks(computed.get("mid2TotalMarks"));
                record.setConvertedInternalMarks(computed.get("convertedInternalMarks"));
                record.setDescriptiveMarks(computed.get("descriptiveMarks"));
                record.setOpenBookMarks(computed.get("openBookMarks"));
                record.setObjectiveMarks(computed.get("objectiveMarks"));
                record.setMidMarks(computed.get("mid1TotalMarks"));
                record.setInternalMarks(computed.get("convertedInternalMarks"));
                record.setSemesterMarks(computed.get("semesterMarks"));
                record.setTotalMarks(total);
                record.setGrade(grade);
                record.setGradePoint(gp);
                if (att != null) record.setAttendancePercentage(att);
                record.setUpdatedBy(userId);

                recordRepository.save(record);
                importedCount++;
            } catch (Exception ex) {
                errors.add("Row " + lineNum + ": " + ex.getMessage());
                skippedCount++;
            }
        }

        // Recalculate SGPA for all affected students & semesters
        for (Long stId : affectedStudents) {
            for (String sCode : affectedSemesters) {
                recalculateSemesterAndCumulativeGPA(stId, sCode, userId, null, null);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("importedCount", importedCount);
        result.put("skippedCount", skippedCount);
        result.put("errors", errors);
        return result;
    }
}

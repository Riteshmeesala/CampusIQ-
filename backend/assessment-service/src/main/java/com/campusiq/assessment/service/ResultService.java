package com.campusiq.assessment.service;

import com.campusiq.assessment.dto.ResultRequest;
import com.campusiq.assessment.entity.Exam;
import com.campusiq.assessment.entity.Result;
import com.campusiq.assessment.entity.StudentAcademicRecord;
import com.campusiq.assessment.entity.StudentSemesterSummary;
import com.campusiq.assessment.entity.User;
import com.campusiq.assessment.repository.ExamRepository;
import com.campusiq.assessment.repository.ResultRepository;
import com.campusiq.assessment.repository.StudentAcademicRecordRepository;
import com.campusiq.assessment.repository.StudentSemesterSummaryRepository;
import com.campusiq.assessment.repository.UserRepository;
import com.campusiq.common.exception.BadRequestException;
import com.campusiq.common.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ResultService {

    private static final Logger log = LoggerFactory.getLogger(ResultService.class);

    private final ResultRepository resultRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final StudentAcademicRecordRepository academicRecordRepository;
    private final StudentSemesterSummaryRepository semesterSummaryRepository;
    private final com.campusiq.assessment.repository.StudentCgpaRepository cgpaRepository;

    public ResultService(ResultRepository resultRepository,
                         ExamRepository examRepository,
                         UserRepository userRepository,
                         StudentAcademicRecordRepository academicRecordRepository,
                         StudentSemesterSummaryRepository semesterSummaryRepository,
                         com.campusiq.assessment.repository.StudentCgpaRepository cgpaRepository) {
        this.resultRepository = resultRepository;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
        this.academicRecordRepository = academicRecordRepository;
        this.semesterSummaryRepository = semesterSummaryRepository;
        this.cgpaRepository = cgpaRepository;
    }

    @Transactional
    public List<Result> publishResults(ResultRequest req, String resultType, Long publisherId) {
        String type = (resultType != null && !resultType.isBlank())
                ? resultType.toUpperCase() : "MID";

        Exam exam = examRepository.findById(req.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", req.getExamId()));

        if (req.getStudentMarks() == null || req.getStudentMarks().isEmpty())
            throw new BadRequestException("No student marks provided");

        List<Result> saved = new ArrayList<>();
        boolean isSem = "SEM".equalsIgnoreCase(type) || "SEMESTER".equalsIgnoreCase(type);

        if (!isSem && req.getMidTerm() != null && exam.getCourse() != null) {
            int targetMid = req.getMidTerm();
            String examNameLower = (exam.getExamName() != null) ? exam.getExamName().toLowerCase() : "";
            boolean isMid2Exam = examNameLower.contains("mid 2") || examNameLower.contains("mid-2") || examNameLower.contains("mid2");
            boolean needsMid2 = (targetMid == 2);
            if (needsMid2 != isMid2Exam) {
                // Find matching Mid exam for this course
                List<Exam> courseExams = examRepository.findByCourseId(exam.getCourse().getId());
                Optional<Exam> matchedExam = courseExams.stream().filter(e -> {
                    String name = (e.getExamName() != null) ? e.getExamName().toLowerCase() : "";
                    boolean isM2 = name.contains("mid 2") || name.contains("mid-2") || name.contains("mid2");
                    return needsMid2 ? isM2 : !isM2;
                }).findFirst();

                if (matchedExam.isPresent()) {
                    exam = matchedExam.get();
                } else {
                    Exam newMidExam = Exam.builder()
                            .course(exam.getCourse())
                            .examName("Mid-Term " + targetMid + ": " + exam.getCourse().getCourseName())
                            .examType("MID_SEM")
                            .semester(exam.getSemester() != null ? exam.getSemester() : 4)
                            .durationMinutes(90)
                            .totalMarks(30)
                            .passingMarks(12)
                            .scheduledDate(exam.getScheduledDate() != null ? exam.getScheduledDate() : LocalDateTime.now())
                            .venue(exam.getVenue() != null ? exam.getVenue() : "Auditorium Hall")
                            .status(Exam.ExamStatus.COMPLETED)
                            .description("Mid-Term " + targetMid + " Examination for " + exam.getCourse().getCourseName())
                            .build();
                    exam = examRepository.save(newMidExam);
                }
            }
        }

        for (Map.Entry<Long, BigDecimal> entry : req.getStudentMarks().entrySet()) {
            Long studentId = entry.getKey();
            BigDecimal inputMarks = entry.getValue();
            if (inputMarks == null) continue;

            if (inputMarks.compareTo(BigDecimal.ZERO) < 0)
                throw new BadRequestException("Marks cannot be negative for student " + studentId);

            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

            BigDecimal marksObtained;
            BigDecimal percentage;
            String grade;
            BigDecimal gPoints;
            boolean pass;
            BigDecimal descMarks = null;
            BigDecimal openBookMarks = null;
            BigDecimal assignmentMarks = null;
            BigDecimal objectiveMarks = null;
            BigDecimal midMarks = null;
            BigDecimal semMarks = null;
            BigDecimal totalMarks = null;

            if (isSem) {
                // ── SEMESTER END EXAMINATION: Max 70 marks ──
                double semVal = inputMarks.doubleValue();
                if (semVal > 70.0) {
                    throw new BadRequestException("Semester exam marks cannot exceed 70 for student " + studentId);
                }
                semMarks = BigDecimal.valueOf(semVal).setScale(2, RoundingMode.HALF_UP);
                marksObtained = semMarks;

                // Look up student's existing Mid marks (Max 30) combining Mid-1 & Mid-2 via 80/20 rule
                double existingMid = 25.0; // default internal if not yet recorded
                String semCode = exam.getSemester() != null ? getSemesterCode(exam.getSemester()) : "2-2";
                Optional<StudentAcademicRecord> recOpt = academicRecordRepository
                        .findByStudentIdAndSemesterCodeAndSubjectCode(studentId, semCode, exam.getCourse().getCourseCode());
                if (recOpt.isPresent()) {
                    StudentAcademicRecord rec = recOpt.get();
                    Double m1 = rec.getMid1TotalMarks() != null ? rec.getMid1TotalMarks().doubleValue() : null;
                    Double m2 = rec.getMid2TotalMarks() != null ? rec.getMid2TotalMarks().doubleValue() : null;
                    if (m1 != null && m2 != null) {
                        double higher = Math.max(m1, m2);
                        double lower = Math.min(m1, m2);
                        existingMid = (0.80 * higher) + (0.20 * lower);
                    } else if (rec.getConvertedInternalMarks() != null) {
                        existingMid = rec.getConvertedInternalMarks().doubleValue();
                    } else if (rec.getMidMarks() != null) {
                        existingMid = rec.getMidMarks().doubleValue();
                    }
                } else {
                    List<Result> existingMids = resultRepository.findByStudentIdAndCourseId(studentId, exam.getCourse().getId());
                    Optional<Result> midResultOpt = existingMids.stream()
                            .filter(r -> "MID".equalsIgnoreCase(r.getResultType()) || "MID_SEM".equalsIgnoreCase(r.getResultType()))
                            .findFirst();
                    if (midResultOpt.isPresent()) {
                        existingMid = midResultOpt.get().getMarksObtained().doubleValue();
                    }
                }
                existingMid = Math.min(30.0, Math.max(0.0, existingMid));
                midMarks = BigDecimal.valueOf(existingMid).setScale(2, RoundingMode.HALF_UP);

                // Combined Total: Sem (70) + 80/20 Mid (30) = Max 100 marks
                double totVal = Math.min(100.0, semVal + existingMid);
                totalMarks = BigDecimal.valueOf(totVal).setScale(2, RoundingMode.HALF_UP);

                // Percentage on 100 marks
                percentage = totalMarks;

                // Passing criteria: Sem marks >= 24 (out of 70) AND Total marks >= 40 (out of 100)
                // If a student scores 24 in sem, they need at least 16 in mid (24 + 16 = 40) to pass;
                // otherwise they must score higher than 24 in sem to reach 40.
                pass = (semVal >= 24.0) && (totVal >= 40.0);

                if (pass) {
                    grade = computeGrade(percentage);
                    gPoints = computeGradePoints(percentage);
                } else {
                    grade = "F";
                    gPoints = BigDecimal.ZERO;
                }

                // Sync with StudentAcademicRecord
                syncSemMarksToAcademicRecord(student, exam, semVal, totVal, grade, gPoints, publisherId);

            } else {
                // ── MID-SEMESTER EXAMINATION: Max 30 marks ──
                // Criteria breakdown: Descriptive 30/3 = 10, Open Book 20/4 = 5, Assignment = 5, Objective 20/2 = 10 -> Total 30
                double dVal, obVal, asVal, objVal, midVal;

                if (req.getStudentBreakdowns() != null && req.getStudentBreakdowns().containsKey(studentId)) {
                    Map<String, BigDecimal> brk = req.getStudentBreakdowns().get(studentId);
                    dVal = brk.getOrDefault("descriptive", BigDecimal.valueOf(27.0)).doubleValue();
                    obVal = brk.getOrDefault("openBook", BigDecimal.valueOf(16.0)).doubleValue();
                    asVal = brk.getOrDefault("assignment", BigDecimal.valueOf(5.0)).doubleValue();
                    objVal = brk.getOrDefault("objective", BigDecimal.valueOf(18.0)).doubleValue();
                } else {
                    double raw = inputMarks.doubleValue();
                    if (raw > 30.0) {
                        throw new BadRequestException("Mid marks cannot exceed 30 for student " + studentId);
                    }
                    dVal = (raw / 30.0) * 30.0;
                    obVal = (raw / 30.0) * 20.0;
                    asVal = (raw / 30.0) * 5.0;
                    objVal = (raw / 30.0) * 20.0;
                }

                // Institutional criteria calculations
                dVal = Math.max(0.0, Math.min(30.0, dVal));
                obVal = Math.max(0.0, Math.min(20.0, obVal));
                asVal = Math.max(0.0, Math.min(5.0, asVal));
                objVal = Math.max(0.0, Math.min(20.0, objVal));

                double dScaled = dVal / 3.0;     // Max 10
                double obScaled = obVal / 4.0;   // Max 5
                double asScaled = asVal;         // Max 5
                double objScaled = objVal / 2.0; // Max 10

                midVal = Math.min(30.0, dScaled + obScaled + asScaled + objScaled);

                descMarks = BigDecimal.valueOf(dVal).setScale(2, RoundingMode.HALF_UP);
                openBookMarks = BigDecimal.valueOf(obVal).setScale(2, RoundingMode.HALF_UP);
                assignmentMarks = BigDecimal.valueOf(asVal).setScale(2, RoundingMode.HALF_UP);
                objectiveMarks = BigDecimal.valueOf(objVal).setScale(2, RoundingMode.HALF_UP);
                midMarks = BigDecimal.valueOf(midVal).setScale(2, RoundingMode.HALF_UP);
                marksObtained = midMarks;

                // Percentage on 30 marks
                percentage = midMarks.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);

                // No letter grades for Mid examinations (Continuous Assessment recorded out of 30)
                pass = true;
                grade = null;
                gPoints = null;

                // Sync with StudentAcademicRecord
                syncMidMarksToAcademicRecord(student, exam, midVal, dVal, obVal, asVal, objVal, req.getMidTerm(), publisherId);
            }

            Optional<Result> existing = resultRepository.findByStudentAndExamId(student, exam.getId());
            Result res;
            if (existing.isPresent()) {
                res = existing.get();
                res.setMarksObtained(marksObtained);
                res.setPercentage(percentage);
                res.setGrade(grade);
                res.setPass(pass);
                res.setGradePoints(gPoints);
                res.setRemarks(req.getRemarks());
                res.setResultType(type);
                res.setPublishedBy(publisherId);
                res.setDescriptiveMarks(descMarks);
                res.setOpenBookMarks(openBookMarks);
                res.setAssignmentMarks(assignmentMarks);
                res.setObjectiveMarks(objectiveMarks);
                res.setMidMarks(midMarks);
                res.setSemMarks(semMarks);
                res.setTotalMarks(totalMarks);
            } else {
                res = Result.builder()
                        .student(student)
                        .exam(exam)
                        .marksObtained(marksObtained)
                        .percentage(percentage)
                        .grade(grade)
                        .pass(pass)
                        .gradePoints(gPoints)
                        .remarks(req.getRemarks())
                        .resultType(type)
                        .publishedBy(publisherId)
                        .descriptiveMarks(descMarks)
                        .openBookMarks(openBookMarks)
                        .assignmentMarks(assignmentMarks)
                        .objectiveMarks(objectiveMarks)
                        .midMarks(midMarks)
                        .semMarks(semMarks)
                        .totalMarks(totalMarks)
                        .build();
            }
            saved.add(resultRepository.save(res));
            log.info("[Result] {} | student={} | exam={} | marks={} | total={} | grade={} | pass={}",
                    type, student.getName(), exam.getExamName(), marksObtained, totalMarks, grade, pass);
        }
        return saved;
    }

    private void syncMidMarksToAcademicRecord(User student, Exam exam, double midTotal,
                                              double desc, double ob, double as, double obj,
                                              Integer midTermReq, Long publisherId) {
        if (exam.getCourse() == null) return;
        String subjectCode = exam.getCourse().getCourseCode();
        String subjectName = exam.getCourse().getCourseName();
        String semCode = exam.getSemester() != null ? getSemesterCode(exam.getSemester()) : "2-2";
        int semNum = exam.getSemester() != null ? exam.getSemester() : 4;

        Optional<StudentAcademicRecord> opt = academicRecordRepository
                .findByStudentIdAndSemesterCodeAndSubjectCode(student.getId(), semCode, subjectCode);

        StudentAcademicRecord rec = opt.orElseGet(() -> StudentAcademicRecord.builder()
                .student(student)
                .semesterCode(semCode)
                .semesterNum(semNum)
                .subjectCode(subjectCode)
                .subjectName(subjectName)
                .creditHours(exam.getCourse().getCreditHours() != null ? exam.getCourse().getCreditHours() : 4)
                .build());

        String examNameLower = exam.getExamName() != null ? exam.getExamName().toLowerCase() : "";
        boolean isMid2 = (midTermReq != null && midTermReq == 2)
                || examNameLower.contains("mid-2")
                || examNameLower.contains("mid 2")
                || examNameLower.contains("mid2")
                || examNameLower.contains("mid-term 2")
                || examNameLower.contains("mid term 2");

        if (isMid2) {
            rec.setMid2DescriptiveMarks(BigDecimal.valueOf(desc).setScale(2, RoundingMode.HALF_UP));
            rec.setMid2OpenBookMarks(BigDecimal.valueOf(ob).setScale(2, RoundingMode.HALF_UP));
            rec.setMid2AssignmentMarks(BigDecimal.valueOf(as).setScale(2, RoundingMode.HALF_UP));
            rec.setMid2ObjectiveMarks(BigDecimal.valueOf(obj).setScale(2, RoundingMode.HALF_UP));
            rec.setMid2TotalMarks(BigDecimal.valueOf(midTotal).setScale(2, RoundingMode.HALF_UP));
        } else {
            rec.setMid1DescriptiveMarks(BigDecimal.valueOf(desc).setScale(2, RoundingMode.HALF_UP));
            rec.setMid1OpenBookMarks(BigDecimal.valueOf(ob).setScale(2, RoundingMode.HALF_UP));
            rec.setMid1AssignmentMarks(BigDecimal.valueOf(as).setScale(2, RoundingMode.HALF_UP));
            rec.setMid1ObjectiveMarks(BigDecimal.valueOf(obj).setScale(2, RoundingMode.HALF_UP));
            rec.setMid1TotalMarks(BigDecimal.valueOf(midTotal).setScale(2, RoundingMode.HALF_UP));
            rec.setDescriptiveMarks(BigDecimal.valueOf(desc).setScale(2, RoundingMode.HALF_UP));
            rec.setOpenBookMarks(BigDecimal.valueOf(ob).setScale(2, RoundingMode.HALF_UP));
            rec.setAssignmentMarks(BigDecimal.valueOf(as).setScale(2, RoundingMode.HALF_UP));
            rec.setObjectiveMarks(BigDecimal.valueOf(obj).setScale(2, RoundingMode.HALF_UP));
        }

        // Apply institutional 80/20 Rule:
        // If student gets more marks in Mid-1, 80% from Mid-1 and 20% from Mid-2.
        // If student gets more marks in Mid-2, 80% from Mid-2 and 20% from Mid-1.
        Double m1 = rec.getMid1TotalMarks() != null ? rec.getMid1TotalMarks().doubleValue() : null;
        Double m2 = rec.getMid2TotalMarks() != null ? rec.getMid2TotalMarks().doubleValue() : null;
        double finalMid;
        if (m1 != null && m2 != null) {
            double higherMid = Math.max(m1, m2);
            double lowerMid = Math.min(m1, m2);
            finalMid = Math.min(30.0, (0.80 * higherMid) + (0.20 * lowerMid));
        } else if (m1 != null) {
            finalMid = m1;
        } else if (m2 != null) {
            finalMid = m2;
        } else {
            finalMid = midTotal;
        }

        rec.setMidMarks(BigDecimal.valueOf(finalMid).setScale(2, RoundingMode.HALF_UP));
        rec.setConvertedInternalMarks(BigDecimal.valueOf(finalMid).setScale(2, RoundingMode.HALF_UP));
        rec.setInternalMarks(BigDecimal.valueOf(finalMid).setScale(2, RoundingMode.HALF_UP));

        if (rec.getSemesterMarks() != null && rec.getSemesterMarks().compareTo(BigDecimal.ZERO) > 0) {
            double sem = rec.getSemesterMarks().doubleValue();
            double total = Math.min(100.0, finalMid + sem);
            BigDecimal totalBd = BigDecimal.valueOf(total).setScale(2, RoundingMode.HALF_UP);
            rec.setTotalMarks(totalBd);
            boolean isPass = (sem >= 24.0) && (total >= 40.0);
            rec.setGrade(isPass ? computeGrade(totalBd) : "F");
            rec.setGradePoint(isPass ? computeGradePoints(totalBd) : BigDecimal.ZERO);
        }
        rec.setUpdatedBy(publisherId);
        academicRecordRepository.save(rec);
        recalculateSgpaAndCgpa(student.getId(), semCode, semNum);
    }

    private void syncSemMarksToAcademicRecord(User student, Exam exam, double semMarks,
                                              double totalMarks, String grade, BigDecimal gradePoint,
                                              Long publisherId) {
        if (exam.getCourse() == null) return;
        String subjectCode = exam.getCourse().getCourseCode();
        String subjectName = exam.getCourse().getCourseName();
        String semCode = exam.getSemester() != null ? getSemesterCode(exam.getSemester()) : "2-2";
        int semNum = exam.getSemester() != null ? exam.getSemester() : 4;

        Optional<StudentAcademicRecord> opt = academicRecordRepository
                .findByStudentIdAndSemesterCodeAndSubjectCode(student.getId(), semCode, subjectCode);

        StudentAcademicRecord rec = opt.orElseGet(() -> StudentAcademicRecord.builder()
                .student(student)
                .semesterCode(semCode)
                .semesterNum(semNum)
                .subjectCode(subjectCode)
                .subjectName(subjectName)
                .creditHours(exam.getCourse().getCreditHours() != null ? exam.getCourse().getCreditHours() : 4)
                .build());

        Double m1 = rec.getMid1TotalMarks() != null ? rec.getMid1TotalMarks().doubleValue() : null;
        Double m2 = rec.getMid2TotalMarks() != null ? rec.getMid2TotalMarks().doubleValue() : null;
        double finalMid;
        if (m1 != null && m2 != null) {
            double higher = Math.max(m1, m2);
            double lower = Math.min(m1, m2);
            finalMid = (0.80 * higher) + (0.20 * lower);
        } else if (rec.getConvertedInternalMarks() != null) {
            finalMid = rec.getConvertedInternalMarks().doubleValue();
        } else if (rec.getMidMarks() != null) {
            finalMid = rec.getMidMarks().doubleValue();
        } else {
            finalMid = 25.0;
        }
        finalMid = Math.min(30.0, Math.max(0.0, finalMid));
        rec.setMidMarks(BigDecimal.valueOf(finalMid).setScale(2, RoundingMode.HALF_UP));
        rec.setConvertedInternalMarks(BigDecimal.valueOf(finalMid).setScale(2, RoundingMode.HALF_UP));
        rec.setInternalMarks(BigDecimal.valueOf(finalMid).setScale(2, RoundingMode.HALF_UP));

        double total = Math.min(100.0, semMarks + finalMid);
        BigDecimal totalBd = BigDecimal.valueOf(total).setScale(2, RoundingMode.HALF_UP);
        rec.setSemesterMarks(BigDecimal.valueOf(semMarks).setScale(2, RoundingMode.HALF_UP));
        rec.setTotalMarks(totalBd);
        boolean isPass = (semMarks >= 24.0) && (total >= 40.0);
        rec.setGrade(isPass ? (grade != null ? grade : computeGrade(totalBd)) : "F");
        rec.setGradePoint(isPass ? (gradePoint != null ? gradePoint : computeGradePoints(totalBd)) : BigDecimal.ZERO);
        rec.setUpdatedBy(publisherId);
        academicRecordRepository.save(rec);

        // Recalculate SGPA for semester summary
        recalculateSgpaAndCgpa(student.getId(), semCode, semNum);
    }

    private String getSemesterCode(int sem) {
        return switch (sem) {
            case 1 -> "1-1";
            case 2 -> "1-2";
            case 3 -> "2-1";
            case 4 -> "2-2";
            case 5 -> "3-1";
            case 6 -> "3-2";
            case 7 -> "4-1";
            case 8 -> "4-2";
            default -> "2-2";
        };
    }

    private void recalculateSgpaAndCgpa(Long studentId, String semCode, int semNum) {
        try {
            List<StudentAcademicRecord> records = academicRecordRepository
                    .findByStudentIdAndSemesterCodeOrderBySubjectCodeAsc(studentId, semCode);
            if (records.isEmpty()) return;

            double weightedGradePoints = 0.0;
            int totalCredits = 0;
            for (StudentAcademicRecord r : records) {
                int credits = r.getCreditHours() != null ? r.getCreditHours() : 3;
                double gp = r.getGradePoint() != null ? r.getGradePoint().doubleValue() : 0.0;
                weightedGradePoints += gp * credits;
                totalCredits += credits;
            }
            double sgpa = totalCredits > 0 ? (weightedGradePoints / totalCredits) : 8.5;
            sgpa = Math.round(sgpa * 100.0) / 100.0;

            Long safeStudentId = studentId != null ? studentId : 0L;
            Optional<StudentSemesterSummary> summaryOpt = semesterSummaryRepository
                    .findByStudentIdAndSemesterCode(safeStudentId, semCode);
            StudentSemesterSummary summary = summaryOpt.orElseGet(() -> StudentSemesterSummary.builder()
                    .student(userRepository.findById(safeStudentId).orElse(null))
                    .semesterCode(semCode)
                    .semesterNum(semNum)
                    .build());
            summary.setSgpa(BigDecimal.valueOf(sgpa));
            summary.setCgpa(BigDecimal.valueOf(sgpa));
            summary.setTotalCredits(totalCredits);
            summary.setEarnedCredits(totalCredits);
            semesterSummaryRepository.save(summary);

            List<com.campusiq.assessment.entity.StudentCgpa> directCgpa = cgpaRepository.findByStudentId(studentId);
            if (!directCgpa.isEmpty()) {
                com.campusiq.assessment.entity.StudentCgpa sc = directCgpa.get(0);
                sc.setCgpaValue(BigDecimal.valueOf(sgpa));
                cgpaRepository.save(sc);
            }
        } catch (Exception ex) {
            log.warn("Failed to recalculate SGPA/CGPA for student {}: {}", studentId, ex.getMessage());
        }
    }

    @Transactional
    public List<Result> publishResults(ResultRequest req) {
        return publishResults(req, "MID", null);
    }

    @Transactional(readOnly = true)
    public List<Result> getAllResults() {
        return resultRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Result> getStudentResults(Long studentId) {
        return resultRepository.findByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public List<Result> getStudentResultsByType(Long studentId, String type) {
        return resultRepository.findByStudentIdAndResultType(studentId, type.toUpperCase());
    }

    public List<Result> getExamResults(Long examId) {
        return resultRepository.findByExamIdOrderByPercentageDesc(examId);
    }

    public List<Result> getStudentCourseResults(Long studentId, Long courseId) {
        return resultRepository.findByStudentIdAndCourseId(studentId, courseId);
    }

    /**
     * Get real-time unified GPA data for student from single source of truth
     */
    public Map<String, Object> getStudentGPA(Long studentId) {
        // 1. Check StudentCgpa direct records (null semester first, then latest any semester)
        List<com.campusiq.assessment.entity.StudentCgpa> directCgpa = cgpaRepository.findCgpaByStudentId(studentId);
        if (directCgpa.isEmpty()) {
            directCgpa = cgpaRepository.findByStudentId(studentId);
        }
        Double directCgpaVal = directCgpa.isEmpty() ? null : directCgpa.get(0).getCgpaValue().doubleValue();

        List<StudentSemesterSummary> summaries = semesterSummaryRepository.findByStudentIdOrderBySemesterNumAsc(studentId);
        List<StudentAcademicRecord> allAcademicRecords = academicRecordRepository.findByStudentIdOrderBySemesterNumAscSubjectCodeAsc(studentId);

        StudentSemesterSummary latestSummary = !summaries.isEmpty() ? summaries.get(summaries.size() - 1) : null;
        Double cgpa = directCgpaVal != null
                ? directCgpaVal
                : (latestSummary != null && latestSummary.getCgpa() != null ? latestSummary.getCgpa().doubleValue() : 0.0);
        Double sgpa = latestSummary != null && latestSummary.getSgpa() != null
                ? latestSummary.getSgpa().doubleValue()
                : (directCgpaVal != null ? directCgpaVal : 0.0);

        long passed = allAcademicRecords.stream()
                .filter(r -> r.getGradePoint() != null && r.getGradePoint().compareTo(BigDecimal.ZERO) > 0)
                .count();

        Map<String, Object> gpa = new LinkedHashMap<>();
        gpa.put("studentId", studentId);
        gpa.put("cgpa", round(cgpa));
        gpa.put("sgpa", round(sgpa));
        gpa.put("totalResults", allAcademicRecords.size());
        gpa.put("passedResults", passed);
        gpa.put("failedResults", allAcademicRecords.size() - passed);
        gpa.put("semesterCode", latestSummary != null ? latestSummary.getSemesterCode() : "1-1");
        return gpa;
    }

    public Map<String, Object> getSemesterGPA(Long studentId, Integer semester) {
        String semCode = switch (semester) {
            case 1 -> "1-1";
            case 2 -> "1-2";
            case 3 -> "2-1";
            case 4 -> "2-2";
            case 5 -> "3-1";
            case 6 -> "3-2";
            case 7 -> "4-1";
            case 8 -> "4-2";
            default -> "1-1";
        };

        List<com.campusiq.assessment.entity.StudentCgpa> directSgpa = cgpaRepository.findSgpaByStudentIdAndSemester(studentId, semester);
        Double directSgpaVal = directSgpa.isEmpty() ? null : directSgpa.get(0).getCgpaValue().doubleValue();

        Optional<StudentSemesterSummary> summaryOpt = semesterSummaryRepository.findByStudentIdAndSemesterCode(studentId, semCode);
        if (summaryOpt.isPresent()) {
            StudentSemesterSummary summary = summaryOpt.get();
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("sgpa", directSgpaVal != null ? round(directSgpaVal) : (summary.getSgpa() != null ? round(summary.getSgpa().doubleValue()) : 8.50));
            map.put("cgpa", summary.getCgpa() != null ? round(summary.getCgpa().doubleValue()) : 8.50);
            map.put("semester", semester);
            map.put("semesterCode", semCode);
            map.put("results", academicRecordRepository.findByStudentIdAndSemesterCodeOrderBySubjectCodeAsc(studentId, semCode));
            return map;
        }

        Double sgpa = directSgpaVal != null ? directSgpaVal : resultRepository.calculateSgpa(studentId, semester);
        List<Result> semRes = resultRepository.findByStudentIdAndSemester(studentId, semester);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("sgpa", round(sgpa));
        map.put("semester", semester);
        map.put("results", semRes);
        return map;
    }

    private double round(Double v) { return v != null ? Math.round(v * 100.0) / 100.0 : 0.0; }

    private String computeGrade(BigDecimal pct) {
        double d = pct.doubleValue();
        if (d >= 90) return "S";
        if (d >= 80) return "A";
        if (d >= 70) return "B";
        if (d >= 60) return "C";
        if (d >= 50) return "D";
        if (d >= 40) return "E";
        return "F";
    }

    private BigDecimal computeGradePoints(BigDecimal pct) {
        double d = pct.doubleValue();
        if (d >= 90) return BigDecimal.valueOf(10.0);
        if (d >= 80) return BigDecimal.valueOf(9.0);
        if (d >= 70) return BigDecimal.valueOf(8.0);
        if (d >= 60) return BigDecimal.valueOf(7.0);
        if (d >= 50) return BigDecimal.valueOf(6.0);
        if (d >= 40) return BigDecimal.valueOf(5.0);
        return BigDecimal.ZERO;
    }
}

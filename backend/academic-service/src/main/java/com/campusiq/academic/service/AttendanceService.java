package com.campusiq.academic.service;

import com.campusiq.academic.dto.AttendanceRequest;
import com.campusiq.academic.entity.Attendance;
import com.campusiq.academic.entity.Attendance.AttendanceStatus;
import com.campusiq.academic.entity.Course;
import com.campusiq.academic.entity.User;
import com.campusiq.academic.repository.AttendanceRepository;
import com.campusiq.academic.repository.CourseRepository;
import com.campusiq.academic.repository.UserRepository;
import com.campusiq.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public List<Attendance> markAttendance(AttendanceRequest req, Long markedById) {
        Course course = courseRepository.findById(req.getCourseId())
                .orElseGet(() -> {
                    List<Course> all = courseRepository.findAll();
                    return !all.isEmpty() ? all.get(0) : null;
                });

        if (course == null) {
            throw new ResourceNotFoundException("Course", "id", req.getCourseId());
        }

        User markedBy = markedById != null ? userRepository.findById(markedById).orElse(null) : null;

        List<Attendance> saved = new ArrayList<>();
        for (var entry : req.getRecords().entrySet()) {
            Long studentId = entry.getKey();
            AttendanceStatus status = entry.getValue();

            Optional<User> studentOpt = userRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                // Try to find if studentId corresponds to any user or continue
                continue;
            }
            User student = studentOpt.get();

            Optional<Attendance> existing = attendanceRepository
                    .findByStudentIdAndCourseIdAndAttendanceDate(student.getId(), course.getId(), req.getAttendanceDate());

            Attendance att;
            if (existing.isPresent()) {
                att = existing.get();
                att.setStatus(status);
                att.setRemarks(req.getRemarks());
                if (markedBy != null) att.setMarkedBy(markedBy);
            } else {
                att = Attendance.builder()
                        .student(student)
                        .course(course)
                        .attendanceDate(req.getAttendanceDate())
                        .status(status)
                        .remarks(req.getRemarks())
                        .markedBy(markedBy)
                        .build();
            }
            saved.add(attendanceRepository.save(att));
        }
        return saved;
    }

    public List<Attendance> getStudentAttendance(Long studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    public List<Attendance> getStudentCourseAttendance(Long studentId, Long courseId) {
        return attendanceRepository.findByStudentIdAndCourseId(studentId, courseId);
    }

    public BigDecimal getPercentage(Long studentId, Long courseId) {
        long present = attendanceRepository.countPresentByStudentAndCourse(studentId, courseId);
        long total = attendanceRepository.countTotalByStudentAndCourse(studentId, courseId);
        if (total == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(present)
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    public List<Attendance> getCourseAttendanceByDate(Long courseId, LocalDate date) {
        return attendanceRepository.findByCourseIdAndAttendanceDate(courseId, date);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }
}

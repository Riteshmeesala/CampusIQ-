package com.campusiq.academic.service;

import com.campusiq.academic.dto.FacultyBiometricPunchRequest;
import com.campusiq.academic.dto.FacultyBiometricSummaryDto;
import com.campusiq.academic.entity.FacultyBiometricAttendance;
import com.campusiq.academic.entity.User;
import com.campusiq.academic.repository.FacultyBiometricAttendanceRepository;
import com.campusiq.academic.repository.UserRepository;
import com.campusiq.common.enums.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class FacultyBiometricAttendanceService {

    private final FacultyBiometricAttendanceRepository biometricRepo;
    private final UserRepository userRepository;

    public FacultyBiometricAttendanceService(FacultyBiometricAttendanceRepository biometricRepo, UserRepository userRepository) {
        this.biometricRepo = biometricRepo;
        this.userRepository = userRepository;
    }

    @Transactional
    public FacultyBiometricAttendance recordPunch(FacultyBiometricPunchRequest req) {
        LocalDate punchDate = req.getPunchDate() != null ? req.getPunchDate() : LocalDate.now();
        Long facultyId = req.getFacultyId();

        Optional<FacultyBiometricAttendance> existingOpt = biometricRepo.findByFacultyIdAndPunchDate(facultyId, punchDate);
        FacultyBiometricAttendance att = existingOpt.orElseGet(FacultyBiometricAttendance::new);

        if (att.getId() == null) {
            att.setFacultyId(facultyId);
            att.setFacultyName(req.getFacultyName() != null ? req.getFacultyName() : "Faculty Member");
            att.setDepartment(req.getDepartment() != null ? req.getDepartment() : "Computer Science");
            att.setEmployeeId(req.getEmployeeId() != null ? req.getEmployeeId() : "FAC-" + facultyId);
            att.setDesignation(req.getDesignation() != null ? req.getDesignation() : "Faculty");
            att.setPunchDate(punchDate);
            att.setPunchInTime(req.getPunchInTime() != null ? req.getPunchInTime() : LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
            att.setStatus(req.getStatus() != null ? req.getStatus() : "PRESENT");
            att.setDeviceId(req.getDeviceId() != null ? req.getDeviceId() : "BIO-TERMINAL-01");
            att.setLocation(req.getLocation() != null ? req.getLocation() : "Main Academic Block Gate");
            att.setRemarks(req.getRemarks() != null ? req.getRemarks() : "Biometric punch recorded");
        } else {
            // Updating checkout
            if (req.getPunchOutTime() != null) {
                att.setPunchOutTime(req.getPunchOutTime());
            } else {
                att.setPunchOutTime(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
            }
            if (req.getStatus() != null) {
                att.setStatus(req.getStatus());
            }
            if (req.getWorkingHours() != null) {
                att.setWorkingHours(req.getWorkingHours());
            } else {
                att.setWorkingHours("8h 15m");
            }
            if (req.getRemarks() != null) {
                att.setRemarks(req.getRemarks());
            }
        }

        return biometricRepo.save(att);
    }

    public List<FacultyBiometricAttendance> getAllPunches() {
        return biometricRepo.findAll();
    }

    public List<FacultyBiometricAttendance> getFacultyPunches(Long facultyId) {
        return biometricRepo.findByFacultyIdOrderByPunchDateDesc(facultyId);
    }

    public List<FacultyBiometricSummaryDto> getMonthlySummary(Integer year, Integer month) {
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : LocalDate.now().getMonthValue();

        LocalDate start = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<FacultyBiometricAttendance> monthLogs = biometricRepo.findByPunchDateBetweenOrderByPunchDateDesc(start, end);
        List<User> facultyUsers = userRepository.findByRole(Role.FACULTY);

        // Group by faculty ID
        Map<Long, List<FacultyBiometricAttendance>> grouped = new HashMap<>();
        for (FacultyBiometricAttendance log : monthLogs) {
            grouped.computeIfAbsent(log.getFacultyId(), k -> new ArrayList<>()).add(log);
        }

        List<FacultyBiometricSummaryDto> summaries = new ArrayList<>();
        int standardWorkingDays = 24;

        // Process known faculty users
        for (User u : facultyUsers) {
            List<FacultyBiometricAttendance> logs = grouped.getOrDefault(u.getId(), Collections.emptyList());
            summaries.add(buildSummary(u.getId(), u.getName(), u.getDepartment(), u.getEnrollmentNumber(), "Faculty Member", logs, standardWorkingDays));
            grouped.remove(u.getId());
        }

        // Process any other faculty logs present in biometric records
        for (var entry : grouped.entrySet()) {
            List<FacultyBiometricAttendance> logs = entry.getValue();
            if (!logs.isEmpty()) {
                FacultyBiometricAttendance first = logs.get(0);
                summaries.add(buildSummary(entry.getKey(), first.getFacultyName(), first.getDepartment(), first.getEmployeeId(), first.getDesignation(), logs, standardWorkingDays));
            }
        }

        return summaries;
    }

    private FacultyBiometricSummaryDto buildSummary(Long facultyId, String name, String dept, String empId, String designation,
                                                    List<FacultyBiometricAttendance> logs, int totalWorkingDays) {
        FacultyBiometricSummaryDto dto = new FacultyBiometricSummaryDto();
        dto.setFacultyId(facultyId);
        dto.setFacultyName(name != null ? name : "Faculty Member");
        dto.setDepartment(dept != null ? dept : "Computer Science");
        dto.setEmployeeId(empId != null ? empId : "FAC-" + facultyId);
        dto.setDesignation(designation != null ? designation : "Associate Professor");
        dto.setTotalWorkingDays(totalWorkingDays);

        int present = 0;
        int late = 0;
        int halfDay = 0;
        int absent = 0;

        for (FacultyBiometricAttendance log : logs) {
            String st = log.getStatus() != null ? log.getStatus().toUpperCase() : "PRESENT";
            switch (st) {
                case "PRESENT" -> present++;
                case "LATE" -> { present++; late++; }
                case "HALF_DAY" -> { halfDay++; }
                case "ABSENT" -> absent++;
                default -> present++;
            }
        }

        dto.setDaysPresent(present);
        dto.setDaysLate(late);
        dto.setDaysHalfDay(halfDay);
        dto.setDaysAbsent(Math.max(0, totalWorkingDays - (present + halfDay)));

        double effectivePresent = present + (halfDay * 0.5);
        BigDecimal pct = totalWorkingDays > 0
                ? BigDecimal.valueOf((effectivePresent / totalWorkingDays) * 100).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        dto.setAttendancePercentage(pct);

        if (!logs.isEmpty()) {
            FacultyBiometricAttendance latest = logs.get(0);
            dto.setLastPunchTime(latest.getPunchDate() + " " + (latest.getPunchInTime() != null ? latest.getPunchInTime() : ""));
            dto.setLastStatus(latest.getStatus());
        } else {
            dto.setLastPunchTime("No punches recorded");
            dto.setLastStatus("NOT_RECORDED");
        }

        dto.setRecentPunches(new ArrayList<>(logs.stream().limit(10).toList()));
        return dto;
    }
}

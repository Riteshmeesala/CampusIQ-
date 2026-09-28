package com.campusiq.academic.dto;

import java.math.BigDecimal;
import java.util.List;

public class FacultyBiometricSummaryDto {
    private Long facultyId;
    private String facultyName;
    private String department;
    private String employeeId;
    private String designation;
    private int totalWorkingDays;
    private int daysPresent;
    private int daysLate;
    private int daysHalfDay;
    private int daysAbsent;
    private BigDecimal attendancePercentage;
    private String lastPunchTime;
    private String lastStatus;
    private List<Object> recentPunches;

    public FacultyBiometricSummaryDto() {}

    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public int getTotalWorkingDays() { return totalWorkingDays; }
    public void setTotalWorkingDays(int totalWorkingDays) { this.totalWorkingDays = totalWorkingDays; }

    public int getDaysPresent() { return daysPresent; }
    public void setDaysPresent(int daysPresent) { this.daysPresent = daysPresent; }

    public int getDaysLate() { return daysLate; }
    public void setDaysLate(int daysLate) { this.daysLate = daysLate; }

    public int getDaysHalfDay() { return daysHalfDay; }
    public void setDaysHalfDay(int daysHalfDay) { this.daysHalfDay = daysHalfDay; }

    public int getDaysAbsent() { return daysAbsent; }
    public void setDaysAbsent(int daysAbsent) { this.daysAbsent = daysAbsent; }

    public BigDecimal getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(BigDecimal attendancePercentage) { this.attendancePercentage = attendancePercentage; }

    public String getLastPunchTime() { return lastPunchTime; }
    public void setLastPunchTime(String lastPunchTime) { this.lastPunchTime = lastPunchTime; }

    public String getLastStatus() { return lastStatus; }
    public void setLastStatus(String lastStatus) { this.lastStatus = lastStatus; }

    public List<Object> getRecentPunches() { return recentPunches; }
    public void setRecentPunches(List<Object> recentPunches) { this.recentPunches = recentPunches; }
}

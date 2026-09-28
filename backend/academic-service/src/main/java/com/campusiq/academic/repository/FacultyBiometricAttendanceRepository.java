package com.campusiq.academic.repository;

import com.campusiq.academic.entity.FacultyBiometricAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyBiometricAttendanceRepository extends JpaRepository<FacultyBiometricAttendance, Long> {

    List<FacultyBiometricAttendance> findByFacultyIdOrderByPunchDateDesc(Long facultyId);

    List<FacultyBiometricAttendance> findByPunchDateOrderByFacultyNameAsc(LocalDate date);

    Optional<FacultyBiometricAttendance> findByFacultyIdAndPunchDate(Long facultyId, LocalDate punchDate);

    List<FacultyBiometricAttendance> findByPunchDateBetweenOrderByPunchDateDesc(LocalDate startDate, LocalDate endDate);

    List<FacultyBiometricAttendance> findByFacultyIdAndPunchDateBetweenOrderByPunchDateDesc(Long facultyId, LocalDate startDate, LocalDate endDate);
}

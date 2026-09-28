import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { attendanceAPI, courseAPI } from '../../services/api';
import { subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';

const SEMESTER_OPTIONS = [
  '1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'
];

const MONTH_OPTIONS = [
  'Select', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEAR_OPTIONS = [
  'Select', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'
];

export default function StudentMonthlyAttendancePage() {
  const [selectedSemester, setSelectedSemester] = useState('4-1');
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [hasSearched, setHasSearched] = useState(true);

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      attendanceAPI.getMyAttendance(),
      courseAPI.getAll()
    ]).then(([attRes, courseRes]) => {
      if (attRes.status === 'fulfilled') {
        setAttendanceRecords(attRes.value.data?.data || []);
      }
      if (courseRes.status === 'fulfilled') {
        setCourses(courseRes.value.data?.data || []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    const unsub = subscribeToDataSync((event) => {
      if (event.type === DATA_SYNC_EVENTS.ATTENDANCE_UPDATED) {
        loadData();
      }
    });
    return () => {
      window.removeEventListener('focus', loadData);
      unsub();
    };
  }, [loadData]);

  // Convert month name to 1-based index (e.g. September -> 9)
  const monthIndex = useMemo(() => {
    const idx = MONTH_OPTIONS.indexOf(selectedMonth);
    return idx > 0 ? idx : 9;
  }, [selectedMonth]);

  const yearNum = useMemo(() => {
    return parseInt(selectedYear, 10) || 2026;
  }, [selectedYear]);

  // Determine total days in selected month (e.g. 30 for Sept, 31 for Oct)
  const daysInMonth = useMemo(() => {
    return new Date(yearNum, monthIndex, 0).getDate();
  }, [yearNum, monthIndex]);

  // Array of 2-digit day strings ['01', '02', ... '30']
  const dayColumns = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [daysInMonth]);

  // Build Day-Matrix Grid Data for each subject
  const matrixData = useMemo(() => {
    const monthPrefix = `${yearNum}-${String(monthIndex).padStart(2, '0')}`;
    const monthLogs = attendanceRecords.filter(r => r.attendanceDate && r.attendanceDate.startsWith(monthPrefix));

    // Determine our subject list
    let subjectList = courses.map(c => ({
      id: c.id,
      code: c.courseCode,
      name: `${c.courseCode} - ${(c.courseName || c.courseCode).toUpperCase()}`
    }));

    if (subjectList.length === 0) {
      subjectList = [
        { id: 1, code: 'CS401', name: 'CS401 - DATABASE MANAGEMENT SYSTEMS' },
        { id: 2, code: 'CS402', name: 'CS402 - MACHINE LEARNING & INTELLIGENT SYSTEMS' },
        { id: 3, code: 'CS403', name: 'CS403 - DESIGN AND ANALYSIS OF ALGORITHMS' },
        { id: 4, code: 'CS404', name: 'CS404 - OPERATING SYSTEMS & ARCHITECTURE' }
      ];
    }

    // Map each subject's day-by-day status
    return subjectList.map((sub, sIdx) => {
      const daysStatus = {};
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let holidayCount = 0;

      // Extract records for this course from backend
      const courseRecords = monthLogs.filter(r =>
        r.course?.id === sub.id ||
        (r.course?.courseCode && r.course.courseCode.toUpperCase() === sub.code.toUpperCase())
      );

      // Populate from live records
      courseRecords.forEach(r => {
        const dayStr = r.attendanceDate.split('-')[2];
        if (dayStr) {
          if (r.status === 'PRESENT' || r.status === 'LATE') {
            daysStatus[dayStr] = 'P';
            presentCount += 1;
          } else if (r.status === 'ABSENT') {
            daysStatus[dayStr] = 'A';
            absentCount += 1;
          } else if (r.status === 'EXCUSED') {
            daysStatus[dayStr] = 'L';
            leaveCount += 1;
          }
        }
      });

      const totalHeld = presentCount + absentCount + leaveCount;
      const pct = totalHeld > 0 ? ((presentCount / totalHeld) * 100).toFixed(2) : '0.00';

      return {
        slNo: sIdx + 1,
        subject: sub.name,
        days: daysStatus,
        P: presentCount,
        A: absentCount,
        L: leaveCount,
        H: holidayCount,
        pct
      };
    });
  }, [selectedSemester, selectedMonth, selectedYear, yearNum, monthIndex, courses, attendanceRecords]);

  // Overall Average Percentage
  const averagePct = useMemo(() => {
    if (!matrixData || matrixData.length === 0) return '0.00';
    const totalP = matrixData.reduce((acc, r) => acc + r.P, 0);
    const totalHeld = matrixData.reduce((acc, r) => acc + (r.P + r.A + r.L), 0);
    return totalHeld > 0 ? ((totalP / totalHeld) * 100).toFixed(2) : '0.00';
  }, [matrixData]);

  const handleSearch = () => {
    setHasSearched(true);
    loadData();
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      bgcolor: '#f1f5f9',
      p: { xs: 1.5, sm: 2.5 }
    }}>
      {/* Top Container Card */}
      <Box sx={{
        maxWidth: 1380,
        mx: 'auto',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        {/* Top Header & Filter Controls Bar */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid #f1f5f9',
          gap: 2
        }}>
          {/* Left Title */}
          <Typography sx={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '-0.01em'
          }}>
            Attendance
          </Typography>

          {/* Right Filter Dropdowns: Semester, Month, Year & Search Button */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            {/* Semester */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#475569', mb: 0.3 }}>
                Semester<span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                style={{
                  height: '32px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '75px'
                }}
              >
                {SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </Box>

            {/* Month */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#475569', mb: 0.3 }}>
                Month<span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  height: '32px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '105px'
                }}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Box>

            {/* Year */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#475569', mb: 0.3 }}>
                Year<span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  height: '32px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Box>

            {/* Blue Search Button */}
            <Button
              onClick={handleSearch}
              sx={{
                minWidth: '34px',
                width: '34px',
                height: '32px',
                mt: 1.8,
                p: 0,
                bgcolor: '#0099ff',
                color: '#ffffff',
                borderRadius: '4px',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#0080d6',
                  boxShadow: 'none'
                }
              }}
            >
              <Search sx={{ fontSize: 18 }} />
            </Button>
          </Box>
        </Box>

        {/* Content Body */}
        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {loading ? (
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={32} sx={{ color: '#0099ff' }} />
            </Box>
          ) : !hasSearched || matrixData.length === 0 ? (
            <Box sx={{ py: 14, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                No Data Found!
              </Typography>
            </Box>
          ) : (
            <>
              {/* Status Legend Bar */}
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                  Present: <span style={{ color: '#0099ff', fontWeight: 700 }}>P</span> | Absent: <span style={{ color: '#ef4444', fontWeight: 700 }}>A</span> | Leave: <span style={{ color: '#06b6d4', fontWeight: 700 }}>L</span> | Holiday: <span style={{ color: '#eab308', fontWeight: 700 }}>H</span>
                </Typography>
              </Box>

              {/* Monthly Attendance Day-Matrix Grid Table */}
              <Box sx={{
                overflowX: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                bgcolor: '#ffffff'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#0099ff',
                      color: '#ffffff',
                      height: '36px'
                    }}>
                      {/* Subject Name Header */}
                      <th style={{
                        textAlign: 'left',
                        padding: '6px 14px',
                        fontWeight: 700,
                        minWidth: '260px',
                        borderRight: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        Subject
                      </th>

                      {/* Day Columns (01 to 30 / 31) */}
                      {dayColumns.map((day) => (
                        <th
                          key={day}
                          style={{
                            width: '28px',
                            minWidth: '28px',
                            padding: '6px 2px',
                            fontWeight: 700,
                            borderRight: '1px solid rgba(255,255,255,0.15)'
                          }}
                        >
                          {day}
                        </th>
                      ))}

                      {/* Summary Columns */}
                      <th style={{ width: '32px', minWidth: '32px', padding: '6px 2px', fontWeight: 700, borderLeft: '1.5px solid rgba(255,255,255,0.3)' }}>P</th>
                      <th style={{ width: '32px', minWidth: '32px', padding: '6px 2px', fontWeight: 700 }}>A</th>
                      <th style={{ width: '32px', minWidth: '32px', padding: '6px 2px', fontWeight: 700 }}>L</th>
                      <th style={{ width: '32px', minWidth: '32px', padding: '6px 2px', fontWeight: 700 }}>H</th>
                      <th style={{ width: '60px', minWidth: '60px', padding: '6px 6px', fontWeight: 700 }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.map((row, index) => (
                      <tr
                        key={row.slNo}
                        style={{
                          backgroundColor: index % 2 === 1 ? '#f0f9ff' : '#ffffff',
                          borderBottom: '1px solid #e2e8f0',
                          height: '34px'
                        }}
                      >
                        {/* Subject Title */}
                        <td style={{
                          textAlign: 'left',
                          padding: '6px 14px',
                          color: '#1e293b',
                          fontWeight: 500,
                          borderRight: '1px solid #e2e8f0'
                        }}>
                          {row.subject}
                        </td>

                        {/* Day Cells (01 to 30/31) */}
                        {dayColumns.map((day) => {
                          const status = row.days[day];
                          let letterColor = '#334155';
                          if (status === 'P') letterColor = '#0099ff';
                          else if (status === 'A') letterColor = '#ef4444';
                          else if (status === 'L') letterColor = '#06b6d4';
                          else if (status === 'H') letterColor = '#eab308';

                          return (
                            <td
                              key={day}
                              style={{
                                padding: '4px 2px',
                                fontWeight: 700,
                                color: letterColor,
                                borderRight: '1px solid #f1f5f9'
                              }}
                            >
                              {status || ''}
                            </td>
                          );
                        })}

                        {/* Summary Numbers */}
                        <td style={{ padding: '4px 2px', fontWeight: 600, color: '#0099ff', borderLeft: '1.5px solid #cbd5e1' }}>
                          {row.P}
                        </td>
                        <td style={{ padding: '4px 2px', fontWeight: 600, color: '#ef4444' }}>
                          {row.A}
                        </td>
                        <td style={{ padding: '4px 2px', fontWeight: 600, color: '#06b6d4' }}>
                          {row.L}
                        </td>
                        <td style={{ padding: '4px 2px', fontWeight: 600, color: '#eab308' }}>
                          {row.H}
                        </td>
                        <td style={{
                          padding: '4px 6px',
                          fontWeight: 700,
                          color: parseFloat(row.pct) >= 75 ? '#0284c7' : '#ef4444'
                        }}>
                          {row.pct} %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              {/* Bottom Summary Bar */}
              <Box sx={{
                mt: 2.5,
                textAlign: 'center'
              }}>
                <Typography sx={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#334155'
                }}>
                  Average Percentage: <span style={{ color: '#0099ff' }}>{averagePct} %</span>
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

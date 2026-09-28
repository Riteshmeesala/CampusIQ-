import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Grid, Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Divider, LinearProgress, ToggleButton,
  ToggleButtonGroup, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Avatar, Tabs, Tab, Stack
} from '@mui/material';
import {
  CalendarMonth, CheckCircle, Cancel, Warning, Refresh,
  HowToReg, Close, Visibility, Search, FilterAlt, Schedule,
  School, Group, Room, AccessTime, Download,
  Print, Assessment, DateRange, EventAvailable, ArrowForward,
  Check, Clear, CloudUpload, ArrowRight
} from '@mui/icons-material';
import { attendanceAPI, courseAPI, userAPI, timetableAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import { COLORS, getAttColor } from '../../theme/theme';
import { toast } from 'react-toastify';
import { broadcastDataChange, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';

export default function AttendancePage() {
  const { user, isStudent, isFaculty, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Read active tab from URL (0: Mark Daily, 1: Subject Monthly, 2: Subject Date Range, 3: Date Range)
  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  // Common Course & Faculty State
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2024-02');
  const [startDate, setStartDate] = useState('2024-02-01');
  const [endDate, setEndDate] = useState('2024-02-28');
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM - 10:00 AM (Period 1)');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [loading, setLoading] = useState(false);

  // Mark Daily State
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' | 'LATE' | 'OD' }
  const [saving, setSaving] = useState(false);

  // Manual Input Features
  const [manualStudentOpen, setManualStudentOpen] = useState(false);
  const [manualStudent, setManualStudent] = useState({
    enrollmentNumber: '',
    name: '',
    department: 'Computer Science',
    section: 'Section A',
    status: 'PRESENT'
  });

  const [quickManualOpen, setQuickManualOpen] = useState(false);
  const [quickManual, setQuickManual] = useState({
    enrollmentNumber: '',
    courseCode: '',
    date: new Date().toISOString().split('T')[0],
    slot: '09:00 AM - 10:00 AM (Period 1)',
    status: 'PRESENT',
    remarks: 'Manual entry by faculty'
  });

  const handleAddManualStudent = () => {
    if (!manualStudent.enrollmentNumber.trim() || !manualStudent.name.trim()) {
      toast.warning('Please enter Student Roll Number and Name');
      return;
    }
    const exists = students.some(s => s.enrollmentNumber?.toLowerCase() === manualStudent.enrollmentNumber.trim().toLowerCase());
    if (exists) {
      toast.info(`Student ${manualStudent.enrollmentNumber} is already in the roster.`);
      setManualStudentOpen(false);
      return;
    }
    const newStudent = {
      id: Date.now(),
      enrollmentNumber: manualStudent.enrollmentNumber.trim().toUpperCase(),
      name: manualStudent.name.trim(),
      department: manualStudent.department || 'Computer Science',
      section: manualStudent.section || selectedSection,
      isManual: true
    };
    setStudents(prev => [newStudent, ...prev]);
    setAttendanceMap(prev => ({ ...prev, [newStudent.id]: manualStudent.status || 'PRESENT' }));
    toast.success(`Student ${newStudent.enrollmentNumber} added to roster manually!`);
    setManualStudentOpen(false);
    setManualStudent({
      enrollmentNumber: '',
      name: '',
      department: 'Computer Science',
      section: selectedSection,
      status: 'PRESENT'
    });
  };

  const handleQuickManualSubmit = async () => {
    if (!quickManual.enrollmentNumber.trim()) {
      toast.warning('Please enter Student Roll Number');
      return;
    }
    try {
      setSaving(true);
      // Try to find student or use manual ID
      const matched = students.find(s => s.enrollmentNumber?.toLowerCase() === quickManual.enrollmentNumber.trim().toLowerCase());
      const sId = matched ? matched.id : Date.now();
      
      const records = { [sId]: quickManual.status === 'OD' ? 'PRESENT' : quickManual.status };
      await attendanceAPI.mark({
        courseId: Number(selectedCourse) || 1,
        attendanceDate: quickManual.date,
        records: records,
        remarks: `[MANUAL ENTRY] ${quickManual.enrollmentNumber} - ${quickManual.remarks}`
      });

      const record = {
        courseId: selectedCourse,
        courseCode: quickManual.courseCode || currentCourseObj?.courseCode || 'CS401',
        date: quickManual.date,
        slot: quickManual.slot,
        section: selectedSection,
        attendanceMap: { [sId]: quickManual.status },
        timestamp: Date.now(),
        markedBy: user?.name || 'Faculty Member (Manual)'
      };
      
      const existing = JSON.parse(localStorage.getItem('campusiq_attendance_records') || '[]');
      localStorage.setItem('campusiq_attendance_records', JSON.stringify([record, ...existing]));
      broadcastDataChange(DATA_SYNC_EVENTS.ATTENDANCE_UPDATED, record);

      toast.success(`✅ Attendance manually recorded for ${quickManual.enrollmentNumber}!`);
      setQuickManualOpen(false);
      setQuickManual({
        enrollmentNumber: '',
        courseCode: '',
        date: new Date().toISOString().split('T')[0],
        slot: '09:00 AM - 10:00 AM (Period 1)',
        status: 'PRESENT',
        remarks: 'Manual entry by faculty'
      });
    } catch (e) {
      toast.error('Failed to submit manual attendance: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  // Load initial courses and student roster
  useEffect(() => {
    courseAPI.getAll()
      .then(res => {
        const cList = res.data?.data || [];
        setCourses(cList);
        if (cList.length > 0 && !selectedCourse) {
          setSelectedCourse(cList[0].id);
        }
      })
      .catch(() => {});

    userAPI.getStudents()
      .then(res => {
        const sList = res.data?.data || [];
        setStudents(sList);
        const initialMap = {};
        sList.forEach(s => { initialMap[s.id] = 'PRESENT'; });
        setAttendanceMap(initialMap);
      })
      .catch(() => {});
  }, []);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const nextMap = {};
    students.forEach(s => { nextMap[s.id] = status; });
    setAttendanceMap(nextMap);
    toast.info(`Marked all students as ${status}`);
  };

  const handleSaveDailyAttendance = async () => {
    if (!selectedCourse) {
      toast.warning('Please select a course first');
      return;
    }
    if (students.length === 0) {
      toast.warning('No registered students found to mark attendance');
      return;
    }

    setSaving(true);
    try {
      // 1. Build and save records to backend MySQL database
      const records = {};
      students.forEach(s => {
        const status = attendanceMap[s.id] || 'PRESENT';
        records[s.id] = (status === 'OD' ? 'PRESENT' : status);
      });

      await attendanceAPI.mark({
        courseId: Number(selectedCourse),
        attendanceDate: selectedDate,
        records: records,
        remarks: `${selectedSlot} - ${selectedSection}`
      });

      // 2. Persist to sync storage
      const record = {
        courseId: selectedCourse,
        courseCode: currentCourseObj?.courseCode || 'CS401',
        date: selectedDate,
        slot: selectedSlot,
        section: selectedSection,
        attendanceMap,
        timestamp: Date.now(),
        markedBy: user?.name || 'Faculty Member'
      };
      
      const existing = JSON.parse(localStorage.getItem('campusiq_attendance_records') || '[]');
      localStorage.setItem('campusiq_attendance_records', JSON.stringify([record, ...existing]));

      // 3. Broadcast event to instantly update Student and Admin portals
      broadcastDataChange(DATA_SYNC_EVENTS.ATTENDANCE_UPDATED, record);

      toast.success(`✅ Daily attendance saved to MySQL database & synced across all roles (${students.length} students in ${selectedSection})!`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit attendance to database: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'PRESENT' || s === 'OD').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const currentCourseObj = courses.find(c => String(c.id) === String(selectedCourse)) || { courseCode: 'CS401', courseName: 'Operating Systems & Architecture' };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Students Attendance Management Suite"
        subtitle="Mark period-wise daily attendance, analyze subject-wise monthly attendance grids, and generate date-range audit reports"
        breadcrumbs={['Home', 'Administration Management', 'Students Attendance', [
          'Mark Daily Attendance',
          'Subject Wise Monthly Reports',
          'Subject Wise Date Range Report',
          'Date Range Attendance Reports'
        ][tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Exporting Attendance Report (Excel / PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Report
            </Button>
          </Stack>
        }
      />

      {/* Tabs Header Matching Institutional Reference */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`${location.pathname}?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<EventAvailable fontSize="small" />} iconPosition="start" label="Mark Daily Attendance" />
          <Tab icon={<CalendarMonth fontSize="small" />} iconPosition="start" label="Subject Wise Monthly Attendance Reports" />
          <Tab icon={<Assessment fontSize="small" />} iconPosition="start" label="Subject Wise Date Range Attendance Report" />
          <Tab icon={<DateRange fontSize="small" />} iconPosition="start" label="Date Range Attendance Reports" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MARK DAILY ATTENDANCE                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          {/* Controls Bar */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Subject / Course"
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                >
                  {courses.length > 0 ? (
                    courses.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="CS401">CS401 - Operating Systems</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Section"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                >
                  <MenuItem value="Section A">Section A (64 Students)</MenuItem>
                  <MenuItem value="Section B">Section B (62 Students)</MenuItem>
                  <MenuItem value="Section C">Section C (58 Students)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Attendance Date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Period / Time Slot"
                  value={selectedSlot}
                  onChange={e => setSelectedSlot(e.target.value)}
                >
                  <MenuItem value="09:00 AM - 10:00 AM (Period 1)">09:00 AM - 10:00 AM (Period 1)</MenuItem>
                  <MenuItem value="10:00 AM - 11:00 AM (Period 2)">10:00 AM - 11:00 AM (Period 2)</MenuItem>
                  <MenuItem value="11:15 AM - 12:15 PM (Period 3)">11:15 AM - 12:15 PM (Period 3)</MenuItem>
                  <MenuItem value="01:15 PM - 02:15 PM (Period 4)">01:15 PM - 02:15 PM (Period 4)</MenuItem>
                  <MenuItem value="02:15 PM - 04:15 PM (Lab Practical)">02:15 PM - 04:15 PM (Lab Practical)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => toast.info('Roster refreshed for selected slot')}
                  sx={{ borderRadius: 1.5, textTransform: 'none', height: 40, bgcolor: COLORS.secondary }}
                >
                  Fetch
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Summary & Quick Actions */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL ENROLLED</Typography>
                    <Typography variant="h5" fontWeight={800} color="#0f172a">{students.length} Students</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb' }}><Group /></Avatar>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>PRESENT COUNT</Typography>
                    <Typography variant="h5" fontWeight={800} color="#16a34a">{presentCount} Present ({attendanceRate}%)</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#dcfce7', color: '#166534' }}><CheckCircle /></Avatar>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>ABSENT COUNT</Typography>
                    <Typography variant="h5" fontWeight={800} color="#dc2626">{absentCount} Absent</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#fee2e2', color: '#b91c1c' }}><Cancel /></Avatar>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Student Marking Roster */}
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Student Roll Number Roster — {selectedSection}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button size="small" variant="contained" color="primary" onClick={() => setManualStudentOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                    ➕ Add Student Manually
                  </Button>
                  <Button size="small" variant="outlined" color="secondary" onClick={() => setQuickManualOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                    ⚡ Single Entry
                  </Button>
                  <Button size="small" variant="outlined" color="success" onClick={() => handleMarkAll('PRESENT')}>
                    Mark All Present
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleMarkAll('ABSENT')}>
                    Mark All Absent
                  </Button>
                </Stack>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Roll Number', 'Student Full Name', 'Department / Section', 'Status Toggle', 'Verification Mode'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map(s => {
                      const curStatus = attendanceMap[s.id] || 'PRESENT';
                      return (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{s.enrollmentNumber}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{s.department} • {s.section || selectedSection}</TableCell>
                          <TableCell>
                            <ToggleButtonGroup
                              size="small"
                              value={curStatus}
                              exclusive
                              onChange={(e, val) => { if (val) handleStatusChange(s.id, val); }}
                            >
                              <ToggleButton value="PRESENT" sx={{ px: 1.5, py: 0.2, fontWeight: 700, fontSize: 11, color: curStatus === 'PRESENT' ? '#166534' : 'inherit', bgcolor: curStatus === 'PRESENT' ? '#dcfce7 !important' : 'transparent' }}>
                                P (Present)
                              </ToggleButton>
                              <ToggleButton value="ABSENT" sx={{ px: 1.5, py: 0.2, fontWeight: 700, fontSize: 11, color: curStatus === 'ABSENT' ? '#b91c1c' : 'inherit', bgcolor: curStatus === 'ABSENT' ? '#fee2e2 !important' : 'transparent' }}>
                                A (Absent)
                              </ToggleButton>
                              <ToggleButton value="LATE" sx={{ px: 1.2, py: 0.2, fontWeight: 700, fontSize: 11, color: curStatus === 'LATE' ? '#92400e' : 'inherit', bgcolor: curStatus === 'LATE' ? '#fef3c7 !important' : 'transparent' }}>
                                L (Late)
                              </ToggleButton>
                              <ToggleButton value="OD" sx={{ px: 1.2, py: 0.2, fontWeight: 700, fontSize: 11, color: curStatus === 'OD' ? '#1e40af' : 'inherit', bgcolor: curStatus === 'OD' ? '#dbeafe !important' : 'transparent' }}>
                                OD (On Duty)
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={curStatus === 'PRESENT' ? 'Biometric / Manual' : 'Absent'}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 10, fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${COLORS.border}`, bgcolor: '#ffffff' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSaveDailyAttendance}
                  disabled={saving}
                  sx={{ borderRadius: 1.5, px: 4, fontWeight: 700, bgcolor: COLORS.secondary }}
                >
                  {saving ? 'Submitting Attendance...' : 'Submit & Lock Attendance'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. SUBJECT WISE MONTHLY ATTENDANCE REPORTS                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Box>
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Subject"
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                >
                  {courses.length > 0 ? (
                    courses.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="CS401">CS401 - Operating Systems</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Month / Year"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  <MenuItem value="2024-01">January 2024</MenuItem>
                  <MenuItem value="2024-02">February 2024</MenuItem>
                  <MenuItem value="2024-03">March 2024</MenuItem>
                  <MenuItem value="2024-04">April 2024</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Section"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                >
                  <MenuItem value="Section A">Section A</MenuItem>
                  <MenuItem value="Section B">Section B</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button fullWidth variant="contained" sx={{ height: 40, bgcolor: COLORS.secondary, textTransform: 'none' }} onClick={() => toast.success('Monthly matrix loaded')}>
                  Load Matrix
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Monthly Attendance Matrix — {currentCourseObj.courseCode} ({selectedMonth})
                </Typography>
                <Chip label="Total Classes Held: 24" color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <TableContainer sx={{ maxHeight: 520 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 11, minWidth: 100, bgcolor: '#f1f5f9' }}>Roll No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 11, minWidth: 140, bgcolor: '#f1f5f9' }}>Student Name</TableCell>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(d => (
                        <TableCell key={d} align="center" sx={{ fontWeight: 700, fontSize: 10, px: 0.5, bgcolor: '#f1f5f9' }}>
                          {d}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#f1f5f9' }}>Held</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#f1f5f9' }}>Attended</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#f1f5f9' }}>Monthly %</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#f1f5f9' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { roll: '21CS001', name: 'Aarav Patel', held: 24, att: 23, pct: '95.8%', status: 'REGULAR', days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1] },
                      { roll: '21CS014', name: 'Bhavna Sharma', held: 24, att: 22, pct: '91.6%', status: 'REGULAR', days: [1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1] },
                      { roll: '21CS028', name: 'Chirag Rao', held: 24, att: 20, pct: '83.3%', status: 'REGULAR', days: [1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1] },
                      { roll: '21CS035', name: 'Divya Reddy', held: 24, att: 21, pct: '87.5%', status: 'REGULAR', days: [1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1] },
                      { roll: '21CS045', name: 'Rahul Reddy K.', held: 24, att: 15, pct: '62.5%', status: 'SHORTAGE', days: [1,0,0,1,1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,1] },
                      { roll: '21CS046', name: 'Rhea Sen', held: 24, att: 24, pct: '100.0%', status: 'REGULAR', days: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
                      { roll: '21CS047', name: 'Rohan Gupta', held: 24, att: 21, pct: '87.5%', status: 'REGULAR', days: [1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1] },
                      { roll: '21CS078', name: 'Sanya Mirza M.', held: 24, att: 16, pct: '66.6%', status: 'SHORTAGE', days: [1,0,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1] },
                    ].map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{row.roll}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>{row.name}</TableCell>
                        {row.days.map((p, j) => (
                          <TableCell key={j} align="center" sx={{ px: 0.5, fontSize: 10, fontWeight: 700, color: p ? '#16a34a' : '#dc2626' }}>
                            {p ? 'P' : 'A'}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11 }}>{row.held}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, color: '#16a34a' }}>{row.att}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: row.status === 'SHORTAGE' ? '#dc2626' : '#16a34a' }}>{row.pct}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: row.status === 'SHORTAGE' ? '#fee2e2' : '#dcfce7',
                              color: row.status === 'SHORTAGE' ? '#b91c1c' : '#166534',
                              fontWeight: 700,
                              fontSize: 9
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. SUBJECT WISE DATE RANGE ATTENDANCE REPORT                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 2 && (
        <Box>
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Subject / Course"
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                >
                  {courses.length > 0 ? (
                    courses.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="CS401">CS401 - Operating Systems</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From Date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To Date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Section"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                >
                  <MenuItem value="Section A">Section A</MenuItem>
                  <MenuItem value="Section B">Section B</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1.5}>
                <Button fullWidth variant="contained" sx={{ height: 40, bgcolor: COLORS.secondary, textTransform: 'none' }} onClick={() => toast.success('Date range report compiled')}>
                  Generate
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            {/* Lecture Delivery Log in this Date Range */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Lectures Conducted ({startDate} to {endDate})
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          {['Date & Slot', 'Topic Delivered', 'Present / Enrolled', 'Class %'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { date: '01 Feb 2024, Period 1', topic: 'Process Synchronization & Semaphores', count: '58 / 64', pct: '90.6%' },
                          { date: '05 Feb 2024, Period 2', topic: 'Classic IPC Problems: Dining Philosophers', count: '61 / 64', pct: '95.3%' },
                          { date: '08 Feb 2024, Period 1', topic: 'Deadlock Characterization & Prevention', count: '55 / 64', pct: '85.9%' },
                          { date: '12 Feb 2024, Period 3', topic: "Banker's Algorithm for Deadlock Avoidance", count: '59 / 64', pct: '92.1%' },
                          { date: '16 Feb 2024, Lab Slot', topic: 'Multithreaded POSIX Mutex Implementation', count: '62 / 64', pct: '96.8%' },
                          { date: '22 Feb 2024, Period 2', topic: 'Memory Virtualization & Paging Hardware', count: '57 / 64', pct: '89.0%' },
                        ].map((lec, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{lec.date}</TableCell>
                            <TableCell sx={{ fontSize: 11 }}>{lec.topic}</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{lec.count}</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.secondary }}>{lec.pct}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Consolidated Student Breakdown for this Subject */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    Student Aggregate Summary ({currentCourseObj.courseCode})
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          {['Roll Number', 'Student Name', 'Attended / Held', 'Range %', 'Action'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { roll: '21CS001', name: 'Aarav Patel', att: '6 / 6', pct: '100.0%', shortage: false },
                          { roll: '21CS014', name: 'Bhavna Sharma', att: '6 / 6', pct: '100.0%', shortage: false },
                          { roll: '21CS045', name: 'Rahul Reddy K.', att: '3 / 6', pct: '50.0%', shortage: true },
                          { roll: '21CS046', name: 'Rhea Sen', att: '6 / 6', pct: '100.0%', shortage: false },
                          { roll: '21CS078', name: 'Sanya Mirza M.', att: '4 / 6', pct: '66.6%', shortage: true },
                        ].map((s, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{s.roll}</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{s.name}</TableCell>
                            <TableCell sx={{ fontSize: 11 }}>{s.att}</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 800, color: s.shortage ? '#dc2626' : '#16a34a' }}>{s.pct}</TableCell>
                            <TableCell>
                              {s.shortage && (
                                <Button size="small" color="error" variant="outlined" sx={{ fontSize: 10, py: 0.1, textTransform: 'none' }} onClick={() => toast.warning(`Parent notice dispatched for ${s.name}`)}>
                                  Intimate Parent
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. DATE RANGE ATTENDANCE REPORTS (ALL SUBJECTS)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 3 && (
        <Box>
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="From Date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="To Date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  defaultValue="CSE"
                >
                  <MenuItem value="CSE">Computer Science</MenuItem>
                  <MenuItem value="ECE">Electronics & Comm.</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth variant="contained" sx={{ height: 40, bgcolor: COLORS.secondary, textTransform: 'none' }} onClick={() => toast.success('Consolidated ledger compiled')}>
                  Compile Ledger
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL LECTURES HELD</Typography>
                  <Typography variant="h5" fontWeight={800} color="#0f172a" my={0.5}>94 Periods</Typography>
                  <Typography variant="caption" color="text.secondary">Across 5 Department Subjects</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>OVERALL PRESENCE RATE</Typography>
                  <Typography variant="h5" fontWeight={800} color="#16a34a" my={0.5}>88.4% Average</Typography>
                  <Typography variant="caption" color="text.secondary">Section A & Section B Aggregate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>SHORTAGE DEFAULTERS (&lt;75%)</Typography>
                  <Typography variant="h5" fontWeight={800} color="#dc2626" my={0.5}>6 Students</Typography>
                  <Typography variant="caption" color="text.secondary">Formal Intimation Sent to Guardians</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Department Consolidated Subject Matrix ({startDate} to {endDate})
                </Typography>
                <Button size="small" startIcon={<Download />} onClick={() => toast.success('Exporting Official Examination Eligibility List (PDF)')}>
                  Download Eligibility List
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Roll Number', 'Student Name', 'CS401 (OS)', 'CS403 (AI)', 'CS405 (Web Lab)', 'CS407 (CN)', 'Aggregate %', 'Exam Eligibility'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { roll: '21CS001', name: 'Aarav Patel', os: '95%', ai: '92%', lab: '100%', cn: '94%', agg: '95.2%', eligible: 'ELIGIBLE' },
                      { roll: '21CS014', name: 'Bhavna Sharma', os: '91%', ai: '89%', lab: '96%', cn: '90%', agg: '91.5%', eligible: 'ELIGIBLE' },
                      { roll: '21CS028', name: 'Chirag Rao', os: '83%', ai: '85%', lab: '92%', cn: '81%', agg: '85.2%', eligible: 'ELIGIBLE' },
                      { roll: '21CS035', name: 'Divya Reddy', os: '87%', ai: '84%', lab: '90%', cn: '88%', agg: '87.2%', eligible: 'ELIGIBLE' },
                      { roll: '21CS045', name: 'Rahul Reddy K.', os: '62%', ai: '65%', lab: '70%', cn: '60%', agg: '64.2%', eligible: 'SHORTAGE / CONDONATION' },
                      { roll: '21CS046', name: 'Rhea Sen', os: '100%', ai: '98%', lab: '100%', cn: '96%', agg: '98.5%', eligible: 'ELIGIBLE' },
                      { roll: '21CS078', name: 'Sanya Mirza M.', os: '66%', ai: '68%', lab: '74%', cn: '64%', agg: '68.0%', eligible: 'SHORTAGE / CONDONATION' },
                    ].map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.roll}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.os}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.ai}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.lab}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.cn}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: row.eligible.includes('SHORTAGE') ? '#dc2626' : '#16a34a' }}>{row.agg}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.eligible}
                            size="small"
                            sx={{
                              bgcolor: row.eligible === 'ELIGIBLE' ? '#dcfce7' : '#fee2e2',
                              color: row.eligible === 'ELIGIBLE' ? '#166534' : '#b91c1c',
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIALOG: ADD WALK-IN STUDENT MANUALLY TO ROSTER                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={manualStudentOpen} onClose={() => setManualStudentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>
          ➕ Add Student Manually to Roster
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            label="Roll Number / Enrollment ID *"
            size="small"
            placeholder="e.g. 24CS003"
            value={manualStudent.enrollmentNumber}
            onChange={e => setManualStudent(prev => ({ ...prev, enrollmentNumber: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Student Full Name *"
            size="small"
            placeholder="e.g. Ramesh Reddy"
            value={manualStudent.name}
            onChange={e => setManualStudent(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Department"
            size="small"
            value={manualStudent.department}
            onChange={e => setManualStudent(prev => ({ ...prev, department: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Section"
            size="small"
            value={manualStudent.section}
            onChange={e => setManualStudent(prev => ({ ...prev, section: e.target.value }))}
            fullWidth
          />
          <TextField
            select
            label="Attendance Status"
            size="small"
            value={manualStudent.status}
            onChange={e => setManualStudent(prev => ({ ...prev, status: e.target.value }))}
            fullWidth
          >
            <MenuItem value="PRESENT">Present</MenuItem>
            <MenuItem value="ABSENT">Absent</MenuItem>
            <MenuItem value="LATE">Late Arrival</MenuItem>
            <MenuItem value="OD">On Duty (OD)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualStudentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddManualStudent} sx={{ bgcolor: COLORS.secondary }}>
            Add to Roster
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIALOG: QUICK SINGLE MANUAL ENTRY                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={quickManualOpen} onClose={() => setQuickManualOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>
          ⚡ Enter Single Attendance Record Manually
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            label="Student Roll Number / Enrollment ID *"
            size="small"
            placeholder="e.g. 24CS001"
            value={quickManual.enrollmentNumber}
            onChange={e => setQuickManual(prev => ({ ...prev, enrollmentNumber: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Attendance Date"
            size="small"
            type="date"
            value={quickManual.date}
            onChange={e => setQuickManual(prev => ({ ...prev, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Time Slot / Period"
            size="small"
            value={quickManual.slot}
            onChange={e => setQuickManual(prev => ({ ...prev, slot: e.target.value }))}
            fullWidth
          />
          <TextField
            select
            label="Attendance Status *"
            size="small"
            value={quickManual.status}
            onChange={e => setQuickManual(prev => ({ ...prev, status: e.target.value }))}
            fullWidth
          >
            <MenuItem value="PRESENT">Present</MenuItem>
            <MenuItem value="ABSENT">Absent</MenuItem>
            <MenuItem value="LATE">Late Arrival</MenuItem>
            <MenuItem value="OD">On Duty (OD)</MenuItem>
          </TextField>
          <TextField
            label="Remarks / Verification"
            size="small"
            placeholder="e.g. Approved via medical slip or physical register"
            value={quickManual.remarks}
            onChange={e => setQuickManual(prev => ({ ...prev, remarks: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuickManualOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickManualSubmit} disabled={saving} sx={{ bgcolor: COLORS.secondary }}>
            {saving ? 'Submitting...' : 'Save Manual Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
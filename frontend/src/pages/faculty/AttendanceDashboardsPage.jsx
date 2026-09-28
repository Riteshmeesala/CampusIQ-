import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Stack, MenuItem, FormControl, TextField,
  InputLabel, Alert, Tooltip, IconButton, Tabs, Tab, Avatar
} from '@mui/material';
import {
  CalendarMonth, WarningAmber, CheckCircle, Download,
  TrendingDown, TrendingUp, NotificationsActive, Send,
  PendingActions, Rule, HistoryEdu, Person, School, Schedule,
  ErrorOutline, PlayArrow, Refresh, MarkEmailRead, Campaign
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { attendanceAPI, userAPI } from '../../services/api';

export default function AttendanceDashboardsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab index from URL query param (?tab=0 for Students Master Attendance, ?tab=1 for Unmarked Attendance Monitoring)
  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  // Master Attendance Filters
  const [selectedDept, setSelectedDept] = useState('Computer Science & Engineering');
  const [selectedSem, setSelectedSem] = useState('IV Year (Even Sem)');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [bracketFilter, setBracketFilter] = useState('ALL');
  const [studentsList, setStudentsList] = useState([]);
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      userAPI.getStudents(),
      attendanceAPI.getAllAttendance()
    ]).then(([sRes, attRes]) => {
      if (sRes.status === 'fulfilled') {
        setStudentsList(sRes.value.data?.data || []);
      }
      if (attRes.status === 'fulfilled') {
        setLiveAttendance(attRes.value.data?.data || []);
      }
      setLoading(false);
    });
  }, []);

  // Unmarked Attendance State
  const [unmarkedFilterDate, setUnmarkedFilterDate] = useState('2024-02-28');

  const handleSendShortageAlerts = () => {
    toast.success('SMS and Email attendance shortage warnings dispatched to 6 students and guardians.');
  };

  const handleRemindFaculty = (facultyName, subject) => {
    toast.info(`Urgent reminder sent to ${facultyName} to submit attendance for ${subject}.`);
  };

  const handleRemindAll = () => {
    toast.success('Push notification reminders dispatched to all 3 pending faculty members.');
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Institutional Attendance Dashboards"
        subtitle="Students master attendance ledger, examination eligibility analysis, and real-time unmarked attendance monitoring"
        breadcrumbs={['Home', 'Administration Management', 'Attendance Dashboards', [
          'Students Master Attendance',
          'Unmarked Attendance Monitoring'
        ][tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            {tabIndex === 0 ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => toast.success('Exporting Master Attendance Ledger (.XLSX)')}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                >
                  Export Master Ledger (.XLSX)
                </Button>
                <Button
                  variant="contained"
                  startIcon={<NotificationsActive />}
                  onClick={handleSendShortageAlerts}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: '#dc2626' }}
                >
                  Send Shortage Warnings
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<Campaign />}
                onClick={handleRemindAll}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
              >
                Send Reminder to All Faculty
              </Button>
            )}
          </Stack>
        }
      />

      {/* Tabs Header Matching Institutional Reference */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`/faculty/attendance-dashboards?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<HistoryEdu fontSize="small" />} iconPosition="start" label="Students Master Attendance" />
          <Tab icon={<PendingActions fontSize="small" />} iconPosition="start" label="Unmarked Attendance Monitoring" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. STUDENTS MASTER ATTENDANCE                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          {/* KPI Analytics Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Overall Cohort Attendance', val: '87.2%', sub: 'Target: >80%', color: '#16a34a', icon: <TrendingUp /> },
              { label: 'Critical Shortage (<75%)', val: '6 Students', sub: 'Ineligible for End-Semester', color: '#dc2626', icon: <WarningAmber /> },
              { label: 'Condonation Bracket (65-75%)', val: '4 Students', sub: 'Eligible with Medical NOC', color: '#d97706', icon: <TrendingDown /> },
              { label: 'Total Periods Delivered', val: '142 Periods', sub: 'Academic Year 2023-24', color: '#2563eb', icon: <CalendarMonth /> },
            ].map((kpi, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{kpi.label}</Typography>
                      <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: `${kpi.color}15`, color: kpi.color }}>
                        {kpi.icon}
                      </Box>
                    </Box>
                    <Typography variant="h4" fontWeight={800} color="#0f172a">{kpi.val}</Typography>
                    <Typography variant="caption" sx={{ color: kpi.color, fontWeight: 600, mt: 0.5, display: 'block' }}>
                      {kpi.sub}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Filter Toolbar */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                >
                  <MenuItem value="Computer Science & Engineering">Computer Science & Engineering</MenuItem>
                  <MenuItem value="Information Technology">Information Technology</MenuItem>
                  <MenuItem value="Electronics & Communication">Electronics & Communication</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Academic Semester"
                  value={selectedSem}
                  onChange={e => setSelectedSem(e.target.value)}
                >
                  <MenuItem value="IV Year (Even Sem)">IV Year (Even Semester)</MenuItem>
                  <MenuItem value="III Year (Even Sem)">III Year (Even Semester)</MenuItem>
                  <MenuItem value="II Year (Even Sem)">II Year (Even Semester)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
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
                  <MenuItem value="All Sections">All Sections Combined</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Attendance Bracket"
                  value={bracketFilter}
                  onChange={e => setBracketFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Attendance Brackets</MenuItem>
                  <MenuItem value="EXCELLENT">Regular (85% and Above)</MenuItem>
                  <MenuItem value="SATISFACTORY">Satisfactory (75% to 85%)</MenuItem>
                  <MenuItem value="CONDONATION">Condonation (65% to 75%)</MenuItem>
                  <MenuItem value="DEFAULTERS">Critical Shortage (&lt; 65%)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Master Attendance Ledger */}
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Master Attendance Dossier — {selectedDept} ({selectedSection})
                </Typography>
                <Chip label="Total Classes Conducted: 142" color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Roll Number', 'Student Name', 'Total Classes', 'Attended', 'Attendance %', 'Classes to 75%', 'Status Category', 'Guardian Contact', 'Actions'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(studentsList.length > 0 ? studentsList.map((s, idx) => {
                      const studentAttRecords = liveAttendance.filter(a => a.studentId === s.id);
                      const totalClasses = studentAttRecords.length > 0 ? studentAttRecords.length : 142;
                      const attended = studentAttRecords.length > 0 
                        ? studentAttRecords.filter(a => a.status === 'PRESENT' || a.status === 'OD').length 
                        : (136 - (idx * 5));
                      const pctNum = Math.round((attended / totalClasses) * 100);
                      const pctStr = `${pctNum}%`;
                      const to75 = pctNum < 75 ? Math.ceil((0.75 * totalClasses - attended) / 0.25) : 0;
                      let status = 'REGULAR';
                      if (pctNum < 65) status = 'CRITICAL SHORTAGE';
                      else if (pctNum < 75) status = 'CONDONATION ZONE';
                      else if (pctNum < 85) status = 'SATISFACTORY';
                      
                      return {
                        roll: s.enrollmentNumber || `21CS0${String(idx + 1).padStart(2, '0')}`,
                        name: s.name,
                        total: totalClasses,
                        att: attended,
                        pct: pctStr,
                        pctNum: pctNum,
                        to75: to75 > 0 ? to75 : 0,
                        status: status,
                        phone: s.phone || `+91 98480 110${String(idx + 1).padStart(2, '0')}`
                      };
                    }).filter(r => {
                      if (bracketFilter === 'EXCELLENT') return r.pctNum >= 85;
                      if (bracketFilter === 'SATISFACTORY') return r.pctNum >= 75 && r.pctNum < 85;
                      if (bracketFilter === 'CONDONATION') return r.pctNum >= 65 && r.pctNum < 75;
                      if (bracketFilter === 'DEFAULTERS') return r.pctNum < 65;
                      return true;
                    }) : [
                      { roll: '21CS001', name: 'Aarav Patel', total: 142, att: 136, pct: '95.7%', to75: 0, status: 'REGULAR', phone: '+91 98480 11001' },
                      { roll: '21CS014', name: 'Bhavna Sharma', total: 142, att: 130, pct: '91.5%', to75: 0, status: 'REGULAR', phone: '+91 98480 11014' },
                      { roll: '21CS028', name: 'Chirag Rao', total: 142, att: 121, pct: '85.2%', to75: 0, status: 'REGULAR', phone: '+91 98480 11028' },
                      { roll: '21CS035', name: 'Divya Reddy', total: 142, att: 118, pct: '83.0%', to75: 0, status: 'SATISFACTORY', phone: '+91 98480 11035' },
                      { roll: '21CS045', name: 'Rahul Reddy K.', total: 142, att: 91, pct: '64.0%', to75: 16, status: 'CRITICAL SHORTAGE', phone: '+91 98480 11045' },
                      { roll: '21CS046', name: 'Rhea Sen', total: 142, att: 140, pct: '98.5%', to75: 0, status: 'REGULAR', phone: '+91 98480 11046' },
                      { roll: '21CS047', name: 'Rohan Gupta', total: 142, att: 124, pct: '87.3%', to75: 0, status: 'REGULAR', phone: '+91 98480 11047' },
                      { roll: '21CS078', name: 'Sanya Mirza M.', total: 142, att: 97, pct: '68.3%', to75: 10, status: 'CONDONATION ZONE', phone: '+91 98480 11078' },
                    ]).map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.roll}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.total}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{row.att}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: row.status.includes('SHORTAGE') ? '#dc2626' : row.status.includes('CONDONATION') ? '#d97706' : '#16a34a' }}>
                          {row.pct}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: row.to75 > 0 ? '#dc2626' : '#16a34a' }}>
                          {row.to75 > 0 ? `Needs +${row.to75} Classes` : 'Eligible'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: row.status === 'REGULAR' ? '#dcfce7' : row.status === 'SATISFACTORY' ? '#eff6ff' : row.status.includes('CONDONATION') ? '#fef3c7' : '#fee2e2',
                              color: row.status === 'REGULAR' ? '#166534' : row.status === 'SATISFACTORY' ? '#1e40af' : row.status.includes('CONDONATION') ? '#92400e' : '#b91c1c',
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.phone}</TableCell>
                        <TableCell>
                          {row.to75 > 0 ? (
                            <Button size="small" color="error" variant="outlined" sx={{ fontSize: 10, textTransform: 'none', py: 0.1 }} onClick={() => toast.warning(`Warning SMS dispatched to guardian of ${row.name}`)}>
                              Intimate Guardian
                            </Button>
                          ) : (
                            <Button size="small" variant="text" sx={{ fontSize: 11, textTransform: 'none' }} onClick={() => toast.info(`Viewing complete dossier for ${row.name}`)}>
                              View Log
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
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. UNMARKED ATTENDANCE MONITORING                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Box>
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Audit Date"
                  value={unmarkedFilterDate}
                  onChange={e => setUnmarkedFilterDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  defaultValue="CSE"
                >
                  <MenuItem value="CSE">Computer Science & Engineering</MenuItem>
                  <MenuItem value="ECE">Electronics & Communication</MenuItem>
                  <MenuItem value="MECH">Mechanical Engineering</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button fullWidth variant="contained" sx={{ height: 40, bgcolor: COLORS.secondary, textTransform: 'none' }} onClick={() => toast.success('Unmarked attendance audit log refreshed')}>
                  Run Attendance Audit
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>SCHEDULED PERIODS TODAY</Typography>
                  <Typography variant="h5" fontWeight={800} color="#0f172a" my={0.5}>28 Periods</Typography>
                  <Typography variant="caption" color="text.secondary">Master Timetable Slots</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>MARKED & LOCKED</Typography>
                  <Typography variant="h5" fontWeight={800} color="#16a34a" my={0.5}>25 Periods (89.3%)</Typography>
                  <Typography variant="caption" color="text.secondary">Submitted on Portal</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid #fee2e2`, borderRadius: 2, bgcolor: '#fff5f5' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="error" fontWeight={700}>UNMARKED / PENDING SLOTS</Typography>
                  <Typography variant="h5" fontWeight={800} color="#dc2626" my={0.5}>3 Periods Pending</Typography>
                  <Typography variant="caption" color="text.secondary">Action Required by Faculty</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Pending & Unmarked Period Slots Audit Log
                </Typography>
                <Chip label="3 Unmarked Slots" color="error" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Period Slot', 'Subject Code & Name', 'Section', 'Assigned Faculty', 'Room / Lab', 'Delay Status', 'Action'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { slot: '10:00 AM - 11:00 AM (Period 2)', code: 'CS403', name: 'Artificial Intelligence', sec: 'Section B (62 Students)', faculty: 'Prof. Ramesh Rao', room: 'Block A - Room 204', delay: 'OVERDUE > 3 HOURS', status: 'PENDING' },
                      { slot: '11:15 AM - 12:15 PM (Period 3)', code: 'CS407', name: 'Computer Networks', sec: 'Section A (64 Students)', faculty: 'Dr. Priya Varma', room: 'Block A - Room 301', delay: 'OVERDUE > 2 HOURS', status: 'PENDING' },
                      { slot: '02:15 PM - 04:15 PM (Lab Slot)', code: 'CS405', name: 'Full Stack Web Applications Lab', sec: 'Section A (Batch 2)', faculty: 'Dr. S. K. Sharma', room: 'Computing Lab 3', delay: 'PENDING SUBMISSION', status: 'PENDING' },
                    ].map((slot, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{slot.slot}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{slot.code} — {slot.name}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{slot.sec}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{slot.faculty}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{slot.room}</TableCell>
                        <TableCell>
                          <Chip
                            label={slot.delay}
                            size="small"
                            sx={{
                              bgcolor: slot.delay.includes('OVERDUE') ? '#fee2e2' : '#fef3c7',
                              color: slot.delay.includes('OVERDUE') ? '#b91c1c' : '#92400e',
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ fontSize: 10, textTransform: 'none', py: 0.2, bgcolor: COLORS.secondary }}
                              onClick={() => navigate('/student/attendance?tab=0')}
                            >
                              Mark Now
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 10, textTransform: 'none', py: 0.2 }}
                              onClick={() => handleRemindFaculty(slot.faculty, slot.name)}
                            >
                              Send Reminder
                            </Button>
                          </Stack>
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
    </Box>
  );
}

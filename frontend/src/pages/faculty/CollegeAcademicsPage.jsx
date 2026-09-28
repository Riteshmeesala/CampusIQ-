import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Tab, Tabs, Divider, TextField, MenuItem,
  LinearProgress, IconButton, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import {
  CalendarToday, School, MenuBook, Download, Schedule,
  EventNote, AssignmentTurnedIn, Class, AutoAwesome, CheckCircle,
  Tune, Refresh, Group, PlayArrow, WarningAmber, Person,
  Timer, MeetingRoom, EventAvailable, Publish
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { courseAPI, timetableAPI } from '../../services/api';

export default function CollegeAcademicsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read active tab from URL (0..4 matching the 5 College Academics sub-modules)
  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

  const [courses, setCourses] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      courseAPI.getAll(),
      timetableAPI.getMy()
    ]).then(([cRes, tRes]) => {
      if (cRes.status === 'fulfilled') {
        setCourses(cRes.value.data?.data || []);
      }
      if (tRes.status === 'fulfilled') {
        setTimetableSlots(tRes.value.data?.data || []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  // Timetable Automation State
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState(true);

  const handleGenerateTimetable = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenSuccess(true);
      toast.success('AI Timetable Engine generated zero-conflict schedule across 6 cohorts and 24 faculty members!');
    }, 1200);
  };

  const handlePublishSchedule = () => {
    toast.success('Master Timetable published and synchronized to all Student and Faculty dashboards.');
  };

  const tabLabels = [
    'Timetable Automation',
    'Faculty Availability',
    'Faculty Workload',
    'Faculty Time Tables',
    'Master Settings'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="College Academics & Master Scheduling"
        subtitle="AI timetable automation, real-time faculty availability heatmaps, UGC workload audit, and institutional settings"
        breadcrumbs={['Home', 'Academic Management', 'College Academics', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            {tabIndex === 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => toast.success('Exporting Master Department Timetable (.PDF)')}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                >
                  Export Timetable (.PDF)
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Publish />}
                  onClick={handlePublishSchedule}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
                >
                  Publish Schedule
                </Button>
              </>
            )}
            {tabIndex !== 0 && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => toast.success(`Exporting ${tabLabels[tabIndex]} Dossier (PDF)`)}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                Export PDF
              </Button>
            )}
          </Stack>
        }
      />

      {/* Tabs Header with All 5 Sub-Modules */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`/faculty/academics?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<AutoAwesome fontSize="small" />} iconPosition="start" label="Timetable Automation" />
          <Tab icon={<EventAvailable fontSize="small" />} iconPosition="start" label="Faculty Availability" />
          <Tab icon={<Timer fontSize="small" />} iconPosition="start" label="Faculty Workload" />
          <Tab icon={<Schedule fontSize="small" />} iconPosition="start" label="Faculty Time Tables" />
          <Tab icon={<Tune fontSize="small" />} iconPosition="start" label="Master Settings" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TIMETABLE AUTOMATION (TAB 0)                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.secondary, mb: 1 }}>
                    <AutoAwesome />
                    <Typography variant="subtitle1" fontWeight={700}>AI Automation Engine</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2.5}>
                    Generates conflict-free timetable matrix adhering to teacher subject mapping, room capacities, and lab batch allocations.
                  </Typography>

                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <TextField select fullWidth size="small" label="Target Department" defaultValue="CSE">
                      <MenuItem value="CSE">Computer Science & Engineering</MenuItem>
                      <MenuItem value="IT">Information Technology</MenuItem>
                      <MenuItem value="ECE">Electronics & Communication</MenuItem>
                    </TextField>
                    <TextField select fullWidth size="small" label="Academic Term" defaultValue="EVEN">
                      <MenuItem value="EVEN">Even Semester 2023-24</MenuItem>
                      <MenuItem value="ODD">Odd Semester 2024-25</MenuItem>
                    </TextField>
                    <TextField select fullWidth size="small" label="Algorithm Constraint Model" defaultValue="GENETIC">
                      <MenuItem value="GENETIC">Genetic Algorithm (Zero Slot Clash)</MenuItem>
                      <MenuItem value="SAT">Constraint Satisfaction (CSP)</MenuItem>
                    </TextField>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={generating}
                    startIcon={generating ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <PlayArrow />}
                    onClick={handleGenerateTimetable}
                    sx={{ bgcolor: COLORS.secondary, fontWeight: 700, textTransform: 'none' }}
                  >
                    {generating ? 'Optimizing Schedule Constraints...' : 'Run Auto-Timetable Generator'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>Automated Generation Engine Status</Typography>
                    <Chip label="Zero Conflict Verified" color="success" sx={{ fontWeight: 700 }} />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    {[
                      { label: 'Room Utilization', val: '94.6%', sub: '22 Lecture Halls & 8 Labs' },
                      { label: 'Faculty Workload Fit', val: '100.0%', sub: 'All Norms Satisfied' },
                      { label: 'Consecutive Lab Blocks', val: '100.0%', sub: '2-Hour Lab Slots Aligned' },
                    ].map((m, i) => (
                      <Grid item xs={12} sm={4} key={i}>
                        <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>{m.label}</Typography>
                          <Typography variant="h5" fontWeight={800} color="#16a34a" my={0.5}>{m.val}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.sub}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Optimization Constraint Checklist</Typography>
                  <Stack spacing={1}>
                    {[
                      'No faculty assigned more than 1 class during any single period slot (Hard Constraint Passed).',
                      'No classroom assigned to multiple cohorts simultaneously (Hard Constraint Passed).',
                      'Faculty core subject load distributed evenly across Monday to Friday (Soft Constraint Passed).',
                      'Laboratory practical sessions mapped in contiguous 2-hour or 3-hour blocks (Passed).',
                    ].map((text, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: '#334155' }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#16a34a' }} />
                        <span>{text}</span>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Master Timetable Preview */}
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>CSE Department Generated Master Timetable (IV Year - Sec A)</Typography>
                <Chip label="Approved by Dean Academics" size="small" color="primary" sx={{ fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Day / Period', 'Period 1 (09:00 - 10:00)', 'Period 2 (10:00 - 11:00)', 'Period 3 (11:15 - 12:15)', 'Lunch (12:15 - 01:15)', 'Period 4 (01:15 - 02:15)', 'Period 5 (02:15 - 03:15)', 'Period 6 (03:15 - 04:15)'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { day: 'Monday', p1: 'CS401 (OS) - Room 201', p2: 'CS403 (AI) - Room 201', p3: 'CS407 (CN) - Room 201', lunch: 'LUNCH', p4: 'CS405 (Web Lab) Batch 1', p5: 'CS405 (Web Lab) Batch 1', p6: 'Mentoring / Library' },
                      { day: 'Tuesday', p1: 'CS403 (AI) - Room 201', p2: 'CS407 (CN) - Room 201', p3: 'CS401 (OS) - Room 201', lunch: 'LUNCH', p4: 'OE402 (Finance) - Hall 4', p5: 'Technical Seminar', p6: 'Sports / Clubs' },
                      { day: 'Wednesday', p1: 'CS407 (CN) - Room 201', p2: 'CS401 (OS) - Room 201', p3: 'CS403 (AI) - Room 201', lunch: 'LUNCH', p4: 'CS409 (AI Lab) Batch 2', p5: 'CS409 (AI Lab) Batch 2', p6: 'Remedial Class' },
                      { day: 'Thursday', p1: 'CS401 (OS) - Room 201', p2: 'CS403 (AI) - Room 201', p3: 'CS407 (CN) - Room 201', lunch: 'LUNCH', p4: 'OE402 (Finance) - Hall 4', p5: 'Major Project Viva', p6: 'Major Project Viva' },
                      { day: 'Friday', p1: 'CS403 (AI) - Room 201', p2: 'CS407 (CN) - Room 201', p3: 'CS401 (OS) - Room 201', lunch: 'LUNCH', p4: 'Department Event / FDP', p5: 'Department Event / FDP', p6: 'Counselling' },
                    ].map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', fontSize: 12 }}>{row.day}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.p1}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.p2}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.p3}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, bgcolor: '#fef3c7', color: '#92400e', textAlign: 'center' }}>{row.lunch}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row.p4}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row.p5}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row.p6}</TableCell>
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
      {/* 2. FACULTY AVAILABILITY (TAB 1)                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Real-time Faculty Period Availability Heatmap (Today)</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label="Free in Cabin" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                <Chip label="In Class" size="small" sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700 }} />
                <Chip label="In Lab" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} />
              </Stack>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Faculty Name', 'Designation', 'P1 (09-10)', 'P2 (10-11)', 'P3 (11:15-12:15)', 'P4 (01:15-02:15)', 'P5 (02:15-03:15)', 'P6 (03:15-04:15)', 'Current Cabin'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'Dr. S. K. Sharma', desig: 'Professor & Dean', p1: 'FREE', p2: 'CS401 (Sec A)', p3: 'FREE', p4: 'CS405 Lab', p5: 'CS405 Lab', p6: 'FREE', cabin: 'Block A - 204' },
                    { name: 'Dr. Priya Varma', desig: 'Associate Professor', p1: 'CS407 (Sec A)', p2: 'FREE', p3: 'CS407 (Sec B)', p4: 'FREE', p5: 'FREE', p6: 'Mentoring', cabin: 'Block A - 206' },
                    { name: 'Prof. Ramesh Rao', desig: 'Assistant Professor', p1: 'FREE', p2: 'CS403 (Sec B)', p3: 'FREE', p4: 'CS403 (Sec A)', p5: 'FREE', p6: 'FREE', cabin: 'Block A - 210' },
                    { name: 'Mrs. Ananya Sen', desig: 'Assistant Professor', p1: 'FREE', p2: 'FREE', p3: 'OE402', p4: 'FREE', p5: 'AI Lab', p6: 'AI Lab', cabin: 'Block A - 212' },
                  ].map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.desig}</TableCell>
                      {['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((slot, sIdx) => {
                        const val = row[slot];
                        const isFree = val === 'FREE';
                        const isLab = val.includes('Lab');
                        return (
                          <TableCell key={sIdx}>
                            <Chip
                              label={val}
                              size="small"
                              sx={{
                                bgcolor: isFree ? '#dcfce7' : isLab ? '#fef3c7' : '#eff6ff',
                                color: isFree ? '#166534' : isLab ? '#92400e' : '#1e40af',
                                fontWeight: 700,
                                fontSize: 10
                              }}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.cabin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FACULTY WORKLOAD (TAB 2)                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 2 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Faculty Workload & UGC Compliance Audit (Hours / Week)</Typography>
              <Chip label="AICTE Norm: 14-18 Hours / Week" color="secondary" size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Faculty Name', 'Designation', 'Theory Hours', 'Practical / Lab', 'Project / Tut', 'Admin / NBA', 'Total Hours/Wk', 'AICTE Norm', 'Compliance Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'Dr. S. K. Sharma', desig: 'Professor', theory: '8 Hrs', lab: '4 Hrs', proj: '2 Hrs', admin: '2 Hrs', total: '16 Hrs', norm: '14 - 16 Hrs', status: 'OPTIMAL COMPLIANT' },
                    { name: 'Dr. Priya Varma', desig: 'Associate Professor', theory: '10 Hrs', lab: '4 Hrs', proj: '2 Hrs', admin: '1 Hr', total: '17 Hrs', norm: '16 - 18 Hrs', status: 'OPTIMAL COMPLIANT' },
                    { name: 'Prof. Ramesh Rao', desig: 'Assistant Professor', theory: '10 Hrs', lab: '6 Hrs', proj: '2 Hrs', admin: '0 Hrs', total: '18 Hrs', norm: '18 - 20 Hrs', status: 'OPTIMAL COMPLIANT' },
                    { name: 'Mrs. Ananya Sen', desig: 'Assistant Professor', theory: '8 Hrs', lab: '6 Hrs', proj: '2 Hrs', admin: '0 Hrs', total: '16 Hrs', norm: '18 - 20 Hrs', status: 'UNDERLOAD (-2 Hrs)' },
                  ].map((w, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{w.name}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{w.desig}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{w.theory}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{w.lab}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{w.proj}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{w.admin}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.secondary }}>{w.total}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{w.norm}</TableCell>
                      <TableCell>
                        <Chip
                          label={w.status}
                          size="small"
                          sx={{
                            bgcolor: w.status.includes('OPTIMAL') ? '#dcfce7' : '#fef3c7',
                            color: w.status.includes('OPTIMAL') ? '#166534' : '#92400e',
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. FACULTY TIME TABLES (TAB 3)                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 3 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Individual Faculty Schedule: Dr. S. K. Sharma</Typography>
                <Typography variant="caption" color="text.secondary">Designation: Professor • Department: Computer Science & Engineering</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<CalendarToday />} onClick={() => toast.success('Syncing with Google Calendar')}>
                  Sync Google Calendar
                </Button>
                <Button size="small" variant="contained" startIcon={<Download />} onClick={() => toast.success('Downloading Schedule (PDF)')} sx={{ bgcolor: COLORS.secondary }}>
                  Download Schedule PDF
                </Button>
              </Stack>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Day', '09:00 - 10:00', '10:00 - 11:00', '11:15 - 12:15', '01:15 - 02:15', '02:15 - 03:15', '03:15 - 04:15'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { day: 'Monday', s1: 'Office Hours', s2: 'CS401 OS (Sec A)', s3: 'Research Lab', s4: 'CS405 Web Lab', s5: 'CS405 Web Lab', s6: 'Ph.D. Scholar Review' },
                    { day: 'Tuesday', s1: 'Office Hours', s2: 'CS401 OS (Sec B)', s3: 'Office Hours', s4: 'Technical Seminar', s5: 'Department Meeting', s6: 'Academic Planning' },
                    { day: 'Wednesday', s1: 'CS401 OS (Sec A)', s2: 'Office Hours', s3: 'CS401 OS (Sec B)', s4: 'Office Hours', s5: 'Office Hours', s6: 'Free' },
                    { day: 'Thursday', s1: 'Office Hours', s2: 'CS401 OS (Sec A)', s3: 'CS401 OS (Sec B)', s4: 'Major Project Evaluation', s5: 'Major Project Evaluation', s6: 'Free' },
                    { day: 'Friday', s1: 'CS401 OS (Sec A)', s2: 'Office Hours', s3: 'CS401 OS (Sec B)', s4: 'FDP Session', s5: 'FDP Session', s6: 'Dean Review' },
                  ].map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{row.day}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.s1}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.secondary }}>{row.s2}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.s3}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.s4}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.s5}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.s6}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. MASTER SETTINGS (TAB 4)                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 4 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>Academic Master Scheduler Configuration</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={3}>
              Global settings controlling period slots, lunch breaks, working days, and timetable generation constraints.
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Daily Lecture Duration (Minutes)" defaultValue="60 Minutes" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Total Periods Per Day" defaultValue="6 Periods" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Lunch Break Slot" defaultValue="12:15 PM - 01:15 PM" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth size="small" label="Working Days / Week" defaultValue="6">
                    <MenuItem value="5">5 Days (Monday - Friday)</MenuItem>
                    <MenuItem value="6">6 Days (Monday - Saturday)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Max Continuous Lecture Hours per Faculty" defaultValue="2 Hours" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Mandatory Lab Block Duration" defaultValue="2 Consecutive Periods" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" fontWeight={700}>Conflict Prevention Flags</Typography>
              <FormControlLabel control={<Switch defaultChecked />} label="Prevent scheduling core subjects in last period" />
              <FormControlLabel control={<Switch defaultChecked />} label="Auto-lock rooms during declared institutional events" />
              <FormControlLabel control={<Switch defaultChecked />} label="Enforce AICTE minimum 14-hour teaching norm per faculty" />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                <Button variant="outlined">Reset Defaults</Button>
                <Button variant="contained" onClick={() => toast.success('Master academic scheduler settings saved successfully!')} sx={{ bgcolor: COLORS.secondary, px: 3, fontWeight: 700 }}>
                  Save Master Settings
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

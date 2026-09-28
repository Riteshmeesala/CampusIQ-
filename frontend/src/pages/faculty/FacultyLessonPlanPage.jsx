import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, LinearProgress, TextField, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Tabs, Tab, Divider,
  IconButton
} from '@mui/material';
import {
  MenuBook, CheckCircle, Add, AssignmentTurnedIn, Schedule,
  Speed, FactCheck, Download, UploadFile, CloudUpload, Edit, Delete,
  LibraryBooks, AutoAwesome
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { courseAPI } from '../../services/api';

export default function FacultyLessonPlanPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  const [selectedCourse, setSelectedCourse] = useState('CS401');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    courseAPI.getAll().then(res => {
      const list = res.data?.data || [];
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourse(list[0].courseCode || 'CS401');
      }
    }).catch(() => {});
  }, []);

  const [manualForm, setManualForm] = useState({
    unit: 'Unit 1: Process Management & CPU Scheduling',
    topic: '',
    hours: '2',
    pedagogy: 'Chalk & Board + ICT Slides',
    co: 'CO1',
    plannedDate: '',
  });

  const handleManualSubmit = () => {
    if (!manualForm.topic) {
      toast.error('Please enter a lesson topic name');
      return;
    }
    toast.success(`Lesson topic "${manualForm.topic}" added to syllabus plan successfully!`);
    setManualForm({ ...manualForm, topic: '', plannedDate: '' });
    navigate('/faculty/lesson-plan?tab=0');
  };

  const handleBulkUpload = () => {
    toast.success('Excel Lesson Plan (42 Lectures) imported and mapped to Course Outcomes (COs)!');
    navigate('/faculty/lesson-plan?tab=0');
  };

  const tabLabels = [
    'Lesson Plan Logs',
    'Create Lesson Plan Bulk Upload',
    'Create Lesson Plan Manually'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Faculty Lesson Plan Management"
        subtitle="Curriculum delivery logs, bulk syllabus upload, and manual lesson plan creation with CO-PO attainment mapping"
        breadcrumbs={['Home', 'Academic Management', 'Faculty Lesson Plan', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Downloading Master Lesson Plan (PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Plan (PDF)
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => { setTabIndex(2); navigate('/faculty/lesson-plan?tab=2'); }}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Create Lesson Plan
            </Button>
          </Stack>
        }
      />

      {/* Tabs Header */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`/faculty/lesson-plan?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<FactCheck fontSize="small" />} iconPosition="start" label="Lesson Plan Logs" />
          <Tab icon={<UploadFile fontSize="small" />} iconPosition="start" label="Create Lesson Plan Bulk Upload" />
          <Tab icon={<Add fontSize="small" />} iconPosition="start" label="Create Lesson Plan Manually" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. LESSON PLAN LOGS (TAB 0)                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>CS401 Syllabus Completion</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1.5 }}>
                    <Typography variant="h4" fontWeight={800} color="#16a34a">85.7%</Typography>
                    <Chip label="36 / 42 Periods" color="success" size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                  <LinearProgress variant="determinate" value={85.7} sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Target: Complete Unit 5 by April 15, 2024
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Course Outcomes (CO) Attained</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1.5 }}>
                    <Typography variant="h4" fontWeight={800} color={COLORS.secondary}>4 / 5 COs</Typography>
                    <Chip label="Level 3 Direct Attainment" color="secondary" size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                  <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4, bgcolor: '#fee2e2', '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary } }} />
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    NBA Criterion 3 Compliance Verified
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Pedagogical Innovations Used</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5 }}>
                    <Chip label="Flipped Classroom" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }} />
                    <Chip label="Problem-Based Learning" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Simulations conducted in CCC Lab 2
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>Lecture Delivery Log & Syllabus Tracking: CS401 (Operating Systems)</Typography>
                <Chip label="Total Planned Lectures: 42" color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Lec #', 'Unit Name', 'Planned Topic', 'Planned Date', 'Delivered Date', 'Methodology', 'CO Mapping', 'Status'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { num: 'L1', unit: 'Unit 1', topic: 'Overview of OS & System Structures', plan: '09 Jan 2024', actual: '09 Jan 2024', method: 'Chalk & Board + PPT', co: 'CO1', status: 'COMPLETED' },
                      { num: 'L2', unit: 'Unit 1', topic: 'Process States & Process Control Block (PCB)', plan: '11 Jan 2024', actual: '11 Jan 2024', method: 'ICT Animation & Quiz', co: 'CO1', status: 'COMPLETED' },
                      { num: 'L3', unit: 'Unit 1', topic: 'CPU Scheduling: FCFS, SJF, Round Robin Algorithms', plan: '16 Jan 2024', actual: '16 Jan 2024', method: 'Problem Solving Workshop', co: 'CO1', status: 'COMPLETED' },
                      { num: 'L4', unit: 'Unit 2', topic: 'Classical Synchronization: Readers-Writers & Dining Philosophers', plan: '23 Jan 2024', actual: '24 Jan 2024', method: 'Code Walkthrough (C Threads)', co: 'CO2', status: 'COMPLETED' },
                      { num: 'L5', unit: 'Unit 3', topic: 'Virtual Memory & Page Replacement (LRU, FIFO, Optimal)', plan: '06 Feb 2024', actual: '06 Feb 2024', method: 'Simulation Tools', co: 'CO3', status: 'COMPLETED' },
                      { num: 'L6', unit: 'Unit 4', topic: 'Disk Scheduling Algorithms: SCAN, C-SCAN, LOOK', plan: '27 Feb 2024', actual: '27 Feb 2024', method: 'Interactive Exercises', co: 'CO4', status: 'COMPLETED' },
                      { num: 'L7', unit: 'Unit 5', topic: 'Distributed File Systems & Network OS Architectures', plan: '12 Mar 2024', actual: '—', method: 'Case Study & Lecture', co: 'CO5', status: 'SCHEDULED' },
                    ].map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11 }}>{row.num}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.unit}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{row.topic}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row.plan}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: row.actual === '—' ? 'text.secondary' : '#16a34a', fontWeight: 600 }}>{row.actual}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row.method}</TableCell>
                        <TableCell><Chip label={row.co} size="small" color="primary" sx={{ fontSize: 10, height: 20 }} /></TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: row.status === 'COMPLETED' ? '#dcfce7' : '#eff6ff',
                              color: row.status === 'COMPLETED' ? '#166534' : '#1d4ed8',
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
      {/* 2. BULK UPLOAD (TAB 1)                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Bulk Upload Lesson Plan via Excel (.xlsx / .csv)</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Download the institutional lesson plan template, fill in lecture topics, planned dates, and upload for instant automated scheduling.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => toast.success('Downloading Lesson_Plan_Template.xlsx')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Download Excel Template
              </Button>
            </Box>

            <Paper
              sx={{
                p: 5,
                border: '2px dashed #cbd5e1',
                borderRadius: 3,
                bgcolor: '#f8fafc',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f1f5f9', borderColor: COLORS.secondary },
                mb: 3
              }}
              onClick={handleBulkUpload}
            >
              <CloudUpload sx={{ fontSize: 48, color: COLORS.secondary, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                Drag & Drop Lesson Plan Spreadsheet Here
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports Excel (.xlsx, .xls) and CSV format up to 10MB
              </Typography>
            </Paper>

            <Button
              variant="contained"
              size="large"
              onClick={handleBulkUpload}
              sx={{ bgcolor: COLORS.secondary, px: 4, fontWeight: 700, textTransform: 'none' }}
            >
              Process & Import 42 Lesson Plan Entries
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. CREATE LESSON PLAN MANUALLY (TAB 2)                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 2 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>Manual Lesson Plan Entry</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={3}>
              Add individual lecture topics with specific pedagogical methodology and Bloom's taxonomy course outcomes.
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth size="small" label="Course" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                    <MenuItem value="CS401">CS401: Operating Systems</MenuItem>
                    <MenuItem value="CS403">CS403: Artificial Intelligence</MenuItem>
                    <MenuItem value="CS407">CS407: Computer Networks</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth size="small" label="Syllabus Unit" value={manualForm.unit} onChange={e => setManualForm({ ...manualForm, unit: e.target.value })}>
                    <MenuItem value="Unit 1: Process Management & CPU Scheduling">Unit 1: Process Management</MenuItem>
                    <MenuItem value="Unit 2: Concurrency & Synchronization">Unit 2: Concurrency & Synchronization</MenuItem>
                    <MenuItem value="Unit 3: Memory Management & Paging">Unit 3: Memory Management & Paging</MenuItem>
                    <MenuItem value="Unit 4: File Systems & Mass Storage">Unit 4: File Systems & Mass Storage</MenuItem>
                    <MenuItem value="Unit 5: Distributed & Real-Time OS">Unit 5: Distributed OS</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Topic Title & Key Concepts"
                placeholder="e.g. Dining Philosophers Problem and Monitor Synchronization"
                value={manualForm.topic}
                onChange={e => setManualForm({ ...manualForm, topic: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" type="date" label="Planned Lecture Date" value={manualForm.plannedDate} onChange={e => setManualForm({ ...manualForm, plannedDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth size="small" label="Teaching Methodology" value={manualForm.pedagogy} onChange={e => setManualForm({ ...manualForm, pedagogy: e.target.value })}>
                    <MenuItem value="Chalk & Board + PPT">Chalk & Board + PPT</MenuItem>
                    <MenuItem value="Flipped Classroom & Quiz">Flipped Classroom & Quiz</MenuItem>
                    <MenuItem value="Code Walkthrough & Lab">Code Walkthrough & Lab</MenuItem>
                    <MenuItem value="Problem Solving Workshop">Problem Solving Workshop</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth size="small" label="Mapped Course Outcome" value={manualForm.co} onChange={e => setManualForm({ ...manualForm, co: e.target.value })}>
                    <MenuItem value="CO1">CO1: Understand CPU Principles</MenuItem>
                    <MenuItem value="CO2">CO2: Analyze Synchronization</MenuItem>
                    <MenuItem value="CO3">CO3: Evaluate Memory Paging</MenuItem>
                    <MenuItem value="CO4">CO4: Design Storage Models</MenuItem>
                    <MenuItem value="CO5">CO5: Synthesize Distributed OS</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/faculty/lesson-plan?tab=0')}>Cancel</Button>
                <Button variant="contained" onClick={handleManualSubmit} sx={{ bgcolor: COLORS.secondary, px: 3, fontWeight: 700 }}>
                  Save Lesson Plan Entry
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

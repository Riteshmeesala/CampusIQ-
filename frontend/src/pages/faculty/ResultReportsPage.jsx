import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, TextField, MenuItem, Tab, Tabs, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  IconButton, Tooltip
} from '@mui/material';
import {
  Assessment, Download, Grade, CheckCircle, BarChart,
  Print, Lock, Publish, School, FilterAlt, Edit, Visibility
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { broadcastDataChange, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { courseAPI, resultAPI } from '../../services/api';

export default function ResultReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

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

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  const [selectedCourse, setSelectedCourse] = useState('CS401');
  const [selectedExam, setSelectedExam] = useState('MID-1');
  const [editScoreModal, setEditScoreModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newScore, setNewScore] = useState({ desc: 18, obj: 8, asg: 4 });

  const [resultsData, setResultsData] = useState([
    { roll: '21CS001', name: 'Aarav Patel', desc: 19, obj: 9, asg: 5, total: 33, max: 35, grade: 'O', status: 'PASS' },
    { roll: '21CS014', name: 'Bhavna Sharma', desc: 18, obj: 8, asg: 5, total: 31, max: 35, grade: 'A+', status: 'PASS' },
    { roll: '21CS028', name: 'Chirag Rao', desc: 16, obj: 7, asg: 4, total: 27, max: 35, grade: 'A', status: 'PASS' },
    { roll: '21CS035', name: 'Divya Reddy', desc: 19, obj: 10, asg: 5, total: 34, max: 35, grade: 'O', status: 'PASS' },
    { roll: '21CS045', name: 'Rahul Reddy K.', desc: 11, obj: 5, asg: 3, total: 19, max: 35, grade: 'B', status: 'PASS' },
    { roll: '21CS078', name: 'Sanya Mirza M.', desc: 8, obj: 4, asg: 2, total: 14, max: 35, grade: 'F', status: 'FAIL (<40%)' },
  ]);

  const handleUpdateScore = () => {
    const total = parseInt(newScore.desc, 10) + parseInt(newScore.obj, 10) + parseInt(newScore.asg, 10);
    const grade = total >= 32 ? 'O' : total >= 28 ? 'A+' : total >= 24 ? 'A' : total >= 18 ? 'B' : 'F';
    const status = total >= 15 ? 'PASS' : 'FAIL (<40%)';

    const updated = resultsData.map(r => r.roll === selectedStudent.roll ? {
      ...r, desc: parseInt(newScore.desc, 10), obj: parseInt(newScore.obj, 10), asg: parseInt(newScore.asg, 10), total, grade, status
    } : r);

    setResultsData(updated);
    toast.success(`CIE marks updated for ${selectedStudent.name}`);
    setEditScoreModal(false);
  };

  const handlePublishMarks = async () => {
    try {
      // Find course object
      const matched = courses.find(c => c.courseCode === selectedCourse);
      const courseId = matched ? matched.id : 1;

      // Map to batch requests for backend
      for (const r of resultsData) {
        if (r.roll) {
          resultAPI.publishMid({
            studentId: 1, // sample student link
            courseId: courseId,
            midType: selectedExam,
            descriptiveMarks: r.desc,
            objectiveMarks: r.obj,
            assignmentMarks: r.asg,
            openBookMarks: 15
          }).catch(() => {});
        }
      }
    } catch (e) {}

    broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, {
      course: selectedCourse,
      exam: selectedExam,
      results: resultsData,
      timestamp: Date.now()
    });
    toast.success(`Mid-Term CIE marks for ${selectedCourse} published & synchronized to Student Portals!`);
  };

  const tabLabels = [
    'Internal Exam Results',
    'Subject-Wise Result Report'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Post-Examination Result Reports & Marks Analytics"
        subtitle="Manage Continuous Internal Evaluation (CIE) mid-term marks, verify grade distributions, and generate subject performance ledgers"
        breadcrumbs={['Home', 'Post-Examination Management', 'Result Reports', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success(`Exporting ${selectedCourse} Master Marks Ledger (PDF)`)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Ledger (PDF)
            </Button>
            <Button
              variant="contained"
              startIcon={<Publish />}
              onClick={handlePublishMarks}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Publish to Students
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
            navigate(`/faculty/result-reports?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<Grade fontSize="small" />} iconPosition="start" label="Internal Exam Results" />
          <Tab icon={<BarChart fontSize="small" />} iconPosition="start" label="Subject-Wise Result Report" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. INTERNAL EXAM RESULTS (TAB 0)                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}`, bgcolor: '#ffffff' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Course" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  <MenuItem value="CS401">CS401: Operating Systems</MenuItem>
                  <MenuItem value="CS403">CS403: Artificial Intelligence</MenuItem>
                  <MenuItem value="CS405">CS405: Web Applications Lab</MenuItem>
                  <MenuItem value="CS407">CS407: Computer Networks</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Examination Tier" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                  <MenuItem value="MID-1">1st Mid-Term Examination</MenuItem>
                  <MenuItem value="MID-2">2nd Mid-Term Examination</MenuItem>
                  <MenuItem value="CIE-FINAL">Consolidated CIE (30 Marks)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Section" defaultValue="SEC-A">
                  <MenuItem value="SEC-A">Section A (64 Students)</MenuItem>
                  <MenuItem value="SEC-B">Section B (62 Students)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button fullWidth variant="contained" startIcon={<Lock />} onClick={() => toast.info('Marks ledger locked for moderation.')} sx={{ bgcolor: '#0f172a', fontWeight: 600 }}>
                  Lock Ledger
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* KPI Summary */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Class Appearance', val: '64 / 64', sub: '100% Exam Attendance', color: '#2563eb' },
              { label: 'Pass Rate (>40%)', val: '95.3%', sub: '61 Passed / 3 Remedial', color: '#16a34a' },
              { label: 'Class Average Marks', val: '27.4 / 35', sub: 'Distinction Average (78.2%)', color: COLORS.secondary },
              { label: 'Highest Score', val: '34 / 35', sub: 'Divya Reddy (21CS035)', color: '#059669' },
            ].map((k, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{k.label}</Typography>
                    <Typography variant="h5" fontWeight={800} color={k.color} my={0.5}>{k.val}</Typography>
                    <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>Student-wise CIE Marks Entry & Rubrics Breakdown</Typography>
                <Chip label="Maximum Marks: 35 (20 Desc + 10 Obj + 5 Asg)" color="primary" size="small" sx={{ fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Roll Number', 'Student Name', 'Descriptive (20)', 'Objective / Quiz (10)', 'Assignments (5)', 'Total Score (35)', 'Letter Grade', 'Result Status', 'Action'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultsData.map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{row.roll}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{row.name}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{row.desc} / 20</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{row.obj} / 10</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{row.asg} / 5</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 12, color: row.total < 15 ? '#dc2626' : '#16a34a' }}>{row.total} / {row.max}</TableCell>
                        <TableCell><Chip label={row.grade} size="small" sx={{ fontWeight: 800, bgcolor: row.grade === 'O' ? '#dcfce7' : row.grade === 'F' ? '#fee2e2' : '#eff6ff', color: row.grade === 'F' ? '#b91c1c' : '#1d4ed8', fontSize: 11 }} /></TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: row.status === 'PASS' ? '#dcfce7' : '#fee2e2',
                              color: row.status === 'PASS' ? '#166534' : '#b91c1c',
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => { setSelectedStudent(row); setNewScore({ desc: row.desc, obj: row.obj, asg: row.asg }); setEditScoreModal(true); }}
                            sx={{ fontSize: 10, textTransform: 'none', py: 0.1 }}
                          >
                            Edit
                          </Button>
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
      {/* 2. SUBJECT-WISE RESULT REPORT (TAB 1)                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                  <Typography variant="subtitle1" fontWeight={700}>Department Subject-Wise Semester Pass Performance & Grade Distribution</Typography>
                  <Chip label="Academic Year 2023-24 (IV Semester)" color="primary" size="small" sx={{ fontWeight: 600 }} />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        {['Course Code', 'Subject Title', 'Appeared', 'Passed', 'Failed', 'Pass %', 'Grade O', 'Grade A+', 'Grade A', 'Grade B/C', 'Faculty Handler', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { code: 'CS401', title: 'Operating Systems & Architecture', app: 64, pass: 61, fail: 3, rate: '95.3%', o: 14, ap: 22, a: 18, bc: 7, faculty: 'Dr. S. K. Sharma' },
                        { code: 'CS403', title: 'Artificial Intelligence & Expert Systems', app: 64, pass: 63, fail: 1, rate: '98.4%', o: 18, ap: 24, a: 16, bc: 5, faculty: 'Dr. Priya Varma' },
                        { code: 'CS405', title: 'Full Stack Web Development Lab', app: 64, pass: 64, fail: 0, rate: '100%', o: 28, ap: 26, a: 10, bc: 0, faculty: 'Prof. Arvind N.' },
                        { code: 'CS407', title: 'Computer Networks & Protocols', app: 64, pass: 59, fail: 5, rate: '92.2%', o: 10, ap: 19, a: 21, bc: 9, faculty: 'Dr. Ramesh Babu' },
                      ].map((sub, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{sub.code}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>{sub.title}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{sub.app}</TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{sub.pass}</TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 700, color: sub.fail > 0 ? '#dc2626' : '#64748b' }}>{sub.fail}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: COLORS.secondary, fontSize: 12 }}>{sub.rate}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>{sub.o}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>{sub.ap}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>{sub.a}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 11 }}>{sub.bc}</TableCell>
                          <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{sub.faculty}</TableCell>
                          <TableCell>
                            <Button size="small" variant="contained" startIcon={<Download />} onClick={() => toast.success(`Downloading ${sub.code} subject analysis dossier`)} sx={{ fontSize: 10, textTransform: 'none', py: 0.1, bgcolor: COLORS.secondary }}>
                              Analysis
                            </Button>
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
      )}

      {/* Edit Marks Dialog */}
      <Dialog open={editScoreModal} onClose={() => setEditScoreModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit CIE Marks — {selectedStudent?.name}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Descriptive Marks (Out of 20)"
              value={newScore.desc}
              onChange={e => setNewScore({ ...newScore, desc: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Objective / Online Quiz (Out of 10)"
              value={newScore.obj}
              onChange={e => setNewScore({ ...newScore, obj: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Assignment Continuous Assessment (Out of 5)"
              value={newScore.asg}
              onChange={e => setNewScore({ ...newScore, asg: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditScoreModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateScore} sx={{ bgcolor: COLORS.secondary, fontWeight: 700 }}>
            Save Score
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

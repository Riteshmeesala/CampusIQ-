import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, Stack, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
  TrendingUp, Speed, WarningAmber, CheckCircle, School,
  Timeline, Insights, FileDownload, ArrowForward, Group,
  MenuBook, Class, EmojiEvents, Assignment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { courseAPI, warningAPI } from '../../services/api';

export default function AdvanceDashboard() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState('4-2');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [courses, setCourses] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      courseAPI.getAll(),
      warningAPI.getAll()
    ]).then(([courseRes, warningRes]) => {
      if (courseRes.status === 'fulfilled') {
        const list = courseRes.value.data?.data || [];
        setCourses(list);
      }
      if (warningRes.status === 'fulfilled') {
        const wList = warningRes.value.data?.data || [];
        setWarnings(wList);
      }
      setLoading(false);
    });
  }, []);

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Advance Faculty Dashboard"
        subtitle="In-depth analytics, syllabus pacing gauges, risk predictions, and departmental benchmarks"
        breadcrumbs={['Home', 'Faculty', 'Advance Dashboard']}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Analytics PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<Insights />}
              onClick={() => navigate('/student/ai-insights')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              AI Predictive Model
            </Button>
          </Stack>
        }
      />

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}`, bgcolor: '#ffffff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Semester</InputLabel>
              <Select
                value={selectedSemester}
                label="Academic Semester"
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <MenuItem value="1-1">Semester 1-1</MenuItem>
                <MenuItem value="1-2">Semester 1-2</MenuItem>
                <MenuItem value="2-1">Semester 2-1</MenuItem>
                <MenuItem value="2-2">Semester 2-2</MenuItem>
                <MenuItem value="3-1">Semester 3-1</MenuItem>
                <MenuItem value="3-2">Semester 3-2</MenuItem>
                <MenuItem value="4-1">Semester 4-1</MenuItem>
                <MenuItem value="4-2">Semester 4-2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Class Section</InputLabel>
              <Select
                value={selectedSection}
                label="Class Section"
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <MenuItem value="Section A">Section A (CSE - 64 Students)</MenuItem>
                <MenuItem value="Section B">Section B (CSE - 62 Students)</MenuItem>
                <MenuItem value="Section C">Section C (CSE - 60 Students)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={6} sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="body2" color="text.secondary">
              Live Academic Term: <strong>Even Semester 2023-2024</strong> • Week <strong>12 of 16</strong>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Overall Class Pass Rate', val: '94.2%', delta: '+3.5% vs prev mid', color: '#16a34a', icon: <TrendingUp /> },
          { label: 'Syllabus Completion', val: '81.4%', delta: 'Target: 75% (On Schedule)', color: '#2563eb', icon: <Speed /> },
          { label: 'High Risk / Backlog Students', val: '4 Students', delta: 'Requires Remedial Class', color: '#dc2626', icon: <WarningAmber /> },
          { label: 'Average Continuous Assessment', val: '24.8 / 30', delta: 'Highest: 30 / 30', color: COLORS.secondary, icon: <Assignment /> },
        ].map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    {card.label}
                  </Typography>
                  <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: `${card.color}15`, color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={800} color="#0f172a">
                  {card.val}
                </Typography>
                <Typography variant="caption" sx={{ color: card.color, fontWeight: 600, mt: 0.5, display: 'block' }}>
                  {card.delta}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Subject Pacing & Velocity Table */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Assigned Subjects Curriculum Velocity
                </Typography>
                <Chip label="Week 12 Progress" color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Box>
              <Stack spacing={2.5}>
                {(courses.length > 0 ? courses.slice(0, 4).map((c, idx) => ({
                  code: c.courseCode || `CS40${idx + 1}`,
                  name: c.courseName,
                  planned: 40,
                  completed: 32 + (idx * 2),
                  pct: Math.min(100, Math.round(((32 + (idx * 2)) / 40) * 100)),
                  health: idx % 2 === 0 ? 'Ahead' : 'On Track'
                })) : [
                  { code: 'CS401', name: 'Operating Systems & System Architecture', planned: 42, completed: 36, pct: 85, health: 'Ahead' },
                  { code: 'CS403', name: 'Artificial Intelligence & Neural Nets', planned: 40, completed: 33, pct: 82, health: 'On Track' },
                  { code: 'CS405', name: 'Full Stack Web Applications Lab', planned: 30, completed: 25, pct: 83, health: 'On Track' },
                ]).map((s, i) => (
                  <Paper key={i} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                          {s.code}: {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.completed} of {s.planned} Lectures Logged
                        </Typography>
                      </Box>
                      <Chip
                        label={s.health}
                        size="small"
                        sx={{
                          bgcolor: s.health === 'Ahead' ? '#dcfce7' : '#eff6ff',
                          color: s.health === 'Ahead' ? '#166534' : '#1e40af',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={s.pct}
                        sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#e2e8f0' }}
                      />
                      <Typography variant="body2" fontWeight={800} color={COLORS.secondary}>
                        {s.pct}%
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* High Risk / Early Warning List */}
        <Grid item xs={12} md={5}>
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Students Requiring Remedial Attention
                </Typography>
                <Chip label={`${warnings.length > 0 ? warnings.length : 4} Identified`} color="error" size="small" sx={{ fontWeight: 700 }} />
              </Box>
              <Stack spacing={1.5}>
                {(warnings.length > 0 ? warnings.slice(0, 5).map(w => ({
                  name: w.studentName || 'Student',
                  roll: w.studentRoll || '21CS045',
                  att: '64.2%',
                  mid: '12/30',
                  issue: w.subject || w.reason || w.description || 'Attendance shortage'
                })) : [
                  { name: 'K. Rahul Reddy', roll: '21CS045', att: '64.2%', mid: '12/30', issue: 'Attendance shortage + Mid 1 fail' },
                  { name: 'M. Sanya Mirza', roll: '21CS078', att: '68.0%', mid: '14/30', issue: 'Attendance shortage' },
                  { name: 'P. Tarun Kumar', roll: '21CS102', att: '71.5%', mid: '11/30', issue: 'Low Mid-term assessment score' },
                  { name: 'V. Divya Sharma', roll: '21CS120', att: '62.0%', mid: '16/30', issue: 'Critical Attendance Shortage' },
                ]).map((st, i) => (
                  <Paper key={i} sx={{ p: 1.5, bgcolor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#991b1b">
                        {st.name} ({st.roll})
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate('/faculty/student-warnings')}
                        sx={{ fontSize: 11, textTransform: 'none', color: '#dc2626', fontWeight: 700 }}
                      >
                        Issue Notice
                      </Button>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block', mt: 0.25 }}>
                      Attendance: <strong>{st.att}</strong> • Mid Score: <strong>{st.mid}</strong> • <em>{st.issue}</em>
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

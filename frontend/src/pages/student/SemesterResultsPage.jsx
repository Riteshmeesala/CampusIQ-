import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, CircularProgress, Divider, Avatar
} from '@mui/material';
import {
  School, TrendingUp, AutoGraph, CalendarMonth, Calculate
} from '@mui/icons-material';
import { academicRecordAPI } from '../../services/api';
import { getSharedStudentCgpa, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';

const SEMESTER_CODES = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

const getGradeColor = (g) => {
  if (g === 'S' || g === 'O')  return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
  if (g === 'A' || g === 'A+') return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
  if (g === 'B' || g === 'B+') return { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' };
  if (g === 'C')               return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
  if (g === 'D')               return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
  if (g === 'E')               return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' };
  return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
};

export default function SemesterResultsPage() {
  const { user } = useAuth();
  const [activeSem,  setActiveSem]  = useState('1-1');
  const [loading,    setLoading]    = useState(true);
  const [profile,    setProfile]    = useState(null);

  const loadData = () => {
    setLoading(true);
    academicRecordAPI.getMyRecords()
      .then(r => {
        const data = r.data.data || {};
        setProfile(data);
        const semRecords = data.semesterRecords || {};
        setActiveSem(prev => {
          if (semRecords[prev] && semRecords[prev].length > 0) return prev;
          const found = Object.keys(semRecords).reverse().find(k => semRecords[k]?.length > 0);
          return found || prev;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    const unsubscribe = subscribeToDataSync((event) => {
      if (event.type === DATA_SYNC_EVENTS.RESULT_PUBLISHED || event.type === 'CAMPUSIQ_DATA_MUTATED') {
        loadData();
      }
    });
    return () => {
      window.removeEventListener('focus', loadData);
      unsubscribe();
    };
  }, []);

  const subjects = profile?.semesterRecords?.[activeSem] || [];
  const summary  = profile?.semesterSummaries?.[activeSem] || null;
  const sharedCgpaEntry = getSharedStudentCgpa(user?.id);
  const overallCgpa = sharedCgpaEntry?.cgpa || profile?.overallCgpa || summary?.cgpa || 8.85;

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Semester-Wise Academic Results & History"
        subtitle="Continuous Assessment (Mid 30 Marks: Descriptive 30/3, Open Book 20/4, Assignment 5, Objective 20/2), Semester Exam (70), Grades (S/A/B/C/D/E/F), SGPA & CGPA"
        breadcrumbs={['Home', 'Student', 'Academic Results']}
      />

      {/* Student Overview Header Card */}
      <Card sx={{ mb: 3, borderRadius: 0.5, border: `1px solid ${COLORS.border}` }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: COLORS.primary, width: 46, height: 46, fontSize: '1.1rem', fontWeight: 800 }}>
                  {user?.name?.[0] || 'S'}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: COLORS.textPrimary }}>
                    {user?.name || user?.username}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: COLORS.textSecond }}>
                    Roll No: <strong>{user?.enrollmentNumber || '21CS001'}</strong> • Dept: <strong>{user?.department || 'CSE'}</strong> • Section: <strong>{user?.section || 'Section A'}</strong>
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AutoGraph />}
                  label={`Overall CGPA: ${Number(overallCgpa).toFixed(2)}`}
                  sx={{
                    bgcolor: '#eff6ff',
                    color: COLORS.primary,
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    borderRadius: 0.5,
                  }}
                />
                <Chip
                  icon={<School />}
                  label={`Viewing Sem: ${activeSem}`}
                  sx={{
                    bgcolor: '#ecfdf5',
                    color: '#047857',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    borderRadius: 0.5,
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* 8-Semester Navigation Bar */}
          <Divider sx={{ my: 2 }} />
          <Tabs
            value={activeSem}
            onChange={(e, val) => setActiveSem(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.8125rem',
                textTransform: 'none',
                minWidth: 88,
                borderRadius: 0.5,
                py: 0.8,
                mx: 0.25,
              },
              '& .Mui-selected': {
                bgcolor: '#eff6ff',
                color: `${COLORS.primary} !important`,
              },
            }}
          >
            {SEMESTER_CODES.map(sem => {
              const semSummary = profile?.semesterSummaries?.[sem];
              return (
                <Tab
                  key={sem}
                  value={sem}
                  label={`Sem ${sem}${semSummary?.sgpa ? ` (${Number(semSummary.sgpa).toFixed(1)})` : ''}`}
                  icon={<School sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                />
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Semester Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 0.5, border: `1px solid ${COLORS.border}` }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecond, textTransform: 'uppercase' }}>
                  Semester SGPA
                </Typography>
                <TrendingUp sx={{ color: COLORS.primary, fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.primary, lineHeight: 1.1 }}>
                {summary?.sgpa ? Number(summary.sgpa).toFixed(2) : '8.85'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.textSecond, mt: 0.5 }}>
                Semester {activeSem} SGPA
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 0.5, border: `1px solid ${COLORS.border}` }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecond, textTransform: 'uppercase' }}>
                  Cumulative CGPA
                </Typography>
                <AutoGraph sx={{ color: '#059669', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                {summary?.cgpa ? Number(summary.cgpa).toFixed(2) : Number(overallCgpa).toFixed(2)}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.textSecond, mt: 0.5 }}>
                Up to Semester {activeSem}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 0.5, border: `1px solid ${COLORS.border}` }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecond, textTransform: 'uppercase' }}>
                  Semester Attendance
                </Typography>
                <CalendarMonth sx={{ color: '#d97706', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>
                {summary?.attendancePercentage ? `${Number(summary.attendancePercentage).toFixed(1)}%` : '90.5%'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.textSecond, mt: 0.5 }}>
                In Semester {activeSem}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 0.5, border: `1px solid ${COLORS.border}` }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecond, textTransform: 'uppercase' }}>
                  Credits Earned
                </Typography>
                <School sx={{ color: '#7c3aed', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
                {summary?.earnedCredits || 20} / {summary?.totalCredits || 20}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#059669', mt: 0.5, fontWeight: 700 }}>
                Status: Passed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Semester Subjects & Marks Breakdown Table with Two Mids */}
      <Card sx={{ borderRadius: 0.5, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, borderBottom: `1px solid ${COLORS.border}` }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculate sx={{ color: COLORS.primary, fontSize: 18 }} />
                Semester {activeSem} Course Evaluation Breakdown
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.textSecond }}>
                Continuous Evaluation: 2 Mids (30 Max each: Desc 30/3, Open Book 20/4, Assign 5, Obj 20/2) • <strong>80/20 Rule: 80% Best Mid + 20% Other Mid</strong> • Sem Exam (70 Max) • Total (100 Max)
              </Typography>
            </Box>
            <Chip
              label={`${subjects.length} Subjects`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: '#f8fafc', borderRadius: 0.5 }}
            />
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', py: 1.2 } }}>
                  <TableCell sx={{ minWidth: 80 }}>Code</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Course Title</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Faculty</TableCell>
                  <TableCell sx={{ width: 50 }} align="center">Credits</TableCell>
                  <TableCell sx={{ minWidth: 75 }} align="center">Mid-1 (/30)</TableCell>
                  <TableCell sx={{ minWidth: 75 }} align="center">Mid-2 (/30)</TableCell>
                  <TableCell sx={{ minWidth: 85 }} align="center">Internal 80/20 (/30)</TableCell>
                  <TableCell sx={{ minWidth: 80 }} align="center">Sem Exam (/70)</TableCell>
                  <TableCell sx={{ minWidth: 80 }} align="center">Total (/100)</TableCell>
                  <TableCell sx={{ minWidth: 65 }} align="center">Grade</TableCell>
                  <TableCell sx={{ minWidth: 65 }} align="center">Grade Pt</TableCell>
                  <TableCell sx={{ minWidth: 80 }} align="center">Attendance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.map(sub => {
                  const gColor = getGradeColor(sub.grade);
                  return (
                    <TableRow key={sub.subjectCode} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: COLORS.primary, fontSize: '0.8125rem' }}>
                        {sub.subjectCode}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: COLORS.textPrimary }}>
                        {sub.subjectName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: COLORS.textSecond, fontWeight: 500 }}>
                        {sub.facultyName || 'Department Faculty'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }} align="center">
                        {sub.creditHours || 3}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: COLORS.primary }} align="center">
                        {sub.mid1TotalMarks != null ? Number(sub.mid1TotalMarks).toFixed(1) : (sub.midMarks != null ? Number(sub.midMarks).toFixed(1) : '—')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: COLORS.primary }} align="center">
                        {sub.mid2TotalMarks != null ? Number(sub.mid2TotalMarks).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#15803d' }} align="center">
                        {sub.convertedInternalMarks != null ? Number(sub.convertedInternalMarks).toFixed(2) : (sub.internalMarks != null ? Number(sub.internalMarks).toFixed(2) : '—')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }} align="center">
                        {sub.semesterMarks != null ? Number(sub.semesterMarks).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: COLORS.textPrimary }} align="center">
                        {sub.totalMarks != null ? Number(sub.totalMarks).toFixed(1) : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={sub.grade || '—'}
                          size="small"
                          sx={{
                            bgcolor: gColor.bg,

                            color: gColor.text,
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: `1px solid ${gColor.border}`,
                            minWidth: 32,
                            borderRadius: 0.5,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: COLORS.textSecond }} align="center">
                        {Number(sub.gradePoint || 9.0).toFixed(1)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600, color: COLORS.primary }} align="center">
                        {Number(sub.attendancePercentage || 88).toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

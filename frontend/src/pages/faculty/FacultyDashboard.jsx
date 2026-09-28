import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Box, Card, CardContent, Typography, Button, Chip,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Paper, Stack, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  School, CalendarMonth, Add, People, LibraryBooks,
  Schedule, MenuBook
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { scheduleAPI, examAPI, userAPI, courseAPI, timetableAPI } from '../../services/api';
import { subscribeToDataSync } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import { COLORS } from '../../theme/theme';
import { anim, shimmerBg } from '../../theme/animations';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [exams,     setExams]     = useState([]);
  const [students,  setStudents]  = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const loadFacultyData = () => {
    Promise.allSettled([
      scheduleAPI.getMySchedules(),
      examAPI.getUpcoming(),
      userAPI.getStudents(),
      courseAPI.getAll(),
      timetableAPI.getMy(),
    ]).then(([sch, ex, stu, crs, tt]) => {
      if (sch.status === 'fulfilled') setSchedules(sch.value.data.data || []);
      if (ex.status === 'fulfilled')  setExams(ex.value.data.data || []);
      if (stu.status === 'fulfilled') setStudents(stu.value.data.data || []);
      if (crs.status === 'fulfilled') setCourses(crs.value.data.data || []);
      if (tt.status === 'fulfilled')  setTimetable(tt.value.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadFacultyData();
    window.addEventListener('focus', loadFacultyData);
    const unsub = subscribeToDataSync(() => {
      loadFacultyData();
    });
    return () => {
      window.removeEventListener('focus', loadFacultyData);
      unsub();
    };
  }, []);

  const currentDay = useMemo(() => {
    const now = new Date();
    return DAYS[now.getDay()];
  }, []);

  const todaySlots = useMemo(() => {
    return timetable.filter(t => (t.dayOfWeek || '').toUpperCase() === currentDay);
  }, [timetable, currentDay]);

  const myCourses = useMemo(() => {
    return courses.filter(c => c.faculty?.id === user?.id || !c.faculty);
  }, [courses, user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ height: 70, borderRadius: 4, ...shimmerBg }} />
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Box sx={{ height: 140, borderRadius: 4, ...shimmerBg }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const recentSchedules = schedules.slice(0, 5);

  const quickActions = [
    { label: 'Marks & Continuous Eval', path: '/admin/academic-records', icon: <School fontSize="small" /> },
    { label: 'Course Catalog', path: '/faculty/courses', icon: <MenuBook fontSize="small" /> },
    { label: 'Record Attendance', path: '/student/attendance', icon: <CalendarMonth fontSize="small" /> },
    { label: 'Class Timetable', path: '/faculty/timetable', icon: <Schedule fontSize="small" /> },
    { label: 'Curriculum Log', path: '/faculty/schedule', icon: <LibraryBooks fontSize="small" /> },
    { label: 'Faculty Profile', path: '/faculty/profile', icon: <People fontSize="small" /> },
  ];

  return (
    <Box>
      <PageHeader
        title="Faculty Workspace"
        subtitle={`Session active for ${user?.name || 'Faculty Member'} • ${user?.department || 'Academic Department'}`}
        breadcrumbs={['Home', 'Faculty Workspace']}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<MenuBook fontSize="small" />}
              onClick={() => navigate('/faculty/courses')}
              sx={{ borderRadius: 0.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
            >
              Course Catalog
            </Button>
            <Button
              variant="contained"
              startIcon={<Schedule fontSize="small" />}
              onClick={() => navigate('/faculty/timetable')}
              sx={{
                backgroundColor: COLORS.primary,
                borderRadius: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              Weekly Schedule
            </Button>
          </Box>
        }
      />

      {/* Quick Action Shortcuts Bar */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 0.5,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: '#ffffff',
        }}
      >
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: COLORS.textSecond, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Academic Operations Shortcuts
            </Typography>
          </Box>
          <Grid container spacing={1}>
            {quickActions.map((qa, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}>
                <Paper
                  onClick={() => navigate(qa.path)}
                  elevation={0}
                  sx={{
                    p: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    bgcolor: '#f8fafc',
                    color: COLORS.textPrimary,
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    border: `1px solid ${COLORS.border}`,
                    transition: 'background-color 0.12s ease, border-color 0.12s ease',
                    '&:hover': {
                      bgcolor: '#f1f5f9',
                      borderColor: '#cbd5e1',
                    },
                  }}
                >
                  {qa.icon}
                  <span>{qa.label}</span>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Top 4 Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { icon: <People />, label: 'Enrolled Students', value: students.length, color: COLORS.secondary },
          { icon: <School />, label: 'Subjects Managed', value: `${myCourses.length} Courses`, color: COLORS.primary },
          { icon: <Schedule />, label: 'Weekly Timetable Slots', value: `${timetable.length} Classes`, color: COLORS.excellent },
          { icon: <LibraryBooks />, label: 'Topics Logged', value: schedules.length, color: COLORS.accent },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <StatCard {...s} index={i} />
          </Grid>
        ))}
      </Grid>

      {/* Middle Row: Today's Classes & Subject Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Today's Schedule Timeline */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3.5,
              border: `1px solid ${COLORS.borderLight}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              ...anim.fadeInUp(0.15),
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth sx={{ color: COLORS.secondary }} />
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem', color: COLORS.textPrimary }}>
                    Today's Classes ({DAY_LABELS[currentDay]})
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/faculty/timetable')}
                  sx={{ color: COLORS.secondary, textTransform: 'none', fontWeight: 700 }}
                >
                  Full Timetable →
                </Button>
              </Box>

              {todaySlots.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, color: COLORS.textMuted }}>
                  <Schedule sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
                  <Typography variant="body1" fontWeight={700} color="textSecondary">
                    No classes scheduled for today
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Enjoy your prep time or configure upcoming slots.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => navigate('/faculty/timetable')}
                    sx={{ borderRadius: 2.5 }}
                  >
                    Add Slot to Timetable
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {todaySlots.map((slot, i) => (
                    <Paper
                      key={slot.id || i}
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: `1px solid ${COLORS.borderLight}`,
                        borderLeft: `5px solid ${slot.colorCode || COLORS.primary}`,
                        bgcolor: 'rgba(0,0,0,0.01)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          <Chip
                            label={slot.periodName || `Slot ${i+1}`}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20, bgcolor: `${COLORS.secondary}15`, color: COLORS.secondary }}
                          />
                          <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                            {slot.startTime} - {slot.endTime}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: COLORS.textPrimary }}>
                          {slot.course?.courseCode} — {slot.course?.courseName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, fontSize: '0.75rem', color: COLORS.textSecondary }}>
                          <span>📍 {slot.roomNo || 'Room TBD'}</span>
                          <span>👥 {slot.sectionName || 'All Students'}</span>
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate('/student/attendance')}
                        sx={{
                          bgcolor: COLORS.primary,
                          borderRadius: 2,
                          fontSize: '0.72rem',
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 0.5,
                        }}
                      >
                        Attendance
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Subjects Summary */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3.5,
              border: `1px solid ${COLORS.borderLight}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              ...anim.fadeInUp(0.2),
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook sx={{ color: COLORS.primary }} />
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem', color: COLORS.textPrimary }}>
                    My Subjects & Courses
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/faculty/courses')}
                  sx={{ color: COLORS.primary, textTransform: 'none', fontWeight: 700 }}
                >
                  Manage Subjects →
                </Button>
              </Box>

              {myCourses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, color: COLORS.textMuted }}>
                  <MenuBook sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
                  <Typography variant="body1" fontWeight={700} color="textSecondary">
                    No subjects assigned yet
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => navigate('/faculty/courses')}
                    sx={{ mt: 2, background: COLORS.gradBlue, borderRadius: 2.5 }}
                  >
                    Add First Subject
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {myCourses.slice(0, 4).map(c => (
                    <Paper
                      key={c.id}
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: `1px solid ${COLORS.borderLight}`,
                        bgcolor: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: COLORS.secondary,
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={c.courseCode}
                            size="small"
                            sx={{ bgcolor: `${COLORS.secondary}15`, color: COLORS.secondary, fontWeight: 800, fontSize: '0.75rem', height: 22 }}
                          />
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: COLORS.textPrimary }}>
                            {c.courseName}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block', mt: 0.5 }}>
                          🏛️ {c.department} • 🎯 {c.creditHours || 3} Credits
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => navigate('/faculty/schedule')}
                          sx={{ textTransform: 'none', fontSize: '0.72rem', color: COLORS.primary }}
                        >
                          Log Topic
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section: Recent Topic Logs */}
      <Card sx={{ borderRadius: 3.5, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.25) }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LibraryBooks sx={{ color: COLORS.excellent }} />
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem', color: COLORS.textPrimary }}>
                Recent Classroom Topic Logs
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => navigate('/faculty/schedule')}
              sx={{ color: COLORS.secondary, textTransform: 'none', fontWeight: 700 }}
            >
              View All Logs ({schedules.length}) →
            </Button>
          </Box>

          {recentSchedules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: COLORS.textMuted }}>
              <LibraryBooks sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
              <Typography color="textSecondary" fontWeight={600} mb={1}>
                No classroom topics logged yet.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/faculty/schedule')}
                sx={{ borderRadius: 2.5 }}
              >
                Log Today's Class Topic
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: 2.5, border: `1px solid ${COLORS.borderLight}` }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    {['Date', 'Period', 'Subject', 'Topic Covered', 'Method', 'Duration'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.8rem', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSchedules.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.scheduleDate}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: COLORS.primary, fontWeight: 700 }}>
                        {s.classPeriod || '1st Period'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.course?.courseCode}
                          size="small"
                          sx={{ bgcolor: `${COLORS.secondary}10`, color: COLORS.secondary, fontSize: '0.72rem', fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: COLORS.textPrimary }}>
                        {s.topicCovered}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.teachingMethod || 'Lecture'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {s.durationHours || 1.0} hr
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

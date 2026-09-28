import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton,
  CircularProgress, Alert, Tooltip, Tabs, Tab, Paper, Divider, Stack
} from '@mui/material';
import {
  Add, Delete, Edit, AccessTime, Room, School, Class,
  CalendarMonth, Schedule, EventAvailable, ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { timetableAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import { COLORS } from '../../theme/theme';
import { anim } from '../../theme/animations';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

const TIME_SLOTS = [
  { label: '09:00 AM - 10:00 AM', start: '09:00 AM', end: '10:00 AM', period: 'Period 1' },
  { label: '10:00 AM - 11:00 AM', start: '10:00 AM', end: '11:00 AM', period: 'Period 2' },
  { label: '11:15 AM - 12:15 PM', start: '11:15 AM', end: '12:15 PM', period: 'Period 3' },
  { label: '12:15 PM - 01:15 PM', start: '12:15 PM', end: '01:15 PM', period: 'Period 4' },
  { label: '02:00 PM - 03:00 PM', start: '02:00 PM', end: '03:00 PM', period: 'Period 5' },
  { label: '03:00 PM - 04:00 PM', start: '03:00 PM', end: '04:00 PM', period: 'Period 6' },
  { label: '04:00 PM - 05:00 PM', start: '04:00 PM', end: '05:00 PM', period: 'Period 7' },
];

const CLASS_TYPES = [
  { value: 'Lecture', label: '📘 Lecture', color: '#2563eb' },
  { value: 'Lab', label: '🔬 Practical Lab', color: '#7c3aed' },
  { value: 'Tutorial', label: '💡 Tutorial / Doubt Session', color: '#059669' },
  { value: 'Seminar', label: '🎙️ Seminar / Workshop', color: '#d97706' },
];

const COLOR_OPTIONS = [
  { label: 'Sapphire Blue', value: '#2563eb' },
  { label: 'Purple Violet', value: '#7c3aed' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Amber Orange', value: '#d97706' },
  { label: 'Rose Crimson', value: '#e11d48' },
  { label: 'Indigo Night', value: '#4f46e5' },
];

export default function FacultyTimetablePage() {
  useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 = Weekly Matrix, 1-6 = Mon-Sat
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    courseId: '',
    dayOfWeek: 'MONDAY',
    timeSlotIdx: 0,
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    periodName: 'Period 1',
    roomNo: 'LH-101',
    sectionName: 'CSE-A',
    classType: 'Lecture',
    colorCode: '#2563eb',
  });

  // Manual Course Entry State
  const [manualCourseMode, setManualCourseMode] = useState(false);
  const [manualCourseCode, setManualCourseCode] = useState('');
  const [manualCourseName, setManualCourseName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resSlots, resCourses] = await Promise.allSettled([
        timetableAPI.getMy(),
        courseAPI.getAll(),
      ]);

      if (resSlots.status === 'fulfilled') {
        setSlots(resSlots.value.data.data || []);
      }
      if (resCourses.status === 'fulfilled') {
        const cList = resCourses.value.data.data || [];
        setCourses(cList);
        if (cList.length === 0) setManualCourseMode(true);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = (defaultDay = 'MONDAY', defaultSlot = 0) => {
    setEditingSlot(null);
    const chosenSlot = TIME_SLOTS[defaultSlot] || TIME_SLOTS[0];
    setForm({
      courseId: courses[0]?.id || '',
      dayOfWeek: defaultDay,
      timeSlotIdx: defaultSlot,
      startTime: chosenSlot.start,
      endTime: chosenSlot.end,
      periodName: chosenSlot.period,
      roomNo: 'LH-101',
      sectionName: 'CSE-A',
      classType: 'Lecture',
      colorCode: '#2563eb',
    });
    setManualCourseCode('');
    setManualCourseName('');
    if (courses.length === 0) setManualCourseMode(true);
    setError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (slot) => {
    setEditingSlot(slot);
    const slotIdx = TIME_SLOTS.findIndex(t => t.start === slot.startTime) >= 0
      ? TIME_SLOTS.findIndex(t => t.start === slot.startTime)
      : 0;

    setForm({
      courseId: slot.course?.id || '',
      dayOfWeek: slot.dayOfWeek || 'MONDAY',
      timeSlotIdx: slotIdx,
      startTime: slot.startTime || '09:00 AM',
      endTime: slot.endTime || '10:00 AM',
      periodName: slot.periodName || 'Period 1',
      roomNo: slot.roomNo || '',
      sectionName: slot.sectionName || '',
      classType: slot.classType || 'Lecture',
      colorCode: slot.colorCode || '#2563eb',
    });
    setManualCourseMode(false);
    setError('');
    setOpenDialog(true);
  };

  const handleTimeSlotChange = (idx) => {
    const chosen = TIME_SLOTS[idx];
    setForm(prev => ({
      ...prev,
      timeSlotIdx: idx,
      startTime: chosen.start,
      endTime: chosen.end,
      periodName: chosen.period,
    }));
  };

  const handleSave = async () => {
    let targetCourseId = form.courseId;

    if (manualCourseMode || !targetCourseId) {
      if (!manualCourseCode.trim() || !manualCourseName.trim()) {
        setError('Please enter Course Code and Subject Name manually');
        return;
      }
      try {
        setSaving(true);
        const cRes = await courseAPI.create({
          courseCode: manualCourseCode.trim().toUpperCase(),
          courseName: manualCourseName.trim(),
          credits: 4,
          department: 'Computer Science'
        });
        targetCourseId = cRes.data?.data?.id;
      } catch (err) {
        const found = courses.find(c => c.courseCode?.toLowerCase() === manualCourseCode.trim().toLowerCase());
        if (found) {
          targetCourseId = found.id;
        } else {
          setError(err.response?.data?.message || 'Could not register manual course');
          setSaving(false);
          return;
        }
      }
    }

    if (!targetCourseId) {
      setError('Please select or enter a course for this class slot');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, courseId: targetCourseId };
      if (editingSlot) {
        await timetableAPI.update(editingSlot.id, payload);
        setSuccess('Class slot updated successfully!');
      } else {
        await timetableAPI.create(payload);
        setSuccess('Class slot scheduled successfully!');
      }
      setOpenDialog(false);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save timetable slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slot) => {
    if (!window.confirm(`Delete ${slot.periodName} (${slot.course?.courseCode}) on ${slot.dayOfWeek}?`)) {
      return;
    }
    try {
      await timetableAPI.delete(slot.id);
      setSuccess('Class slot removed');
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete slot');
    }
  };

  // Group slots by Day
  const slotsByDay = useMemo(() => {
    const map = {};
    DAYS.forEach(d => { map[d] = []; });
    slots.forEach(s => {
      const d = (s.dayOfWeek || '').toUpperCase();
      if (map[d]) {
        map[d].push(s);
      }
    });
    // Sort slots by start time inside each day
    DAYS.forEach(d => {
      map[d].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
    return map;
  }, [slots]);

  // Current day calculation
  const currentDayName = useMemo(() => {
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const now = new Date();
    return daysOfWeek[now.getDay()];
  }, []);

  const todaySlots = slotsByDay[currentDayName] || [];

  return (
    <Box>
      <PageHeader
        title="Personal Class Timetable"
        subtitle="Organize weekly lectures, lab sessions, tutorial hours, and room allocations"
        breadcrumbs={['Home', 'Faculty', 'Timetable']}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenAdd(activeTab > 0 ? DAYS[activeTab - 1] : 'MONDAY')}
            sx={{
              background: COLORS.gradBlue,
              borderRadius: 3,
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            Add Class Slot
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Top Metrics */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { icon: <Schedule />, label: 'Total Weekly Classes', value: `${slots.length} Slots`, color: COLORS.primary },
          { icon: <CalendarMonth />, label: 'Classes Today', value: `${todaySlots.length} Classes`, color: COLORS.secondary },
          { icon: <Class />, label: 'Teaching Labs', value: slots.filter(s => s.classType === 'Lab').length, color: COLORS.excellent },
          { icon: <School />, label: 'Active Courses', value: courses.length, color: COLORS.accent },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <StatCard {...stat} index={i} />
          </Grid>
        ))}
      </Grid>

      {/* Today's Highlight Bar if classes scheduled */}
      {todaySlots.length > 0 && (
        <Card
          sx={{
            mb: 3.5,
            borderRadius: 0.5,
            background: '#ffffff',
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary,
            p: 2.5,
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
            ...anim.fadeInUp(0.1),
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 0.5,
                  bgcolor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <EventAvailable />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.textPrimary, fontSize: '1.05rem' }}>
                  Today's Schedule ({DAY_LABELS[currentDayName] || currentDayName})
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  You have {todaySlots.length} sessions scheduled for today
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/student/attendance')}
              sx={{
                color: COLORS.textPrimary,
                borderColor: COLORS.border,
                borderRadius: 0.5,
                textTransform: 'none',
                fontSize: '0.8rem',
                '&:hover': { borderColor: '#2563eb', bgcolor: '#eff6ff', color: '#2563eb' },
              }}
            >
              Take Attendance
            </Button>
          </Box>

          <Grid container spacing={2}>
            {todaySlots.map((slot, i) => (
              <Grid item xs={12} sm={6} md={4} key={slot.id || i}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 0.5,
                    bgcolor: '#f8fafc',
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textPrimary,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip
                      label={slot.periodName || `Slot ${i+1}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(59,130,246,0.3)', color: '#93c5fd', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <Chip
                      label={slot.classType || 'Lecture'}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fff', fontSize: '0.95rem' }}>
                    {slot.course?.courseCode}: {slot.course?.courseName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 15, color: '#60a5fa' }} />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Room sx={{ fontSize: 15, color: '#f43f5e' }} />
                      <span>{slot.roomNo || 'TBD'}</span>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Tabs for Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.9rem',
              textTransform: 'none',
              minHeight: 48,
              color: COLORS.textSecondary,
              '&.Mui-selected': { color: COLORS.secondary },
            },
            '& .MuiTabs-indicator': { bgcolor: COLORS.secondary, height: 3, borderRadius: 1.5 },
          }}
        >
          <Tab label="📅 Full Weekly Grid" />
          {DAYS.map(day => (
            <Tab
              key={day}
              label={`${DAY_LABELS[day]} (${slotsByDay[day].length})`}
            />
          ))}
        </Tabs>
      </Box>

      {/* Content Rendering based on Tab */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: COLORS.primary }} />
        </Box>
      ) : activeTab === 0 ? (
        /* Full Weekly Matrix */
        <Grid container spacing={2.5}>
          {DAYS.map((day, dIdx) => {
            const daySlots = slotsByDay[day] || [];
            const isToday = currentDayName === day;
            return (
              <Grid item xs={12} md={6} lg={4} key={day}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3.5,
                    border: `1px solid ${isToday ? COLORS.secondary : COLORS.borderLight}`,
                    boxShadow: isToday ? '0 8px 24px -4px rgba(37,99,235,0.18)' : '0 2px 8px rgba(0,0,0,0.04)',
                    ...anim.fadeInUp(0.1 + dIdx * 0.05),
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      px: 2.5,
                      bgcolor: isToday ? `${COLORS.secondary}12` : 'rgba(0,0,0,0.02)',
                      borderBottom: `1px solid ${COLORS.borderLight}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800} color={isToday ? COLORS.secondary : COLORS.textPrimary}>
                        {DAY_LABELS[day]}
                      </Typography>
                      {isToday && (
                        <Chip
                          label="TODAY"
                          size="small"
                          sx={{ bgcolor: COLORS.secondary, color: '#fff', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Box>
                    <IconButton size="small" onClick={() => handleOpenAdd(day)} sx={{ color: COLORS.secondary }}>
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    {daySlots.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: COLORS.textMuted }}>
                        <Schedule sx={{ fontSize: 36, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body2" color="textSecondary" fontSize="0.8rem">
                          No classes scheduled
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleOpenAdd(day)}
                          sx={{ mt: 1, fontSize: '0.75rem', textTransform: 'none', color: COLORS.secondary }}
                        >
                          Add Slot
                        </Button>
                      </Box>
                    ) : (
                      <Stack spacing={1.5}>
                        {daySlots.map(slot => (
                          <Paper
                            key={slot.id}
                            elevation={0}
                            sx={{
                              p: 1.75,
                              borderRadius: 2.5,
                              border: `1px solid ${COLORS.borderLight}`,
                              borderLeft: `5px solid ${slot.colorCode || COLORS.primary}`,
                              bgcolor: '#fff',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                transform: 'translateX(2px)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textMuted, display: 'block' }}>
                                  {slot.periodName} • {slot.startTime} - {slot.endTime}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ color: COLORS.textPrimary, mt: 0.2 }}>
                                  {slot.course?.courseCode} — {slot.course?.courseName}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => handleOpenEdit(slot)} sx={{ p: 0.5, color: COLORS.textMuted }}>
                                    <Edit sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" onClick={() => handleDelete(slot)} sx={{ p: 0.5, color: '#ef4444' }}>
                                    <Delete sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {slot.roomNo && (
                                  <Chip
                                    icon={<Room sx={{ fontSize: '13px !important' }} />}
                                    label={slot.roomNo}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 22, bgcolor: 'rgba(0,0,0,0.05)' }}
                                  />
                                )}
                                {slot.sectionName && (
                                  <Chip
                                    label={slot.sectionName}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 22, bgcolor: 'rgba(0,0,0,0.05)' }}
                                  />
                                )}
                              </Box>
                              <Chip
                                label={slot.classType || 'Lecture'}
                                size="small"
                                sx={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  height: 22,
                                  bgcolor: `${slot.colorCode || COLORS.primary}15`,
                                  color: slot.colorCode || COLORS.primary,
                                }}
                              />
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Single Day Detailed View */
        (() => {
          const day = DAYS[activeTab - 1];
          const daySlots = slotsByDay[day] || [];
          return (
            <Card sx={{ borderRadius: 3.5, ...anim.fadeInUp(0.1) }}>
              <Box
                sx={{
                  p: 2.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: COLORS.textPrimary }}>
                    {DAY_LABELS[day]} Schedule
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {daySlots.length} class periods configured for this day
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenAdd(day)}
                  sx={{ background: COLORS.gradBlue, borderRadius: 2.5 }}
                >
                  Add Slot to {DAY_LABELS[day]}
                </Button>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {daySlots.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CalendarMonth sx={{ fontSize: 56, color: COLORS.textMuted, opacity: 0.4, mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" fontWeight={700}>
                      No Classes Scheduled for {DAY_LABELS[day]}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Add your lecture or practical lab hours for {DAY_LABELS[day]}.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleOpenAdd(day)}
                      sx={{ borderRadius: 2.5 }}
                    >
                      Schedule Class
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2.5}>
                    {daySlots.map((slot, i) => (
                      <Grid item xs={12} md={6} key={slot.id}>
                        <Paper
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: `1px solid ${COLORS.borderLight}`,
                            borderLeft: `6px solid ${slot.colorCode || COLORS.primary}`,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Chip
                              label={slot.periodName}
                              size="small"
                              sx={{
                                bgcolor: `${slot.colorCode || COLORS.primary}15`,
                                color: slot.colorCode || COLORS.primary,
                                fontWeight: 800,
                                fontSize: '0.75rem',
                              }}
                            />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleOpenEdit(slot)} sx={{ color: COLORS.textMuted }}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(slot)} sx={{ color: '#ef4444' }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.textPrimary, fontSize: '1.05rem', mb: 0.5 }}>
                            {slot.course?.courseCode} — {slot.course?.courseName}
                          </Typography>

                          <Grid container spacing={1.5} sx={{ my: 1 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                                <AccessTime sx={{ fontSize: 16, color: COLORS.primary }} />
                                <span>{slot.startTime} - {slot.endTime}</span>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                                <Room sx={{ fontSize: 16, color: '#f43f5e' }} />
                                <span>{slot.roomNo || 'Not specified'}</span>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                                <School sx={{ fontSize: 16, color: COLORS.excellent }} />
                                <span>Section: {slot.sectionName || 'All Students'}</span>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                                <Class sx={{ fontSize: 16, color: COLORS.accent }} />
                                <span>Type: {slot.classType || 'Lecture'}</span>
                              </Box>
                            </Grid>
                          </Grid>

                          <Divider sx={{ my: 1.5, borderColor: COLORS.borderLight }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                              size="small"
                              startIcon={<CalendarMonth sx={{ fontSize: 15 }} />}
                              onClick={() => navigate('/faculty/schedule')}
                              sx={{ fontSize: '0.78rem', textTransform: 'none', color: COLORS.primary }}
                            >
                              Log Topic Covered
                            </Button>
                            <Button
                              size="small"
                              endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                              onClick={() => navigate('/student/attendance')}
                              sx={{ fontSize: '0.78rem', textTransform: 'none', color: COLORS.secondary, fontWeight: 700 }}
                            >
                              Take Attendance
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          );
        })()
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !saving && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', pb: 1 }}>
          {editingSlot ? '✏️ Edit Class Slot' : '➕ Add Class Timetable Slot'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
            Assign course, day, time interval, room, and section for this class slot.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Course Selection or Manual Entry */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textMuted }}>
                  {manualCourseMode ? 'MANUAL SUBJECT ENTRY' : 'SELECT FROM REGISTERED COURSES'}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setManualCourseMode(p => !p)}
                  sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700 }}
                >
                  {manualCourseMode ? '← Pick from list' : '✍️ Enter Subject Manually'}
                </Button>
              </Box>

              {manualCourseMode ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Subject Code *"
                      placeholder="e.g. CS401"
                      value={manualCourseCode}
                      onChange={e => setManualCourseCode(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Subject Name *"
                      placeholder="e.g. Operating Systems"
                      value={manualCourseName}
                      onChange={e => setManualCourseName(e.target.value)}
                    />
                  </Grid>
                </Grid>
              ) : (
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Select Subject / Course *"
                  value={form.courseId}
                  onChange={e => setForm({ ...form, courseId: e.target.value })}
                  disabled={saving}
                >
                  {courses.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      <strong>{c.courseCode}</strong> — {c.courseName} ({c.creditHours || 3} Credits)
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>

            {/* Day of Week */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Day of Week *"
                value={form.dayOfWeek}
                onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
                disabled={saving}
              >
                {DAYS.map(d => (
                  <MenuItem key={d} value={d}>{DAY_LABELS[d]}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Predefined Time Slot Preset */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Period / Time Slot *"
                value={form.timeSlotIdx}
                onChange={e => handleTimeSlotChange(e.target.value)}
                disabled={saving}
              >
                {TIME_SLOTS.map((t, idx) => (
                  <MenuItem key={idx} value={idx}>
                    {t.period}: {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Custom Start / End Time if needed */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
                disabled={saving}
                helperText="e.g. 09:00 AM"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                disabled={saving}
                helperText="e.g. 10:00 AM"
              />
            </Grid>

            {/* Room / Hall */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room / Hall / Lab"
                placeholder="e.g. Lecture Hall 101, CS Lab 2"
                value={form.roomNo}
                onChange={e => setForm({ ...form, roomNo: e.target.value })}
                disabled={saving}
              />
            </Grid>

            {/* Section / Batch */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Section / Batch / Class"
                placeholder="e.g. CSE-A, 4th Sem Batch 1"
                value={form.sectionName}
                onChange={e => setForm({ ...form, sectionName: e.target.value })}
                disabled={saving}
              />
            </Grid>

            {/* Class Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Class Type"
                value={form.classType}
                onChange={e => setForm({ ...form, classType: e.target.value })}
                disabled={saving}
              >
                {CLASS_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Color Tag */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Color Label"
                value={form.colorCode}
                onChange={e => setForm({ ...form, colorCode: e.target.value })}
                disabled={saving}
              >
                {COLOR_OPTIONS.map(c => (
                  <MenuItem key={c.value} value={c.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.value }} />
                      <span>{c.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={saving} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ background: COLORS.gradBlue, borderRadius: 2.5, px: 3 }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (editingSlot ? 'Save Changes' : 'Schedule Slot')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

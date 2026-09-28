import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, CircularProgress
} from '@mui/material';
import { AccessTimeOutlined, Refresh, Add } from '@mui/icons-material';
import { timetableAPI, courseAPI } from '../../services/api';
import { subscribeToDataSync } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { toast } from 'react-toastify';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const TIME_OPTIONS = [
  { start: '09:00 AM', end: '10:00 AM', period: 'Period 1' },
  { start: '10:00 AM', end: '11:00 AM', period: 'Period 2' },
  { start: '11:15 AM', end: '12:15 PM', period: 'Period 3' },
  { start: '12:15 PM', end: '01:15 PM', period: 'Period 4' },
  { start: '02:00 PM', end: '03:00 PM', period: 'Period 5' },
  { start: '03:00 PM', end: '04:00 PM', period: 'Period 6' },
  { start: '04:00 PM', end: '05:00 PM', period: 'Period 7' }
];

export default function StudentClassRoutinePage() {
  const { user } = useAuth();
  const isAdminOrFaculty = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [slotForm, setSlotForm] = useState({
    courseId: '',
    dayOfWeek: 'MONDAY',
    periodIndex: 0,
    roomNo: 'LH-101',
    sectionName: 'Section A',
    classType: 'Lecture'
  });

  const loadData = () => {
    setLoading(true);
    timetableAPI.getMy()
      .then(res => setSlots(res.data?.data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    courseAPI.getAll()
      .then(res => setCourses(res.data?.data || []))
      .catch(() => {});
    window.addEventListener('focus', loadData);
    const unsub = subscribeToDataSync(() => {
      loadData();
    });
    return () => {
      window.removeEventListener('focus', loadData);
      unsub();
    };
  }, []);

  const handleOpenAdd = () => {
    setSlotForm({
      courseId: courses.length > 0 ? courses[0].id : '',
      dayOfWeek: 'MONDAY',
      periodIndex: 0,
      roomNo: 'LH-101',
      sectionName: 'Section A',
      classType: 'Lecture'
    });
    setOpenModal(true);
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!slotForm.courseId) {
      toast.warning('Please select a course');
      return;
    }

    const selectedTime = TIME_OPTIONS[slotForm.periodIndex] || TIME_OPTIONS[0];

    try {
      setSubmitting(true);
      await timetableAPI.addSlot({
        courseId: Number(slotForm.courseId),
        dayOfWeek: slotForm.dayOfWeek,
        startTime: selectedTime.start,
        endTime: selectedTime.end,
        periodName: selectedTime.period,
        roomNo: slotForm.roomNo.trim(),
        sectionName: slotForm.sectionName.trim(),
        classType: slotForm.classType,
        colorCode: '#2563eb'
      });

      toast.success('✅ Routine slot scheduled and synchronized to student timetable!');
      setOpenModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add timetable slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Class Routine & Weekly Timetable"
        subtitle="Daily lecture periods, lab sessions, room allotments, and instructor schedules"
        breadcrumbs={[{ label: 'Dashboard', path: '/student/dashboard' }, { label: 'Class Routine' }]}
        action={
          isAdminOrFaculty ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
              sx={{
                bgcolor: '#2563eb',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 1.5,
                boxShadow: 'none'
              }}
            >
              Add Routine Slot Manually
            </Button>
          ) : null
        }
      />

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Weekly Course Schedule</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh"><IconButton size="small" onClick={loadData}><Refresh fontSize="small" /></IconButton></Tooltip>
            {isAdminOrFaculty && (
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleOpenAdd} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Enter Slot
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : slots.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <AccessTimeOutlined sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No timetable slots assigned yet</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Weekly section routine will populate once semester courses are finalized.</Typography>
            {isAdminOrFaculty && (
              <Button variant="contained" size="small" startIcon={<Add />} onClick={handleOpenAdd} sx={{ mt: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}>
                Add First Class Slot Manually
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {slots.map((s, idx) => (
              <Box key={idx} sx={{ p: 2, borderRadius: 1.5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{s.course?.courseName || 'Lecture Class'}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#0284c7', fontWeight: 600 }}>{s.course?.courseCode} | Room: {s.roomNo || s.roomNumber || 'Main Block'} | {s.sectionName || 'Section A'}</Typography>
                </Box>
                <Chip label={`${s.dayOfWeek} (${s.startTime} - ${s.endTime}) • ${s.periodName || 'Period'}`} size="small" sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#1d4ed8' }} />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Manual Slot Creation Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSlot}>
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>
            Add Timetable Slot Manually
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Course / Subject"
                  required
                  value={slotForm.courseId}
                  onChange={e => setSlotForm({ ...slotForm, courseId: e.target.value })}
                >
                  {courses.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.courseCode} - {c.courseName}
                    </MenuItem>
                  ))}
                  {courses.length === 0 && (
                    <MenuItem value="" disabled>No courses available</MenuItem>
                  )}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Day of Week"
                  value={slotForm.dayOfWeek}
                  onChange={e => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                >
                  {DAYS.map(d => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Time Slot & Period"
                  value={slotForm.periodIndex}
                  onChange={e => setSlotForm({ ...slotForm, periodIndex: Number(e.target.value) })}
                >
                  {TIME_OPTIONS.map((t, idx) => (
                    <MenuItem key={idx} value={idx}>{t.period}: {t.start} - {t.end}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Section"
                  value={slotForm.sectionName}
                  onChange={e => setSlotForm({ ...slotForm, sectionName: e.target.value })}
                  placeholder="e.g. Section A"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Room Number"
                  value={slotForm.roomNo}
                  onChange={e => setSlotForm({ ...slotForm, roomNo: e.target.value })}
                  placeholder="e.g. LH-101"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Class Type"
                  value={slotForm.classType}
                  onChange={e => setSlotForm({ ...slotForm, classType: e.target.value })}
                >
                  <MenuItem value="Lecture">Lecture</MenuItem>
                  <MenuItem value="Lab">Lab Session</MenuItem>
                  <MenuItem value="Tutorial">Tutorial</MenuItem>
                  <MenuItem value="Seminar">Seminar</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700 }}
            >
              {submitting ? 'Adding...' : 'Save Routine Slot'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

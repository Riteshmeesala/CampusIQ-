import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, CircularProgress
} from '@mui/material';
import { AccessTimeOutlined, Refresh, Add } from '@mui/icons-material';
import { examAPI, courseAPI } from '../../services/api';
import { subscribeToDataSync } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { toast } from 'react-toastify';

export default function StudentExamRoutinePage() {
  const { user } = useAuth();
  const isAdminOrFaculty = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    examName: '',
    courseId: '',
    scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    durationMinutes: 180,
    totalMarks: 100,
    passingMarks: 40,
    venue: 'Exam Hall 1A',
    examType: 'MID_SEM',
    semester: 4,
    description: 'Manual examination schedule entry'
  });

  const loadExams = () => {
    setLoading(true);
    examAPI.getAll()
      .then(res => setExams(res.data?.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExams();
    courseAPI.getAll()
      .then(res => setCourses(res.data?.data || []))
      .catch(() => {});
    window.addEventListener('focus', loadExams);
    const unsub = subscribeToDataSync(() => {
      loadExams();
    });
    return () => {
      window.removeEventListener('focus', loadExams);
      unsub();
    };
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      examName: '',
      courseId: courses.length > 0 ? courses[0].id : '',
      scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      durationMinutes: 180,
      totalMarks: 100,
      passingMarks: 40,
      venue: 'Exam Hall 1A',
      examType: 'MID_SEM',
      semester: 4,
      description: 'Manual examination schedule entry'
    });
    setOpenModal(true);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!formData.examName.trim() || !formData.courseId) {
      toast.warning('Please enter Exam Name and select a Course');
      return;
    }

    try {
      setSubmitting(true);
      await examAPI.createExam({
        examName: formData.examName.trim(),
        courseId: Number(formData.courseId),
        scheduledDate: formData.scheduledDate,
        durationMinutes: Number(formData.durationMinutes),
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        venue: formData.venue.trim(),
        examType: formData.examType,
        semester: Number(formData.semester),
        description: formData.description
      });

      toast.success(`✅ Exam "${formData.examName}" scheduled and published to all students!`);
      setOpenModal(false);
      loadExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Examination Routine & Timetable"
        subtitle="Detailed schedule for internal mid terms, lab evaluations, and final university examinations"
        breadcrumbs={[{ label: 'Dashboard', path: '/student/dashboard' }, { label: 'Exam Routine' }]}
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
              Schedule Exam Manually
            </Button>
          ) : null
        }
      />

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Exam Schedule Table</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Refresh"><IconButton size="small" onClick={loadExams}><Refresh fontSize="small" /></IconButton></Tooltip>
            {isAdminOrFaculty && (
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleOpenAdd} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Enter Exam
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : exams.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <AccessTimeOutlined sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No exam routine published yet</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Session timetable and hall allotment will appear once exams are finalized.</Typography>
            {isAdminOrFaculty && (
              <Button variant="contained" size="small" startIcon={<Add />} onClick={handleOpenAdd} sx={{ mt: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}>
                Schedule First Exam Manually
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Exam Name</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Course</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Date & Time</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Venue</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{e.examName}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0369a1' }}>{e.course?.courseCode} - {e.course?.courseName}</td>
                    <td style={{ padding: '10px 12px' }}><Chip label={e.examType} size="small" /></td>
                    <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 600 }}>{e.scheduledDate ? new Date(e.scheduledDate).toLocaleString() : e.examDate || 'TBD'}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{e.venue || 'Main Hall'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{e.totalMarks || 100}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Box>

      {/* Manual Exam Creation Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateExam}>
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>
            Schedule Examination Manually
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Exam Name"
                  required
                  placeholder="e.g. Mid-Term 1 Assessment"
                  value={formData.examName}
                  onChange={e => setFormData({ ...formData, examName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Course / Subject"
                  required
                  value={formData.courseId}
                  onChange={e => setFormData({ ...formData, courseId: e.target.value })}
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
                  label="Exam Type"
                  value={formData.examType}
                  onChange={e => setFormData({ ...formData, examType: e.target.value })}
                >
                  <MenuItem value="MID_SEM">Mid-Semester Exam</MenuItem>
                  <MenuItem value="SEMESTER">Semester Final Exam</MenuItem>
                  <MenuItem value="LAB_VIVA">Lab / Practical Exam</MenuItem>
                  <MenuItem value="QUIZ">Quiz / Internal Test</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date & Time"
                  type="datetime-local"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.scheduledDate}
                  onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Duration (Minutes)"
                  type="number"
                  required
                  value={formData.durationMinutes}
                  onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total Marks"
                  type="number"
                  required
                  value={formData.totalMarks}
                  onChange={e => setFormData({ ...formData, totalMarks: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Passing Marks"
                  type="number"
                  required
                  value={formData.passingMarks}
                  onChange={e => setFormData({ ...formData, passingMarks: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Semester"
                  type="number"
                  inputProps={{ min: 1, max: 8 }}
                  value={formData.semester}
                  onChange={e => setFormData({ ...formData, semester: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Venue / Hall Number"
                  placeholder="e.g. Exam Hall 3B, Main Block"
                  value={formData.venue}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
                />
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
              {submitting ? 'Scheduling...' : 'Save Exam Schedule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

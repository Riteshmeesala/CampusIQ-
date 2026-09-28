import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Box, Card, CardContent, Typography, Chip, Divider,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip
} from '@mui/material';
import {
  School, Event, AccessTime, LocationOn, Add, Delete,
  Close, Refresh, Edit, AssignmentTurnedIn
} from '@mui/icons-material';
import { examAPI, courseAPI, resultAPI, userAPI } from '../../services/api';
import { updateSharedStudentCgpa, broadcastDataChange, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { anim, shimmerBg } from '../../theme/animations';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const EXAM_TYPES = ['MID_SEM', 'END_SEM', 'QUIZ', 'LAB', 'ASSIGNMENT'];
const TYPE_COLOR = {
  MID_SEM:    { color: COLORS.secondary, bg: '#dbeafe' },
  END_SEM:    { color: '#dc2626',         bg: '#fee2e2' },
  QUIZ:       { color: COLORS.excellent,  bg: '#dcfce7' },
  LAB:        { color: '#d97706',         bg: '#fef9c3' },
  ASSIGNMENT: { color: '#7c3aed',         bg: '#f5f3ff' },
};
const tc = (type) => TYPE_COLOR[type] || { color: COLORS.secondary, bg: '#dbeafe' };

// ── Create Exam Dialog ────────────────────────────────────────────────────────
function CreateExamDialog({ open, onClose, onCreated }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    examName: '', courseId: '', scheduledDate: '',
    durationMinutes: 120, totalMarks: 100, passingMarks: 40,
    venue: '', examType: 'MID_SEM', semester: 4,
  });
  const [manualCourse, setManualCourse] = useState(false);
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      examName: '', courseId: '', scheduledDate: '',
      durationMinutes: 120, totalMarks: 100, passingMarks: 40,
      venue: '', examType: 'MID_SEM', semester: 4,
    });
    setManualCourse(false);
    setCustomCourseCode('');
    setCustomCourseName('');
    courseAPI.getAll()
      .then(r => {
        const list = r.data?.data || [];
        setCourses(list);
        if (list.length === 0) setManualCourse(true);
      })
      .catch(() => {
        setManualCourse(true);
      });
  }, [open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.examName.trim()) { toast.warning('Enter exam name'); return; }
    if (!form.scheduledDate)   { toast.warning('Select exam date & time'); return; }
    if (Number(form.passingMarks) > Number(form.totalMarks)) {
      toast.warning('Passing marks cannot exceed total marks'); return;
    }

    setSaving(true);
    let targetCourseId = form.courseId;

    if (manualCourse || !targetCourseId) {
      if (!customCourseCode.trim() || !customCourseName.trim()) {
        toast.warning('Please enter Course Code and Course Title manually');
        setSaving(false);
        return;
      }
      try {
        const cRes = await courseAPI.create({
          courseCode: customCourseCode.trim().toUpperCase(),
          courseName: customCourseName.trim(),
          credits: 4,
          department: 'Computer Science'
        });
        targetCourseId = cRes.data?.data?.id;
      } catch (err) {
        const existing = courses.find(c => c.courseCode?.toLowerCase() === customCourseCode.trim().toLowerCase());
        if (existing) {
          targetCourseId = existing.id;
        } else {
          toast.error('Could not register manual course: ' + (err.response?.data?.message || err.message));
          setSaving(false);
          return;
        }
      }
    }

    try {
      await examAPI.createExam({
        examName:        form.examName.trim(),
        courseId:        Number(targetCourseId),
        scheduledDate:   form.scheduledDate,
        durationMinutes: Number(form.durationMinutes),
        totalMarks:      Number(form.totalMarks),
        passingMarks:    Number(form.passingMarks),
        venue:           form.venue.trim() || null,
        examType:        form.examType,
        semester:        Number(form.semester),
      });
      toast.success('✅ Exam created and scheduled successfully!');
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{
        fontWeight: 800, borderBottom: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        📅 Schedule New Exam
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>
          {/* Exam name */}
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Exam Name *"
              value={form.examName} onChange={e => set('examName', e.target.value)}
              placeholder="e.g. CS401 Mid-Semester Exam" />
          </Grid>

          {/* Course Selection or Manual Course Input */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textMuted }}>
                {manualCourse ? 'MANUAL COURSE ENTRY' : 'SELECT FROM REGISTERED COURSES'}
              </Typography>
              <Button
                size="small"
                onClick={() => setManualCourse(p => !p)}
                sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700 }}
              >
                {manualCourse ? '← Pick from list' : '✍️ Enter Course Manually'}
              </Button>
            </Box>

            {manualCourse ? (
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Course Code *"
                    placeholder="e.g. CS401"
                    value={customCourseCode}
                    onChange={e => setCustomCourseCode(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Course Title *"
                    placeholder="e.g. Operating Systems"
                    value={customCourseName}
                    onChange={e => setCustomCourseName(e.target.value)}
                  />
                </Grid>
              </Grid>
            ) : (
              <TextField select fullWidth size="small" label="Course *"
                value={form.courseId} onChange={e => set('courseId', e.target.value)}>
                <MenuItem value="">— Select Course —</MenuItem>
                {courses.map(c => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    <strong>{c.courseCode}</strong>&nbsp;— {c.courseName}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>

          {/* Exam type */}
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size="small" label="Exam Type"
              value={form.examType} onChange={e => set('examType', e.target.value)}>
              {EXAM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Date & time */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Date & Time *" type="datetime-local"
              value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)}
              InputLabelProps={{ shrink: true }} />
          </Grid>

          {/* Duration */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Duration (minutes)" type="number"
              value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)}
              inputProps={{ min: 15, max: 300 }} />
          </Grid>

          {/* Total marks */}
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Total Marks *" type="number"
              value={form.totalMarks} onChange={e => set('totalMarks', e.target.value)}
              inputProps={{ min: 1 }} />
          </Grid>

          {/* Passing marks */}
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Passing Marks *" type="number"
              value={form.passingMarks} onChange={e => set('passingMarks', e.target.value)}
              inputProps={{ min: 1 }} />
          </Grid>

          {/* Semester */}
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Semester" type="number"
              value={form.semester} onChange={e => set('semester', e.target.value)}
              inputProps={{ min: 1, max: 8 }} />
          </Grid>

          {/* Venue */}
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Venue (optional)"
              value={form.venue} onChange={e => set('venue', e.target.value)}
              placeholder="e.g. Exam Hall A, Room 201" />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9', gap: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, color: '#64748b' }}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Add />}
          sx={{ borderRadius: 2, px: 3, bgcolor: COLORS.primary }}>
          {saving ? 'Creating…' : 'Create Exam'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Enter Marks Manually Dialog ──────────────────────────────────────────────
function EnterMarksDialog({ open, onClose, exams, onSubmitted }) {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    examId: '',
    studentRoll: '',
    marksObtained: '',
    remarks: 'Manual marks entry'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      userAPI.getStudents().then(r => setStudents(r.data?.data || [])).catch(() => {});
      if (exams?.length > 0 && !form.examId) {
        setForm(p => ({ ...p, examId: String(exams[0].id) }));
      }
    }
  }, [open, exams]);

  const handleSubmit = async () => {
    if (!form.examId || !form.studentRoll.trim() || form.marksObtained === '') {
      toast.warning('Please select Exam, Student Roll Number, and Marks');
      return;
    }
    const matched = students.find(s => s.enrollmentNumber?.toLowerCase() === form.studentRoll.trim().toLowerCase() || String(s.id) === form.studentRoll.trim());
    const studentId = matched ? matched.id : Number(form.studentRoll.trim());
    if (!studentId || isNaN(studentId)) {
      toast.warning('Invalid Student Roll Number or ID');
      return;
    }

    setSaving(true);
    try {
      const selectedExam = exams.find(e => String(e.id) === String(form.examId));
      await resultAPI.publishResults({
        examId: Number(form.examId),
        examType: selectedExam?.examType || 'MID_SEM',
        studentMarks: { [studentId]: Number(form.marksObtained) },
        remarks: form.remarks
      });

      const gpa = Number(form.marksObtained) / 10;
      updateSharedStudentCgpa(studentId, gpa, selectedExam?.semester || 4, form.remarks);
      broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, { examId: form.examId, studentId });

      toast.success(`✅ Marks for ${form.studentRoll} saved and synced to student profile!`);
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit student marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        📝 Enter Student Marks Manually
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '15px !important' }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Select Exam *"
          value={form.examId}
          onChange={e => setForm(p => ({ ...p, examId: e.target.value }))}
        >
          {exams.map(e => (
            <MenuItem key={e.id} value={String(e.id)}>
              {e.examName} ({e.examType})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          size="small"
          label="Student Roll No / ID *"
          placeholder="e.g. 24CS001"
          value={form.studentRoll}
          onChange={e => setForm(p => ({ ...p, studentRoll: e.target.value }))}
        />
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Marks Obtained *"
          placeholder="e.g. 88"
          value={form.marksObtained}
          onChange={e => setForm(p => ({ ...p, marksObtained: e.target.value }))}
        />
        <TextField
          fullWidth
          size="small"
          label="Remarks / Evaluation Note"
          value={form.remarks}
          onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ bgcolor: COLORS.primary }}>
          {saving ? 'Saving...' : 'Save Marks'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ExamPage() {
  const { user }        = useAuth();
  const isStaff         = user?.role === 'FACULTY' || user?.role === 'ADMIN';
  const [exams,         setExams]      = useState([]);
  const [loading,       setLoading]    = useState(true);
  const [filter,        setFilter]     = useState('');
  const [createOpen,    setCreateOpen] = useState(false);
  const [marksOpen,     setMarksOpen]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    // Students see upcoming only; staff see all
    const req = isStaff ? examAPI.getAllExams() : examAPI.getUpcoming();
    req
      .then(r => setExams(r.data?.data || []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, [isStaff]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await examAPI.deleteExam(id);
      toast.success('Exam deleted');
      load();
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const filterLower = filter.toLowerCase();
  const filtered = exams.filter(e =>
    !filter ||
    e.examName?.toLowerCase().includes(filterLower) ||
    e.course?.courseName?.toLowerCase().includes(filterLower) ||
    e.course?.courseCode?.toLowerCase().includes(filterLower) ||
    (e.examType || '').toLowerCase().includes(filterLower)
  );

  // Next 7-day exams
  const upcoming7 = exams.filter(e => {
    const d = dayjs(e.scheduledDate);
    return d.isAfter(dayjs()) && d.isBefore(dayjs().add(7, 'day'));
  });

  return (
    <Box>
      <PageHeader
        title="Exam Schedule"
        subtitle={isStaff ? 'Manage and schedule exams' : 'View upcoming exams'}
        breadcrumbs={['Home', 'Exams']}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isStaff && (
              <>
                <Button variant="contained" startIcon={<Add />}
                  onClick={() => setCreateOpen(true)}
                  sx={{ borderRadius: 2, bgcolor: COLORS.primary, fontSize: 12 }}>
                  Schedule Exam
                </Button>
                <Button variant="outlined" startIcon={<Edit />}
                  onClick={() => setMarksOpen(true)}
                  sx={{ borderRadius: 2, fontSize: 12, textTransform: 'none', fontWeight: 700 }}>
                  📝 Enter Marks Manually
                </Button>
              </>
            )}
            <Tooltip title="Refresh">
              <IconButton onClick={load} size="small"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      {/* Upcoming 7-day alert cards */}
      {upcoming7.length > 0 && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          📅 <strong>{upcoming7.length}</strong> exam{upcoming7.length > 1 ? 's' : ''} in the next 7 days — stay prepared!
        </Alert>
      )}

      {upcoming7.length > 0 && (
        <>
          <Typography variant="h6" fontWeight={700} mb={1.5}>⚡ Next 7 Days</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {upcoming7.map(e => {
              const col = tc(e.examType);
              const daysLeft = dayjs(e.scheduledDate).diff(dayjs(), 'day');
              return (
                <Grid item xs={12} sm={6} md={4} key={e.id}>
                  <Card elevation={0}
                    sx={{ border: `2px solid ${col.color}40`, borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Chip label={e.examType || 'EXAM'} size="small"
                          sx={{ bgcolor: col.bg, color: col.color, fontWeight: 700, fontSize: 11 }} />
                        <Chip
                          label={daysLeft === 0 ? '🔴 TODAY' : `${daysLeft}d left`}
                          size="small"
                          sx={{
                            bgcolor: daysLeft === 0 ? '#fee2e2' : daysLeft <= 3 ? '#fef9c3' : '#f1f5f9',
                            color:   daysLeft === 0 ? '#dc2626' : daysLeft <= 3 ? '#92400e' : '#64748b',
                            fontWeight: 700, fontSize: 11,
                          }}
                        />
                      </Box>
                      <Typography fontWeight={700} mb={0.3}>
                        {e.course?.courseName || e.examName}
                      </Typography>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                        {e.course?.courseCode}
                      </Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Event sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(e.scheduledDate).format('DD MMM')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(e.scheduledDate).format('HH:mm')}
                          </Typography>
                        </Box>
                        {e.venue && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 13, color: '#94a3b8' }} />
                            <Typography variant="caption" color="text.secondary">{e.venue}</Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Full table */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={700} flex={1}>
            {isStaff ? 'All Exams' : 'Upcoming Exams'}
            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
              ({filtered.length})
            </Typography>
          </Typography>
          <TextField size="small" placeholder="Search by name, course, type…"
            value={filter} onChange={e => setFilter(e.target.value)}
            sx={{ width: 230, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={32} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Exam Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Venue</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {isStaff && <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      <School sx={{ fontSize: 40, mb: 1, display: 'block', mx: 'auto' }} />
                      No exams found
                    </TableCell>
                  </TableRow>
                ) : filtered.map(e => {
                  const col  = tc(e.examType);
                  const past = dayjs(e.scheduledDate).isBefore(dayjs());
                  return (
                    <TableRow key={e.id} hover sx={{ opacity: past ? 0.75 : 1 }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {e.course?.courseName || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {e.course?.courseCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{e.examName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={e.examType || 'EXAM'} size="small"
                          sx={{ bgcolor: col.bg, color: col.color, fontWeight: 700, fontSize: 10 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {dayjs(e.scheduledDate).format('DD MMM YYYY')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(e.scheduledDate).format('HH:mm')}
                          {e.durationMinutes ? ` · ${e.durationMinutes} min` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{e.venue || '—'}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>{e.totalMarks}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pass: {e.passingMarks}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.status || 'SCHEDULED'} size="small"
                          sx={{
                            bgcolor: e.status === 'COMPLETED' ? '#dcfce7'
                                   : e.status === 'ONGOING'   ? '#fef9c3'
                                   : e.status === 'CANCELLED' ? '#fee2e2'
                                   : '#dbeafe',
                            color:   e.status === 'COMPLETED' ? '#15803d'
                                   : e.status === 'ONGOING'   ? '#92400e'
                                   : e.status === 'CANCELLED' ? '#dc2626'
                                   : '#1d4ed8',
                            fontWeight: 700, fontSize: 10,
                          }}
                        />
                      </TableCell>
                      {isStaff && (
                        <TableCell>
                          <Tooltip title="Delete exam">
                            <IconButton size="small" onClick={() => handleDelete(e.id)}
                              sx={{ color: '#dc2626' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create dialog */}
      <CreateExamDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      {/* Manual Marks Entry Dialog */}
      <EnterMarksDialog
        open={marksOpen}
        onClose={() => setMarksOpen(false)}
        exams={exams}
        onSubmitted={load}
      />
    </Box>
  );
}
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton,
  CircularProgress, Alert, Tooltip, InputAdornment, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, MenuBook, School, Search, AccessTime,
  CalendarMonth, Group, Class, ArrowForward, CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseAPI, userAPI } from '../../services/api';
import { broadcastDataChange, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import { COLORS } from '../../theme/theme';
import { anim } from '../../theme/animations';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electrical & Electronics',
  'Mechanical Engineering', 'Civil Engineering', 'Mathematics',
  'Physics', 'Humanities', 'General'
];

export default function FacultyCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    creditHours: 3,
    department: user?.department || 'Computer Science',
  });

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await courseAPI.getAll();
      setCourses(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    window.addEventListener('focus', loadCourses);
    const unsub = subscribeToDataSync((event) => {
      if (event.type === DATA_SYNC_EVENTS.COURSE_UPDATED || event.type === 'CAMPUSIQ_DATA_MUTATED') {
        loadCourses();
      }
    });
    return () => {
      window.removeEventListener('focus', loadCourses);
      unsub();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setForm({
      courseCode: '',
      courseName: '',
      description: '',
      creditHours: 3,
      department: user?.department || 'Computer Science',
    });
    setError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setForm({
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description || '',
      creditHours: course.creditHours || 3,
      department: course.department || user?.department || 'Computer Science',
    });
    setError('');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.courseCode.trim() || !form.courseName.trim()) {
      setError('Course code and Course name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingCourse) {
        await courseAPI.update(editingCourse.id, form);
        setSuccess(`Course ${form.courseCode} updated successfully!`);
      } else {
        await courseAPI.create(form);
        setSuccess(`Course ${form.courseCode} added successfully!`);
      }
      broadcastDataChange(DATA_SYNC_EVENTS.COURSE_UPDATED, { form });
      setOpenDialog(false);
      await loadCourses();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Are you sure you want to delete subject "${course.courseName}" (${course.courseCode})?`)) {
      return;
    }
    try {
      await courseAPI.delete(course.id);
      broadcastDataChange(DATA_SYNC_EVENTS.COURSE_UPDATED, { deletedId: course.id });
      setSuccess(`Course ${course.courseCode} removed`);
      await loadCourses();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete course');
    }
  };

  // Filtered courses
  const myCourses = courses.filter(c => c.faculty?.id === user?.id || !c.faculty);
  const otherCourses = courses.filter(c => c.faculty && c.faculty?.id !== user?.id);

  const displayedCourses = courses.filter(c => {
    const matchesSearch =
      c.courseName.toLowerCase().includes(search.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = filterDept === 'ALL' || c.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const totalCredits = myCourses.reduce((sum, c) => sum + (c.creditHours || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Subject & Course Management"
        subtitle="Manage assigned subjects, configure syllabus outcomes, and add new courses"
        breadcrumbs={['Home', 'Faculty', 'Subjects']}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
            sx={{
              background: COLORS.gradBlue,
              borderRadius: 3,
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            Add New Subject
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

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { icon: <MenuBook />, label: 'My Subjects', value: myCourses.length, color: COLORS.primary },
          { icon: <School />, label: 'Total Credits Taught', value: `${totalCredits} Credits`, color: COLORS.secondary },
          { icon: <Class />, label: 'All Campus Courses', value: courses.length, color: COLORS.excellent },
          { icon: <Group />, label: 'Department', value: user?.department || 'Engineering', color: COLORS.accent },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <StatCard {...stat} index={i} />
          </Grid>
        ))}
      </Grid>

      {/* Cross-Department Teaching Guide Alert */}
      <Alert
        severity="info"
        icon={<School sx={{ color: COLORS.secondary }} />}
        sx={{
          mb: 3,
          borderRadius: 0.5,
          bgcolor: '#eff6ff',
          border: '1px solid #bfdbfe',
          '& .MuiAlert-message': { fontSize: '0.8125rem', color: '#1e40af' },
        }}
      >
        <strong>Faculty Department Scope:</strong> Registered with <strong>{user?.department || 'Department of Engineering'}</strong>. You are authorized to administer courses within your primary department and designated cross-departmental branches.
      </Alert>

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3, borderRadius: 3, ...anim.fadeInUp(0.1) }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search subject by code, title, or syllabus keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                select
                size="small"
                label="Department Filter"
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
              >
                <MenuItem value="ALL">All Departments</MenuItem>
                {DEPARTMENTS.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: COLORS.primary }} />
        </Box>
      ) : displayedCourses.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
          <CardContent>
            <MenuBook sx={{ fontSize: 64, color: COLORS.textMuted, opacity: 0.4, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="textSecondary" gutterBottom>
              No Subjects Found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {search ? 'Try adjusting your search filters' : 'Get started by creating your first subject!'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
              sx={{ background: COLORS.gradBlue, borderRadius: 2.5 }}
            >
              Add Subject Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {displayedCourses.map((c, idx) => {
            const isMine = c.faculty?.id === user?.id || (!c.faculty && user?.role === 'FACULTY');
            return (
              <Grid item xs={12} md={6} lg={4} key={c.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3.5,
                    border: `1px solid ${isMine ? `${COLORS.secondary}30` : COLORS.borderLight}`,
                    background: isMine
                      ? 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)'
                      : '#ffffff',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -6px rgba(0,0,0,0.08)',
                      borderColor: COLORS.secondary,
                    },
                    ...anim.fadeInUp(0.15 + (idx % 6) * 0.05),
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Top Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip
                        label={c.courseCode}
                        size="small"
                        sx={{
                          bgcolor: `${COLORS.secondary}15`,
                          color: COLORS.secondary,
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          borderRadius: 2,
                          letterSpacing: '0.04em',
                          px: 0.5,
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={`${c.creditHours || 3} Credits`}
                          size="small"
                          sx={{
                            bgcolor: `${COLORS.primary}10`,
                            color: COLORS.primary,
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            borderRadius: 1.5,
                          }}
                        />
                        <Tooltip title="Edit Subject">
                          <IconButton size="small" onClick={() => handleOpenEdit(c)} sx={{ color: COLORS.textMuted }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isMine && (
                          <Tooltip title="Delete Subject">
                            <IconButton size="small" onClick={() => handleDelete(c)} sx={{ color: '#ef4444' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Course Title */}
                    <Typography variant="h6" fontWeight={700} sx={{ color: COLORS.textPrimary, mb: 1, fontSize: '1.05rem', lineHeight: 1.3 }}>
                      {c.courseName}
                    </Typography>

                    {/* Department */}
                    <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600, display: 'block', mb: 1.5 }}>
                      🏛️ {c.department || 'General'}
                    </Typography>

                    {/* Description / Syllabus */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.textSecondary,
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        mb: 2,
                        minHeight: 40,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.description || 'No detailed syllabus outline provided yet.'}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: COLORS.borderLight }} />

                    {/* Faculty In Charge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                        Instructor: <strong>{c.faculty?.name || user?.name || 'Unassigned'}</strong>
                      </Typography>
                      {isMine && (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#10b981' }} />}
                          label="Your Subject"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(16,185,129,0.1)',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  {/* Actions footer */}
                  <Box
                    sx={{
                      p: 1.5,
                      px: 2.5,
                      bgcolor: 'rgba(0,0,0,0.015)',
                      borderTop: `1px solid ${COLORS.borderLight}`,
                      display: 'flex',
                      gap: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
                      onClick={() => navigate('/faculty/schedule')}
                      sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.primary, textTransform: 'none' }}
                    >
                      Log Topic
                    </Button>
                    <Button
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                      onClick={() => navigate('/student/attendance')}
                      sx={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.secondary, textTransform: 'none' }}
                    >
                      Take Attendance
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
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
          {editingCourse ? '✏️ Edit Subject' : '➕ Add New Subject'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
            Configure the course code, title, credit hours, and syllabus outcomes.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Course Code *"
                placeholder="e.g. CS501"
                value={form.courseCode}
                onChange={e => setForm({ ...form, courseCode: e.target.value.toUpperCase() })}
                disabled={saving || !!editingCourse}
                helperText={editingCourse ? 'Course code is permanent' : 'e.g. CS401, EC302'}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Course Title *"
                placeholder="e.g. Advanced Distributed Systems"
                value={form.courseName}
                onChange={e => setForm({ ...form, courseName: e.target.value })}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Credit Hours"
                value={form.creditHours}
                onChange={e => setForm({ ...form, creditHours: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 10 }}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Department"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                disabled={saving}
              >
                {DEPARTMENTS.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Syllabus & Course Description"
                placeholder="Key topics, prerequisites, module overview, and learning outcomes..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                disabled={saving}
              />
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
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (editingCourse ? 'Save Changes' : 'Create Subject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

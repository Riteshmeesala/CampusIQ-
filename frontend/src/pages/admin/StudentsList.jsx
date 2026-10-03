import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, IconButton,
  TextField, InputAdornment, CircularProgress, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Tooltip, MenuItem,
  Paper, Divider
} from '@mui/material';
import {
  Search, Visibility, PersonAdd, Edit, Delete, School,
  AddCircleOutline, GroupAdd, Add, DeleteOutline, FileUpload, CheckCircle,
  FileDownload, VerifiedUser
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { userAPI } from '../../services/api';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { anim } from '../../theme/animations';
import { toast } from 'react-toastify';

const INITIAL_DEPTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics',
  'Mathematics',
  'Physics',
  'Humanities & Sciences'
];

const STANDARD_SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D', 'Batch 1', 'Batch 2'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SEMESTER_CODES = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const BLANK = {
  username: '',
  name: '',
  email: '',
  password: 'campusiq@1234',
  phoneNumber: '',
  department: 'Computer Science',
  customDepartment: '',
  section: 'Section A',
  customSection: '',
  semester: 4,
  enrollmentNumber: '',
};

const createEmptyStudentRow = (idx) => ({
  id: Date.now() + Math.random(),
  name: '',
  enrollmentNumber: '',
  email: '',
  department: 'Computer Science',
  year: '1st Year',
  semester: '1-1',
  username: '',
  password: 'campusiq@1234',
  section: 'Section A',
  phoneNumber: '',
});

export default function StudentsList() {
  const navigate = useNavigate();
  const [students,       setStudents]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [search,         setSearch]         = useState('');
  const [deptFilter,     setDeptFilter]     = useState('ALL');
  const [sectionFilter,  setSectionFilter]  = useState('ALL');
  const [deptOptions,    setDeptOptions]    = useState(INITIAL_DEPTS);

  // Dialog States
  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [editForm, setEditForm] = useState({});
  const [editId,   setEditId]   = useState(null);

  // Bulk Student Creation State
  const [bulkRows,   setBulkRows]   = useState([
    createEmptyStudentRow(1),
    createEmptyStudentRow(2),
    createEmptyStudentRow(3),
  ]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [csvText,    setCsvText]    = useState('');
  const [showCsvBox, setShowCsvBox] = useState(false);

  const load = () => {
    setLoading(true);
    userAPI.getStudents()
      .then(r => {
        const list = r.data.data || [];
        setStudents(list);
        // Discover any custom departments from existing students
        const discovered = new Set(INITIAL_DEPTS);
        list.forEach(s => {
          if (s.department && !discovered.has(s.department)) {
            discovered.add(s.department);
          }
        });
        setDeptOptions(Array.from(discovered));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  // Filtered list
  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch =
        (s.name || '').toLowerCase().includes(q) ||
        (s.enrollmentNumber || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        (s.section || '').toLowerCase().includes(q);

      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      const matchesSec  = sectionFilter === 'ALL' || s.section === sectionFilter;

      return matchesSearch && matchesDept && matchesSec;
    });
  }, [students, search, deptFilter, sectionFilter]);

  const handleBulkRowChange = (id, field, value) => {
    setBulkRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      // Auto-suggest username if name changes and username is empty/auto
      if (field === 'name' && (!row.username || row.username === row.name?.toLowerCase().replace(/\s+/g, ''))) {
        updated.username = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      // Auto-suggest email if username/name changes and email was auto
      if (field === 'username' && (!row.email || row.email.endsWith('@campus.edu'))) {
        updated.email = `${value.toLowerCase().replace(/[^a-z0-9]/g, '')}@campus.edu`;
      }
      return updated;
    }));
  };

  const handleAddBulkRow = () => {
    setBulkRows(prev => [...prev, createEmptyStudentRow(prev.length + 1)]);
  };

  const handleRemoveBulkRow = (id) => {
    if (bulkRows.length <= 1) {
      toast.info('At least one student row is required');
      return;
    }
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) {
      toast.warning('Please paste CSV text first');
      return;
    }
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length >= 3) {
        // Format: Name, EnrollmentNumber, Email, Department, Year, Semester, Username, Password
        const name = parts[0] || '';
        const enroll = parts[1] || '';
        const email = parts[2] || '';
        const dept = parts[3] || 'Computer Science';
        const year = parts[4] || '1st Year';
        const sem = parts[5] || '1-1';
        const user = parts[6] || name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pass = parts[7] || 'campusiq@1234';

        parsed.push({
          id: Date.now() + Math.random() + i,
          name,
          enrollmentNumber: enroll,
          email,
          department: dept,
          year,
          semester: sem,
          username: user,
          password: pass,
          section: 'Section A',
          phoneNumber: '',
        });
      }
    }
    if (parsed.length > 0) {
      setBulkRows(parsed);
      setCsvText('');
      setShowCsvBox(false);
      toast.success(`Imported ${parsed.length} student rows from CSV`);
    } else {
      toast.error('Could not parse valid student rows. Ensure comma-separated format: Name, EnrollmentNumber, Email, Department, Year, Semester, Username, Password');
    }
  };

  const handleBulkSubmit = async () => {
    // 1. Client-side duplicate check
    const usernames = new Set();
    const emails = new Set();
    const enrollments = new Set();
    const payload = [];

    for (let i = 0; i < bulkRows.length; i++) {
      const r = bulkRows[i];
      const rowNum = i + 1;
      const name = (r.name || '').trim();
      const username = (r.username || '').trim();
      const email = (r.email || '').trim();
      const enroll = (r.enrollmentNumber || '').trim();

      if (!name || !username || !email) {
        toast.warning(`Row #${rowNum}: Name, Username, and Email are required`);
        return;
      }

      if (usernames.has(username.toLowerCase())) {
        toast.error(`Duplicate username '${username}' at row #${rowNum}`);
        return;
      }
      usernames.add(username.toLowerCase());

      if (emails.has(email.toLowerCase())) {
        toast.error(`Duplicate email '${email}' at row #${rowNum}`);
        return;
      }
      emails.add(email.toLowerCase());

      if (enroll && enrollments.has(enroll.toLowerCase())) {
        toast.error(`Duplicate enrollment number '${enroll}' at row #${rowNum}`);
        return;
      }
      if (enroll) enrollments.add(enroll.toLowerCase());

      payload.push({
        name,
        username,
        email,
        enrollmentNumber: enroll,
        department: r.department || 'Computer Science',
        year: r.year || '1st Year',
        semester: r.semester || '1-1',
        password: r.password || 'campusiq@1234',
        section: r.section || 'Section A',
        phoneNumber: r.phoneNumber || '',
      });
    }

    setBulkSaving(true);
    try {
      const res = await userAPI.createMultipleStudents(payload);
      const createdCount = res.data?.data?.createdCount || payload.length;
      toast.success(`🎉 Successfully created ${createdCount} student accounts!`);
      setBulkOpen(false);
      setBulkRows([
        createEmptyStudentRow(1),
        createEmptyStudentRow(2),
        createEmptyStudentRow(3),
      ]);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create multiple students';
      toast.error(`❌ ${msg}`);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!form.username || !form.email || !form.name) {
      toast.warning('Username, Name, and Email are required');
      return;
    }

    // Resolve custom department / section
    const finalDepartment = form.department === '__CUSTOM__'
      ? (form.customDepartment.trim() || 'General')
      : form.department;

    const finalSection = form.section === '__CUSTOM__'
      ? (form.customSection.trim() || 'Section A')
      : form.section;

    setSaving(true);
    try {
      await userAPI.createStudent({
        username: form.username.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber,
        enrollmentNumber: form.enrollmentNumber.trim(),
        department: finalDepartment,
        section: finalSection,
        semester: form.semester,
      });

      toast.success(`✅ Student "${form.name}" created! (Dept: ${finalDepartment}, ${finalSection})`);
      
      // Update department options if new
      if (!deptOptions.includes(finalDepartment)) {
        setDeptOptions(prev => [...prev, finalDepartment]);
      }

      setAddOpen(false);
      setForm(BLANK);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s) => {
    setEditId(s.id);
    const isCustomDept = s.department && !deptOptions.includes(s.department);
    const isCustomSec  = s.section && !STANDARD_SECTIONS.includes(s.section);

    setEditForm({
      name: s.name || '',
      email: s.email || '',
      phoneNumber: s.phoneNumber || '',
      department: isCustomDept ? '__CUSTOM__' : (s.department || 'Computer Science'),
      customDepartment: isCustomDept ? s.department : '',
      section: isCustomSec ? '__CUSTOM__' : (s.section || 'Section A'),
      customSection: isCustomSec ? s.section : '',
      semester: s.semester || 4,
      enrollmentNumber: s.enrollmentNumber || '',
      password: '',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    setSaving(true);
    const finalDepartment = editForm.department === '__CUSTOM__'
      ? (editForm.customDepartment?.trim() || 'General')
      : editForm.department;

    const finalSection = editForm.section === '__CUSTOM__'
      ? (editForm.customSection?.trim() || 'Section A')
      : editForm.section;

    try {
      await userAPI.updateUser(editId, {
        name: editForm.name,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        department: finalDepartment,
        section: finalSection,
        semester: editForm.semester,
        enrollmentNumber: editForm.enrollmentNumber,
        password: editForm.password,
      });
      toast.success('Student profile updated successfully!');
      setEditOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete student "${s.name}" (${s.enrollmentNumber})? This cannot be undone.`)) return;
    try {
      await userAPI.deleteUser(s.id);
      toast.success('Student removed from system');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.warning('No student records to export');
      return;
    }
    const exportData = filtered.map((s, idx) => ({
      'S.No': idx + 1,
      'Full Name': s.name,
      'Enrollment / Roll No': s.enrollmentNumber || '',
      'Username': s.username,
      'Email': s.email,
      'Phone Number': s.phoneNumber || '',
      'Department': s.department || '',
      'Course': s.course || 'B.Tech CSE',
      'Semester': s.semester || 4,
      'Section': s.section || 'Section A',
      'Admission Status': s.admissionStatus || 'ADMITTED',
      'Verified': s.isVerified ? 'YES' : 'NO',
      'Date of Birth': s.dateOfBirth || '',
      'Gender': s.gender || '',
      'Guardian Name': s.guardianName || '',
      'Guardian Phone': s.guardianPhone || '',
      'Address': s.address || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `SmartCampus_Students_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${exportData.length} students to Excel`);
  };

  const handleToggleVerify = async (s) => {
    try {
      const newStatus = !s.isVerified;
      await userAPI.verifyUser(s.id, { verified: newStatus, admissionStatus: newStatus ? 'VERIFIED' : 'PENDING' });
      toast.success(`Student ${s.name} marked as ${newStatus ? 'VERIFIED' : 'UNVERIFIED'}`);
      load();
    } catch (err) {
      toast.error('Failed to update verification status');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Students Management"
        subtitle="Manage student enrollment, allocate departments and class sections, and update credentials"
        breadcrumbs={['Home', 'Admin', 'Students']}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportExcel}
              sx={{
                borderRadius: 3,
                px: 2.2,
                py: 1,
                fontWeight: 700,
                color: '#1d4ed8',
                borderColor: '#bfdbfe',
                '&:hover': { bgcolor: '#eff6ff', borderColor: '#93c5fd' }
              }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<GroupAdd />}
              onClick={() => setBulkOpen(true)}
              sx={{
                borderRadius: 3,
                px: 2.5,
                py: 1,
                fontWeight: 700,
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  borderColor: COLORS.primary,
                  bgcolor: '#eff6ff',
                }
              }}
            >
              Add Multiple Students
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setAddOpen(true)}
              sx={{
                borderRadius: 3,
                px: 2.5,
                py: 1,
                fontWeight: 700,
                background: COLORS.gradBlue,
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              }}
            >
              Add New Student
            </Button>
          </Box>
        }
      />

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3, borderRadius: 3.5, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.1) }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by student name, roll number, email, or section..."
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

            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department Filter"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Departments ({deptOptions.length})</MenuItem>
                {deptOptions.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Section Filter"
                value={sectionFilter}
                onChange={e => setSectionFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Sections</MenuItem>
                {STANDARD_SECTIONS.map(sec => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card sx={{ borderRadius: 3.5, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.15) }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.015)', borderBottom: `1px solid ${COLORS.borderLight}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School sx={{ color: COLORS.primary }} />
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: COLORS.textPrimary }}>
                Registered Students Directory
              </Typography>
            </Box>
            <Chip
              label={`${filtered.length} of ${students.length} Students`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: `${COLORS.primary}12`, color: COLORS.primary }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Student Name', 'Username', 'Enrollment No.', 'Department', 'Class Section & Sem', 'Email', 'Phone', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.8rem', py: 1.5, color: COLORS.textSecondary }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography color="textSecondary">No students match the selected department/section filters.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(s => (
                    <TableRow key={s.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.secondary, fontSize: '0.85rem', fontWeight: 700 }}>
                            {s.name?.[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700} sx={{ color: COLORS.textPrimary }}>
                            {s.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: COLORS.primary, fontWeight: 700 }}>
                        {s.username}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                        {s.enrollmentNumber || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.department || 'General'}
                          size="small"
                          sx={{
                            bgcolor: `${COLORS.secondary}12`,
                            color: COLORS.secondary,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 22,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={s.section || 'Section A'}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(0,0,0,0.06)',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              height: 22,
                            }}
                          />
                          {s.semester && (
                            <Chip
                              label={`Sem ${s.semester}`}
                              size="small"
                              sx={{
                                bgcolor: `${COLORS.primary}10`,
                                color: COLORS.primary,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 22,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>
                        {s.email}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: COLORS.textMuted }}>
                        {s.phoneNumber || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: s.active ? '#dcfce7' : '#fee2e2',
                            color: s.active ? '#15803d' : '#dc2626',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Profile">
                            <IconButton size="small" color="primary" onClick={() => navigate(`/admin/students/${s.id}`)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={s.isVerified ? "Verified (Click to toggle)" : "Verify Profile"}>
                            <IconButton size="small" sx={{ color: s.isVerified ? '#16a34a' : '#94a3b8' }} onClick={() => handleToggleVerify(s)}>
                              <VerifiedUser fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Student">
                            <IconButton size="small" sx={{ color: COLORS.moderate }} onClick={() => openEdit(s)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Student">
                            <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => handleDelete(s)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── ADD STUDENT DIALOG ── */}
      <Dialog
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', borderBottom: `1px solid ${COLORS.border}`, py: 2 }}>
          Enroll Student Record
          <Typography variant="caption" display="block" color="text.secondary" mt={0.25}>
            Assign institutional identifier, departmental allocation, and class section
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username *"
                size="small"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                helperText="Used for system login"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password *"
                size="small"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                helperText="Default: campusiq@1234"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name *"
                size="small"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address *"
                size="small"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enrollment / Roll No."
                size="small"
                placeholder="e.g. 23BQ1A1268"
                value={form.enrollmentNumber}
                onChange={e => setForm(p => ({ ...p, enrollmentNumber: e.target.value.toUpperCase() }))}
                disabled={saving}
              />
            </Grid>

            {/* Department Selector with Add New Dept Option */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Department *"
                size="small"
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                disabled={saving}
              >
                {deptOptions.map(d => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem value="__CUSTOM__" sx={{ color: COLORS.secondary, fontWeight: 700 }}>
                  <AddCircleOutline sx={{ fontSize: 16, mr: 1 }} /> + Add New Department...
                </MenuItem>
              </TextField>
            </Grid>

            {/* Custom Department Name Input */}
            {form.department === '__CUSTOM__' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Department Name *"
                  size="small"
                  placeholder="e.g. Artificial Intelligence"
                  value={form.customDepartment}
                  onChange={e => setForm(p => ({ ...p, customDepartment: e.target.value }))}
                  disabled={saving}
                  autoFocus
                />
              </Grid>
            )}

            {/* Section Selector with Custom Option */}
            <Grid item xs={12} sm={form.department === '__CUSTOM__' ? 12 : 6}>
              <TextField
                select
                fullWidth
                label="Section / Batch *"
                size="small"
                value={form.section}
                onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                disabled={saving}
              >
                {STANDARD_SECTIONS.map(sec => (
                  <MenuItem key={sec} value={sec}>
                    {sec}
                  </MenuItem>
                ))}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem value="__CUSTOM__" sx={{ color: COLORS.secondary, fontWeight: 700 }}>
                  <AddCircleOutline sx={{ fontSize: 16, mr: 1 }} /> + Custom Section...
                </MenuItem>
              </TextField>
            </Grid>

            {/* Custom Section Input */}
            {form.section === '__CUSTOM__' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custom Section Name *"
                  size="small"
                  placeholder="e.g. Section E or CS-Batch 2"
                  value={form.customSection}
                  onChange={e => setForm(p => ({ ...p, customSection: e.target.value }))}
                  disabled={saving}
                  autoFocus
                />
              </Grid>
            )}

            {/* Semester Selector */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Semester"
                size="small"
                value={form.semester}
                onChange={e => setForm(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))}
                disabled={saving}
              >
                {SEMESTERS.map(sem => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem} ({sem <= 2 ? '1st Year' : sem <= 4 ? '2nd Year' : sem <= 6 ? '3rd Year' : '4th Year'})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                size="small"
                placeholder="e.g. 9876543210"
                value={form.phoneNumber}
                onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                disabled={saving}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2.5, border: '1px solid #bbf7d0' }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 500 }}>
              Credentials and institutional records will be provisioned immediately upon confirmation.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setAddOpen(false)} disabled={saving} variant="outlined" sx={{ borderRadius: 0.5 }}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={saving}
            sx={{ backgroundColor: COLORS.primary, borderRadius: 0.5, minWidth: 130, fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Confirm Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── EDIT STUDENT DIALOG ── */}
      <Dialog
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', borderBottom: `1px solid ${COLORS.border}`, py: 2 }}>
          Edit Student Record & Academic Allocation
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                size="small"
                value={editForm.name || ''}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                size="small"
                value={editForm.email || ''}
                onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Enrollment Number"
                size="small"
                value={editForm.enrollmentNumber || ''}
                onChange={e => setEditForm(p => ({ ...p, enrollmentNumber: e.target.value }))}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                size="small"
                value={editForm.phoneNumber || ''}
                onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))}
                disabled={saving}
              />
            </Grid>

            {/* Department in Edit */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Department"
                size="small"
                value={editForm.department || 'Computer Science'}
                onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                disabled={saving}
              >
                {deptOptions.map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem value="__CUSTOM__" sx={{ color: COLORS.secondary, fontWeight: 700 }}>
                  <AddCircleOutline sx={{ fontSize: 16, mr: 1 }} /> + Add New Department...
                </MenuItem>
              </TextField>
            </Grid>

            {editForm.department === '__CUSTOM__' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Department Name"
                  size="small"
                  value={editForm.customDepartment || ''}
                  onChange={e => setEditForm(p => ({ ...p, customDepartment: e.target.value }))}
                  disabled={saving}
                />
              </Grid>
            )}

            {/* Section in Edit */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Section / Batch"
                size="small"
                value={editForm.section || 'Section A'}
                onChange={e => setEditForm(p => ({ ...p, section: e.target.value }))}
                disabled={saving}
              >
                {STANDARD_SECTIONS.map(sec => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem value="__CUSTOM__" sx={{ color: COLORS.secondary, fontWeight: 700 }}>
                  <AddCircleOutline sx={{ fontSize: 16, mr: 1 }} /> + Custom Section...
                </MenuItem>
              </TextField>
            </Grid>

            {editForm.section === '__CUSTOM__' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custom Section Name"
                  size="small"
                  value={editForm.customSection || ''}
                  onChange={e => setEditForm(p => ({ ...p, customSection: e.target.value }))}
                  disabled={saving}
                />
              </Grid>
            )}

            {/* Semester in Edit */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Semester"
                size="small"
                value={editForm.semester || 4}
                onChange={e => setEditForm(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))}
                disabled={saving}
              >
                {SEMESTERS.map(sem => (
                  <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password (leave blank to keep existing)"
                size="small"
                value={editForm.password || ''}
                onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                disabled={saving}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={saving}
            sx={{ background: COLORS.gradBlue, borderRadius: 2.5, minWidth: 130, fontWeight: 700 }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ADD MULTIPLE STUDENTS DIALOG                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={bulkOpen}
        onClose={() => !bulkSaving && setBulkOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, maxHeight: '92vh' } }}
      >
        <DialogTitle sx={{
          fontWeight: 800,
          fontSize: '1.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${COLORS.borderLight}`,
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: '#eff6ff',
              color: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GroupAdd />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: COLORS.textPrimary }}>
                Add Multiple Students
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
                Create multiple student accounts in one batch with duplicate validation
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={showCsvBox ? 'contained' : 'outlined'}
              startIcon={<FileUpload fontSize="small" />}
              onClick={() => setShowCsvBox(!showCsvBox)}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', fontWeight: 600 }}
            >
              {showCsvBox ? 'Hide CSV Tool' : 'Quick CSV Paste'}
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 2.5, px: { xs: 1.5, md: 3 } }}>
          {showCsvBox && (
            <Card sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: `1px solid ${COLORS.borderLight}`, borderRadius: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', mb: 0.5, color: COLORS.textPrimary }}>
                Paste Comma-Separated Data (CSV)
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.textMuted, mb: 1.5 }}>
                Format per line: <code>Name, EnrollmentNumber, Email, Department, Year, Semester (1-1 to 4-2), Username, Password</code>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="John Doe, 21CS001, john@campus.edu, Computer Science, 1st Year, 1-1, johndoe, pass123&#10;Alice Smith, 21CS002, alice@campus.edu, Information Technology, 2nd Year, 2-1, alicesmith, pass123"
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                size="small"
                sx={{ mb: 1.5, bgcolor: '#fff' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={() => setCsvText('')}>Clear</Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleParseCsv}
                  sx={{ background: COLORS.gradBlue, borderRadius: 2, fontWeight: 700 }}
                >
                  Apply CSV to Rows
                </Button>
              </Box>
            </Card>
          )}

          {/* Student Rows Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 2.5, mb: 2, maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: COLORS.textPrimary } }}>
                  <TableCell sx={{ width: 40 }}>#</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Name *</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Enrollment No *</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Email *</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Department</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>Year</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>Semester</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Username *</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Password</TableCell>
                  <TableCell sx={{ width: 50, textAlign: 'center' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkRows.map((row, idx) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textMuted }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Full Name"
                        value={row.name}
                        onChange={e => handleBulkRowChange(row.id, 'name', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& input': { fontSize: '0.8rem', py: 0.75 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Roll No / Enroll"
                        value={row.enrollmentNumber}
                        onChange={e => handleBulkRowChange(row.id, 'enrollmentNumber', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& input': { fontSize: '0.8rem', py: 0.75 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="email"
                        placeholder="student@campus.edu"
                        value={row.email}
                        onChange={e => handleBulkRowChange(row.id, 'email', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& input': { fontSize: '0.8rem', py: 0.75 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={row.department}
                        onChange={e => handleBulkRowChange(row.id, 'department', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.75 } }}
                      >
                        {deptOptions.map(d => (
                          <MenuItem key={d} value={d} sx={{ fontSize: '0.78rem' }}>{d}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={row.year}
                        onChange={e => handleBulkRowChange(row.id, 'year', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.75 } }}
                      >
                        {YEARS.map(y => (
                          <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem' }}>{y}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={row.semester}
                        onChange={e => handleBulkRowChange(row.id, 'semester', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& .MuiSelect-select': { fontSize: '0.78rem', py: 0.75 } }}
                      >
                        {SEMESTER_CODES.map(s => (
                          <MenuItem key={s} value={s} sx={{ fontSize: '0.78rem' }}>{s}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="username"
                        value={row.username}
                        onChange={e => handleBulkRowChange(row.id, 'username', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& input': { fontSize: '0.8rem', py: 0.75 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="password"
                        value={row.password}
                        onChange={e => handleBulkRowChange(row.id, 'password', e.target.value)}
                        disabled={bulkSaving}
                        sx={{ '& input': { fontSize: '0.8rem', py: 0.75 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveBulkRow(row.id)}
                        disabled={bulkSaving || bulkRows.length <= 1}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              startIcon={<Add />}
              onClick={handleAddBulkRow}
              disabled={bulkSaving}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
            >
              Add Another Student Row
            </Button>
            <Typography sx={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
              Total Students to Create: <strong>{bulkRows.length}</strong>
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: `1px solid ${COLORS.borderLight}` }}>
          <Button onClick={() => setBulkOpen(false)} disabled={bulkSaving} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkSubmit}
            disabled={bulkSaving}
            startIcon={bulkSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckCircle />}
            sx={{
              background: COLORS.gradBlue,
              borderRadius: 2.5,
              px: 3,
              py: 1,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            {bulkSaving ? 'Creating Students...' : `Create All ${bulkRows.length} Students`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
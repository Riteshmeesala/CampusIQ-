import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, MenuItem, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Alert
} from '@mui/material';
import {
  Save, Refresh, Edit, CheckCircle, FileUpload, FileDownload,
  CompareArrows, School, Person, AssignmentOutlined, Lock,
  HelpOutline, Close, Add
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { userAPI, academicRecordAPI } from '../../services/api';
import { updateSharedStudentCgpa, subscribeToDataSync, broadcastDataChange, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';

const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

const INSTITUTIONAL_GRADES = [
  { grade: 'S', label: 'S (>=90%)', min: 90, gp: 10.0, color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  { grade: 'A', label: 'A (80-89%)', min: 80, gp: 9.0, color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
  { grade: 'B', label: 'B (70-79%)', min: 70, gp: 8.0, color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
  { grade: 'C', label: 'C (60-69%)', min: 60, gp: 7.0, color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { grade: 'D', label: 'D (50-59%)', min: 50, gp: 6.0, color: '#ea580c', bg: '#ffedd5', border: '#fed7aa' },
  { grade: 'E', label: 'E (40-49%)', min: 40, gp: 5.0, color: '#7c3aed', bg: '#f3e8ff', border: '#d8b4fe' },
  { grade: 'F', label: 'F (<40%)', min: 0, gp: 0.0, color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
];

const getGradeColor = (grade) => {
  const found = INSTITUTIONAL_GRADES.find(g => g.grade === (grade || '').toUpperCase());
  return found ? { text: found.color, bg: found.bg, border: found.border } : { text: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
};

// Institutional two-mid marks calculation (80% Best Mid + 20% Other Mid)
export const computeTwoMidMarks = (m1d, m1ob, m1a, m1obj, m2d, m2ob, m2a, m2obj, sem) => {
  let d1, o1, a1, j1, d2, o2, a2, j2, s;
  if (sem === undefined) {
    d1 = Math.max(0, Math.min(30, Number(m1d) || 0));
    o1 = Math.max(0, Math.min(20, Number(m1ob) || 0));
    a1 = 5;
    j1 = Math.max(0, Math.min(20, Number(m1a) || 0));
    d2 = Math.max(0, Math.min(30, Number(m1obj) || 0));
    o2 = Math.max(0, Math.min(20, Number(m2d) || 0));
    a2 = 5;
    j2 = Math.max(0, Math.min(20, Number(m2ob) || 0));
    s  = Math.max(0, Math.min(70, Number(m2a) || 0));
  } else {
    d1 = Math.max(0, Math.min(30, Number(m1d) || 0));
    o1 = Math.max(0, Math.min(20, Number(m1ob) || 0));
    a1 = Math.max(0, Math.min(5,  Number(m1a) || 0));
    j1 = Math.max(0, Math.min(20, Number(m1obj) || 0));
    d2 = Math.max(0, Math.min(30, Number(m2d) || 0));
    o2 = Math.max(0, Math.min(20, Number(m2ob) || 0));
    a2 = Math.max(0, Math.min(5,  Number(m2a) || 0));
    j2 = Math.max(0, Math.min(20, Number(m2obj) || 0));
    s  = Math.max(0, Math.min(70, Number(sem) || 0));
  }

  // Institutional criteria: 30 Mid (Descriptive 30 -> 30/3, Open Book 20 -> 20/4, Assignment 5, Objective 20 -> 20/2) = 30
  const m1Total = (d1 / 3.0) + (o1 / 4.0) + a1 + (j1 / 2.0); // Max 30
  const m2Total = (d2 / 3.0) + (o2 / 4.0) + a2 + (j2 / 2.0); // Max 30

  // 80/20 Rule: 80% Highest Mid + 20% Other Mid -> Max 30
  const bestMid = Math.max(m1Total, m2Total);
  const otherMid = Math.min(m1Total, m2Total);
  const internal = (0.80 * bestMid) + (0.20 * otherMid); // Max 30
  const total = Math.min(100, internal + s); // Max 100

  let grade = 'F';
  let gp = 0.0;
  if (total >= 90) { grade = 'S'; gp = 10.0; }
  else if (total >= 80) { grade = 'A'; gp = 9.0; }
  else if (total >= 70) { grade = 'B'; gp = 8.0; }
  else if (total >= 60) { grade = 'C'; gp = 7.0; }
  else if (total >= 50) { grade = 'D'; gp = 6.0; }
  else if (total >= 40) { grade = 'E'; gp = 5.0; }
  else { grade = 'F'; gp = 0.0; }

  return {
    mid1DescriptiveMarks: d1,
    mid1OpenBookMarks: o1,
    mid1AssignmentMarks: a1,
    mid1ObjectiveMarks: j1,
    mid1TotalMarks: Number(m1Total.toFixed(2)),
    mid2DescriptiveMarks: d2,
    mid2OpenBookMarks: o2,
    mid2AssignmentMarks: a2,
    mid2ObjectiveMarks: j2,
    mid2TotalMarks: Number(m2Total.toFixed(2)),
    convertedInternalMarks: Number(internal.toFixed(2)),
    descriptiveMarks: d1,
    openBookMarks: o1,
    assignmentMarks: a1,
    objectiveMarks: j1,
    semesterMarks: s,
    totalMarks: Number(total.toFixed(2)),
    grade,
    gradePoint: gp
  };
};

export default function StudentAcademicRecordsPage() {
  const { user, isAdmin, isFaculty } = useAuth();

  const [students,       setStudents]       = useState([]);
  const [selectedStudent,setSelectedStudent]= useState(null);
  const [activeSem,      setActiveSem]      = useState('1-1');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [studentSearch] = useState('');

  // Editable lists
  const [editSubjects,   setEditSubjects]   = useState([]);

  // Summary inputs
  const [sgpaInput, setSgpaInput] = useState('');
  const [cgpaInput, setCgpaInput] = useState('');
  const [attInput,  setAttInput]  = useState('');

  // Single Subject Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: '',
    subjectName: '',
    facultyName: '',
    creditHours: 3,
    mid1DescriptiveMarks: 27,
    mid1OpenBookMarks: 16,
    mid1AssignmentMarks: 5,
    mid1ObjectiveMarks: 18,
    mid1TotalMarks: 27,
    mid2DescriptiveMarks: 28.5,
    mid2OpenBookMarks: 18,
    mid2AssignmentMarks: 5,
    mid2ObjectiveMarks: 19,
    mid2TotalMarks: 28.5,
    convertedInternalMarks: 27.5,
    semesterMarks: 62,
    totalMarks: 89.5,
    grade: 'A',
    gradePoint: 9.0,
    attendancePercentage: 88,
  });

  // CSV Import Dialog State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);

  // Saving states & comparison
  const [saving, setSaving] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Load students list
  useEffect(() => {
    userAPI.getStudents()
      .then(r => {
        const list = r.data.data || [];
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudent(list[0]);
        }
      })
      .catch(() => toast.error('Failed to load students'));
  }, []);

  // Load student academic records
  const loadRecords = (studentId, semCode) => {
    if (!studentId) return;
    setLoadingRecords(true);
    academicRecordAPI.getStudentRecords(studentId)
      .then(r => {
        const profile = r.data.data || {};
        const semRecords = profile.semesterRecords?.[semCode] || [];
        const semSummary = profile.semesterSummaries?.[semCode] || null;

        setEditSubjects(JSON.parse(JSON.stringify(semRecords)));
        setSgpaInput(semSummary?.sgpa ? String(semSummary.sgpa) : '8.85');
        setCgpaInput(semSummary?.cgpa ? String(semSummary.cgpa) : (profile.overallCgpa ? String(profile.overallCgpa) : '8.85'));
        setAttInput(semSummary?.attendancePercentage ? String(semSummary.attendancePercentage) : '90.00');
      })
      .catch(() => toast.error('Failed to load academic records'))
      .finally(() => setLoadingRecords(false));
  };

  useEffect(() => {
    if (selectedStudent?.id) {
      loadRecords(selectedStudent.id, activeSem);
    }
  }, [selectedStudent, activeSem]);

  // Filtered student list for dropdown
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.enrollmentNumber || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Handle single subject edit modal open
  const handleOpenSubjectEdit = (sub) => {
    const m1d = sub.mid1DescriptiveMarks ?? sub.descriptiveMarks ?? sub.midMarks ?? 27;
    const m1ob = sub.mid1OpenBookMarks ?? sub.openBookMarks ?? 16;
    const m1a = sub.mid1AssignmentMarks ?? sub.assignmentMarks ?? 5;
    const m1obj = sub.mid1ObjectiveMarks ?? sub.objectiveMarks ?? 18;

    const m2d = sub.mid2DescriptiveMarks ?? m1d;
    const m2ob = sub.mid2OpenBookMarks ?? m1ob;
    const m2a = sub.mid2AssignmentMarks ?? m1a;
    const m2obj = sub.mid2ObjectiveMarks ?? m1obj;

    const sem = sub.semesterMarks ?? 62;
    const computed = computeTwoMidMarks(m1d, m1ob, m1a, m1obj, m2d, m2ob, m2a, m2obj, sem);

    setSubjectForm({
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      facultyName: sub.facultyName || 'Department Faculty',
      creditHours: sub.creditHours || 3,
      mid1DescriptiveMarks: computed.mid1DescriptiveMarks,
      mid1OpenBookMarks: computed.mid1OpenBookMarks,
      mid1AssignmentMarks: computed.mid1AssignmentMarks,
      mid1ObjectiveMarks: computed.mid1ObjectiveMarks,
      mid1TotalMarks: computed.mid1TotalMarks,
      mid2DescriptiveMarks: computed.mid2DescriptiveMarks,
      mid2OpenBookMarks: computed.mid2OpenBookMarks,
      mid2AssignmentMarks: computed.mid2AssignmentMarks,
      mid2ObjectiveMarks: computed.mid2ObjectiveMarks,
      mid2TotalMarks: computed.mid2TotalMarks,
      convertedInternalMarks: computed.convertedInternalMarks,
      semesterMarks: computed.semesterMarks,
      totalMarks: computed.totalMarks,
      grade: sub.grade || computed.grade,
      gradePoint: sub.gradePoint || computed.gradePoint,
      attendancePercentage: sub.attendancePercentage || 88,
    });
    setEditDialogOpen(true);
  };

  // Live Auto Grade calculation for subject modal
  const handleSubjectMarksChange = (field, val) => {
    const num = parseFloat(val) || 0;
    const nextForm = { ...subjectForm, [field]: num };

    const m1d = field === 'mid1DescriptiveMarks' ? num : nextForm.mid1DescriptiveMarks;
    const m1ob = field === 'mid1OpenBookMarks' ? num : nextForm.mid1OpenBookMarks;
    const m1a = field === 'mid1AssignmentMarks' ? num : nextForm.mid1AssignmentMarks;
    const m1obj = field === 'mid1ObjectiveMarks' ? num : nextForm.mid1ObjectiveMarks;

    const m2d = field === 'mid2DescriptiveMarks' ? num : nextForm.mid2DescriptiveMarks;
    const m2ob = field === 'mid2OpenBookMarks' ? num : nextForm.mid2OpenBookMarks;
    const m2a = field === 'mid2AssignmentMarks' ? num : nextForm.mid2AssignmentMarks;
    const m2obj = field === 'mid2ObjectiveMarks' ? num : nextForm.mid2ObjectiveMarks;

    const sem = field === 'semesterMarks' ? num : nextForm.semesterMarks;

    const computed = computeTwoMidMarks(m1d, m1ob, m1a, m1obj, m2d, m2ob, m2a, m2obj, sem);
    setSubjectForm({
      ...nextForm,
      ...computed,
    });
  };

  // Open Dialog for Manual Subject Creation
  const handleOpenAddSubject = () => {
    const computed = computeTwoMidMarks(25, 16, 5, 17, 26, 17, 5, 18, 60);
    setSubjectForm({
      subjectCode: '',
      subjectName: '',
      facultyName: user?.name || 'Department Faculty',
      creditHours: 3,
      mid1DescriptiveMarks: 25,
      mid1OpenBookMarks: 16,
      mid1AssignmentMarks: 5,
      mid1ObjectiveMarks: 17,
      mid1TotalMarks: computed.mid1TotalMarks,
      mid2DescriptiveMarks: 26,
      mid2OpenBookMarks: 17,
      mid2AssignmentMarks: 5,
      mid2ObjectiveMarks: 18,
      mid2TotalMarks: computed.mid2TotalMarks,
      convertedInternalMarks: computed.convertedInternalMarks,
      semesterMarks: 60,
      totalMarks: computed.totalMarks,
      grade: computed.grade,
      gradePoint: computed.gradePoint,
      attendancePercentage: 90,
    });
    setEditDialogOpen(true);
  };

  // Save single subject to backend MySQL
  const handleSaveSingleSubject = async () => {
    if (!selectedStudent?.id) return;
    if (!subjectForm.subjectCode.trim() || !subjectForm.subjectName.trim()) {
      toast.warning('Please enter both Subject Code and Subject Name');
      return;
    }
    try {
      setSaving(true);
      const res = await academicRecordAPI.updateSubjectMarks(selectedStudent.id, {
        semesterCode: activeSem,
        ...subjectForm
      });
      toast.success(`✅ Saved marks for ${subjectForm.subjectCode}`);
      setEditDialogOpen(false);
      
      const newCg = parseFloat(cgpaInput) || parseFloat(sgpaInput) || 8.5;
      updateSharedStudentCgpa(selectedStudent.id, newCg, activeSem, `Subject: ${subjectForm.subjectCode}`);

      broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, {
        studentId: selectedStudent.id,
        semesterCode: activeSem
      });

      setLastSavedSnapshot({
        timestamp: new Date().toLocaleTimeString(),
        type: `Single Subject (${subjectForm.subjectCode})`,
        data: res.data.data,
        newSgpa: sgpaInput,
        newCgpa: cgpaInput
      });
      loadRecords(selectedStudent.id, activeSem);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save subject record');
    } finally {
      setSaving(false);
    }
  };

  // Inline table edit changes
  const handleInlineSubjectChange = (idx, field, val) => {
    const updated = [...editSubjects];
    const num = parseFloat(val) || 0;
    updated[idx][field] = num;

    const sub = updated[idx];
    const m1d = sub.mid1DescriptiveMarks ?? sub.descriptiveMarks ?? sub.midMarks ?? 27;
    const m1ob = sub.mid1OpenBookMarks ?? sub.openBookMarks ?? 16;
    const m1a = sub.mid1AssignmentMarks ?? sub.assignmentMarks ?? 5;
    const m1obj = sub.mid1ObjectiveMarks ?? sub.objectiveMarks ?? 18;
    const m2d = sub.mid2DescriptiveMarks ?? m1d;
    const m2ob = sub.mid2OpenBookMarks ?? m1ob;
    const m2a = sub.mid2AssignmentMarks ?? m1a;
    const m2obj = sub.mid2ObjectiveMarks ?? m1obj;
    const sem = sub.semesterMarks ?? 65;

    const computed = computeTwoMidMarks(m1d, m1ob, m1a, m1obj, m2d, m2ob, m2a, m2obj, sem);
    updated[idx] = {
      ...updated[idx],
      ...computed
    };
    setEditSubjects(updated);
  };

  // Batch Save all subjects + SGPA + CGPA to backend MySQL
  const handleBatchSaveSemester = async () => {
    if (!selectedStudent?.id) return;
    try {
      setSaving(true);
      const payload = {
        semesterCode: activeSem,
        sgpa: parseFloat(sgpaInput) || null,
        cgpa: parseFloat(cgpaInput) || null,
        attendancePercentage: parseFloat(attInput) || null,
        subjects: editSubjects
      };
      await academicRecordAPI.batchUpdateSemester(selectedStudent.id, payload);
      
      const newCg = parseFloat(cgpaInput) || parseFloat(sgpaInput) || 8.5;
      updateSharedStudentCgpa(selectedStudent.id, newCg, activeSem, `Batch Semester ${activeSem}`);

      toast.success(`✅ Successfully updated Semester ${activeSem} in MySQL & synchronized across all roles!`);
      broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, {
        studentId: selectedStudent.id,
        semesterCode: activeSem
      });

      setLastSavedSnapshot({
        timestamp: new Date().toLocaleTimeString(),
        type: `Batch Semester (${activeSem})`,
        newSgpa: sgpaInput,
        newCgpa: cgpaInput
      });
      loadRecords(selectedStudent.id, activeSem);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save semester records');
    } finally {
      setSaving(false);
    }
  };

  // CSV Template download
  const handleDownloadCsvTemplate = () => {
    const headers = "enrollmentNumber,semesterCode,subjectCode,subjectName,creditHours,mid1DescriptiveMarks,mid1OpenBookMarks,mid1ObjectiveMarks,mid2DescriptiveMarks,mid2OpenBookMarks,mid2ObjectiveMarks,semesterMarks,attendancePercentage\n";
    const sample = "2024CS001,1-1,CS101,Problem Solving through C,4,28,18,19,29,19,20,66,95\n2024CS002,1-1,CS101,Problem Solving through C,4,27,16,18,28,18,19,64,90\n";
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Academic_Marks_Template_${activeSem}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process CSV Upload
  const handleProcessCsvImport = async () => {
    if (!csvText.trim()) {
      toast.warning('Please paste or upload CSV data');
      return;
    }
    setImporting(true);
    setImportReport(null);
    try {
      const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV must contain a header line and at least one record row');
        setImporting(false);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          if (vals[idx] !== undefined) obj[h] = vals[idx];
        });
        rows.push(obj);
      }
      const res = await academicRecordAPI.importCsv(rows);
      setImportReport(res.data.data);
      toast.success(`✅ Imported ${res.data.data.importedCount} academic records!`);
      if (selectedStudent?.id) {
        loadRecords(selectedStudent.id, activeSem);
      }
    } catch (err) {
      toast.error('Failed to import CSV marks');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={isFaculty ? "Continuous Evaluation & Mid Marks" : "Academic & Final Marks Manager"}
        subtitle={isFaculty
          ? "Faculty Evaluation: Enter Mid-1, Mid-2 (80/20 rule), Continuous Internal (25), and Lab Attendance"
          : "Central Administration: Manage Semester Final Marks (70), SGPA/CGPA calculations, and Result Publication"}
        breadcrumbs={['Home', isFaculty ? 'Faculty' : 'Admin', 'Academic Records']}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileUpload sx={{ fontSize: 16 }} />}
              onClick={() => {
                setCsvText('');
                setImportReport(null);
                setImportDialogOpen(true);
              }}
              sx={{
                borderRadius: 0.5,
                borderColor: COLORS.borderDark,
                color: COLORS.textPrimary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              Import Marks CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => loadRecords(selectedStudent?.id, activeSem)}
              sx={{
                borderRadius: 0.5,
                borderColor: COLORS.borderDark,
                color: COLORS.textPrimary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleBatchSaveSemester}
              disabled={saving || !selectedStudent}
              sx={{
                bgcolor: COLORS.primary,
                borderRadius: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              {saving ? 'Saving...' : 'Commit Semester Changes'}
            </Button>
          </Box>
        }
      />

      {/* Role Responsibility Alert Banner */}
      <Alert
        severity={isFaculty ? "info" : "success"}
        sx={{ mb: 2.5, borderRadius: 0.5, fontSize: '0.8rem' }}
        icon={<Lock fontSize="small" />}
      >
        {isFaculty ? (
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            <strong>Faculty Assessment Mode:</strong> You are authorized to enter/update <strong>Mid-1</strong>, <strong>Mid-2</strong>, <strong>Lab/Internal marks</strong>, and <strong>Attendance</strong> for your subjects. Semester final exam marks are administered by Central Examination / Admin.
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            <strong>Administrator Mode:</strong> You are authorized to enter/update <strong>Semester Final Examination Marks (Max 70)</strong> and release official SGPA/CGPA results. Mid examination marks are maintained by course faculty.
          </Typography>
        )}
      </Alert>

      {/* Student & Semester Selector Header */}
      <Card elevation={0} sx={{ mb: 3, border: `1px solid ${COLORS.border}`, borderRadius: 0.5 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Student Picker */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Student"
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const s = students.find(x => x.id === e.target.value);
                  setSelectedStudent(s);
                }}
              >
                {filteredStudents.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.enrollmentNumber || 'No Roll No'}) • {s.department || 'CS'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Semester Tabs */}
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {SEMESTERS.map(sem => (
                  <Button
                    key={sem}
                    size="small"
                    variant={activeSem === sem ? 'contained' : 'outlined'}
                    onClick={() => setActiveSem(sem)}
                    sx={{
                      borderRadius: 0.5,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      bgcolor: activeSem === sem ? COLORS.primary : 'transparent',
                      borderColor: activeSem === sem ? COLORS.primary : COLORS.borderDark,
                      color: activeSem === sem ? '#fff' : COLORS.textPrimary,
                    }}
                  >
                    Sem {sem}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Subjects & Marks Table */}
      <Card elevation={0} sx={{ mb: 3, border: `1px solid ${COLORS.border}`, borderRadius: 0.5 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: COLORS.textPrimary, fontSize: '0.9rem' }}>
                Semester {activeSem} Course Evaluation Matrix
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Two-Mid Continuous Internal (80% Best + 20% Other &rarr; 30 Marks: Descriptive 30/3, Open Book 20/4, Assignment 5, Objective 20/2) + Semester Final (70 Marks) = Total (100)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={`${editSubjects.length} Registered Subjects`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', fontWeight: 600, fontSize: '0.75rem' }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<Add fontSize="small" />}
                onClick={handleOpenAddSubject}
                sx={{
                  bgcolor: '#2563eb',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: 1
                }}
              >
                Add Subject Manually
              </Button>
            </Box>
          </Box>

          {loadingRecords ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={30} sx={{ color: COLORS.primary }} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>SUBJECT / CODE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">CREDITS</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">MID-1 (/30)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">MID-2 (/30)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">INTERNAL (/30)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">SEM EXAM (/70)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">TOTAL (/100)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">GRADE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">GP</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">ATT %</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }} align="center">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editSubjects.map((sub, idx) => {
                    const gradeStyle = getGradeColor(sub.grade);
                    return (
                      <TableRow key={sub.id || idx} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.78rem' }}>
                            {sub.subjectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {sub.subjectCode} • {sub.facultyName || 'Faculty'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={sub.creditHours || 3} size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} color={COLORS.primary} sx={{ fontSize: '0.8rem' }}>
                            {Number(sub.mid1TotalMarks || sub.midMarks || 26).toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} color={COLORS.primary} sx={{ fontSize: '0.8rem' }}>
                            {Number(sub.mid2TotalMarks || sub.mid1TotalMarks || 27.5).toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${Number(sub.convertedInternalMarks || sub.internalMarks || 26.5).toFixed(1)} / 30`}
                            size="small"
                            sx={{ bgcolor: '#eff6ff', color: COLORS.primary, fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ width: 110 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={sub.semesterMarks ?? 62}
                            disabled={isFaculty}
                            onChange={(e) => handleInlineSubjectChange(idx, 'semesterMarks', e.target.value)}
                            inputProps={{ min: 0, max: 70, style: { textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', padding: '4px 6px' } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={800} color={COLORS.textPrimary} sx={{ fontSize: '0.82rem' }}>
                            {Number(sub.totalMarks || 88.5).toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sub.grade || 'A'}
                            size="small"
                            sx={{ bgcolor: gradeStyle.bg, color: gradeStyle.text, fontWeight: 800, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                            {Number(sub.gradePoint || 9.0).toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.78rem' }}>
                            {Number(sub.attendancePercentage || 90).toFixed(0)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenSubjectEdit(sub)} sx={{ color: COLORS.primary }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Single Subject Detailed Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {subjectForm.subjectCode} — {subjectForm.subjectName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Semester {activeSem} • {isFaculty ? 'Faculty Continuous Evaluation Mode' : 'Admin Semester Examination Mode'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setEditDialogOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {/* SUBJECT IDENTITY */}
            <Grid item xs={12} sm={4} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Subject Code"
                value={subjectForm.subjectCode}
                onChange={e => setSubjectForm(prev => ({ ...prev, subjectCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. CS101"
                required
              />
            </Grid>
            <Grid item xs={12} sm={5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Subject Name"
                value={subjectForm.subjectName}
                onChange={e => setSubjectForm(prev => ({ ...prev, subjectName: e.target.value }))}
                placeholder="e.g. Data Structures"
                required
              />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Credits"
                type="number"
                value={subjectForm.creditHours}
                onChange={e => setSubjectForm(prev => ({ ...prev, creditHours: Number(e.target.value) || 3 }))}
                inputProps={{ min: 1, max: 6 }}
              />
            </Grid>

            {/* MID-1 SECTION */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color={COLORS.primary}>
                  1. MID-1 EXAMINATION (Continuous Assessment 1 — Max 30)
                </Typography>
                {isAdmin && <Chip icon={<Lock sx={{ fontSize: '12px !important' }} />} label="Faculty Authority Only" size="small" sx={{ fontSize: 10, bgcolor: '#eff6ff', color: '#1d4ed8' }} />}
              </Box>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Descriptive (Max 30, /3)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid1DescriptiveMarks}
                onChange={(e) => handleSubjectMarksChange('mid1DescriptiveMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 30 }}
                helperText={`= ${(subjectForm.mid1DescriptiveMarks / 3).toFixed(1)}/10`}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Open Book (Max 20, /4)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid1OpenBookMarks}
                onChange={(e) => handleSubjectMarksChange('mid1OpenBookMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 20 }}
                helperText={`= ${(subjectForm.mid1OpenBookMarks / 4).toFixed(1)}/5`}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Assignment (Max 5)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid1AssignmentMarks}
                onChange={(e) => handleSubjectMarksChange('mid1AssignmentMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 5 }}
                helperText="Max: 5"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Objective (Max 20, /2)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid1ObjectiveMarks}
                onChange={(e) => handleSubjectMarksChange('mid1ObjectiveMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 20 }}
                helperText={`= ${(subjectForm.mid1ObjectiveMarks / 2).toFixed(1)}/10`}
              />
            </Grid>
            <Grid item xs={12}>
              <Chip label={`Mid-1 Total: ${subjectForm.mid1TotalMarks} / 30`} color="primary" size="small" sx={{ fontWeight: 700 }} />
            </Grid>

            {/* MID-2 SECTION */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color={COLORS.primary}>
                  2. MID-2 EXAMINATION (Continuous Assessment 2 — Max 30)
                </Typography>
                {isAdmin && <Chip icon={<Lock sx={{ fontSize: '12px !important' }} />} label="Faculty Authority Only" size="small" sx={{ fontSize: 10, bgcolor: '#eff6ff', color: '#1d4ed8' }} />}
              </Box>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Descriptive (Max 30, /3)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid2DescriptiveMarks}
                onChange={(e) => handleSubjectMarksChange('mid2DescriptiveMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 30 }}
                helperText={`= ${(subjectForm.mid2DescriptiveMarks / 3).toFixed(1)}/10`}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Open Book (Max 20, /4)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid2OpenBookMarks}
                onChange={(e) => handleSubjectMarksChange('mid2OpenBookMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 20 }}
                helperText={`= ${(subjectForm.mid2OpenBookMarks / 4).toFixed(1)}/5`}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Assignment (Max 5)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid2AssignmentMarks}
                onChange={(e) => handleSubjectMarksChange('mid2AssignmentMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 5 }}
                helperText="Max: 5"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Objective (Max 20, /2)"
                type="number"
                disabled={isAdmin}
                value={subjectForm.mid2ObjectiveMarks}
                onChange={(e) => handleSubjectMarksChange('mid2ObjectiveMarks', e.target.value)}
                size="small"
                inputProps={{ min: 0, max: 20 }}
                helperText={`= ${(subjectForm.mid2ObjectiveMarks / 2).toFixed(1)}/10`}
              />
            </Grid>
            <Grid item xs={12}>
              <Chip label={`Mid-2 Total: ${subjectForm.mid2TotalMarks} / 30`} color="primary" size="small" sx={{ fontWeight: 700 }} />
            </Grid>

            {/* COMBINED INTERNAL & SEMESTER EXAM */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color={COLORS.secondary} sx={{ mb: 1 }}>
                3. EVALUATION & SEMESTER EXAMINATION
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Continuous Internal (80% Best Mid + 20% Other Mid, Max 30)"
                value={subjectForm.convertedInternalMarks}
                disabled
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <Tooltip title={isFaculty ? "Semester Final Marks are entered by Admin only." : "Enter final semester examination marks (Max 70)"}>
                <TextField
                  fullWidth
                  label="Semester Exam Marks (Max 70 — Admin Authority)"
                  type="number"
                  disabled={isFaculty}
                  value={subjectForm.semesterMarks}
                  onChange={(e) => handleSubjectMarksChange('semesterMarks', e.target.value)}
                  size="small"
                  inputProps={{ min: 0, max: 70 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 0.5, border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Final Subject Total</Typography>
                  <Typography variant="h6" fontWeight={800} color={COLORS.primary}>{subjectForm.totalMarks} / 100</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Institutional Grade</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={subjectForm.grade} sx={{ fontWeight: 800, bgcolor: getGradeColor(subjectForm.grade).bg, color: getGradeColor(subjectForm.grade).text }} />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Grade Point</Typography>
                  <Typography variant="h6" fontWeight={800}>{Number(subjectForm.gradePoint).toFixed(1)} GP</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSingleSubject}
            disabled={saving}
            sx={{ bgcolor: COLORS.primary, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Saving to Database...' : 'Save Subject Marks'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Marks Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileUpload sx={{ color: COLORS.primary }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Batch Marks Import (Excel / CSV)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setImportDialogOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Upload or paste CSV student marks data matching Enrollment Number, Semester, and Subject Code.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleDownloadCsvTemplate}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
            >
              Download CSV Template
            </Button>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={8}
            placeholder={`enrollmentNumber,semesterCode,subjectCode,subjectName,creditHours,mid1DescriptiveMarks,mid1OpenBookMarks,mid1ObjectiveMarks,mid2DescriptiveMarks,mid2OpenBookMarks,mid2ObjectiveMarks,semesterMarks,attendancePercentage\n2024CS001,1-1,CS101,Problem Solving through C,4,28,18,19,29,19,20,66,95\n2024CS002,1-1,CS101,Problem Solving through C,4,27,16,18,28,18,19,64,90`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mb: 2 }}
          />

          {importReport && (
            <Alert severity={importReport.errors?.length ? "warning" : "success"} sx={{ borderRadius: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Import Summary: {importReport.importedCount} records imported, {importReport.skippedCount} skipped.
              </Typography>
              {importReport.errors?.map((err, i) => (
                <Typography key={i} variant="caption" display="block" color="error">
                  • {err}
                </Typography>
              ))}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setImportDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Close</Button>
          <Button
            variant="contained"
            onClick={handleProcessCsvImport}
            disabled={importing || !csvText.trim()}
            sx={{ bgcolor: COLORS.primary, textTransform: 'none', fontWeight: 600 }}
          >
            {importing ? 'Processing Import...' : 'Import Records'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

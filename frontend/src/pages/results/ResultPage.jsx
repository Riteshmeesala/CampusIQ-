import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Chip, Button, Tab, Tabs,
  CircularProgress, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Alert, Divider, Grid, Paper
} from '@mui/material';
import { Publish, Refresh, Close, BarChart, School } from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip as CTooltip, Legend
} from 'chart.js';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS, getPerfColor, getPerfBg } from '../../theme/theme';
import { anim, shimmerBg } from '../../theme/animations';
import { toast } from 'react-toastify';
import { broadcastDataChange, updateSharedStudentCgpa, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';

ChartJS.register(CategoryScale, LinearScale, BarElement, CTooltip, Legend);

// ── Grade / color helpers ─────────────────────────────────────────────────────
function calcGrade(pct) {
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
}
const gradeClr = (g) => {
  if (!g) return '#64748b';
  if (g === 'O')  return '#059669';
  if (g === 'A+') return '#0284c7';
  if (g === 'A')  return '#7c3aed';
  if (g === 'B+') return '#d97706';
  if (g === 'B')  return '#ea580c';
  return '#dc2626';
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLISH DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function PublishDialog({ open, onClose, onDone, type }) {
  const isSem   = type === 'SEM';
  const [courses,   setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [exams,    setExams]   = useState([]);
  const [students, setStudents]= useState([]);
  const [academicRecordsMap, setAcademicRecordsMap] = useState({});
  const [examId,   setExamId]  = useState('');
  const [remarks,  setRemarks] = useState('');
  const [loading,  setLoading] = useState(false);
  const [saving,   setSaving]  = useState(false);

  // For Mid marks breakdown: { [studentId]: { desc: 27, ob: 16, assgn: 5, obj: 18 } }
  const [breakdowns, setBreakdowns] = useState({});
  // For Sem marks: { [studentId]: semMarks }
  const [semMarks,   setSemMarks]   = useState({});

  // Load courses + exams + students when dialog opens
  useEffect(() => {
    if (!open) return;
    setExamId(''); setSelectedCourseId(''); setBreakdowns({}); setSemMarks({}); setRemarks('');
    setLoading(true);
    Promise.all([
      api.get('/exams'),
      api.get('/users/students'),
      api.get('/courses').catch(() => ({ data: { data: [] } }))
    ])
      .then(([er, sr, cr]) => {
        const crs = cr.data?.data || [];
        setCourses(crs);

        const allExams = er.data?.data || [];
        const filtered = allExams.filter(e => {
          const t = (e.examType || '').toUpperCase();
          if (isSem) return t.includes('SEM') || t.includes('FINAL') || t.includes('SEMESTER');
          return t.includes('MID') || t.includes('INTERNAL');
        });
        setExams(filtered.length > 0 ? filtered : allExams);
        const stds = sr.data?.data || [];
        setStudents(stds);

        if (!isSem) {
          const initB = {};
          stds.forEach(s => {
            initB[s.id] = { desc: 27, ob: 16, assgn: 5, obj: 18 };
          });
          setBreakdowns(initB);
        } else {
          const initS = {};
          stds.forEach(s => {
            initS[s.id] = 58;
          });
          setSemMarks(initS);
        }

        if (crs.length > 0) {
          const firstC = crs[0];
          setSelectedCourseId(String(firstC.id));
          const matchEx = filtered.find(e => String(e.course?.id) === String(firstC.id) || e.course?.courseCode === firstC.courseCode);
          if (matchEx) setExamId(String(matchEx.id));
        }
      })
      .catch(() => toast.error('Could not load exams/students/courses'))
      .finally(() => setLoading(false));
  }, [open, isSem]);

  const selExam = exams.find(e => String(e.id) === String(examId));
  const selCourse = courses.find(c => String(c.id) === String(selectedCourseId))
    || selExam?.course
    || (examId ? exams.find(e => String(e.id) === String(examId))?.course : null);

  const handleCourseChange = (cId) => {
    setSelectedCourseId(cId);
    if (!cId) { setExamId(''); return; }
    const courseObj = courses.find(c => String(c.id) === String(cId));
    const matched = exams.find(e => {
      const matchCourse = String(e.course?.id) === String(cId) || e.course?.courseCode === courseObj?.courseCode;
      return matchCourse;
    });
    if (matched) {
      setExamId(String(matched.id));
    }
  };

  const handleExamChange = (newExamId) => {
    setExamId(newExamId);
    const chosen = exams.find(e => String(e.id) === String(newExamId));
    if (chosen?.course?.id) {
      setSelectedCourseId(String(chosen.course.id));
    }
  };

  // Load student academic records for the selected course
  useEffect(() => {
    if (!students || students.length === 0) return;
    const targetCode = selCourse?.courseCode || selExam?.course?.courseCode;
    students.forEach(s => {
      api.get(`/academic-records/student/${s.id}`)
        .then(res => {
          const semRecords = res.data?.data?.semesterRecords || {};
          let foundSubject = null;
          for (const key of Object.keys(semRecords)) {
            const list = semRecords[key] || [];
            const match = targetCode ? list.find(r => r.subjectCode === targetCode) : list[0];
            if (match) { foundSubject = match; break; }
          }
          if (foundSubject) {
            setAcademicRecordsMap(prev => ({ ...prev, [s.id]: foundSubject }));
          }
        })
        .catch(() => {});
    });
  }, [selExam, selectedCourseId, selCourse, students]);

  // Compute 30-mark mid total: (desc/3) + (ob/4) + assgn + (obj/2)
  const calcMidTotal = (b) => {
    if (!b) return 0;
    const d = Math.max(0, Math.min(30, Number(b.desc) || 0));
    const o = Math.max(0, Math.min(20, Number(b.ob) || 0));
    const a = Math.max(0, Math.min(5,  Number(b.assgn) || 0));
    const j = Math.max(0, Math.min(20, Number(b.obj) || 0));
    return Number(((d / 3.0) + (o / 4.0) + a + (j / 2.0)).toFixed(2));
  };

  const handlePublish = async () => {
    if (!examId) { toast.warning('Select an exam first'); return; }

    const studentMarks = {};
    const studentBreakdowns = {};
    let count = 0;

    if (isSem) {
      for (const s of students) {
        const raw = semMarks[s.id];
        if (raw === undefined || raw === '') continue;
        const num = parseFloat(raw);
        if (isNaN(num) || num < 0 || num > 70) {
          toast.warning(`${s.name}: Semester exam marks must be between 0 and 70`);
          return;
        }
        studentMarks[s.id] = num;
        count++;
      }
    } else {
      for (const s of students) {
        const b = breakdowns[s.id];
        if (!b) continue;
        const tot = calcMidTotal(b);
        studentMarks[s.id] = tot;
        studentBreakdowns[s.id] = {
          descriptive: Number(b.desc) || 0,
          openBook:    Number(b.ob) || 0,
          assignment:  Number(b.assgn) || 0,
          objective:   Number(b.obj) || 0,
        };
        count++;
      }
    }

    if (count === 0) { toast.warning('Enter marks for at least one student'); return; }

    setSaving(true);
    try {
      const endpoint = isSem ? '/results/publish/sem' : '/results/publish/mid';
      const payload = {
        examId: Number(examId),
        studentMarks,
        remarks: remarks.trim() || null,
      };
      if (!isSem) {
        payload.studentBreakdowns = studentBreakdowns;
      }

      const res = await api.post(endpoint, payload);
      const publishedList = res.data?.data || [];
      if (Array.isArray(publishedList)) {
        publishedList.forEach(r => {
          const sId = r.student?.id || r.studentId;
          if (sId) {
            const gpa = r.gradePoints != null ? parseFloat(r.gradePoints) : (r.marksObtained ? parseFloat(r.marksObtained) / 10 : 8.5);
            updateSharedStudentCgpa(sId, gpa, selExam?.semester || 4, remarks);
          }
        });
      }
      broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, { examId, isSem, count, results: publishedList });
      toast.success(`✅ ${isSem ? 'Semester (Admin)' : 'Mid-semester (Faculty)'} results published for ${count} student(s)! Automatically synced to all portals.`);
      onDone();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to publish';
      toast.error(`❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>

      {/* Title */}
      <DialogTitle sx={{
        fontWeight: 800, fontSize: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #f1f5f9', pb: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSem ? '📖 Publish Semester Results — Admin Authority (70 Sem / 30 Mid = 100)' : '📝 Publish Mid-Semester Results — Faculty Authority (Max 30)'}
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {isSem ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
            ⚠️ <strong>Admin Authority Only:</strong> Enter Semester End Exam marks (Max 70, pass threshold 24). Overall pass threshold is 40 (Sem + Mid ≥ 40), requiring at least 16 in Mid if Sem is 24, otherwise higher in Sem.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
            📝 <strong>Faculty Authority Only:</strong> Enter Continuous Assessment breakdown: Descriptive (Max 30 &rarr; /3 = 10), Open Book (Max 20 &rarr; /4 = 5), Assignment (Max 5 = 5), Objective (Max 20 &rarr; /2 = 10) &rarr; Overall Mid 30 marks. Automatically synchronizes for Student and Admin.
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Subject and Exam Selectors */}
            <Grid container spacing={2} sx={{ mb: 1.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select fullWidth size="small" label="Select Subject / Course *"
                  value={selectedCourseId} onChange={e => handleCourseChange(e.target.value)}>
                  <MenuItem value="">— Choose Subject / Course —</MenuItem>
                  {courses.map(c => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span><strong>{c.courseCode}</strong> — {c.courseName}</span>
                        <Chip label={`${c.creditHours} Cr`} size="small" sx={{ height: 18, fontSize: 10 }} />
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select fullWidth size="small" label="Select Target Exam *"
                  value={examId} onChange={e => handleExamChange(e.target.value)}>
                  <MenuItem value="">— Choose exam —</MenuItem>
                  {exams
                    .filter(e => !selectedCourseId || String(e.course?.id) === String(selectedCourseId) || e.course?.courseCode === selCourse?.courseCode)
                    .map(e => (
                      <MenuItem key={e.id} value={String(e.id)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                          <span><strong>{e.examName}</strong></span>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip label={e.examType || 'EXAM'} size="small" sx={{ fontSize: 10, height: 18 }} />
                            <Chip label={`Max: ${isSem ? 70 : 30}`} size="small"
                              sx={{ fontSize: 10, height: 18, bgcolor: '#f1f5f9' }} />
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Quick Subject Selectors */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Curriculum Subjects:
              </Typography>
              {courses.map(c => {
                const isSelected = String(c.id) === String(selectedCourseId) || c.courseCode === selCourse?.courseCode;
                return (
                  <Chip
                    key={c.id}
                    label={`${c.courseCode}`}
                    size="small"
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => handleCourseChange(String(c.id))}
                    sx={{ cursor: 'pointer', fontWeight: isSelected ? 800 : 500 }}
                  />
                );
              })}
            </Box>

            {/* Selected Subject Banner */}
            {selCourse && (
              <Paper sx={{ p: 1.5, mb: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={800} color="#0f172a">
                    📚 Subject: {selCourse.courseCode} — {selCourse.courseName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Department: {selCourse.department || 'Computer Science'} • Credits: {selCourse.creditHours} • Criteria: {isSem ? '70 Sem External + 30 Mid Internal (80/20 Rule) = 100 Total' : 'Continuous Mid Assessment (Max 30)'}
                  </Typography>
                </Box>
                <Chip
                  label={isSem ? 'Admin Authority (70)' : 'Faculty Authority (30)'}
                  size="small"
                  color={isSem ? 'primary' : 'success'}
                  sx={{ fontWeight: 700 }}
                />
              </Paper>
            )}

            {/* Marks table */}
            {examId && (
              <>
                {!isSem ? (
                  /* Faculty Mid Marks breakdown table */
                  <TableContainer sx={{ maxHeight: 380, border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                          <TableCell sx={{ width: 40 }}>#</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell sx={{ width: 120 }}>Descriptive (30/3)</TableCell>
                          <TableCell sx={{ width: 120 }}>Open Book (20/4)</TableCell>
                          <TableCell sx={{ width: 110 }}>Assignment (5)</TableCell>
                          <TableCell sx={{ width: 120 }}>Objective (20/2)</TableCell>
                          <TableCell sx={{ width: 110 }}>Mid Total (/30)</TableCell>
                          <TableCell sx={{ width: 90 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((s, i) => {
                          const b = breakdowns[s.id] || { desc: 0, ob: 0, assgn: 0, obj: 0 };
                          const tot = calcMidTotal(b);
                          return (
                            <TableRow key={s.id} hover>
                              <TableCell sx={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                  {s.enrollmentNumber || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField size="small" type="number"
                                  value={b.desc}
                                  onChange={e => {
                                    const v = Math.max(0, Math.min(30, parseFloat(e.target.value) || 0));
                                    setBreakdowns(prev => ({ ...prev, [s.id]: { ...b, desc: v } }));
                                  }}
                                  inputProps={{ min: 0, max: 30, step: 0.5 }}
                                  helperText={`= ${(b.desc / 3).toFixed(1)} / 10`}
                                  sx={{ width: 100, '& input': { py: 0.5, px: 1, fontSize: 13 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField size="small" type="number"
                                  value={b.ob}
                                  onChange={e => {
                                    const v = Math.max(0, Math.min(20, parseFloat(e.target.value) || 0));
                                    setBreakdowns(prev => ({ ...prev, [s.id]: { ...b, ob: v } }));
                                  }}
                                  inputProps={{ min: 0, max: 20, step: 0.5 }}
                                  helperText={`= ${(b.ob / 4).toFixed(1)} / 5`}
                                  sx={{ width: 100, '& input': { py: 0.5, px: 1, fontSize: 13 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField size="small" type="number"
                                  value={b.assgn}
                                  onChange={e => {
                                    const v = Math.max(0, Math.min(5, parseFloat(e.target.value) || 0));
                                    setBreakdowns(prev => ({ ...prev, [s.id]: { ...b, assgn: v } }));
                                  }}
                                  inputProps={{ min: 0, max: 5, step: 0.5 }}
                                  helperText="Max: 5"
                                  sx={{ width: 90, '& input': { py: 0.5, px: 1, fontSize: 13 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField size="small" type="number"
                                  value={b.obj}
                                  onChange={e => {
                                    const v = Math.max(0, Math.min(20, parseFloat(e.target.value) || 0));
                                    setBreakdowns(prev => ({ ...prev, [s.id]: { ...b, obj: v } }));
                                  }}
                                  inputProps={{ min: 0, max: 20, step: 0.5 }}
                                  helperText={`= ${(b.obj / 2).toFixed(1)} / 10`}
                                  sx={{ width: 100, '& input': { py: 0.5, px: 1, fontSize: 13 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={800} color="primary.main">
                                  {tot} <Typography component="span" variant="caption" color="text.secondary">/ 30</Typography>
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label="Recorded" size="small"
                                  sx={{
                                    bgcolor: '#e0f2fe',
                                    color:   '#0369a1',
                                    fontSize: 10, fontWeight: 700,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  /* Admin Sem Marks table (70 sem + 30 mid = 100 total) */
                  <TableContainer sx={{ maxHeight: 380, border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                          <TableCell sx={{ width: 40 }}>#</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell sx={{ width: 140 }}>Sem Exam (/70)<br /><span style={{ fontSize: 10, color: '#64748b' }}>Pass: 24</span></TableCell>
                          <TableCell sx={{ width: 120 }}>Mid Marks (/30)</TableCell>
                          <TableCell sx={{ width: 120 }}>Total Marks (/100)<br /><span style={{ fontSize: 10, color: '#64748b' }}>Pass: 40</span></TableCell>
                          <TableCell sx={{ width: 80 }}>Grade</TableCell>
                          <TableCell sx={{ width: 90 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((s, i) => {
                          const rec = academicRecordsMap[s.id];
                          let mid = 25.0;
                          if (rec) {
                            const m1 = rec.mid1TotalMarks != null ? parseFloat(rec.mid1TotalMarks) : null;
                            const m2 = rec.mid2TotalMarks != null ? parseFloat(rec.mid2TotalMarks) : null;
                            if (m1 != null && m2 != null) {
                              mid = Math.min(30, Math.round(((0.80 * Math.max(m1, m2)) + (0.20 * Math.min(m1, m2))) * 100) / 100);
                            } else if (rec.convertedInternalMarks != null) {
                              mid = parseFloat(rec.convertedInternalMarks);
                            } else if (rec.midMarks != null) {
                              mid = parseFloat(rec.midMarks);
                            } else if (m1 != null) {
                              mid = m1;
                            }
                          }
                          const raw = semMarks[s.id];
                          const sem = (raw !== undefined && raw !== '') ? parseFloat(raw) : 0;
                          const total = Number((sem + mid).toFixed(2));
                          const pass = sem >= 24 && total >= 40;
                          const pct = total;
                          const gr = pass ? calcGrade(pct) : 'F';
                          return (
                            <TableRow key={s.id} hover>
                              <TableCell sx={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                  {s.enrollmentNumber || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField size="small" type="number"
                                  value={semMarks[s.id] ?? ''}
                                  onChange={e => {
                                    const v = Math.max(0, Math.min(70, parseFloat(e.target.value) || 0));
                                    setSemMarks(prev => ({ ...prev, [s.id]: v }));
                                  }}
                                  inputProps={{ min: 0, max: 70, step: 0.5 }}
                                  helperText="Pass: >= 24/70"
                                  sx={{ width: 120, '& input': { py: 0.5, px: 1, fontSize: 13 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={600} color="secondary.main">
                                  {mid} <Typography component="span" variant="caption" color="text.secondary">/ 30</Typography>
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={800} color={pass ? '#059669' : '#dc2626'}>
                                  {total} <Typography component="span" variant="caption" color="text.secondary">/ 100</Typography>
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={gr} size="small"
                                  sx={{ bgcolor: gradeClr(gr) + '22', color: gradeClr(gr), fontWeight: 800, fontSize: 12 }} />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={pass ? 'Passed' : 'Failed'} size="small"
                                  sx={{
                                    bgcolor: pass ? '#dcfce7' : '#fee2e2',
                                    color:   pass ? '#15803d' : '#dc2626',
                                    fontSize: 10, fontWeight: 700,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* Remarks */}
            <TextField
              fullWidth multiline rows={2} size="small"
              label="Remarks (optional)" value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Official evaluation verified and released." />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, color: '#64748b' }}>Cancel</Button>
        <Button variant="contained" disabled={saving || loading || !examId}
          onClick={handlePublish}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Publish />}
          sx={{
            borderRadius: 2, px: 3,
            bgcolor:   isSem ? COLORS.primary    : COLORS.secondary,
            '&:hover': { bgcolor: isSem ? '#0d1657' : '#1e3a8a' },
          }}>
          {saving ? 'Publishing…' : (isSem ? 'Publish Sem Results (Admin)' : 'Publish Mid Results (Faculty)')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ResultPage() {
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'ADMIN';
  const isFaculty  = user?.role === 'FACULTY';
  const isStudent  = user?.role === 'STUDENT';
  const isStaff    = isAdmin || isFaculty;

  const [tab,      setTab]     = useState(0);
  const [results,  setResults] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [midOpen,  setMidOpen] = useState(false);
  const [semOpen,  setSemOpen] = useState(false);

  // Derived lists
  const midResults = results.filter(r => r.resultType !== 'SEM');
  const semResults = results.filter(r => r.resultType === 'SEM');
  const shown      = tab === 0 ? results : tab === 1 ? midResults : semResults;

  const loadResults = useCallback(() => {
    setLoading(true);
    // Students  → /results/my   (their own marks)
    // Staff     → /results/all  (all students' marks)
    const url = isStudent ? '/results/my' : '/results/all';
    api.get(url)
      .then(r => setResults(r.data?.data || []))
      .catch(err => {
        console.error('Results load failed:', err.response?.status, err.response?.data);
        toast.error('Failed to load results — check backend is running');
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [isStudent]);

  useEffect(() => { loadResults(); }, [loadResults]);

  // Computed stats
  const avgPct  = shown.length
    ? shown.reduce((s, r) => s + parseFloat(r.percentage || 0), 0) / shown.length : 0;
  const passedResults = results.filter(r => r.pass);
  const cgpa    = passedResults.length
    ? passedResults.reduce((s, r) => s + parseFloat(r.gradePoints || 0), 0) / passedResults.length : 0;

  const barData = {
    labels:   shown.map(r => r.exam?.course?.courseCode || r.exam?.examName || '—'),
    datasets: [{
      label: 'Score %',
      data:  shown.map(r => Math.round(parseFloat(r.percentage || 0))),
      backgroundColor: shown.map(r => getPerfColor(parseFloat(r.percentage || 0)) + 'cc'),
      borderRadius: 6,
    }],
  };

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Results"
        subtitle={isStudent ? 'Your mid-semester & semester marks' : 'Publish and manage exam results'}
        breadcrumbs={['Home', 'Results']}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isFaculty && (
              <Button variant="contained" startIcon={<Publish />}
                onClick={() => setMidOpen(true)}
                sx={{ borderRadius: 2, fontSize: 12, bgcolor: COLORS.secondary }}>
                Publish Mid Results
              </Button>
            )}
            {isAdmin && (
              <Button variant="contained" startIcon={<Publish />}
                onClick={() => setSemOpen(true)}
                sx={{ borderRadius: 2, fontSize: 12, bgcolor: COLORS.primary }}>
                Publish Sem Results
              </Button>
            )}
            <Tooltip title="Refresh">
              <IconButton onClick={loadResults} size="small"
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      {/* Student summary strip */}
      {isStudent && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'CGPA',          val: `${cgpa.toFixed(2)}/10`, color: getPerfColor(cgpa * 10) },
            { label: 'Avg Score',     val: `${avgPct.toFixed(1)}%`, color: getPerfColor(avgPct) },
            { label: 'Total Results', val: results.length,          color: COLORS.primary },
            { label: 'Passed',        val: results.filter(r => r.pass).length, color: '#059669' },
            { label: 'Failed',        val: results.filter(r => !r.pass).length,
              color: results.filter(r => !r.pass).length > 0 ? '#dc2626' : '#94a3b8' },
          ].map((c, i) => (
            <Card key={i} elevation={0}
              sx={{ flex: '1 1 110px', minWidth: 100, border: '1px solid #e2e8f0', borderRadius: 3, textAlign: 'center' }}>
              <Box sx={{ p: '12px 10px' }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: c.color, lineHeight: 1.1 }}>
                  {c.val}
                </Typography>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Main card */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>

        {/* Tabs — standard MUI Tabs + Tab components */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: '1px solid #f1f5f9',
            '& .MuiTab-root': { fontWeight: 600, fontSize: 13, minHeight: 48, textTransform: 'none' },
          }}>
          <Tab label={`All Results (${results.length})`} />
          <Tab label={`📝 Mid-Sem (${midResults.length})`} />
          <Tab label={`📖 Semester (${semResults.length})`} />
        </Tabs>

        {/* Loading */}
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>

        /* Empty state */
        ) : shown.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <School sx={{ fontSize: 52, color: '#cbd5e1', mb: 1 }} />
            <Typography color="text.secondary" mb={2} fontSize={14}>
              {tab === 1
                ? 'No mid-semester results yet.'
                : tab === 2
                ? 'No semester results yet.'
                : 'No results published yet.'}
            </Typography>
            {isFaculty && tab !== 2 && (
              <Button variant="outlined" startIcon={<Publish />} onClick={() => setMidOpen(true)}>
                Publish Mid Results Now
              </Button>
            )}
            {isAdmin && tab === 2 && (
              <Button variant="outlined" startIcon={<Publish />} onClick={() => setSemOpen(true)}>
                Publish Semester Results Now
              </Button>
            )}
          </Box>

        ) : (
          <>
            {/* Bar chart — only for students with 2+ results */}
            {isStudent && shown.length >= 2 && (
              <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BarChart fontSize="small" /> Score Distribution
                </Typography>
                <Box sx={{ height: 130 }}>
                  <Bar data={barData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { min: 0, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                      x: { grid: { display: false },               ticks: { font: { size: 10 } } },
                    },
                  }} />
                </Box>
                <Divider sx={{ mt: 2 }} />
              </Box>
            )}

            {/* Results table */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    {isStaff && <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }}>Subject / Exam</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shown.map(r => {
                    const pct = Math.round(parseFloat(r.percentage || 0));
                    return (
                      <TableRow key={r.id} hover>
                        {isStaff && (
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {r.student?.name || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {r.student?.enrollmentNumber || '—'}
                            </Typography>
                          </TableCell>
                        )}

                        {/* Subject */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {r.exam?.course?.courseName || r.exam?.examName || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {r.exam?.course?.courseCode} · {r.exam?.examName}
                          </Typography>
                        </TableCell>

                        {/* Type badge */}
                        <TableCell>
                          <Chip
                            label={r.resultType === 'SEM' ? '📖 Semester' : '📝 Mid-Sem'}
                            size="small"
                            sx={{
                              bgcolor: r.resultType === 'SEM' ? '#dbeafe' : '#dcfce7',
                              color:   r.resultType === 'SEM' ? '#1d4ed8' : '#15803d',
                              fontWeight: 700, fontSize: 10,
                            }}
                          />
                        </TableCell>

                        {/* Marks */}
                        <TableCell>
                          <Typography fontWeight={700}>
                            {r.marksObtained}
                            <Typography component="span" variant="caption" color="text.secondary">
                              &nbsp;/ {r.exam?.totalMarks ?? '—'}
                            </Typography>
                          </Typography>
                        </TableCell>

                        {/* Grade */}
                        <TableCell>
                          <Chip label={r.grade || '—'} size="small"
                            sx={{
                              bgcolor: gradeClr(r.grade) + '22',
                              color:   gradeClr(r.grade),
                              fontWeight: 800, fontSize: 13, minWidth: 38,
                            }}
                          />
                        </TableCell>

                        {/* Pass/Fail */}
                        <TableCell>
                          <Chip
                            label={r.pass ? '✅ Pass' : '❌ Fail'} size="small"
                            sx={{
                              bgcolor: r.pass ? '#dcfce7' : '#fee2e2',
                              color:   r.pass ? '#15803d' : '#dc2626',
                              fontWeight: 700, fontSize: 11,
                            }}
                          />
                        </TableCell>

                        {/* Progress bar */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <LinearProgress variant="determinate" value={pct}
                              sx={{
                                flex: 1, height: 7, borderRadius: 4,
                                bgcolor: getPerfColor(pct) + '22',
                                '& .MuiLinearProgress-bar': { bgcolor: getPerfColor(pct), borderRadius: 4 },
                              }}
                            />
                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 32, color: getPerfColor(pct) }}>
                              {pct}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table footer */}
            <Box sx={{ p: 2, bgcolor: '#fafbfc', borderTop: '1px solid #f1f5f9',
              display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {shown.length} result(s)
              </Typography>
              {shown.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Average: <strong style={{ color: getPerfColor(avgPct) }}>{avgPct.toFixed(1)}%</strong>
                </Typography>
              )}
              {isStudent && results.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  CGPA: <strong style={{ color: getPerfColor(cgpa * 10) }}>{cgpa.toFixed(2)} / 10</strong>
                </Typography>
              )}
            </Box>
          </>
        )}
      </Card>

      {/* Dialogs */}
      <PublishDialog open={midOpen} onClose={() => setMidOpen(false)} onDone={loadResults} type="MID" />
      <PublishDialog open={semOpen} onClose={() => setSemOpen(false)} onDone={loadResults} type="SEM" />
    </Box>
  );
}
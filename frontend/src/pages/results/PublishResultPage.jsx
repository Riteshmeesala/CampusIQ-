import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Chip, Divider, Grid, FormControl,
  InputLabel, Select, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Paper
} from '@mui/material';
import { Publish } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { examAPI, resultAPI, userAPI, academicRecordAPI, courseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { broadcastDataChange, DATA_SYNC_EVENTS } from '../../services/dataSync';

// Grade calculator for 100 total marks or scaled percentages
function calcGrade(totalMarks) {
  if (totalMarks == null || isNaN(totalMarks)) return '—';
  if (totalMarks >= 90) return 'S';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B';
  if (totalMarks >= 60) return 'C';
  if (totalMarks >= 50) return 'D';
  if (totalMarks >= 40) return 'E';
  return 'F';
}

function getGradeBg(grade) {
  switch (grade) {
    case 'S': return '#dcfce7';
    case 'A': return '#e0f2fe';
    case 'B': return '#ede9fe';
    case 'C': return '#fef3c7';
    case 'D': return '#ffedd5';
    case 'E': return '#fee2e2';
    default:  return '#f1f5f9';
  }
}

function getGradeColor(grade) {
  switch (grade) {
    case 'S': return '#15803d';
    case 'A': return '#0369a1';
    case 'B': return '#6d28d9';
    case 'C': return '#b45309';
    case 'D': return '#c2410c';
    case 'E': return '#b91c1c';
    default:  return '#64748b';
  }
}

export default function PublishResultPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isFaculty = user?.role === 'FACULTY';
  const isAdmin = user?.role === 'ADMIN';

  // Authority mode: Faculty ONLY has authority for MID; Admin ONLY has authority for SEM
  const mode = isFaculty ? 'MID' : (isAdmin ? 'SEM' : 'NONE');

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [existingResults, setExistingResults] = useState([]);
  const [academicRecordsMap, setAcademicRecordsMap] = useState({});
  const [examId, setExamId] = useState('');
  const [midTerm, setMidTerm] = useState('1'); // '1' or '2'
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Mid marks criteria state per student:
  // { [studentId]: { desc: 27, ob: 16, assign: 5, obj: 18 } }
  const [midBreakdowns, setMidBreakdowns] = useState({});

  // Direct sem marks state per student (for Admin):
  // { [studentId]: 62.5 }
  const [semMarks, setSemMarks] = useState({});

  useEffect(() => {
    Promise.all([
      examAPI.getAllExams(),
      userAPI.getStudents(),
      resultAPI.getAllResults().catch(() => ({ data: { data: [] } })),
      courseAPI.getAll().catch(() => ({ data: { data: [] } }))
    ])
      .then(([er, sr, rr, cr]) => {
        const allCourses = cr.data?.data || [];
        setCourses(allCourses);

        const allExams = er.data?.data || [];
        // Filter exams matching authority
        const filteredExams = allExams.filter(e => {
          if (mode === 'MID') {
            return e.examType === 'MID_SEM' || e.totalMarks <= 30;
          } else if (mode === 'SEM') {
            return e.examType === 'SEMESTER' || e.totalMarks >= 70;
          }
          return true;
        });
        setExams(filteredExams.length > 0 ? filteredExams : allExams);

        const list = sr.data?.data || [];
        setStudents(list);

        // Prepopulate default breakdown values for demo/speed
        const initMid = {};
        const initSem = {};
        list.forEach(s => {
          initMid[s.id] = { desc: '27', ob: '16', assign: '5', obj: '18' };
          initSem[s.id] = '62';
        });
        setMidBreakdowns(initMid);
        setSemMarks(initSem);

        setExistingResults(rr.data?.data || []);

        // Default to first subject if available
        if (allCourses.length > 0 && !selectedCourseId) {
          const firstCourse = allCourses[0];
          setSelectedCourseId(String(firstCourse.id));
          const matchExam = filteredExams.find(e => 
            String(e.course?.id) === String(firstCourse.id) || e.course?.courseCode === firstCourse.courseCode
          );
          if (matchExam) {
            setExamId(String(matchExam.id));
          }
        }
      })
      .catch(() => toast.error('Failed to load courses, exams or student roster'));
  }, [mode]);

  const selectedExam = exams.find(e => String(e.id) === String(examId));
  const selectedCourse = courses.find(c => String(c.id) === String(selectedCourseId))
    || selectedExam?.course
    || (examId ? exams.find(e => String(e.id) === String(examId))?.course : null);

  // When Admin or Faculty selects a Subject / Course
  const handleCourseChange = async (cId) => {
    setSelectedCourseId(cId);
    if (!cId) {
      setExamId('');
      return;
    }
    const courseObj = courses.find(c => String(c.id) === String(cId));
    if (!courseObj) return;

    // Search for a matching exam for this course
    const matched = exams.find(e => {
      const isCourseMatch = String(e.course?.id) === String(cId) || e.course?.courseCode === courseObj.courseCode;
      if (!isCourseMatch) return false;
      if (mode === 'SEM') {
        return e.examType === 'SEMESTER' || e.totalMarks >= 70;
      } else if (mode === 'MID') {
        const name = (e.examName || '').toLowerCase();
        const isMid2 = name.includes('mid 2') || name.includes('mid-2') || name.includes('mid2');
        return (e.examType === 'MID_SEM' || e.totalMarks <= 30) && (midTerm === '2' ? isMid2 : !isMid2);
      }
      return true;
    });

    if (matched) {
      setExamId(String(matched.id));
    } else {
      // Auto-create the exam if missing for this subject
      try {
        toast.info(`Initializing ${mode === 'SEM' ? 'Semester End' : 'Mid-' + midTerm} Examination for ${courseObj.courseCode}...`);
        const newExamPayload = {
          examName: mode === 'SEM'
            ? `Semester End Examination: ${courseObj.courseName}`
            : `Mid-Term ${midTerm}: ${courseObj.courseName}`,
          courseId: Number(cId),
          scheduledDate: new Date().toISOString(),
          durationMinutes: mode === 'SEM' ? 180 : 90,
          totalMarks: mode === 'SEM' ? 70 : 30,
          passingMarks: mode === 'SEM' ? 28 : 12,
          venue: 'Auditorium Hall',
          description: `${mode === 'SEM' ? 'University semester examination' : 'Mid examination'} for ${courseObj.courseName}`,
          semester: 4,
          examType: mode === 'SEM' ? 'SEMESTER' : 'MID_SEM',
          status: 'SCHEDULED'
        };
        const res = await examAPI.createExam(newExamPayload);
        const created = res.data?.data;
        if (created) {
          setExams(prev => [...prev, created]);
          setExamId(String(created.id));
          toast.success(`Exam linked for subject ${courseObj.courseCode}!`);
        }
      } catch (err) {
        console.warn('Auto-create exam warning:', err);
      }
    }
  };

  // Auto-detect Subject and Mid 1 vs Mid 2 when exam is selected directly
  const handleExamChange = (newExamId) => {
    setExamId(newExamId);
    const chosen = exams.find(e => String(e.id) === String(newExamId));
    if (chosen?.course?.id) {
      setSelectedCourseId(String(chosen.course.id));
    }
    if (chosen?.examName) {
      const lower = chosen.examName.toLowerCase();
      if (lower.includes('mid 2') || lower.includes('mid-2') || lower.includes('mid2')) {
        setMidTerm('2');
      } else {
        setMidTerm('1');
      }
    }
  };

  // Change Mid 1 vs Mid 2 slot
  const handleMidTermChange = async (newMidTerm) => {
    setMidTerm(newMidTerm);
    if (selectedCourseId) {
      const courseObj = courses.find(c => String(c.id) === String(selectedCourseId));
      let matched = exams.find(e => {
        const isCourseMatch = String(e.course?.id) === String(selectedCourseId) || e.course?.courseCode === courseObj?.courseCode;
        if (!isCourseMatch) return false;
        const name = (e.examName || '').toLowerCase();
        const isMid2 = name.includes('mid 2') || name.includes('mid-2') || name.includes('mid2');
        return (e.examType === 'MID_SEM' || e.totalMarks <= 30) && (newMidTerm === '2' ? isMid2 : !isMid2);
      });
      if (matched) {
        setExamId(String(matched.id));
      } else if (courseObj) {
        try {
          toast.info(`Initializing Mid-Term ${newMidTerm} Examination for ${courseObj.courseCode}...`);
          const newExamPayload = {
            examName: `Mid-Term ${newMidTerm}: ${courseObj.courseName}`,
            courseId: Number(selectedCourseId),
            scheduledDate: new Date().toISOString(),
            durationMinutes: 90,
            totalMarks: 30,
            passingMarks: 12,
            venue: 'Auditorium Hall',
            description: `Mid-Term ${newMidTerm} examination for ${courseObj.courseName}`,
            semester: 4,
            examType: 'MID_SEM',
            status: 'SCHEDULED'
          };
          const res = await examAPI.createExam(newExamPayload);
          const created = res.data?.data;
          if (created) {
            setExams(prev => [...prev, created]);
            setExamId(String(created.id));
            toast.success(`Mid-Term ${newMidTerm} exam linked for ${courseObj.courseCode}!`);
          }
        } catch (err) {
          console.warn('Auto-create exam error:', err);
        }
      }
    }
  };

  // Load student academic records for subjects to inspect Mid-1, Mid-2, and 80/20 rule
  useEffect(() => {
    if (!students || students.length === 0) return;
    const targetSubjectCode = selectedCourse?.courseCode || selectedExam?.course?.courseCode;
    students.forEach(s => {
      academicRecordAPI.getStudentRecords(s.id)
        .then(res => {
          const semRecords = res.data?.data?.semesterRecords || {};
          let foundSubject = null;
          for (const key of Object.keys(semRecords)) {
            const list = semRecords[key] || [];
            const match = targetSubjectCode
              ? list.find(r => r.subjectCode === targetSubjectCode)
              : list[0];
            if (match) {
              foundSubject = match;
              break;
            }
          }
          if (foundSubject) {
            setAcademicRecordsMap(prev => ({ ...prev, [s.id]: foundSubject }));
          }
        })
        .catch(() => {});
    });
  }, [selectedExam, selectedCourseId, selectedCourse, students]);

  // Pre-populate breakdowns based on selected Mid Term (1 vs 2) and academic records
  useEffect(() => {
    if (!students || students.length === 0) return;
    setMidBreakdowns(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        const rec = academicRecordsMap[s.id];
        if (rec) {
          if (midTerm === '2') {
            const hasMid2 = rec.mid2DescriptiveMarks != null || rec.mid2TotalMarks != null;
            if (hasMid2) {
              updated[s.id] = {
                desc: rec.mid2DescriptiveMarks != null ? String(rec.mid2DescriptiveMarks) : '27',
                ob: rec.mid2OpenBookMarks != null ? String(rec.mid2OpenBookMarks) : '16',
                assign: rec.mid2AssignmentMarks != null ? String(rec.mid2AssignmentMarks) : '5',
                obj: rec.mid2ObjectiveMarks != null ? String(rec.mid2ObjectiveMarks) : '18'
              };
              return;
            }
          } else {
            const hasMid1 = rec.mid1DescriptiveMarks != null || rec.mid1TotalMarks != null;
            if (hasMid1) {
              updated[s.id] = {
                desc: rec.mid1DescriptiveMarks != null ? String(rec.mid1DescriptiveMarks) : '27',
                ob: rec.mid1OpenBookMarks != null ? String(rec.mid1OpenBookMarks) : '16',
                assign: rec.mid1AssignmentMarks != null ? String(rec.mid1AssignmentMarks) : '5',
                obj: rec.mid1ObjectiveMarks != null ? String(rec.mid1ObjectiveMarks) : '18'
              };
              return;
            }
          }
        }
        if (!updated[s.id]) {
          updated[s.id] = { desc: '27', ob: '16', assign: '5', obj: '18' };
        }
      });
      return updated;
    });
  }, [midTerm, academicRecordsMap, students]);

  // Compute calculated Mid marks for a student based on exact criteria:
  // Descriptive 30 -> /3 (max 10)
  // Open Book 20 -> /4 (max 5)
  // Assignment 5 -> 5
  // Objective 20 -> /2 (max 10)
  // Overall Mid: (30/3) + (20/4) + 5 + (20/2) = 30 marks
  const computeStudentMid = (studentId) => {
    const b = midBreakdowns[studentId] || {};
    const d = parseFloat(b.desc) || 0;
    const ob = parseFloat(b.ob) || 0;
    const as = parseFloat(b.assign) || 0;
    const obj = parseFloat(b.obj) || 0;

    const dScaled = Math.min(10, Math.max(0, d / 3.0));
    const obScaled = Math.min(5, Math.max(0, ob / 4.0));
    const asScaled = Math.min(5, Math.max(0, as));
    const objScaled = Math.min(10, Math.max(0, obj / 2.0));

    const total = Math.min(30, Math.round((dScaled + obScaled + asScaled + objScaled) * 100) / 100);
    return {
      desc: d,
      dScaled,
      ob,
      obScaled,
      assign: as,
      asScaled,
      obj,
      objScaled,
      total,
      pass: total >= 12
    };
  };

  // Find student's Mid-1, Mid-2, and computed 80/20 combined internal marks for the SELECTED SUBJECT
  const getStudentMidDetails = (studentId) => {
    const rec = academicRecordsMap[studentId];
    let m1 = rec?.mid1TotalMarks != null ? parseFloat(rec.mid1TotalMarks) : null;
    let m2 = rec?.mid2TotalMarks != null ? parseFloat(rec.mid2TotalMarks) : null;

    const targetCode = selectedCourse?.courseCode || selectedExam?.course?.courseCode;
    const targetCourseId = selectedCourse?.id || selectedExam?.course?.id;

    if (m1 == null || m2 == null) {
      existingResults.forEach(r => {
        if (r.student?.id === studentId || r.studentId === studentId) {
          const rCourseCode = r.exam?.course?.courseCode || r.course?.courseCode;
          const rCourseId = r.exam?.course?.id || r.course?.id;
          // Filter specifically for the selected subject
          if (targetCode && rCourseCode && rCourseCode !== targetCode) return;
          if (targetCourseId && rCourseId && rCourseId !== targetCourseId) return;

          const name = (r.exam?.examName || '').toLowerCase();
          const score = parseFloat(r.marksObtained ?? r.midMarks);
          if (!isNaN(score)) {
            if (name.includes('mid 2') || name.includes('mid-2') || name.includes('mid2')) {
              if (m2 == null) m2 = score;
            } else if (name.includes('mid 1') || name.includes('mid-1') || name.includes('mid1') || r.resultType === 'MID') {
              if (m1 == null) m1 = score;
            }
          }
        }
      });
    }

    if (m1 != null && m2 != null) {
      const higher = Math.max(m1, m2);
      const lower = Math.min(m1, m2);
      const isM1Higher = m1 >= m2;
      const combined = Math.min(30, Math.round(((0.80 * higher) + (0.20 * lower)) * 100) / 100);
      return {
        m1,
        m2,
        combined,
        higherMid: isM1Higher ? 'Mid-1' : 'Mid-2',
        lowerMid: isM1Higher ? 'Mid-2' : 'Mid-1',
        higher,
        lower,
        ruleText: `80% from ${isM1Higher ? 'Mid-1' : 'Mid-2'} (${higher.toFixed(1)}) + 20% from ${isM1Higher ? 'Mid-2' : 'Mid-1'} (${lower.toFixed(1)}) = ${combined.toFixed(2)} / 30`
      };
    } else if (m1 != null) {
      return { m1, m2: null, combined: m1, higherMid: 'Mid-1', lowerMid: null, higher: m1, lower: null, ruleText: `Mid-1 recorded: ${m1.toFixed(1)} / 30 (Awaiting Mid-2)` };
    } else if (m2 != null) {
      return { m1: null, m2, combined: m2, higherMid: 'Mid-2', lowerMid: null, higher: m2, lower: null, ruleText: `Mid-2 recorded: ${m2.toFixed(1)} / 30 (Awaiting Mid-1)` };
    }
    const def = computeStudentMid(studentId).total || 25.0;
    return { m1: null, m2: null, combined: def, higherMid: null, lowerMid: null, higher: null, lower: null, ruleText: `Estimated: ${def.toFixed(1)} / 30` };
  };

  const handleMidChange = (studentId, field, val) => {
    setMidBreakdowns(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: val
      }
    }));
  };

  const handleSemChange = (studentId, val) => {
    setSemMarks(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  const handlePublish = async () => {
    if (!examId) {
      toast.warning('Please select an exam first');
      return;
    }

    setConfirmOpen(false);
    setSaving(true);

    try {
      if (mode === 'MID') {
        // Faculty Posting Mid Marks
        const studentMarks = {};
        const studentBreakdowns = {};

        students.forEach(s => {
          const calc = computeStudentMid(s.id);
          studentMarks[s.id] = calc.total;
          studentBreakdowns[s.id] = {
            descriptive: calc.desc,
            openBook: calc.ob,
            assignment: calc.assign,
            objective: calc.obj
          };
        });

        const res = await resultAPI.publishMid({
          examId: Number(examId),
          resultType: 'MID',
          midTerm: Number(midTerm),
          studentMarks,
          studentBreakdowns,
          remarks: remarks.trim() || `Mid-${midTerm} marks submitted by Faculty`
        });

        const list = res.data?.data || [];
        broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, {
          examId,
          type: 'MID',
          results: list
        });

        toast.success(`✅ Mid-${midTerm} marks posted for ${list.length} student(s)! Automatically synchronized for Students and Admins.`);
        navigate('/results');

      } else if (mode === 'SEM') {
        // Admin Posting Semester Results
        const studentFinalMarks = {};

        for (const s of students) {
          const raw = semMarks[s.id];
          const num = parseFloat(raw);
          if (isNaN(num) || num < 0 || num > 70) {
            toast.error(`Invalid semester marks for ${s.name} (must be 0 - 70)`);
            setSaving(false);
            return;
          }
          studentFinalMarks[s.id] = num;
        }

        const res = await resultAPI.publishSem({
          examId: Number(examId),
          resultType: 'SEM',
          studentMarks: studentFinalMarks,
          remarks: remarks.trim() || 'Final semester examination results published by University Admin'
        });

        const list = res.data?.data || [];
        broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, {
          examId,
          type: 'SEM',
          results: list
        });

        toast.success(`✅ Semester results published for ${list.length} student(s)! Automatically synchronized for Students and Faculty.`);
        navigate('/results');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to post marks';
      toast.error(`❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // If unauthorized user
  if (!isFaculty && !isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 3, mb: 2 }}>
          <strong>Access Restricted:</strong> Only Faculty members have authority to post Mid marks, and only Administrators have authority to post Semester results.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/results')} sx={{ borderRadius: 2 }}>
          View My Results
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={mode === 'MID' ? 'Faculty Portal — Post Mid-Semester Marks' : 'Admin Portal — Post Semester-End Results'}
        subtitle={mode === 'MID'
          ? 'Faculty exclusive authority: Enter Mid marks (30 Max). Marks automatically update for Students and Admin.'
          : 'Admin exclusive authority: Publish Semester marks (70 Max + 30 Mid = 100 Total). Automatically updates for Students and Faculty.'}
        breadcrumbs={['Home', 'Results', 'Publish']}
      />

      {/* Authority & Criteria Banner */}
      {mode === 'MID' ? (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1px solid #bbf7d0', borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip label="FACULTY AUTHORITY ONLY" size="small" sx={{ bgcolor: '#166534', color: '#fff', fontWeight: 800 }} />
              <Typography variant="h6" fontWeight={800} color="#14532d">
                Two Mid Examinations & Continuous Evaluation Criteria (Total: 30 Marks)
              </Typography>
            </Box>
            <Typography variant="body2" color="#166534" mb={2}>
              When posted by Faculty, marks are <strong>automatically synchronized in real-time for Students and Admins</strong>.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dcfce7' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>1. DESCRIPTIVE</Typography>
                  <Typography variant="h6" fontWeight={800} color="#15803d">Max 30 → /3 = 10</Typography>
                  <Typography variant="caption" color="text.secondary">Reduced by dividing by 3</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dcfce7' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>2. OPEN BOOK</Typography>
                  <Typography variant="h6" fontWeight={800} color="#0284c7">Max 20 → /4 = 5</Typography>
                  <Typography variant="caption" color="text.secondary">Reduced by dividing by 4</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dcfce7' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>3. ASSIGNMENT</Typography>
                  <Typography variant="h6" fontWeight={800} color="#7c3aed">5 Marks</Typography>
                  <Typography variant="caption" color="text.secondary">Continuous submission score</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dcfce7' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>4. OBJECTIVE</Typography>
                  <Typography variant="h6" fontWeight={800} color="#ea580c">Max 20 → /2 = 10</Typography>
                  <Typography variant="caption" color="text.secondary">Reduced by dividing by 2</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* 80/20 Rule Box */}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#dcfce7', borderRadius: 2, border: '1px solid #86efac' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#14532d" mb={0.5}>
                🎯 2-Mid Examination Institutional 80/20 Weightage Rule:
              </Typography>
              <Typography variant="body2" color="#166534">
                • <strong>If student got more marks in Mid-1:</strong> 80% weightage will be from Mid-1 and 20% from Mid-2.<br />
                • <strong>Vice versa, if student got more marks in Mid-2:</strong> 80% weightage will be from Mid-2 and 20% from Mid-1.<br />
                • <strong>Formula:</strong> <code>(0.80 × Higher Mid) + (0.20 × Lower Mid) = Combined Mid (Max 30 Marks)</code>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', border: '1px solid #bfdbfe', borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip label="ADMIN AUTHORITY ONLY" size="small" sx={{ bgcolor: COLORS.primary, color: '#fff', fontWeight: 800 }} />
              <Typography variant="h6" fontWeight={800} color="#1e3a8a">
                Semester Results Criteria: Total 100 Marks (70 Sem + 30 Combined Mid via 80/20 Rule)
              </Typography>
            </Box>
            <Typography variant="body2" color="#1e40af" mb={2}>
              As Administrator, you post the final <strong>70-mark Semester Examination results</strong>. The system automatically fetches Faculty's Mid-1 & Mid-2 marks to compute the <strong>80/20 combined internal (30 Max)</strong> and calculate the 100-mark final score, grade, and GPA. Results automatically synchronize for Students and Faculty.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dbeafe' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>SEMESTER EXAM</Typography>
                  <Typography variant="h6" fontWeight={800} color="#1e40af">70 Marks (Pass: 24)</Typography>
                  <Typography variant="caption" color="text.secondary">Min 24/70 required to pass</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dbeafe' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>80/20 MID INTERNAL</Typography>
                  <Typography variant="h6" fontWeight={800} color="#059669">30 Marks (No Grades)</Typography>
                  <Typography variant="caption" color="text.secondary">Need ≥16 to pass with 24 in Sem</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #dbeafe' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>FINAL SUBJECT TOTAL</Typography>
                  <Typography variant="h6" fontWeight={800} color="#7c3aed">100 Marks (Pass: 40)</Typography>
                  <Typography variant="caption" color="text.secondary">Sem (≥24) + Mid ≥ 40 to pass</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Subject & Examination */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                Step 1 — Select Subject / Course & Examination
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mode === 'SEM'
                  ? 'Select the curriculum subject below to enter 70-mark external semester examination results (Admin authority).'
                  : 'Select the curriculum subject and slot to enter 30-mark mid examination marks (Faculty authority).'}
              </Typography>
            </Box>
            {selectedCourse && (
              <Chip
                label={`${selectedCourse.courseCode}: ${selectedCourse.courseName}`}
                color="primary"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>

          <Grid container spacing={2}>
            {/* Primary: Select Subject / Course */}
            <Grid item xs={12} sm={mode === 'MID' ? 4 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel id="select-subject-label">Select Subject / Course *</InputLabel>
                <Select
                  labelId="select-subject-label"
                  value={selectedCourseId}
                  label="Select Subject / Course *"
                  onChange={e => handleCourseChange(e.target.value)}
                >
                  <MenuItem value="">— Choose Subject / Course —</MenuItem>
                  {courses.map(c => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      <strong>{c.courseCode}</strong> &nbsp;—&nbsp; {c.courseName} ({c.creditHours} Credits)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Examination Dropdown (Linked or selectable directly) */}
            <Grid item xs={12} sm={mode === 'MID' ? 3 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel id="select-exam-label">Select Exam *</InputLabel>
                <Select
                  labelId="select-exam-label"
                  value={examId}
                  label="Select Exam *"
                  onChange={e => handleExamChange(e.target.value)}
                >
                  <MenuItem value="">— Choose Exam —</MenuItem>
                  {exams
                    .filter(e => !selectedCourseId || String(e.course?.id) === String(selectedCourseId) || e.course?.courseCode === selectedCourse?.courseCode)
                    .map(e => (
                      <MenuItem key={e.id} value={String(e.id)}>
                        {e.examName} (Max: {e.totalMarks})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Mid Slot Selector (Faculty only) */}
            {mode === 'MID' && (
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mid-slot-label">Mid Exam Slot *</InputLabel>
                  <Select
                    labelId="mid-slot-label"
                    value={midTerm}
                    label="Mid Exam Slot *"
                    onChange={e => handleMidTermChange(e.target.value)}
                  >
                    <MenuItem value="1">Mid Exam 1 (Max 30)</MenuItem>
                    <MenuItem value="2">Mid Exam 2 (Max 30)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Evaluation Remarks */}
            <Grid item xs={12} sm={mode === 'MID' ? 3 : 4}>
              <TextField
                fullWidth
                size="small"
                label="Evaluation Remarks (Optional)"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Evaluated strictly as per 80/20 criteria"
              />
            </Grid>
          </Grid>

          {/* Quick Subject Selectors */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              All Subjects in Curriculum:
            </Typography>
            {courses.map(c => {
              const isSelected = String(c.id) === String(selectedCourseId) || c.courseCode === selectedCourse?.courseCode;
              return (
                <Chip
                  key={c.id}
                  label={`${c.courseCode}: ${c.courseName}`}
                  variant={isSelected ? 'filled' : 'outlined'}
                  color={isSelected ? 'primary' : 'default'}
                  onClick={() => handleCourseChange(String(c.id))}
                  size="small"
                  sx={{
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isSelected ? undefined : '#f1f5f9' }
                  }}
                />
              );
            })}
          </Box>

          {/* Subject Metadata Card when selected */}
          {selectedCourse && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SUBJECT CODE</Typography>
                <Typography variant="body1" fontWeight={800} color="primary.main">{selectedCourse.courseCode}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SUBJECT TITLE</Typography>
                <Typography variant="body1" fontWeight={700} color="#0f172a">{selectedCourse.courseName}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>CREDITS</Typography>
                <Typography variant="body1" fontWeight={700} color="#0f172a">{selectedCourse.creditHours} Credits</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>DEPARTMENT</Typography>
                <Typography variant="body1" fontWeight={700} color="#0f172a">{selectedCourse.department || 'Computer Science'}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ASSESSMENT CRITERIA</Typography>
                <Typography variant="body2" fontWeight={800} color="#15803d">
                  {mode === 'SEM' ? '70 Sem External + 30 80/20 Mid Internal = 100 Total' : `Mid Exam ${midTerm} (Max 30 Marks)`}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Marks Entry Table */}
      {!examId ? (
        <Card sx={{ mb: 4, borderRadius: 3, p: 4, textAlign: 'center', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <Typography variant="h6" fontWeight={700} color="#334155" mb={1}>
            Please select a Subject / Course above
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choose any subject from the academic curriculum above to load the student roster and enter marks.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {courses.map(c => (
              <Button
                key={c.id}
                variant="outlined"
                size="small"
                onClick={() => handleCourseChange(String(c.id))}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {c.courseCode} — {c.courseName}
              </Button>
            ))}
          </Box>
        </Card>
      ) : (
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                  Step 2 — {mode === 'MID'
                    ? `Enter Marks for Mid Examination ${midTerm} (Total: 30 Marks)`
                    : 'Enter Semester Examination Marks (Max: 70) — Combined with 80/20 Mid Marks'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Subject: <strong>{selectedCourse?.courseCode} — {selectedCourse?.courseName}</strong> ({selectedCourse?.creditHours} Credits)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`Subject: ${selectedCourse?.courseCode || 'All'}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`${students.length} Students Active`}
                  size="small"
                  sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}
                />
              </Box>
            </Box>
            <Divider />

            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Roll Number</TableCell>

                    {mode === 'MID' ? (
                      <>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                          Descriptive<br /><span style={{ fontSize: 11, color: '#15803d' }}>Max 30 (/3 → 10)</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#f0f9ff' }}>
                          Open Book<br /><span style={{ fontSize: 11, color: '#0369a1' }}>Max 20 (/4 → 5)</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#faf5ff' }}>
                          Assignment<br /><span style={{ fontSize: 11, color: '#7c3aed' }}>Max 5 (5)</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#fff7ed' }}>
                          Objective<br /><span style={{ fontSize: 11, color: '#c2410c' }}>Max 20 (/2 → 10)</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#dcfce7' }}>
                          Mid-{midTerm} Total<br /><span style={{ fontSize: 11, color: '#166534' }}>Overall 30</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Status</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#f8fafc' }}>
                          Mid-1<br /><span style={{ fontSize: 11, color: '#64748b' }}>/ 30</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#f8fafc' }}>
                          Mid-2<br /><span style={{ fontSize: 11, color: '#64748b' }}>/ 30</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                          Combined Mid (80/20)<br /><span style={{ fontSize: 11, color: '#15803d' }}>80% Best + 20% Low / 30</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#eff6ff', width: 140 }}>
                          Semester Marks<br /><span style={{ fontSize: 11, color: '#1e40af' }}>Max 70 (Pass: 24)</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', bgcolor: '#fef3c7' }}>
                          Total Marks<br /><span style={{ fontSize: 11, color: '#b45309' }}>Sem + Mid / 100 (Pass: 40)</span>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Final Grade</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Pass / Fail</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s, idx) => {
                    if (mode === 'MID') {
                      const calc = computeStudentMid(s.id);
                      const b = midBreakdowns[s.id] || {};
                      return (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ color: '#94a3b8' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            {s.enrollmentNumber || s.username}
                          </TableCell>
                          {/* Descriptive: 30 max -> /3 */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <TextField
                                size="small" type="number"
                                value={b.desc ?? ''}
                                onChange={e => handleMidChange(s.id, 'desc', e.target.value)}
                                inputProps={{ min: 0, max: 30, step: 0.5 }}
                                sx={{ width: 68 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                → <strong>{calc.dScaled.toFixed(1)}</strong>
                              </Typography>
                            </Box>
                          </TableCell>
                          {/* Open Book: 20 max -> /4 */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <TextField
                                size="small" type="number"
                                value={b.ob ?? ''}
                                onChange={e => handleMidChange(s.id, 'ob', e.target.value)}
                                inputProps={{ min: 0, max: 20, step: 0.5 }}
                                sx={{ width: 68 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                → <strong>{calc.obScaled.toFixed(1)}</strong>
                              </Typography>
                            </Box>
                          </TableCell>
                          {/* Assignment: 5 max */}
                          <TableCell align="center">
                            <TextField
                              size="small" type="number"
                              value={b.assign ?? ''}
                              onChange={e => handleMidChange(s.id, 'assign', e.target.value)}
                              inputProps={{ min: 0, max: 5, step: 0.5 }}
                              sx={{ width: 68 }}
                            />
                          </TableCell>
                          {/* Objective: 20 max -> /2 */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <TextField
                                size="small" type="number"
                                value={b.obj ?? ''}
                                onChange={e => handleMidChange(s.id, 'obj', e.target.value)}
                                inputProps={{ min: 0, max: 20, step: 0.5 }}
                                sx={{ width: 68 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                → <strong>{calc.objScaled.toFixed(1)}</strong>
                              </Typography>
                            </Box>
                          </TableCell>
                          {/* Mid Total out of 30 */}
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={800} color="#15803d">
                              {calc.total.toFixed(2)} / 30
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label="RECORDED"
                              size="small"
                              sx={{
                                bgcolor: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 700, fontSize: 11
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      // Admin SEM mode
                      const midDetails = getStudentMidDetails(s.id);
                      const rawSem = parseFloat(semMarks[s.id]) || 0;
                      const total100 = Math.min(100, Math.round((rawSem + midDetails.combined) * 100) / 100);
                      const isPass = rawSem >= 24 && total100 >= 40;
                      const grade = isPass ? calcGrade(total100) : 'F';

                      return (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ color: '#94a3b8' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            {s.enrollmentNumber || s.username}
                          </TableCell>

                          {/* Mid-1 Column */}
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                              {midDetails.m1 != null ? `${midDetails.m1.toFixed(1)}` : '—'}
                            </Typography>
                          </TableCell>

                          {/* Mid-2 Column */}
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                              {midDetails.m2 != null ? `${midDetails.m2.toFixed(1)}` : '—'}
                            </Typography>
                          </TableCell>

                          {/* Combined 80/20 Mid Marks */}
                          <TableCell align="center">
                            <Tooltip title={midDetails.ruleText} arrow>
                              <Chip
                                label={`${midDetails.combined.toFixed(1)} / 30`}
                                size="small"
                                sx={{
                                  bgcolor: '#dcfce7',
                                  color: '#166534',
                                  fontWeight: 800,
                                  cursor: 'help'
                                }}
                              />
                            </Tooltip>
                          </TableCell>

                          {/* Sem Marks Input */}
                          <TableCell align="center">
                            <TextField
                              size="small" type="number"
                              value={semMarks[s.id] ?? ''}
                              onChange={e => handleSemChange(s.id, e.target.value)}
                              inputProps={{ min: 0, max: 70, step: 0.5 }}
                              sx={{ width: 90 }}
                            />
                          </TableCell>

                          {/* Total Marks */}
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={800} color="#b45309">
                              {total100.toFixed(1)} / 100
                            </Typography>
                          </TableCell>

                          {/* Grade */}
                          <TableCell align="center">
                            <Chip
                              label={grade}
                              size="small"
                              sx={{
                                bgcolor: getGradeBg(grade),
                                color: getGradeColor(grade),
                                fontWeight: 800, minWidth: 32
                              }}
                            />
                          </TableCell>

                          {/* Pass / Fail */}
                          <TableCell align="center">
                            <Chip
                              label={isPass ? 'PASS' : 'FAIL'}
                              size="small"
                              sx={{
                                bgcolor: isPass ? '#dcfce7' : '#fee2e2',
                                color: isPass ? '#166534' : '#dc2626',
                                fontWeight: 800, fontSize: 11
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action Footer */}
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid #f1f5f9' }}>
              <Button
                variant="contained"
                onClick={() => setConfirmOpen(true)}
                disabled={saving || !examId}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Publish />}
                sx={{
                  borderRadius: 2, px: 3, py: 1,
                  bgcolor: mode === 'MID' ? '#166534' : COLORS.primary,
                  '&:hover': { bgcolor: mode === 'MID' ? '#14532d' : '#0d1657' }
                }}
              >
                {mode === 'MID' ? `Post Mid-${midTerm} Marks (Faculty)` : 'Publish Semester Results (Admin)'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {mode === 'MID' ? `Confirm Post Mid-${midTerm} Marks` : 'Confirm Publish Semester Results'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {mode === 'MID'
              ? `You are posting Mid-${midTerm} marks (30 Marks Max) as Faculty for ${students.length} student(s). These marks will automatically update in real-time for Students and Admins, and participate in the 80/20 weightage calculation.`
              : `You are publishing Semester-End results (70 Sem + 30 Combined Mid via 80/20 Rule = 100 Total) as Administrator for ${students.length} student(s). These results will automatically update in real-time for Students and Faculty.`}
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Students and respective stakeholders will see these updated marks immediately.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={saving}
            sx={{
              borderRadius: 2,
              bgcolor: mode === 'MID' ? '#166534' : COLORS.primary
            }}
          >
            {saving ? 'Processing...' : 'Confirm & Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


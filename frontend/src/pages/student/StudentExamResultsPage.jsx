import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip, FormControl,
  InputLabel, Select, MenuItem, Paper, Grid, Alert
} from '@mui/material';
import { MenuBookOutlined, Refresh, FilterList } from '@mui/icons-material';
import { resultAPI, gpaAPI, academicRecordAPI } from '../../services/api';
import { subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';

export default function StudentExamResultsPage() {
  const [results, setResults] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [academicRecords, setAcademicRecords] = useState(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('ALL');

  const loadData = () => {
    Promise.allSettled([
      resultAPI.getMyResults(),
      gpaAPI.getMyGpa(),
      academicRecordAPI.getMyRecords()
    ]).then(([res, gpaRes, recRes]) => {
      if (res.status === 'fulfilled') setResults(res.value.data?.data || []);
      if (gpaRes.status === 'fulfilled') setGpa(gpaRes.value.data?.data || null);
      if (recRes.status === 'fulfilled') setAcademicRecords(recRes.value.data?.data || null);
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    const unsub = subscribeToDataSync((event) => {
      if (event.type === DATA_SYNC_EVENTS.RESULT_PUBLISHED || event.type === 'CAMPUSIQ_DATA_MUTATED') {
        loadData();
      }
    });
    return () => {
      window.removeEventListener('focus', loadData);
      unsub();
    };
  }, []);

  // 1. Group results by Subject Code
  const subjectsMap = {};
  results.forEach(r => {
    const code = r.course?.courseCode || r.exam?.course?.courseCode || r.courseCode || 'SUB';
    const name = r.course?.courseName || r.exam?.course?.courseName || r.courseName || r.exam?.examName?.split(':')[1]?.trim() || r.exam?.examName || 'Subject Course';
    const credits = r.course?.creditHours || r.exam?.course?.creditHours || 4;
    const dept = r.course?.department || r.exam?.course?.department || 'Engineering';

    if (!subjectsMap[code]) {
      subjectsMap[code] = {
        code,
        name,
        credits,
        department: dept,
        results: [],
        mid1: null,
        mid2: null,
        sem: null
      };
    }

    subjectsMap[code].results.push(r);

    const examNameLower = (r.exam?.examName || '').toLowerCase();
    const examType = (r.exam?.examType || r.resultType || '').toUpperCase();

    if (examNameLower.includes('mid-term 1') || examNameLower.includes('mid 1') || examNameLower.includes('midterm 1') || examType === 'MID_1') {
      subjectsMap[code].mid1 = r;
    } else if (examNameLower.includes('mid-term 2') || examNameLower.includes('mid 2') || examNameLower.includes('midterm 2') || examType === 'MID_2') {
      subjectsMap[code].mid2 = r;
    } else if (examNameLower.includes('semester') || examNameLower.includes('end exam') || examNameLower.includes('sem end') || examType === 'END_SEM' || examType === 'SEMESTER') {
      subjectsMap[code].sem = r;
    } else if (r.resultType === 'MID' || (r.exam?.totalMarks && r.exam?.totalMarks <= 30)) {
      if (!subjectsMap[code].mid1) subjectsMap[code].mid1 = r;
      else if (!subjectsMap[code].mid2) subjectsMap[code].mid2 = r;
    } else {
      if (!subjectsMap[code].sem) subjectsMap[code].sem = r;
    }
  });

  // Merge official academic records (which store Mid-1, Mid-2, 80/20 Internal, Sem, etc.)
  if (academicRecords?.semesterRecords) {
    Object.values(academicRecords.semesterRecords).forEach(semList => {
      if (Array.isArray(semList)) {
        semList.forEach(rec => {
          const code = rec.subjectCode || 'SUB';
          if (!subjectsMap[code]) {
            subjectsMap[code] = {
              code,
              name: rec.subjectName || code,
              credits: rec.creditHours || 4,
              department: rec.department || 'Engineering',
              results: [],
              mid1: null,
              mid2: null,
              sem: null
            };
          }
          const s = subjectsMap[code];
          if (rec.mid1TotalMarks != null) s.recordMid1 = Number(rec.mid1TotalMarks);
          if (rec.mid2TotalMarks != null) s.recordMid2 = Number(rec.mid2TotalMarks);
          if (rec.convertedInternalMarks != null) s.recordInternal = Number(rec.convertedInternalMarks);
          if (rec.semesterMarks != null) s.recordSem = Number(rec.semesterMarks);
          if (rec.totalMarks != null) s.recordTotal = Number(rec.totalMarks);
          if (rec.grade) s.recordGrade = rec.grade;
          if (rec.gradePoint != null) s.recordGradePoint = Number(rec.gradePoint);
        });
      }
    });
  }

  // 2. Calculate Mid internal assessment (80:20 rule) and Semester totals
  Object.values(subjectsMap).forEach(sub => {
    const m1 = sub.recordMid1 ?? (sub.mid1 ? Number(sub.mid1.marksObtained || 0) : null);
    const m2 = sub.recordMid2 ?? (sub.mid2 ? Number(sub.mid2.marksObtained || 0) : null);

    let weightedMid = null;
    if (sub.recordInternal != null) {
      weightedMid = sub.recordInternal;
    } else if (m1 !== null && m2 !== null) {
      const best = Math.max(m1, m2);
      const second = Math.min(m1, m2);
      weightedMid = Number(((0.8 * best) + (0.2 * second)).toFixed(2));
    } else if (m1 !== null) {
      weightedMid = Number(m1.toFixed(2));
    } else if (m2 !== null) {
      weightedMid = Number(m2.toFixed(2));
    }

    sub.m1Marks = m1;
    sub.m2Marks = m2;
    sub.weightedMid = weightedMid;
    sub.semMarks = sub.recordSem ?? (sub.sem ? Number(sub.sem.marksObtained || 0) : null);

    if (sub.recordTotal != null) {
      sub.totalMarks = sub.recordTotal;
    } else if (weightedMid !== null && sub.semMarks !== null) {
      sub.totalMarks = Number((weightedMid + sub.semMarks).toFixed(2));
    } else if (sub.semMarks !== null) {
      sub.totalMarks = Number(sub.semMarks.toFixed(2));
    } else {
      sub.totalMarks = null;
    }

    // Passing Rule: Pass mark for sem is 24/70, overall mid+sem must be >= 40/100
    if (sub.sem || sub.recordSem != null) {
      const semPassed = sub.semMarks !== null && sub.semMarks >= 24;
      const totalPassed = sub.totalMarks !== null && sub.totalMarks >= 40;
      sub.isPassed = semPassed && totalPassed;
      sub.grade = sub.recordGrade || sub.sem?.grade || (sub.totalMarks >= 90 ? 'S' : sub.totalMarks >= 80 ? 'A' : sub.totalMarks >= 70 ? 'B' : sub.totalMarks >= 60 ? 'C' : sub.totalMarks >= 50 ? 'D' : sub.totalMarks >= 40 ? 'E' : 'F');
      sub.status = sub.isPassed ? 'PASSED' : 'FAILED';
    } else {
      sub.isPassed = null;
      sub.grade = sub.recordGrade || '—';
      sub.status = 'IN PROGRESS';
    }
  });

  const subjectList = Object.values(subjectsMap);

  // Filter based on user selection
  const filteredSubjects = selectedSubjectCode === 'ALL'
    ? subjectList
    : subjectList.filter(s => s.code === selectedSubjectCode);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Examination Results & Academic Performance"
        subtitle="Official semester SGPA/CGPA evaluation cards, subject grades, and credits earned"
        breadcrumbs={[{ label: 'Dashboard', path: '/student/dashboard' }, { label: 'Exam Results' }]}
      />

      {/* GPA Summary Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Box sx={{ p: 3, bgcolor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Overall Cumulative GPA (CGPA)
          </Typography>
          <Typography sx={{ fontSize: 34, fontWeight: 800, color: '#1e40af', mt: 0.5 }}>
            {gpa?.cgpa ? gpa.cgpa.toFixed(2) : 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#60a5fa' }}>Synchronized source of truth</Typography>
        </Box>
        <Box sx={{ p: 3, bgcolor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Current Semester GPA (SGPA)
          </Typography>
          <Typography sx={{ fontSize: 34, fontWeight: 800, color: '#166534', mt: 0.5 }}>
            {gpa?.sgpa ? gpa.sgpa.toFixed(2) : 'N/A'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#4ade80' }}>Latest semester evaluation</Typography>
        </Box>
      </Box>

      {/* Subject Filter Dropdown Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          mb: 3,
          bgcolor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: { xs: '100%', sm: 300 } }}>
          <FilterList sx={{ color: '#0f172a', fontSize: 22 }} />
          <FormControl size="small" fullWidth sx={{ maxWidth: { xs: '100%', sm: 420 } }}>
            <InputLabel id="subject-filter-label" sx={{ fontWeight: 600 }}>Select Subject</InputLabel>
            <Select
              labelId="subject-filter-label"
              value={selectedSubjectCode}
              label="Select Subject"
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              sx={{ borderRadius: '8px', fontWeight: 600, bgcolor: '#f8fafc' }}
            >
              <MenuItem value="ALL" sx={{ fontWeight: 700 }}>
                <em>All Enrolled Subjects ({subjectList.length})</em>
              </MenuItem>
              {subjectList.map(subj => (
                <MenuItem key={subj.code} value={subj.code}>
                  <strong>{subj.code}</strong> &nbsp;—&nbsp; {subj.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Showing: <strong>{selectedSubjectCode === 'ALL' ? 'All Subjects' : selectedSubjectCode}</strong>
          </Typography>
          <Tooltip title="Refresh Results">
            <IconButton size="small" onClick={loadData}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main Results Display */}
      {filteredSubjects.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <MenuBookOutlined sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>No Examination Results Found</Typography>
          <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Marks will appear here once published by the examination authority.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filteredSubjects.map(sub => (
            <Paper
              key={sub.code}
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                bgcolor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              {/* Subject Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        letterSpacing: 0.5
                      }}
                    >
                      {sub.code}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">
                      — {sub.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="#64748b" sx={{ fontSize: 12 }}>
                    Credits: <strong>{sub.credits}</strong> • Department: <strong>{sub.department}</strong>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {sub.grade && sub.grade !== '—' && (
                    <Box sx={{ textAlign: 'right', mr: 1 }}>
                      <Typography variant="caption" color="#64748b" display="block" sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                        Grade
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="#0284c7" sx={{ lineHeight: 1 }}>
                        {sub.grade}
                      </Typography>
                    </Box>
                  )}
                  <Chip
                    label={sub.status}
                    size="small"
                    sx={{
                      bgcolor: sub.status === 'PASSED' ? '#dcfce7' : sub.status === 'FAILED' ? '#fee2e2' : '#e0f2fe',
                      color: sub.status === 'PASSED' ? '#15803d' : sub.status === 'FAILED' ? '#dc2626' : '#0369a1',
                      fontWeight: 800,
                      fontSize: 12,
                      px: 1,
                      py: 0.5,
                      borderRadius: '6px'
                    }}
                  />
                </Box>
              </Box>

              {/* Subject Metrics Strip */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Mid 1 Score */}
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                      Mid-Term 1 (Max 30)
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                      {sub.m1Marks !== null ? `${sub.m1Marks.toFixed(1)} / 30` : (sub.mid1 ? `${sub.mid1.marksObtained} / 30` : '—')}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" sx={{ fontSize: 10 }}>
                      {sub.m1Marks !== null || sub.mid1 ? 'Internal Component' : 'Not recorded yet'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Mid 2 Score */}
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                      Mid-Term 2 (Max 30)
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                      {sub.m2Marks !== null ? `${sub.m2Marks.toFixed(1)} / 30` : (sub.mid2 ? `${sub.mid2.marksObtained} / 30` : '—')}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" sx={{ fontSize: 10 }}>
                      {sub.m2Marks !== null || sub.mid2 ? 'Internal Component' : 'Not recorded yet'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Semester End Exam */}
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                      Semester Exam (Max 70)
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                      {sub.semMarks !== null ? `${sub.semMarks} / 70` : '—'}
                    </Typography>
                    <Typography variant="caption" color={sub.semMarks !== null && sub.semMarks >= 24 ? '#059669' : '#dc2626'} sx={{ fontSize: 10, fontWeight: 600 }}>
                      {sub.semMarks !== null ? (sub.semMarks >= 24 ? 'Min 24 Met ✓' : 'Min 24 Not Met') : 'Min 24 to Pass'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Marks */}
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 2, bgcolor: sub.status === 'PASSED' ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: sub.status === 'PASSED' ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color={sub.status === 'PASSED' ? '#15803d' : '#64748b'} fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: 10 }}>
                      Overall Total (Max 100)
                    </Typography>
                    <Typography variant="h6" fontWeight={900} color={sub.status === 'PASSED' ? '#166534' : '#0f172a'} sx={{ mt: 0.5 }}>
                      {sub.totalMarks !== null ? `${sub.totalMarks} / 100` : (sub.semMarks !== null ? `${sub.semMarks} / 70` : '—')}
                    </Typography>
                    <Typography variant="caption" color="#64748b" sx={{ fontSize: 10 }}>
                      {sub.weightedMid !== null ? `Mid (80:20): ${sub.weightedMid} + Sem: ${sub.semMarks || 0}` : 'Min 40 to Pass'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Exam Breakdown Table for this Subject */}
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '9px 12px', fontWeight: 700, color: '#475569' }}>Exam Component</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, color: '#475569' }}>Type</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, color: '#475569' }}>Scored / Max</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, color: '#475569' }}>Passing Criteria</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, color: '#475569' }}>Grade</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Evaluation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.results.map((r, idx) => {
                      const isMid = r.resultType === 'MID' || (r.exam?.totalMarks && r.exam?.totalMarks <= 30);
                      const isPass = r.pass !== false && (r.isPass !== false);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                            {r.exam?.examName || 'Assessment'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>
                            {isMid ? 'Internal Examination' : 'End Semester Examination'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>
                            {r.marksObtained} / {r.exam?.totalMarks || (isMid ? 30 : 70)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>
                            {isMid ? 'Contributes to 30M Internal' : 'Min 24 / 70 Required'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0284c7' }}>
                            {isMid ? '—' : (r.grade || sub.grade || '—')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {isMid ? (
                              <Chip label="RECORDED" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: 11 }} />
                            ) : (
                              <Chip
                                label={isPass ? 'PASSED' : 'FAILED'}
                                size="small"
                                sx={{
                                  bgcolor: isPass ? '#dcfce7' : '#fee2e2',
                                  color: isPass ? '#15803d' : '#dc2626',
                                  fontWeight: 700,
                                  fontSize: 11
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Passing Criteria Guidance Alert */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info" sx={{ borderRadius: '10px', fontSize: 12, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <strong>University Examination Evaluation Norms:</strong> Internal marks are computed from both Mid-Terms using the <strong>80:20 rule</strong> (80% from higher score + 20% from lower score, out of 30). For Semester End Examination, minimum <strong>24 / 70</strong> is required, and overall aggregate (Mid + Sem) must be at least <strong>40 / 100</strong> to qualify as PASSED.
        </Alert>
      </Box>
    </Box>
  );
}

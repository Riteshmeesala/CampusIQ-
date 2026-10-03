import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress
} from '@mui/material';
import {
  Edit, Person, CheckCircle, Download,
  PictureAsPdf, Description, AccountBalance, School, AutoAwesome
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, feeAPI, gpaAPI, academicRecordAPI } from '../../services/api';
import { getSharedStudentCgpa, subscribeToDataSync } from '../../services/dataSync';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.studentId || user?.id;

  const [activeTab, setActiveTab] = useState('PROFILE');
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [academicProfile, setAcademicProfile] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [personalPhone, setPersonalPhone] = useState('9398215300');

  const TABS = [
    'PROFILE',
    'ATTENDANCE',
    'FEES ASSIGN',
    'BOOK ISSUES',
    'NOTES',
    'LEAVE',
    'DOCUMENTS',
    'BANK INFO',
    'SUMMARY',
    'COUNSELLING'
  ];

  const loadData = () => {
    Promise.allSettled([
      attendanceAPI.getMyAttendance(),
      feeAPI.getMyFees(),
      gpaAPI.getMyGpa(),
      academicRecordAPI.getMyRecords(),
    ]).then(([att, fee, gpaRes, acad]) => {
      if (att.status === 'fulfilled') {
        const records = att.value.data.data || [];
        const byCourse = {};
        records.forEach(r => {
          const code = r.course?.courseCode || 'UNK';
          const name = r.course?.courseName || code;
          if (!byCourse[code]) byCourse[code] = { subjectCode: code, subjectName: name, present: 0, total: 0 };
          byCourse[code].total++;
          if (r.status === 'PRESENT' || r.status === 'LATE') byCourse[code].present++;
        });
        const subjects = Object.values(byCourse).map(s => ({
          ...s,
          percentage: s.total ? (s.present / s.total) * 100 : 0,
          classesNeededFor75: Math.max(0, Math.ceil((0.75 * s.total - s.present) / 0.25)),
        }));
        const totalPresent = subjects.reduce((s, x) => s + x.present, 0);
        const totalClasses = subjects.reduce((s, x) => s + x.total, 0);
        setAttendance({
          overallPercentage: totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 88.5,
          totalPresent: totalPresent || 177,
          totalClasses: totalClasses || 200,
          subjectBreakdown: subjects.length ? subjects : [
            { subjectCode: 'IT411', subjectName: 'Cloud Computing & DevOps', present: 44, total: 50, percentage: 88, classesNeededFor75: 0 },
            { subjectCode: 'IT412', subjectName: 'Information Security & Cryptography', present: 46, total: 50, percentage: 92, classesNeededFor75: 0 },
            { subjectCode: 'IT413', subjectName: 'Full Stack Web Development', present: 45, total: 50, percentage: 90, classesNeededFor75: 0 },
            { subjectCode: 'IT414', subjectName: 'Machine Learning Applications', present: 42, total: 50, percentage: 84, classesNeededFor75: 0 },
          ]
        });
      }
      if (fee.status === 'fulfilled') setFees(fee.value.data?.data || []);
      if (gpaRes.status === 'fulfilled') setGpa(gpaRes.value.data?.data || null);
      if (acad.status === 'fulfilled') setAcademicProfile(acad.value.data?.data || null);
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    const unsubscribe = subscribeToDataSync(() => loadData());
    return () => {
      window.removeEventListener('focus', loadData);
      unsubscribe();
    };
  }, [studentId]);

  const sharedCgpa = getSharedStudentCgpa(studentId);
  const liveCgpa = sharedCgpa?.cgpa || academicProfile?.overallCgpa || gpa?.cgpa || 8.52;
  const liveSgpa = sharedCgpa?.sgpa || gpa?.sgpa || 8.52;

  // Student specific parameters matching the ERP screenshot
  const studentName = user?.name || 'MEESALA RITESH';
  const rollNumber = user?.enrollmentNumber || user?.username || '23BQ1A1268';
  const batchYear = user?.batchYear || '2023-27';
  const courseName = user?.course || 'Bachelor Of Technology';
  const branchName = user?.department || 'Information Technology';
  const academicYear = '2026-27';
  const semesterYear = user?.semester ? (user.semester === 7 ? '4-1' : user.semester) : '4-1';
  const sectionName = user?.section ? `Section ${user.section}` : 'Section B';
  const seatType = 'No Reimbursement';
  const studentEmail = user?.email || '23bq1a1268@vvit.net';
  const studentPhone = user?.phoneNumber || personalPhone;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HORIZONTAL TAB STRIP ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          bgcolor: '#ffffff',
          p: '4px 6px 0 6px',
          borderBottom: '2px solid #00b4d8',
          borderRadius: '6px 6px 0 0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              sx={{
                bgcolor: isActive ? '#00b4d8' : 'transparent',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                px: 2,
                py: 1,
                borderRadius: '4px 4px 0 0',
                textTransform: 'uppercase',
                boxShadow: isActive ? '0 -2px 6px rgba(0, 180, 216, 0.25)' : 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: isActive ? '#0096c7' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#0f172a'
                }
              }}
            >
              {tab}
            </Button>
          );
        })}

        <Button
          onClick={() => navigate('/student/chatbot')}
          sx={{
            ml: 'auto',
            bgcolor: '#0284c7',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 800,
            px: 2,
            py: 0.8,
            borderRadius: '4px 4px 0 0',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            boxShadow: '0 -2px 6px rgba(2, 132, 199, 0.25)',
            '&:hover': { bgcolor: '#0369a1' }
          }}
        >
          <AutoAwesome sx={{ fontSize: 16 }} />
          Campus AI Chatbot
        </Button>
      </Box>

      {/* ── MAIN TAB CONTAINER CARD ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          p: { xs: 2.5, md: 4 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          minHeight: 520
        }}
      >
        {/* ── 1. PROFILE TAB (EXACT MATCH TO SCREENSHOT 1) ── */}
        {activeTab === 'PROFILE' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '240px 1fr 300px' }, gap: { xs: 3, md: 4 } }}>
            {/* Left Column: Avatar Silhouette, Name, Roll No */}
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
              <Box
                sx={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  bgcolor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2.5,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                }}
              >
                <Person sx={{ fontSize: 72, color: '#f8fafc' }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: '#1e3a8a',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  mb: 0.5
                }}
              >
                {studentName}
              </Typography>
              <Typography sx={{ fontSize: '0.86rem', color: '#475569', fontWeight: 600 }}>
                Roll No. #{rollNumber}
              </Typography>
            </Box>

            {/* Middle Column: Academic Details & Personal Details */}
            <Box sx={{ borderLeft: { md: '1px solid #f1f5f9' }, borderRight: { md: '1px solid #f1f5f9' }, px: { md: 4 } }}>
              {/* Academic Details Section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #e2e8f0', mb: 2 }}>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Academic Details
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Edit sx={{ fontSize: 14 }} />}
                  onClick={() => setEditModalOpen(true)}
                  sx={{
                    bgcolor: '#16a34a',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    px: 1.6,
                    py: 0.4,
                    borderRadius: 1,
                    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                    '&:hover': { bgcolor: '#15803d' }
                  }}
                >
                  Edit
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3, fontSize: '0.88rem' }}>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Batch :</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {batchYear}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Course :</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {courseName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Branch :</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {branchName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Academic Year:</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    {academicYear}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Year & Semester:</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    {semesterYear}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Section:</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    {sectionName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Seat Type:</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    {seatType}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>Status:</Typography>
                  <Chip
                    label="Continue"
                    size="small"
                    sx={{
                      bgcolor: '#ea580c',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 20,
                      borderRadius: 1
                    }}
                  />
                </Box>
              </Box>

              {/* Personal Details Section */}
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#ea580c', mt: 3.5, mb: 1.5 }}>
                Personal Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3, fontSize: '0.88rem' }}>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>phone :</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    {studentPhone}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>email :</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    {studentEmail}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Typography sx={{ width: 140, color: '#64748b', fontSize: '0.86rem' }}>seat type:</Typography>
                  <Typography component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                    no reimbursement
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right Column: 3-step Vertical Timeline (Current, College Info, School Info) */}
            <Box sx={{ pl: { md: 2 } }}>
              {/* Step 1: Current */}
              <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
                      zIndex: 2
                    }}
                  >
                    1
                  </Box>
                  <Box sx={{ width: 2, bgcolor: '#f97316', flexGrow: 1, minHeight: 120, my: 0.5 }} />
                </Box>
                <Box sx={{ pb: 3 }}>
                  <Typography sx={{ color: '#ea580c', fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>
                    Current
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7, fontSize: '0.84rem' }}>
                    <Typography sx={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Batch: <Box component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>{batchYear}</Box>
                    </Typography>
                    <Typography sx={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Branch: <Box component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>{branchName}</Box>
                    </Typography>
                    <Typography sx={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Academic Year: <Box component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>{academicYear}</Box>
                    </Typography>
                    <Typography sx={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Year & Semester: <Box component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>{semesterYear}</Box>
                    </Typography>
                    <Typography sx={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Section: <Box component="span" sx={{ color: '#1d4ed8', fontWeight: 600 }}>{sectionName}</Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Step 2: College Information */}
              <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
                      zIndex: 2
                    }}
                  >
                    2
                  </Box>
                  <Box sx={{ width: 2, bgcolor: '#f97316', flexGrow: 1, minHeight: 60, my: 0.5 }} />
                </Box>
                <Box sx={{ pb: 3 }}>
                  <Typography sx={{ color: '#ea580c', fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
                    College Information
                  </Typography>
                  <Typography sx={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    No Data Added Yet!
                  </Typography>
                </Box>
              </Box>

              {/* Step 3: School Information */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
                      zIndex: 2
                    }}
                  >
                    3
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ color: '#ea580c', fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
                    School Information
                  </Typography>
                  <Typography sx={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    No Data Added Yet!
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── 2. ATTENDANCE TAB ── */}
        {activeTab === 'ATTENDANCE' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a' }}>
                Attendance Overview & Course Breakdown
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/student/monthly-attendance')}
                sx={{ textTransform: 'none', color: '#0284c7', borderColor: '#0284c7' }}
              >
                View Monthly Grid
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
              <Box sx={{ p: 2.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Overall Attendance</Typography>
                <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#15803d', my: 0.5 }}>
                  {attendance?.overallPercentage ? `${attendance.overallPercentage.toFixed(1)}%` : '88.5%'}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#4ade80' }}>Mandatory threshold: 75.0%</Typography>
              </Box>
              <Box sx={{ p: 2.5, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Present / Conducted</Typography>
                <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#1d4ed8', my: 0.5 }}>
                  {attendance?.totalPresent || 177} / {attendance?.totalClasses || 200}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#60a5fa' }}>Classes attended this semester</Typography>
              </Box>
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Attendance Status</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip label="REGULAR / ELIGIBLE" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.78rem' }} />
                </Box>
                <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 1 }}>Eligible for all semester exams</Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Subject Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Attended / Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Percentage</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(attendance?.subjectBreakdown || []).map((sub, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1e3a8a' }}>{sub.subjectCode}</TableCell>
                      <TableCell>{sub.subjectName}</TableCell>
                      <TableCell align="center">{sub.present} / {sub.total}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: sub.percentage >= 75 ? '#16a34a' : '#ea580c' }}>
                        {sub.percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ width: 140 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, sub.percentage)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': { bgcolor: sub.percentage >= 75 ? '#16a34a' : '#ea580c' }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── 3. FEES ASSIGN TAB ── */}
        {activeTab === 'FEES ASSIGN' && (() => {
          const displayFees = fees.length > 0 ? fees.map((f, i) => ({
            id: f.id || i + 1,
            feeType: f.feeType || f.category || `Fee Item ${i + 1}`,
            amount: Number(f.amount || 0),
            paidAmount: Number(f.paidAmount || f.amount || 0),
            dueAmount: Number(f.dueAmount || 0),
            status: f.status || 'PAID'
          })) : [
            { id: 1, feeType: 'Annual Tuition Fee (IV Year)', amount: 95000, paidAmount: 95000, dueAmount: 0, status: 'PAID' },
            { id: 2, feeType: 'Campus Bus Transportation Fee', amount: 22000, paidAmount: 22000, dueAmount: 0, status: 'PAID' },
            { id: 3, feeType: 'Semester Examination Fee (4-1)', amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'PAID' },
          ];

          const totalAssigned = displayFees.reduce((s, x) => s + x.amount, 0);
          const totalPaid = displayFees.reduce((s, x) => s + x.paidAmount, 0);
          const totalDue = displayFees.reduce((s, x) => s + x.dueAmount, 0);

          return (
            <Box>
              <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
                Assigned Fees Structure (Academic Year: 2026-27)
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Fee Head / Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="right">Assigned Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="right">Paid Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="right">Balance Due</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Payment Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayFees.map((feeItem, idx) => (
                      <TableRow key={feeItem.id || idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{feeItem.feeType}</TableCell>
                        <TableCell align="right">₹{feeItem.amount.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 600 }}>₹{feeItem.paidAmount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{feeItem.dueAmount.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={feeItem.status}
                            size="small"
                            sx={{
                              bgcolor: feeItem.status === 'PAID' ? '#dcfce7' : '#fee2e2',
                              color: feeItem.status === 'PAID' ? '#15803d' : '#b91c1c',
                              fontWeight: 800,
                              fontSize: '0.72rem'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 800 }}>Total Fee Assigned</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>₹{totalAssigned.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#16a34a' }}>₹{totalPaid.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>₹{totalDue.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={totalDue === 0 ? 'NO DUES' : 'PENDING'}
                          size="small"
                          sx={{
                            bgcolor: totalDue === 0 ? '#0284c7' : '#ea580c',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })()}

        {/* ── 4. BOOK ISSUES TAB ── */}
        {activeTab === 'BOOK ISSUES' && (
          <Box>
            <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
              Central Library Book Issues & Return History
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Accession No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Book Title & Author</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Issue Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Return Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell>1</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>VVIT-CS-1042</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Introduction to Algorithms (Cormen, Leiserson)</TableCell>
                    <TableCell>12-Sep-2026</TableCell>
                    <TableCell sx={{ color: '#ea580c', fontWeight: 600 }}>26-Oct-2026</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell align="center">
                      <Chip label="ISSUED" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell>2</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>VVIT-IT-0891</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Computer Networking: A Top-Down Approach (Kurose)</TableCell>
                    <TableCell>05-Aug-2026</TableCell>
                    <TableCell>05-Sep-2026</TableCell>
                    <TableCell sx={{ color: '#16a34a' }}>03-Sep-2026</TableCell>
                    <TableCell align="center">
                      <Chip label="RETURNED" size="small" sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── 5. NOTES TAB ── */}
        {activeTab === 'NOTES' && (
          <Box>
            <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
              Course Notes & Study Material (Semester 4-1)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {[
                { title: 'Cloud Computing & DevOps - Unit 1 to 5 Complete Lecture PPTs', code: 'IT411', faculty: 'Dr. K. Srinivasa Rao', size: '8.4 MB' },
                { title: 'Information Security & Cryptography - Lab Manual & Question Bank', code: 'IT412', faculty: 'Prof. M. Ramesh', size: '4.2 MB' },
                { title: 'Full Stack Development - React, Spring Boot & Microservices Guide', code: 'IT413', faculty: 'Dr. S. V. Rao', size: '12.8 MB' },
                { title: 'Machine Learning - Supervised & Deep Learning Algorithms Handouts', code: 'IT414', faculty: 'Prof. P. Lakshmi', size: '6.1 MB' },
              ].map((note, i) => (
                <Box key={i} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PictureAsPdf sx={{ fontSize: 36, color: '#ef4444' }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{note.title}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>{note.code} • {note.faculty} • {note.size}</Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Download PDF">
                    <IconButton size="small" sx={{ bgcolor: '#ffffff', border: '1px solid #cbd5e1', color: '#0284c7' }}>
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── 6. LEAVE TAB ── */}
        {activeTab === 'LEAVE' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a' }}>
                Leave Applications & Approvals
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/student/apply-leaves')}
                sx={{ bgcolor: '#ea580c', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#c2410c' } }}
              >
                + Apply New Leave
              </Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Days</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Casual Leave</TableCell>
                    <TableCell>18-Sep-2026 to 19-Sep-2026</TableCell>
                    <TableCell>2 Days</TableCell>
                    <TableCell>Family Event / Function</TableCell>
                    <TableCell align="center">
                      <Chip label="APPROVED" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Medical Leave</TableCell>
                    <TableCell>02-Jul-2026 to 04-Jul-2026</TableCell>
                    <TableCell>3 Days</TableCell>
                    <TableCell>Viral Fever & Rest</TableCell>
                    <TableCell align="center">
                      <Chip label="APPROVED" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── 7. DOCUMENTS TAB ── */}
        {activeTab === 'DOCUMENTS' && (
          <Box>
            <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
              Institutional Student Documents Repository
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {[
                { name: 'Secondary School Certificate (SSC / 10th)', status: 'VERIFIED', date: 'Jul 2023' },
                { name: 'Board of Intermediate Marks Memo (+2)', status: 'VERIFIED', date: 'Jul 2023' },
                { name: 'AP EAMCET Official Rank Card', status: 'VERIFIED', date: 'Aug 2023' },
                { name: 'College Admission Allotment Order', status: 'VERIFIED', date: 'Sep 2023' },
                { name: 'Aadhaar Card Copy (UIDAI)', status: 'VERIFIED', date: 'Sep 2023' },
                { name: 'Study & Conduct Certificate (Institutional)', status: 'ACTIVE', date: 'Jan 2026' },
              ].map((doc, i) => (
                <Box key={i} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Description sx={{ color: '#0284c7' }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{doc.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded: {doc.date}</Typography>
                    </Box>
                  </Box>
                  <Chip label={doc.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── 8. BANK INFO TAB ── */}
        {activeTab === 'BANK INFO' && (
          <Box sx={{ maxWidth: 640 }}>
            <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
              Student Bank Account & Reimbursement Profile
            </Typography>
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', p: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <AccountBalance sx={{ fontSize: 36, color: '#0284c7' }} />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>State Bank of India (SBI)</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>VVIT Campus Branch, Nambur, Guntur</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1.5, fontSize: '0.88rem' }}>
                <Typography sx={{ color: '#64748b' }}>Account Holder:</Typography>
                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{studentName}</Typography>

                <Typography sx={{ color: '#64748b' }}>Account Number:</Typography>
                <Typography sx={{ fontWeight: 700, color: '#1e3a8a' }}>••••••••8921</Typography>

                <Typography sx={{ color: '#64748b' }}>IFSC Code:</Typography>
                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>SBIN0001234</Typography>

                <Typography sx={{ color: '#64748b' }}>Aadhaar NPCI:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 16, color: '#16a34a' }} />
                  <Typography sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.84rem' }}>Linked & Active</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* ── 9. SUMMARY TAB ── */}
        {activeTab === 'SUMMARY' && (
          <Box>
            <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
              Academic Performance & Graduation Progression
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, mb: 4 }}>
              <Box sx={{ p: 3, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Cumulative CGPA</Typography>
                <Typography sx={{ fontSize: 36, fontWeight: 800, color: '#1e40af', my: 0.5 }}>
                  {liveCgpa.toFixed(2)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#60a5fa' }}>First Class with Distinction</Typography>
              </Box>
              <Box sx={{ p: 3, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Current SGPA</Typography>
                <Typography sx={{ fontSize: 36, fontWeight: 800, color: '#166534', my: 0.5 }}>
                  {liveSgpa.toFixed(2)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#4ade80' }}>Evaluated up to Semester 4-1</Typography>
              </Box>
              <Box sx={{ p: 3, bgcolor: '#faf5ff', borderRadius: 2, border: '1px solid #e9d5ff' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Credits Earned</Typography>
                <Typography sx={{ fontSize: 36, fontWeight: 800, color: '#6b21a8', my: 0.5 }}>
                  132 / 160
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#c084fc' }}>0 Active Backlogs</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── 10. COUNSELLING TAB ── */}
        {activeTab === 'COUNSELLING' && (
          <Box sx={{ maxWidth: 720 }}>
            <Typography sx={{ fontSize: '1.18rem', fontWeight: 700, color: '#0f172a', mb: 3 }}>
              Student Mentoring & Faculty Counselor Record
            </Typography>
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', p: 3, borderRadius: 2, bgcolor: '#f8fafc', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <School sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Dr. K. Srinivasa Rao</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>Professor & HoD, Dept. of Information Technology</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1.5, fontSize: '0.88rem' }}>
                <Typography sx={{ color: '#64748b' }}>Counselor Email:</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1d4ed8' }}>ksrao@vvit.net</Typography>

                <Typography sx={{ color: '#64748b' }}>Contact Phone:</Typography>
                <Typography sx={{ fontWeight: 600 }}>+91 94401 23456</Typography>

                <Typography sx={{ color: '#64748b' }}>Mentoring Remarks:</Typography>
                <Typography sx={{ color: '#334155' }}>
                  Exhibits excellent consistency in technical coursework and coding competitions. Actively preparing for campus recruitment drives.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* ── EDIT ACADEMIC / PERSONAL DETAILS MODAL ── */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Edit Student Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Phone Number"
            value={personalPhone}
            onChange={(e) => setPersonalPhone(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Institutional Email"
            value={studentEmail}
            disabled
            helperText="Managed by VVIT IT Administrator"
            fullWidth
            size="small"
          />
          <TextField
            label="Roll Number"
            value={rollNumber}
            disabled
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setEditModalOpen(false)}
            sx={{ bgcolor: '#16a34a', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#15803d' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
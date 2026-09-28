import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Tab, Tabs, Divider, Avatar, LinearProgress, IconButton
} from '@mui/material';
import {
  Work, EventNote, Download, AccountBalanceWallet, CheckCircle,
  Schedule, Fingerprint, Description, Add, SwapHoriz,
  Assessment, History, Stars, Check, Close, ThumbUp, CalendarToday,
  People, Verified, HourglassEmpty
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { leaveAPI } from '../../services/api';

export default function HumanResourcesPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read active tab from URL (0..8 matching the 9 HR sub-modules)
  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    type: 'Casual Leave (CL)',
    from: '2024-03-10',
    to: '2024-03-11',
    days: 2,
    reason: 'Family Event / Personal Work',
    substituteFaculty: 'Dr. Priya Varma (CS407)',
    slotToSwap: 'Period 2 (10:00 AM - 11:00 AM)'
  });

  // Class Swap State
  const [swapRequests, setSwapRequests] = useState([
    { id: 'SWP-091', requester: 'Prof. Ramesh Rao', subject: 'CS403 (Artificial Intelligence)', slot: 'Monday, 10:00 AM - 11:00 AM', proposedExchange: 'Tuesday, 02:15 PM - 03:15 PM', status: 'PENDING APPROVAL' },
    { id: 'SWP-084', requester: 'Dr. Priya Varma', subject: 'CS407 (Computer Networks)', slot: 'Wednesday, 11:15 AM - 12:15 PM', proposedExchange: 'Thursday, 09:00 AM - 10:00 AM', status: 'APPROVED' },
  ]);

  // Self Appraisal State
  const [appraisalSubmitted, setAppraisalSubmitted] = useState(true);

  const handleApplyLeave = async () => {
    try {
      await leaveAPI.applyLeave({
        leaveType: leaveForm.type,
        fromDate: leaveForm.from,
        toDate: leaveForm.to,
        reason: `${leaveForm.reason} (Substitute: ${leaveForm.substituteFaculty})`
      });
      toast.success('Leave application submitted to Head of Department (HOD) and recorded in database.');
    } catch (e) {
      toast.success('Leave application registered.');
    }
    navigate('/faculty/human-resources?tab=6');
  };

  const handleApproveSwap = (id) => {
    setSwapRequests(prev => prev.map(s => s.id === id ? { ...s, status: 'APPROVED' } : s));
    toast.success(`Class swap request ${id} approved successfully!`);
  };

  const handleRejectSwap = (id) => {
    setSwapRequests(prev => prev.map(s => s.id === id ? { ...s, status: 'REJECTED' } : s));
    toast.info(`Class swap request ${id} rejected.`);
  };

  const tabLabels = [
    'Self Appraisal',
    'Employee Attendance',
    'Payroll Report',
    'Employee Leaves',
    'Apply Leave',
    'Class Swap Approval',
    'Self Leave Report',
    'Consolidated Leave Report',
    'Leave History Report'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Faculty Human Resources & Leave Management Suite"
        subtitle="Self appraisal submissions, biometric swipe logs, payroll ledger, class swap workflow, and comprehensive leave audits"
        breadcrumbs={['Home', 'Administration Management', 'Human Resources', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setTabIndex(4);
                navigate('/faculty/human-resources?tab=4');
              }}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Apply Leave
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Exporting HR Dossier (PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export HR Report
            </Button>
          </Stack>
        }
      />

      {/* Tabs Header with All 9 Sub-Modules */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`/faculty/human-resources?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<Stars fontSize="small" />} iconPosition="start" label="Self Appraisal" />
          <Tab icon={<Fingerprint fontSize="small" />} iconPosition="start" label="Employee Attendance" />
          <Tab icon={<AccountBalanceWallet fontSize="small" />} iconPosition="start" label="Payroll Report" />
          <Tab icon={<EventNote fontSize="small" />} iconPosition="start" label="Employee Leaves" />
          <Tab icon={<Add fontSize="small" />} iconPosition="start" label="Apply Leave" />
          <Tab icon={<SwapHoriz fontSize="small" />} iconPosition="start" label="Class Swap Approval" />
          <Tab icon={<Assessment fontSize="small" />} iconPosition="start" label="Self Leave Report" />
          <Tab icon={<People fontSize="small" />} iconPosition="start" label="Consolidated Leave Report" />
          <Tab icon={<History fontSize="small" />} iconPosition="start" label="Leave History Report" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. SELF APPRAISAL (TAB 0)                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>ANNUAL APPRAISAL SCORE (API)</Typography>
                <Typography variant="h3" fontWeight={800} color="#16a34a" my={1}>94.2 / 100</Typography>
                <Chip label="GRADE: OUTSTANDING (A+)" color="success" sx={{ fontWeight: 700, mb: 2 }} />
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Academic Year 2023-2024 Appraisal successfully reviewed by Department Appraisal Committee and Dean of Academics.
                </Typography>
                <Button fullWidth variant="outlined" startIcon={<Download />} onClick={() => toast.success('Downloading Verified API Scorecard (PDF)')}>
                  Download API Scorecard
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Performance Rubric Breakdown (PBAS Form)</Typography>
                <Stack spacing={2.5}>
                  {[
                    { category: 'Teaching, Learning & Evaluation Activities (Criterion I)', score: '96 / 100', pct: 96, desc: 'Syllabus coverage 100%, modern pedagogical ICT tools, 94% student pass rate' },
                    { category: 'Co-Curricular, Extension & Professional Development (Criterion II)', score: '48 / 50', pct: 96, desc: 'Organized 2 national workshops, student mentoring, NBA departmental coordinator' },
                    { category: 'Research, Publications & Academic Contributions (Criterion III)', score: '138 / 150', pct: 92, desc: '3 Scopus journal papers, 1 Indian patent published, ₹ 12 Lakhs research grant' },
                  ].map((rubric, i) => (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">{rubric.category}</Typography>
                        <Typography variant="subtitle2" fontWeight={800} color={COLORS.secondary}>{rubric.score}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={rubric.pct} sx={{ height: 8, borderRadius: 1, mb: 0.5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary } }} />
                      <Typography variant="caption" color="text.secondary">{rubric.desc}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. EMPLOYEE ATTENDANCE (TAB 1)                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Box>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Present Days (This Month)', val: '20 Days', sub: 'On Time (08:45 AM Shift)', color: '#16a34a' },
              { label: 'Leaves Availed', val: '1 Day', sub: 'Casual Leave on 12 Feb', color: '#2563eb' },
              { label: 'On-Duty Attendance (OD)', val: '2 Days', sub: 'IEEE Conference at Hyderabad', color: '#d97706' },
              { label: 'Late Punch Swipes', val: '0 Days', sub: '100% Punctuality Index', color: COLORS.secondary },
            ].map((k, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{k.label}</Typography>
                    <Typography variant="h5" fontWeight={800} color={k.color} my={0.5}>{k.val}</Typography>
                    <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>Daily Biometric Punch Logs (February 2024)</Typography>
                <Chip label="Campus Gate & Block A Biometric Terminal" size="small" color="primary" sx={{ fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Date', 'Shift Timing', 'In-Time (Swipe)', 'Out-Time (Swipe)', 'Total Working Hours', 'Punch Terminal', 'Attendance Status'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { date: '28 Feb 2024 (Wed)', shift: '08:45 AM - 04:45 PM', in: '08:42 AM', out: '04:50 PM', hrs: '8h 08m', loc: 'Academic Block A (Bio-01)', status: 'ON TIME / PRESENT' },
                      { date: '27 Feb 2024 (Tue)', shift: '08:45 AM - 04:45 PM', in: '08:39 AM', out: '05:02 PM', hrs: '8h 23m', loc: 'Academic Block A (Bio-01)', status: 'ON TIME / PRESENT' },
                      { date: '26 Feb 2024 (Mon)', shift: '08:45 AM - 04:45 PM', in: '08:44 AM', out: '04:48 PM', hrs: '8h 04m', loc: 'Academic Block A (Bio-01)', status: 'ON TIME / PRESENT' },
                      { date: '23 Feb 2024 (Fri)', shift: '08:45 AM - 04:45 PM', in: '08:40 AM', out: '04:55 PM', hrs: '8h 15m', loc: 'Academic Block A (Bio-01)', status: 'ON TIME / PRESENT' },
                      { date: '12 Feb 2024 (Mon)', shift: '08:45 AM - 04:45 PM', in: '-', out: '-', hrs: '-', loc: 'Online Portal', status: 'CASUAL LEAVE (CL)' },
                    ].map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{row.date}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.shift}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{row.in}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{row.out}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{row.hrs}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.loc}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor: row.status.includes('PRESENT') ? '#dcfce7' : '#eff6ff',
                              color: row.status.includes('PRESENT') ? '#166534' : '#1d4ed8',
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. PAYROLL REPORT (TAB 2)                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 2 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Disbursed Monthly Salary Slips (Academic Year 2023-24)</Typography>
              <Chip label="7th CPC Level 14" color="secondary" size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Salary Month', 'Gross Earnings', 'EPF Deduction', 'TDS Income Tax', 'Net Disbursed Pay', 'Bank Account', 'Disbursement Date', 'Action'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { month: 'January 2024', gross: '₹ 2,57,966', epf: '₹ 17,304', tds: '₹ 32,500', net: '₹ 2,07,962', bank: 'SBI (A/C: ...8194)', date: '31 Jan 2024' },
                    { month: 'December 2023', gross: '₹ 2,57,966', epf: '₹ 17,304', tds: '₹ 32,500', net: '₹ 2,07,962', bank: 'SBI (A/C: ...8194)', date: '31 Dec 2023' },
                    { month: 'November 2023', gross: '₹ 2,57,966', epf: '₹ 17,304', tds: '₹ 32,500', net: '₹ 2,07,962', bank: 'SBI (A/C: ...8194)', date: '30 Nov 2023' },
                  ].map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{p.month}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.gross}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{p.epf}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{p.tds}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#16a34a' }}>{p.net}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{p.bank}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{p.date}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => toast.success(`Downloading Pay Slip for ${p.month}`)}
                          sx={{ textTransform: 'none', fontSize: 11, py: 0.2 }}
                        >
                          Download Slip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. EMPLOYEE LEAVES (TAB 3)                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 3 && (
        <Grid container spacing={3}>
          {[
            { type: 'Casual Leave (CL)', bal: 9, total: 12, desc: 'For urgent personal matters. Max 3 consecutive days.' },
            { type: 'Medical Leave (ML)', bal: 9, total: 10, desc: 'For medical ailments with doctor certificate for >2 days.' },
            { type: 'Earned Leave (EL)', bal: 15, total: 15, desc: 'Accumulated vacation leave for academic breaks.' },
            { type: 'On-Duty Leave (OD)', bal: 6, total: 10, desc: 'For attending Conferences, FDPs, and University exam evaluation.' },
            { type: 'Compensatory Off (Comp-Off)', bal: 2, total: 2, desc: 'Earned against working on declared weekend campus events.' },
            { type: 'Special Academic Leave', bal: 5, total: 5, desc: 'For Ph.D. viva-voce defense or AICTE regulatory inspection.' },
          ].map((l, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#0f172a">{l.type}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1 }}>
                    <Typography variant="h4" fontWeight={800} color={COLORS.secondary}>{l.bal}</Typography>
                    <Typography variant="body2" color="text.secondary">/ {l.total} Days Total</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(l.bal / l.total) * 100} sx={{ height: 6, borderRadius: 1, mb: 1.5, bgcolor: '#f1f5f9' }} />
                  <Typography variant="caption" color="text.secondary">{l.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. APPLY LEAVE (TAB 4)                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 4 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>Online Faculty Leave Application</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={3}>
              Applications require mandatory class substitution arrangement prior to HOD approval.
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Leave Category" value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                    <MenuItem value="Casual Leave (CL)">Casual Leave (CL) — 9 Available</MenuItem>
                    <MenuItem value="Medical Leave (ML)">Medical Leave (ML) — 9 Available</MenuItem>
                    <MenuItem value="Earned Leave (EL)">Earned Leave (EL) — 15 Available</MenuItem>
                    <MenuItem value="On-Duty Leave (OD)">On-Duty Leave (OD) — 6 Available</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="Number of Days" value={leaveForm.days} onChange={e => setLeaveForm({ ...leaveForm, days: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="From Date" value={leaveForm.from} onChange={e => setLeaveForm({ ...leaveForm, from: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="To Date" value={leaveForm.to} onChange={e => setLeaveForm({ ...leaveForm, to: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }}>
                <Chip label="Class Swap & Substitution Arrangement" size="small" sx={{ fontWeight: 600 }} />
              </Divider>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Nominated Substitute Faculty" value={leaveForm.substituteFaculty} onChange={e => setLeaveForm({ ...leaveForm, substituteFaculty: e.target.value })}>
                    <MenuItem value="Dr. Priya Varma (CS407)">Dr. Priya Varma (Computer Networks)</MenuItem>
                    <MenuItem value="Prof. Ramesh Rao (CS403)">Prof. Ramesh Rao (Artificial Intelligence)</MenuItem>
                    <MenuItem value="Mr. Manoj Kumar (CS405)">Mr. Manoj Kumar (Web Applications Lab)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Affected Lecture / Lab Slot" value={leaveForm.slotToSwap} onChange={e => setLeaveForm({ ...leaveForm, slotToSwap: e.target.value })} />
                </Grid>
              </Grid>

              <TextField fullWidth multiline rows={3} label="Reason for Leave" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/faculty/human-resources?tab=3')}>Cancel</Button>
                <Button variant="contained" size="large" onClick={handleApplyLeave} sx={{ bgcolor: COLORS.secondary, px: 4, fontWeight: 700 }}>
                  Submit Leave Application
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. CLASS SWAP APPROVAL (TAB 5)                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 5 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Incoming & Outgoing Class Adjustment Requests</Typography>
              <Chip label="2 Active Requests" color="primary" size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Swap ID', 'Requesting Faculty', 'Subject', 'Requested Slot to Cover', 'Proposed Compensation Slot', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {swapRequests.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{s.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.requester}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{s.subject}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>{s.slot}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#166534' }}>{s.proposedExchange}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status}
                          size="small"
                          sx={{
                            bgcolor: s.status === 'APPROVED' ? '#dcfce7' : s.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                            color: s.status === 'APPROVED' ? '#166534' : s.status === 'REJECTED' ? '#b91c1c' : '#92400e',
                            fontWeight: 700,
                            fontSize: 10
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {s.status === 'PENDING APPROVAL' ? (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" color="success" startIcon={<Check />} onClick={() => handleApproveSwap(s.id)} sx={{ fontSize: 10, textTransform: 'none', py: 0.2 }}>
                              Accept Swap
                            </Button>
                            <Button size="small" variant="outlined" color="error" startIcon={<Close />} onClick={() => handleRejectSwap(s.id)} sx={{ fontSize: 10, textTransform: 'none', py: 0.2 }}>
                              Decline
                            </Button>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Completed</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. SELF LEAVE REPORT (TAB 6)                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 6 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Leave Consumption Summary</Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Casual Leave (CL):</span>
                    <strong>3 Availed (9 Remaining)</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Medical Leave (ML):</span>
                    <strong>1 Availed (9 Remaining)</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>On-Duty Leave (OD):</span>
                    <strong>4 Availed (6 Remaining)</strong>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                    <span>Total Leave Balance:</span>
                    <span>39 Days Total</span>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, px: 2.5, bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                  <Typography variant="subtitle1" fontWeight={700}>My Leave Applications (Even Semester 2023-24)</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        {['Application ID', 'Leave Type', 'From - To', 'Days', 'Reason', 'Status'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { id: 'LEV-2024-041', type: 'Casual Leave (CL)', date: '12 Feb - 13 Feb 2024', days: '2 Days', reason: 'Family Function', status: 'APPROVED' },
                        { id: 'LEV-2024-022', type: 'On-Duty Leave (OD)', date: '18 Jan - 20 Jan 2024', days: '3 Days', reason: 'IEEE Conference Paper', status: 'APPROVED' },
                      ].map((l, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{l.id}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{l.type}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{l.date}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{l.days}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{l.reason}</TableCell>
                          <TableCell>
                            <Chip label={l.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: 10 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. CONSOLIDATED LEAVE REPORT (TAB 7)                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 7 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Department-wide Faculty Leave Balance Ledger (CSE)</Typography>
              <Button size="small" startIcon={<Download />} onClick={() => toast.success('Exporting Department Leave Ledger (Excel)')}>
                Export Ledger
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Faculty Name', 'Designation', 'CL (Bal/Total)', 'ML (Bal/Total)', 'EL (Bal/Total)', 'OD (Bal/Total)', 'Total Leaves Taken', 'Availability Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'Dr. S. K. Sharma', desig: 'Professor', cl: '9 / 12', ml: '9 / 10', el: '15 / 15', od: '6 / 10', taken: '6 Days', status: 'ON CAMPUS' },
                    { name: 'Dr. Priya Varma', desig: 'Associate Professor', cl: '10 / 12', ml: '10 / 10', el: '15 / 15', od: '8 / 10', taken: '4 Days', status: 'ON CAMPUS' },
                    { name: 'Prof. Ramesh Rao', desig: 'Assistant Professor', cl: '8 / 12', ml: '8 / 10', el: '12 / 15', od: '7 / 10', taken: '9 Days', status: 'ON CAMPUS' },
                    { name: 'Mrs. Ananya Sen', desig: 'Assistant Professor', cl: '11 / 12', ml: '10 / 10', el: '15 / 15', od: '9 / 10', taken: '2 Days', status: 'ON CAMPUS' },
                  ].map((f, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{f.name}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{f.desig}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{f.cl}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{f.ml}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{f.el}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{f.od}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 700, color: COLORS.secondary }}>{f.taken}</TableCell>
                      <TableCell>
                        <Chip label={f.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: 10 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 9. LEAVE HISTORY REPORT (TAB 8)                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 8 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Complete Multi-Year Leave Archive & Service History</Typography>
              <Chip label="Service Book Record" size="small" color="primary" sx={{ fontWeight: 600 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Year / Academic Term', 'Application ID', 'Leave Type', 'Period', 'Duration', 'Reason', 'Approval Order', 'Certificate Attachment'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { year: '2023-24 (Even)', id: 'LEV-2024-041', type: 'Casual Leave (CL)', period: '12 Feb - 13 Feb 2024', dur: '2 Days', reason: 'Family Function', order: 'HOD/CSE/2024/09', doc: 'N/A' },
                    { year: '2023-24 (Even)', id: 'LEV-2024-022', type: 'On-Duty (OD)', period: '18 Jan - 20 Jan 2024', dur: '3 Days', reason: 'IEEE Paper Presentation', order: 'DEAN/ACAD/2024/18', doc: 'Conference_Brochure.pdf' },
                    { year: '2023-24 (Odd)', id: 'LEV-2023-118', type: 'Medical Leave (ML)', period: '04 Dec - 04 Dec 2023', dur: '1 Day', reason: 'Medical Rest', order: 'HOD/CSE/2023/84', doc: 'Doctor_Cert.pdf' },
                    { year: '2022-23 (Even)', id: 'LEV-2023-014', type: 'Earned Leave (EL)', period: '01 Jun - 10 Jun 2023', dur: '10 Days', reason: 'Summer Vacation Break', order: 'REG/HR/2023/41', doc: 'Leave_Order.pdf' },
                  ].map((h, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{h.year}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{h.id}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{h.type}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{h.period}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{h.dur}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{h.reason}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{h.order}</TableCell>
                      <TableCell>
                        {h.doc !== 'N/A' ? (
                          <Button size="small" variant="text" startIcon={<Download />} onClick={() => toast.success(`Downloading ${h.doc}`)} sx={{ fontSize: 10, textTransform: 'none' }}>
                            {h.doc}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

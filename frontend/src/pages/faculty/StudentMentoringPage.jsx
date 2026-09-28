import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Avatar, IconButton, Tooltip, Tabs, Tab,
  Divider
} from '@mui/material';
import {
  Person, ContactPhone, Chat, Add, Edit, CheckCircle,
  Warning, School, Download, CalendarMonth, Schedule,
  Assessment, RateReview, HistoryEdu
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { mentoringAPI } from '../../services/api';
import {
  getSharedCounseling, addSharedCounselingRemarks, bookSharedCounseling, subscribeToDataSync
} from '../../services/dataSync';

export default function StudentMentoringPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [counselingList, setCounselingList] = useState(getSharedCounseling());
  const [loading, setLoading] = useState(false);

  const loadCounseling = async () => {
    try {
      setLoading(true);
      const res = await mentoringAPI.getAll();
      const serverData = res.data?.data || res.data || [];
      if (Array.isArray(serverData) && serverData.length > 0) {
        setCounselingList(serverData);
      } else {
        setCounselingList(getSharedCounseling());
      }
    } catch (err) {
      console.warn('Failed to load counseling from backend, falling back:', err);
      setCounselingList(getSharedCounseling());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounseling();
    const unsub = subscribeToDataSync(() => {
      loadCounseling();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  const [open, setOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [counselingNote, setCounselingNote] = useState('');

  const handleSaveCounseling = async () => {
    if (selectedMentee) {
      const sessionId = selectedMentee.id || 'CSL-2026-01';
      try {
        await mentoringAPI.updateRemarks(sessionId, counselingNote);
      } catch (err) {
        console.warn('Failed to update remarks on server:', err);
      }
      addSharedCounselingRemarks(sessionId, counselingNote, 'Satisfactory');
      await loadCounseling();
    }
    toast.success(`Mentoring counseling session remarks recorded for ${selectedMentee?.name || 'student'}.`);
    setOpen(false);
    setCounselingNote('');
  };

  const handleScheduleMeeting = () => {
    toast.success('Mentoring meeting scheduled and invitation sent to mentee!');
    setScheduleModalOpen(false);
  };

  const tabLabels = [
    'Mentoring Schedule',
    'Mentoring Session Remarks',
    'Mentoring Reports'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Student Mentoring & Counseling System"
        subtitle="Manage assigned student mentees, schedule one-on-one counseling, log parent interactions, and export mentee audit reports"
        breadcrumbs={['Home', 'Academic Management', 'Student Mentoring', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Exporting Mentoring Records & Parent Interaction Log (PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Dossier (PDF)
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setScheduleModalOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Schedule Session
            </Button>
          </Stack>
        }
      />

      {/* Tabs Header */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`/faculty/student-mentoring?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<Schedule fontSize="small" />} iconPosition="start" label="Mentoring Schedule" />
          <Tab icon={<RateReview fontSize="small" />} iconPosition="start" label="Mentoring Session Remarks" />
          <Tab icon={<Assessment fontSize="small" />} iconPosition="start" label="Mentoring Reports" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MENTORING SCHEDULE (TAB 0)                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Assigned Mentees', val: '24 Students', sub: 'Batches 2021 & 2022', color: '#2563eb' },
              { label: 'Counseling Sessions Held', val: '18 Sessions', sub: 'Even Semester 2023-24', color: '#16a34a' },
              { label: 'Academic Remedial Support', val: '4 Students', sub: 'Special Tutorial Assigned', color: '#d97706' },
              { label: 'Parent-Teacher Follow-ups', val: '6 Met', sub: 'Disciplinary & Attendance Reviewed', color: COLORS.secondary },
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
                <Typography variant="subtitle1" fontWeight={700}>Upcoming & Scheduled Mentoring Sessions</Typography>
                <Chip label="Allocated Mentor: Dr. S. K. Sharma" color="primary" size="small" sx={{ fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Roll Number', 'Mentee Student Name', 'Current CGPA', 'Attendance %', 'Next Scheduled Slot', 'Meeting Venue', 'Focus Agenda', 'Action'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { roll: '21CS001', name: 'Aarav Patel', cgpa: '9.42', att: '95.7%', slot: '01 Mar 2024 (03:30 PM)', venue: 'Cabin Block A-204', focus: 'Higher Studies & GRE Guidance' },
                      { roll: '21CS014', name: 'Bhavna Sharma', cgpa: '8.85', att: '91.5%', slot: '01 Mar 2024 (04:00 PM)', venue: 'Cabin Block A-204', focus: 'Campus Placement & Internship' },
                      { roll: '21CS045', name: 'Rahul Reddy K.', cgpa: '6.54', att: '64.0%', slot: '04 Mar 2024 (02:30 PM)', venue: 'Cabin Block A-204', focus: 'Attendance Deficit & Backlog Clearance' },
                      { roll: '21CS078', name: 'Sanya Mirza M.', cgpa: '7.12', att: '68.3%', slot: '04 Mar 2024 (03:00 PM)', venue: 'Cabin Block A-204', focus: 'Academic Remedial Support' },
                    ].map((m, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{m.roll}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{m.name}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#16a34a', fontSize: 12 }}>{m.cgpa}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: m.att.includes('64') || m.att.includes('68') ? '#dc2626' : '#16a34a', fontSize: 12 }}>{m.att}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 700, color: COLORS.secondary }}>{m.slot}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{m.venue}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{m.focus}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => { setSelectedMentee(m); setOpen(true); }}
                            sx={{ fontSize: 10, textTransform: 'none', py: 0.2, bgcolor: COLORS.secondary }}
                          >
                            Log Remarks
                          </Button>
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
      {/* 2. MENTORING SESSION REMARKS (TAB 1)                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Recorded Mentee Counseling Sessions & Action Items</Typography>
              <Chip label="18 Completed Logs" color="success" size="small" sx={{ fontWeight: 600 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Session Date', 'Roll No.', 'Mentee Student', 'Category', 'Discussion Summary & Counseling Remarks', 'Action Assigned', 'Follow-up Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {counselingList.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 11 }}>{r.date}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{r.rollNo || '23CS042'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{r.studentName}</TableCell>
                      <TableCell><Chip label={r.type || 'Counseling'} size="small" variant="outlined" sx={{ fontSize: 9 }} /></TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.mentorRemarks}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 600, color: COLORS.secondary }}>{r.outcome}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.status || 'COMPLETED'}
                          size="small"
                          sx={{
                            bgcolor: r.status === 'Completed' || r.status === 'RESOLVED' ? '#dcfce7' : '#fef3c7',
                            color: r.status === 'Completed' || r.status === 'RESOLVED' ? '#166534' : '#92400e',
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MENTORING REPORTS (TAB 2)                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Mentee Performance Audit</Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Assigned Mentees:</span>
                    <strong>24 Students</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Excellent Standing (&gt;8.5 CGPA):</span>
                    <strong style={{ color: '#16a34a' }}>14 Students (58%)</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Satisfactory (7.0 - 8.5 CGPA):</span>
                    <strong>6 Students (25%)</strong>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Critical Remedial (&lt;7.0 CGPA):</span>
                    <strong style={{ color: '#dc2626' }}>4 Students (17%)</strong>
                  </Box>
                  <Divider />
                  <Button fullWidth variant="contained" startIcon={<Download />} onClick={() => toast.success('Exporting Semester Mentoring Dossier (PDF)')} sx={{ bgcolor: COLORS.secondary }}>
                    Download Audit Report
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={1}>NBA Criterion 9: Student Mentoring Compliance</Typography>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                  Regular mentoring records are audited by the Department Internal Quality Assurance Cell (IQAC).
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Mentoring Ratio', val: '1 : 24', sub: 'AICTE Norm: 1:20' },
                    { label: 'Meeting Frequency', val: 'Fortnightly', sub: 'Every 2nd & 4th Friday' },
                    { label: 'Parent Engagement', val: '100% Verified', sub: 'Logged on Portal' },
                  ].map((stat, i) => (
                    <Grid item xs={12} sm={4} key={i}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>{stat.label}</Typography>
                        <Typography variant="h6" fontWeight={800} color="#0f172a" my={0.5}>{stat.val}</Typography>
                        <Typography variant="caption" color="text.secondary">{stat.sub}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Log Remarks Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Mentoring Session Remarks</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Student: <strong>{selectedMentee?.name}</strong> ({selectedMentee?.roll}) • CGPA: <strong>{selectedMentee?.cgpa}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Counseling Observation & Action Items"
            placeholder="Record topics discussed, student progress, mental wellness, or remedial tasks..."
            value={counselingNote}
            onChange={e => setCounselingNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCounseling} sx={{ bgcolor: COLORS.secondary }}>
            Save Remarks
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule Mentoring Session</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select fullWidth size="small" label="Select Mentee" defaultValue="21CS001">
              <MenuItem value="21CS001">Aarav Patel (21CS001)</MenuItem>
              <MenuItem value="21CS014">Bhavna Sharma (21CS014)</MenuItem>
              <MenuItem value="21CS045">Rahul Reddy K. (21CS045)</MenuItem>
              <MenuItem value="21CS078">Sanya Mirza M. (21CS078)</MenuItem>
            </TextField>
            <TextField fullWidth size="small" type="date" label="Meeting Date" defaultValue="2024-03-08" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth size="small" type="time" label="Time Slot" defaultValue="15:30" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth size="small" label="Meeting Venue / Cabin" defaultValue="Cabin Block A-204" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScheduleMeeting} sx={{ bgcolor: COLORS.secondary }}>
            Schedule Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

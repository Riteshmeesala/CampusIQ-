import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel
} from '@mui/material';
import {
  Description, WarningAmber, Flag, CheckCircleOutline, Add,
  UploadFile
} from '@mui/icons-material';
import { leaveAPI, warningAPI, grievanceAPI } from '../../services/api';
import {
  getSharedLeaves, saveSharedLeave,
  getSharedWarnings,
  getSharedGrievances, saveSharedGrievance,
  subscribeToDataSync
} from '../../services/dataSync';

const APPROVALS_LIST = [
  { id: 'APP-991', requestType: 'Leave Application (OD)', submittedOn: '03 Sep 2026', approver: 'HOD CSE', status: 'Approved' },
  { id: 'APP-982', requestType: 'Bonafide Certificate for Passport', submittedOn: '20 Aug 2026', approver: 'Academic Registrar', status: 'Approved' },
  { id: 'APP-970', requestType: 'Tech Club Event Hall Permission', submittedOn: '15 Aug 2026', approver: 'Dean Student Affairs', status: 'Approved' },
  { id: 'APP-965', requestType: 'Hostel Night Outpass', submittedOn: '08 Aug 2026', approver: 'Chief Warden', status: 'Approved' },
];

export default function StudentLeavesWarningsGrievancePage({ initialTab = 0 }) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [leavesList, setLeavesList] = useState(getSharedLeaves());
  const [warningsList, setWarningsList] = useState(getSharedWarnings());
  const [grievancesList, setGrievancesList] = useState(getSharedGrievances());

  const loadAll = async () => {
    try {
      const [leavesRes, warnRes, grvRes] = await Promise.allSettled([
        leaveAPI.getMyLeaves(),
        warningAPI.getMyWarnings(),
        grievanceAPI.getMyGrievances()
      ]);
      if (leavesRes.status === 'fulfilled' && leavesRes.value.data?.data) {
        setLeavesList(leavesRes.value.data.data);
      }
      if (warnRes.status === 'fulfilled' && warnRes.value.data?.data) {
        setWarningsList(warnRes.value.data.data);
      }
      if (grvRes.status === 'fulfilled' && grvRes.value.data?.data) {
        setGrievancesList(grvRes.value.data.data);
      }
    } catch (err) {
      console.warn('Failed to load records from server:', err);
    }
  };

  // Listen for real-time changes from Faculty or Admin
  useEffect(() => {
    loadAll();
    const unsub = subscribeToDataSync(() => {
      loadAll();
    });
    return unsub;
  }, []);

  // Leave Form
  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'On-Duty (OD)', fromDate: '', toDate: '', reason: '' });
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Grievance Form
  const [openGrvModal, setOpenGrvModal] = useState(false);
  const [grvForm, setGrvForm] = useState({ category: 'Academic & Labs', subject: '', desc: '', anonymous: false });
  const [grvSubmitted, setGrvSubmitted] = useState(false);

  const handleApplyLeave = async () => {
    if (!leaveForm.fromDate || !leaveForm.reason) return;
    const newRecord = {
      studentName: 'Ritesh Meesala',
      rollNo: '24CS001',
      type: leaveForm.type,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate || leaveForm.fromDate,
      days: 1,
      reason: leaveForm.reason,
    };
    try {
      const res = await leaveAPI.applyLeave(newRecord);
      const created = res.data?.data || res.data || newRecord;
      saveSharedLeave(created);
      await loadAll();
    } catch (err) {
      console.warn('Failed to submit leave to server:', err);
      saveSharedLeave(newRecord);
    }
    setLeaveSubmitted(true);
  };

  const handleApplyGrv = async () => {
    if (!grvForm.subject || !grvForm.desc) return;
    const newGrv = {
      studentName: grvForm.anonymous ? 'Anonymous Student' : 'Ritesh Meesala',
      rollNo: grvForm.anonymous ? 'Hidden' : '24CS001',
      category: grvForm.category,
      subject: grvForm.subject,
      desc: grvForm.desc,
    };
    try {
      const res = await grievanceAPI.submitGrievance(newGrv);
      const created = res.data?.data || res.data || newGrv;
      saveSharedGrievance(created);
      await loadAll();
    } catch (err) {
      console.warn('Failed to submit grievance to server:', err);
      saveSharedGrievance(newGrv);
    }
    setGrvSubmitted(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description sx={{ color: '#2563eb' }} /> Student Requests, Leaves & Grievances
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Apply for student leaves, review institutional warnings, lodge confidential grievances, and track approvals.
          </Typography>
        </Box>
        {tabIndex === 0 && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setOpenLeaveModal(true); setLeaveSubmitted(false); }}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
          >
            Apply for Leave
          </Button>
        )}
        {tabIndex === 2 && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setOpenGrvModal(true); setGrvSubmitted(false); }}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#dc2626' }}
          >
            Lodge Grievance
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            bgcolor: '#ffffff',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, py: 2, minHeight: 48 },
            '& .Mui-selected': { color: '#2563eb' },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3 }
          }}
        >
          <Tab icon={<Description fontSize="small" />} iconPosition="start" label="Apply Leaves & History" />
          <Tab icon={<WarningAmber fontSize="small" />} iconPosition="start" label="Official Warnings" />
          <Tab icon={<Flag fontSize="small" />} iconPosition="start" label="Grievance Cell" />
          <Tab icon={<CheckCircleOutline fontSize="small" />} iconPosition="start" label="My Approvals Tracker" />
        </Tabs>
      </Paper>

      {/* Tab 0: Leaves */}
      {tabIndex === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Leave Applications & OD Records
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Leave ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Days</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Approval Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Approved By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leavesList.map((lv) => (
                  <TableRow key={lv.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{lv.id}</TableCell>
                    <TableCell>
                      <Chip label={lv.type} size="small" color={lv.type.includes('OD') ? 'primary' : 'default'} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#334155' }}>{lv.fromDate} to {lv.toDate}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{lv.days} Day(s)</TableCell>
                    <TableCell sx={{ color: '#475569', maxWidth: 280 }}>{lv.reason}</TableCell>
                    <TableCell>
                      <Chip label={lv.status} size="small" color={lv.status === 'Approved' ? 'success' : lv.status === 'Rejected' ? 'error' : 'warning'} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{lv.approvedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 1: Warnings */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Official Disciplinary & Academic Notices
          </Typography>
          {warningsList.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              No active warnings or disciplinary notices on your academic record. Excellent conduct!
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {warningsList.map((w) => (
                <Card key={w.id} variant="outlined" sx={{ borderRadius: 2.5, borderColor: '#fed7aa', bgcolor: '#fffbeb' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <WarningAmber sx={{ color: '#d97706' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9a3412' }}>
                          {w.type} ({w.id})
                        </Typography>
                      </Box>
                      <Chip label={`Issued: ${w.date}`} size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#78350f', my: 1 }}>
                      {w.text}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1, borderTop: '1px solid #fed7aa' }}>
                      <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 600 }}>
                        Issued by: {w.issuedBy}
                      </Typography>
                      <Chip label="Acknowledged" color="success" size="small" sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 2: Grievances */}
      {tabIndex === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Grievance Redressal Portal
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                All submissions are encrypted and monitored by the Institutional Grievance Redressal Committee
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {grievancesList.map((g) => (
              <Card key={g.id} variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Chip label={g.category} size="small" color="primary" sx={{ fontWeight: 700, mb: 0.5 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {g.subject}
                      </Typography>
                    </Box>
                    <Chip
                      label={g.status}
                      size="small"
                      color={g.status === 'Resolved' ? 'success' : 'warning'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                    Ticket Ref: <strong>{g.id}</strong> • Lodged on: {g.date}
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                      Committee Resolution & Action Taken:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      {g.response}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Tab 3: My Approvals */}
      {tabIndex === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Student Institutional Approvals Status
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Application Ref</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Request Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Submitted Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Designated Approver</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Current Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {APPROVALS_LIST.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{app.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e40af' }}>{app.requestType}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{app.submittedOn}</TableCell>
                    <TableCell sx={{ color: '#334155', fontWeight: 500 }}>{app.approver}</TableCell>
                    <TableCell>
                      <Chip label={app.status} color="success" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Apply Leave Modal */}
      <Dialog open={openLeaveModal} onClose={() => setOpenLeaveModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply for Student Leave / OD</DialogTitle>
        <DialogContent dividers>
          {leaveSubmitted ? (
            <Alert severity="success">Leave application submitted for Mentor & HOD approval! Ref: #LV-2026-108</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Leave Type"
                fullWidth
                size="small"
                value={leaveForm.type}
                onChange={(e) => setLeaveForm(p => ({ ...p, type: e.target.value }))}
              >
                <MenuItem value="On-Duty (OD)">On-Duty (OD) - Hackathon / Sports / Conf</MenuItem>
                <MenuItem value="Medical Leave">Medical Leave</MenuItem>
                <MenuItem value="Casual Leave">Casual Leave</MenuItem>
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="From Date"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm(p => ({ ...p, fromDate: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="To Date"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={leaveForm.toDate}
                    onChange={(e) => setLeaveForm(p => ({ ...p, toDate: e.target.value }))}
                  />
                </Grid>
              </Grid>
              <TextField
                label="Reason / Event Description"
                multiline
                rows={3}
                fullWidth
                placeholder="State the reason in detail..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
              />
              <Button variant="outlined" component="label" startIcon={<UploadFile />} sx={{ textTransform: 'none' }}>
                Upload Supporting Proof (Doctor Memo / Event Invite)
                <input type="file" hidden />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLeaveModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          {!leaveSubmitted && (
            <Button variant="contained" onClick={handleApplyLeave} sx={{ textTransform: 'none', bgcolor: '#2563eb' }}>
              Submit Leave Application
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Lodge Grievance Modal */}
      <Dialog open={openGrvModal} onClose={() => setOpenGrvModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Lodge Student Grievance</DialogTitle>
        <DialogContent dividers>
          {grvSubmitted ? (
            <Alert severity="success">Grievance submitted. Your ticket tracking ID is #GRV-2026-118</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Grievance Category"
                fullWidth
                size="small"
                value={grvForm.category}
                onChange={(e) => setGrvForm(p => ({ ...p, category: e.target.value }))}
              >
                <MenuItem value="Academic & Labs">Academic & Labs</MenuItem>
                <MenuItem value="Library Infrastructure">Library Infrastructure</MenuItem>
                <MenuItem value="Hostel & Food">Hostel & Food</MenuItem>
                <MenuItem value="Transport / Bus">Transport / Bus</MenuItem>
                <MenuItem value="Harassment / Ragging (Strict Anti-Ragging)">Harassment / Ragging (Strict Anti-Ragging)</MenuItem>
              </TextField>
              <TextField
                label="Subject Summary"
                fullWidth
                size="small"
                value={grvForm.subject}
                onChange={(e) => setGrvForm(p => ({ ...p, subject: e.target.value }))}
              />
              <TextField
                label="Detailed Description"
                multiline
                rows={4}
                fullWidth
                value={grvForm.desc}
                onChange={(e) => setGrvForm(p => ({ ...p, desc: e.target.value }))}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={grvForm.anonymous}
                    onChange={(e) => setGrvForm(p => ({ ...p, anonymous: e.target.checked }))}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Keep Submission Anonymous</Typography>}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenGrvModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          {!grvSubmitted && (
            <Button variant="contained" onClick={handleApplyGrv} sx={{ textTransform: 'none', bgcolor: '#dc2626' }}>
              Submit Grievance
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

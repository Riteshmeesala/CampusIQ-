import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, IconButton, Tooltip
} from '@mui/material';
import {
  Warning, Send, Print, NotificationsActive, Email,
  Phone, CheckCircle, ErrorOutline, Delete, Download
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { warningAPI } from '../../services/api';
import { broadcastDataChange, subscribeToDataSync } from '../../services/dataSync';

export default function StudentWarningsPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const res = await warningAPI.getAll();
      const serverData = res.data?.data || res.data || [];
      if (Array.isArray(serverData) && serverData.length > 0) {
        setWarnings(serverData);
      } else {
        const saved = localStorage.getItem('campusiq_student_warnings');
        if (saved) setWarnings(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Failed to load warnings from server:', err);
      const saved = localStorage.getItem('campusiq_student_warnings');
      if (saved) setWarnings(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarnings();
    const unsub = subscribeToDataSync(() => {
      loadWarnings();
    });
    return unsub;
  }, []);

  const [form, setForm] = useState({
    roll: '21CS045',
    name: 'Rahul Reddy K.',
    type: 'Attendance Shortage (<65%)',
    severity: 'CRITICAL',
    remarks: 'Attendance fallen below 65%. Ineligible for End-Semester examinations unless condonation approved.'
  });

  const handleIssueWarning = async () => {
    const payload = {
      rollNo: form.roll,
      studentName: form.name,
      type: form.type,
      severity: form.severity,
      text: form.remarks,
      issuedBy: 'Faculty Committee',
    };

    try {
      const res = await warningAPI.issueWarning(payload);
      const created = res.data?.data || res.data || payload;
      const updated = [created, ...warnings];
      setWarnings(updated);
      localStorage.setItem('campusiq_student_warnings', JSON.stringify(updated));
      broadcastDataChange('STUDENT_WARNING_ISSUED', { warning: created, allWarnings: updated });
      toast.success(`Formal warning notice issued and synced to backend!`);
    } catch (err) {
      console.warn('Failed to issue warning to server, saving locally:', err);
      const newNotice = {
        id: `WARN-2024-00${warnings.length + 1}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        roll: form.roll,
        name: form.name,
        type: form.type,
        severity: form.severity,
        text: form.remarks,
        status: 'PENDING EXPLANATION'
      };
      const updated = [newNotice, ...warnings];
      setWarnings(updated);
      localStorage.setItem('campusiq_student_warnings', JSON.stringify(updated));
      toast.success(`Warning saved locally`);
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    const updated = warnings.filter(w => w.id !== id);
    setWarnings(updated);
    localStorage.setItem('campusiq_student_warnings', JSON.stringify(updated));
    broadcastDataChange('STUDENT_WARNING_DELETED', { id, allWarnings: updated });
    toast.info('Warning record dismissed.');
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Student Academic & Attendance Warnings"
        subtitle="Issue official disciplinary notices, dispatch parent alerts, and synchronize warnings across Student, Faculty, and Admin portals"
        breadcrumbs={['Home', 'Administration Management', 'Student Warnings']}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Exporting Disciplinary & Attendance Warnings Ledger (PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Ledger (PDF)
            </Button>
            <Button
              variant="contained"
              startIcon={<Warning />}
              onClick={() => setOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: '#dc2626' }}
            >
              Issue Formal Notice
            </Button>
          </Stack>
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Active Warning Notices', val: `${warnings.length} Active`, sub: 'Even Semester 2023-24', color: '#dc2626' },
          { label: 'Attendance Shortages (<65%)', val: '2 Students', sub: 'Ineligible for Exams', color: '#ea580c' },
          { label: 'Parent Alerts Dispatched', val: '100% Delivered', sub: 'SMS & Email Gateways', color: '#16a34a' },
          { label: 'Remedial Counselings Held', val: '3 Sessions', sub: 'HOD Chamber', color: '#2563eb' },
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
            <Typography variant="subtitle1" fontWeight={700}>
              Active Warning Records & Parent Notices Ledger
            </Typography>
            <Chip label="Real-Time Synced with Student Portals" color="error" size="small" sx={{ fontWeight: 700 }} />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Notice ID', 'Date Issued', 'Student Details', 'Warning Type', 'Severity', 'Guardian Notified', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {warnings.map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{row.id}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{row.date}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">{row.name}</Typography>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">{row.roll}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.severity}
                        size="small"
                        sx={{
                          bgcolor: row.severity === 'CRITICAL' ? '#fee2e2' : row.severity === 'HIGH' ? '#fef3c7' : '#eff6ff',
                          color: row.severity === 'CRITICAL' ? '#b91c1c' : row.severity === 'HIGH' ? '#92400e' : '#1d4ed8',
                          fontWeight: 800,
                          fontSize: 10
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CheckCircle sx={{ fontSize: 14, color: '#16a34a' }} />
                        <Typography variant="caption" fontWeight={600} color="#166534">{row.parentNotified}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          bgcolor: row.status === 'RESOLVED' ? '#dcfce7' : '#f8fafc',
                          color: row.status === 'RESOLVED' ? '#166534' : '#475569',
                          fontWeight: 700,
                          fontSize: 10,
                          border: '1px solid #e2e8f0'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" variant="outlined" startIcon={<Print />} onClick={() => toast.success(`Printing official warning letter ${row.id}`)} sx={{ fontSize: 10, textTransform: 'none', py: 0.1 }}>
                          Letter
                        </Button>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                          <Delete fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Issue Warning Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#dc2626', color: '#ffffff' }}>
          Issue Formal Disciplinary / Attendance Notice
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Select Student" value={form.roll} onChange={e => {
                  const names = { '21CS045': 'Rahul Reddy K.', '21CS078': 'Sanya Mirza M.', '21CS092': 'Vikram Aditya J.' };
                  setForm({ ...form, roll: e.target.value, name: names[e.target.value] || 'Student' });
                }}>
                  <MenuItem value="21CS045">Rahul Reddy K. (21CS045)</MenuItem>
                  <MenuItem value="21CS078">Sanya Mirza M. (21CS078)</MenuItem>
                  <MenuItem value="21CS092">Vikram Aditya J. (21CS092)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Severity Level" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  <MenuItem value="CRITICAL">CRITICAL (Exam Barred / Detention)</MenuItem>
                  <MenuItem value="HIGH">HIGH (Parent Meeting Required)</MenuItem>
                  <MenuItem value="MEDIUM">MEDIUM (Remedial Counseling)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField select fullWidth size="small" label="Warning Violation Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="Attendance Shortage (<65%)">Attendance Shortage (&lt;65%)</MenuItem>
              <MenuItem value="Multiple Academic Backlogs (3)">Multiple Academic Backlogs</MenuItem>
              <MenuItem value="Continuous Absenteeism (5 Days)">Continuous Uninformed Absenteeism</MenuItem>
              <MenuItem value="Lab Practical Deficit">Lab Practical Deficit</MenuItem>
              <MenuItem value="Campus Discipline Violation">Campus Discipline Violation</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Official Notice Remarks & Action Required"
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
            />

            <Alert severity="warning" sx={{ fontSize: 12 }}>
              Issuing this notice will automatically dispatch an SMS alert to the registered parent mobile number and lock condonation eligibility pending explanation.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleIssueWarning} sx={{ bgcolor: '#dc2626', fontWeight: 700 }}>
            Dispatch Formal Notice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

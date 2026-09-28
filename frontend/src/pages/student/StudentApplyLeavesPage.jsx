import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Alert, IconButton, Tooltip
} from '@mui/material';
import {
  DescriptionOutlined, Add, Refresh
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { leaveAPI } from '../../services/api';
import { getSharedLeaves, saveSharedLeave, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';

export default function StudentApplyLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    type: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [successMsg, setSuccessMsg] = useState('');

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveAPI.getMyLeaves();
      const serverLeaves = res.data?.data || res.data || [];
      if (Array.isArray(serverLeaves) && serverLeaves.length > 0) {
        setLeaves(serverLeaves);
      } else {
        setLeaves(getSharedLeaves());
      }
    } catch (err) {
      console.warn('Failed to load leaves from server, using local fallback:', err);
      setLeaves(getSharedLeaves());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.LEAVE_STATUS_CHANGED, () => loadLeaves());
    const unsubApply = subscribeToDataSync(DATA_SYNC_EVENTS.LEAVE_APPLIED, () => loadLeaves());
    return () => {
      unsub();
      unsubApply();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromDate || !form.toDate || !form.reason.trim()) return;

    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    const days = Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1);

    const payload = {
      studentName: user?.name || 'Student',
      rollNo: user?.username || '24CS001',
      type: form.type,
      fromDate: form.fromDate,
      toDate: form.toDate,
      days,
      reason: form.reason.trim(),
    };

    try {
      const res = await leaveAPI.applyLeave(payload);
      const created = res.data?.data || res.data || payload;
      saveSharedLeave(created);
      await loadLeaves();
      setOpenModal(false);
      setForm({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
      setSuccessMsg('Leave application submitted successfully to backend server!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error submitting leave to server:', err);
      // Fallback
      saveSharedLeave(payload);
      setLeaves(getSharedLeaves());
      setOpenModal(false);
      setSuccessMsg('Leave saved locally (offline mode)');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Apply Leaves Module"
        subtitle="Submit institutional leave requests, On-Duty (OD) slips, and track real-time approval status"
        breadcrumbs={[
          { label: 'Dashboard', path: '/student/dashboard' },
          { label: 'Apply Leaves' }
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenModal(true)}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 600 }}
          >
            New Leave Application
          </Button>
        }
      />

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {/* Leaves Records Table Card */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            My Leave Applications & History
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadLeaves}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
        </Box>

        {leaves.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <DescriptionOutlined sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No leave applications found</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 2 }}>You have not submitted any leave requests yet.</Typography>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setOpenModal(true)} sx={{ textTransform: 'none' }}>
              Apply for Leave
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Application ID</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Leave Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Duration</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Days</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Reason</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0284c7' }}>{l.id}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{l.type}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{l.fromDate} to {l.toDate}</td>
                    <td style={{ padding: '10px 12px' }}>{l.days} day(s)</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{l.reason}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Chip
                        label={l.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '11px',
                          bgcolor: l.status === 'Approved' ? '#dcfce7' : l.status === 'Pending Review' ? '#fef9c3' : '#fee2e2',
                          color: l.status === 'Approved' ? '#15803d' : l.status === 'Pending Review' ? '#854d0e' : '#b91c1c'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{l.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Box>

      {/* New Leave Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Submit Leave Application</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Leave Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Casual Leave">Casual Leave</MenuItem>
              <MenuItem value="Medical Leave">Medical Leave</MenuItem>
              <MenuItem value="On-Duty (OD)">On-Duty (OD) / Hackathon / Event</MenuItem>
              <MenuItem value="Semester Project Leave">Semester Project Leave</MenuItem>
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="date"
                label="From Date"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                size="small"
              />
              <TextField
                type="date"
                label="To Date"
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Reason for Leave"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              multiline
              rows={3}
              placeholder="State institutional reason, event name, or medical details..."
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 600 }}>
              Submit Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

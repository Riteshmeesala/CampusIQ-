import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Add, Refresh, Search } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { leaveAPI } from '../../services/api';
import { getSharedLeaves, saveSharedLeave, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';

export default function StudentApplyLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    type: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: '',
  });

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

    const newLeave = {
      id: Date.now(),
      studentName: user?.name || 'MEESALA RITESH',
      rollNo: user?.enrollmentNumber || user?.username || '23BQ1A1268',
      type: form.type,
      leaveType: form.type,
      startDate: form.fromDate,
      endDate: form.toDate,
      reason: form.reason.trim(),
      status: 'PENDING',
      appliedAt: new Date().toLocaleDateString(),
    };

    saveSharedLeave(newLeave);
    setLeaves(getSharedLeaves());
    setOpenModal(false);
    setForm({ type: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
  };

  const filtered = leaves.filter(item =>
    item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HEADER MATCHING SCREENSHOT 4 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          p: '14px 20px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 2.5
        }}
      >
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
          Apply Leave
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Orange Add New Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => setOpenModal(true)}
            sx={{
              bgcolor: '#ea580c',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: 0.7,
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
              '&:hover': { bgcolor: '#c2410c' }
            }}
          >
            + Add New
          </Button>

          {/* Blue Refresh Button */}
          <Button
            variant="contained"
            size="small"
            disabled={loading}
            startIcon={<Refresh sx={{ fontSize: 16 }} />}
            onClick={loadLeaves}
            sx={{
              bgcolor: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: 0.7,
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              '&:hover': { bgcolor: '#0369a1' }
            }}
          >
            Refresh
          </Button>

          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: 160, sm: 220 },
              '& .MuiOutlinedInput-root': {
                height: 36,
                fontSize: '0.84rem',
                borderRadius: '4px',
                bgcolor: '#ffffff'
              }
            }}
          />
        </Box>
      </Box>

      {/* ── MAIN CONTENT MATCHING SCREENSHOT 4 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minHeight: 480,
          p: filtered.length === 0 ? 0 : 2,
          display: filtered.length === 0 ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {filtered.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            No Data Found!
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Leave Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>From Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>To Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item, idx) => (
                  <TableRow key={item.id || idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{item.type || item.leaveType}</TableCell>
                    <TableCell>{item.startDate || item.fromDate}</TableCell>
                    <TableCell>{item.endDate || item.toDate}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.status || 'PENDING'}
                        size="small"
                        sx={{
                          bgcolor: item.status === 'APPROVED' ? '#dcfce7' : item.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                          color: item.status === 'APPROVED' ? '#15803d' : item.status === 'REJECTED' ? '#b91c1c' : '#b45309',
                          fontWeight: 700,
                          fontSize: '0.72rem'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* ── APPLY LEAVE MODAL ── */}
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
              <MenuItem value="On-Duty (OD)">On-Duty (OD - Technical Fest/Conference)</MenuItem>
              <MenuItem value="Permission">Permission</MenuItem>
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="From Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="To Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                required
                fullWidth
                size="small"
              />
            </Box>
            <TextField
              label="Reason for Leave"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="State clear purpose of leave..."
              multiline
              rows={3}
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#ea580c', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#c2410c' } }}
            >
              Submit Application
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

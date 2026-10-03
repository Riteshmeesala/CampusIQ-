import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { Add, Refresh, Search, VisibilityOutlined, Link as LinkIcon, AttachFile } from '@mui/icons-material';
import { leaveAPI, certificateAPI } from '../../services/api';
import { getSharedLeaves, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';

export default function StudentApprovalsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [form, setForm] = useState({
    category: 'Project Submission',
    approver: 'Dr. K. Srinivasa Rao (HoD IT)',
    note: '',
    link: '',
    file: 'report.pdf'
  });

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const [leavesRes, certsRes] = await Promise.allSettled([
        leaveAPI.getMyLeaves(),
        certificateAPI.getMyCertificates()
      ]);

      const serverLeaves = (leavesRes.status === 'fulfilled' && (leavesRes.value.data?.data || leavesRes.value.data)) || getSharedLeaves();
      const serverCerts = (certsRes.status === 'fulfilled' && (certsRes.value.data?.data || certsRes.value.data)) || [];

      const list = [
        ...serverLeaves.map((l, i) => ({
          id: `LEAVE_${l.id || i}`,
          approver: l.approvedBy || 'HoD / Department Faculty',
          note: l.reason || 'Leave Application',
          status: l.status || 'PENDING',
          category: 'Leave Application',
          link: '#',
          file: 'leave_request.pdf'
        })),
        ...serverCerts.map((c, i) => ({
          id: `CERT_${c.id || i}`,
          approver: 'Academic Registrar / Dean Office',
          note: c.purpose || 'Certificate Clearance',
          status: c.status || 'APPROVED',
          category: 'Document Clearance',
          link: '#',
          file: 'certificate_memo.pdf'
        }))
      ];

      setSubmissions(list);
    } catch (err) {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.LEAVE_STATUS_CHANGED, () => loadSubmissions());
    return () => unsub();
  }, []);

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!form.note.trim()) return;

    const newItem = {
      id: `SUB_${Date.now()}`,
      approver: form.approver,
      note: form.note.trim(),
      status: 'PENDING',
      category: form.category,
      link: form.link || 'https://vvit-erp.edunxt.co.in/submissions',
      file: form.file || 'document.pdf'
    };

    setSubmissions([newItem, ...submissions]);
    setOpenModal(false);
    setForm({
      category: 'Project Submission',
      approver: 'Dr. K. Srinivasa Rao (HoD IT)',
      note: '',
      link: '',
      file: 'report.pdf'
    });
  };

  const filtered = submissions.filter(item =>
    item.approver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HEADER MATCHING SCREENSHOT 1 ── */}
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
          Submission
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
            onClick={loadSubmissions}
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

      {/* ── TABLE WITH SOLID BLUE/CYAN HEADER MATCHING SCREENSHOT 1 ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          bgcolor: '#ffffff',
          minHeight: 480
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0284c7' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 50, fontSize: '0.86rem', py: 1.4 }}>
                #
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.86rem', py: 1.4 }}>
                Approver
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.86rem', py: 1.4 }}>
                Note
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 120, fontSize: '0.86rem', py: 1.4 }} align="center">
                Status
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 150, fontSize: '0.86rem', py: 1.4 }}>
                Category
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 90, fontSize: '0.86rem', py: 1.4 }} align="center">
                Link
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 90, fontSize: '0.86rem', py: 1.4 }} align="center">
                File
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 80, fontSize: '0.86rem', py: 1.4 }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8, color: '#94a3b8', fontSize: '0.95rem' }}>
                  No Data Found!
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, idx) => (
                <TableRow key={item.id || idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.86rem', py: 1.2 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.86rem', py: 1.2 }}>
                    {item.approver}
                  </TableCell>
                  <TableCell sx={{ color: '#334155', fontSize: '0.86rem', py: 1.2 }}>
                    {item.note}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <Chip
                      label={item.status}
                      size="small"
                      sx={{
                        bgcolor: item.status === 'APPROVED' ? '#dcfce7' : item.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                        color: item.status === 'APPROVED' ? '#15803d' : item.status === 'REJECTED' ? '#b91c1c' : '#b45309',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#64748b', fontSize: '0.84rem', py: 1.2 }}>
                    {item.category}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <IconButton size="small" sx={{ color: '#0284c7' }}>
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <IconButton size="small" sx={{ color: '#ea580c' }}>
                      <AttachFile fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setViewItem(item)} sx={{ color: '#0284c7' }}>
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── ADD NEW SUBMISSION MODAL ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Add New Submission for Approval</DialogTitle>
        <form onSubmit={handleAddNew}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Submission Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Project Submission">Project Submission / Major Project Review</MenuItem>
              <MenuItem value="Internship Report">Internship Completion Report</MenuItem>
              <MenuItem value="Technical Paper / Conference">Technical Paper / Conference Approval</MenuItem>
              <MenuItem value="Leave Request">Leave Request Submission</MenuItem>
              <MenuItem value="Fee Concession / Scholarship">Fee Concession / Scholarship Application</MenuItem>
            </TextField>
            <TextField
              label="Approver / Authority"
              value={form.approver}
              onChange={(e) => setForm({ ...form, approver: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Note / Remarks"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="State submission details..."
              multiline
              rows={3}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Submission Link / URL (Optional)"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://github.com/... or Google Drive URL"
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
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── VIEW SUBMISSION MODAL ── */}
      {viewItem && (
        <Dialog open={Boolean(viewItem)} onClose={() => setViewItem(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Submission Details</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: '#0284c7' }}>{viewItem.category}</Typography>
              <Chip label={viewItem.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>Approver: {viewItem.approver}</Typography>
            <Typography sx={{ fontSize: '0.88rem', color: '#334155', bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
              {viewItem.note}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setViewItem(null)} sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

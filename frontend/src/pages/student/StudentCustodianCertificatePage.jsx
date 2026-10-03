import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';

export default function StudentCustodianCertificatePage() {
  const [records, setRecords] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    certificateType: 'Custodian Certificate (Original Certificates Custody)',
    purpose: 'Passport / Visa Application',
    documentsHeld: 'SSC Original Memo, Intermediate Original Memo, Transfer Certificate',
    durationRequired: '1 Month',
    remarks: ''
  });

  const handleApply = (e) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now(),
      applicationNo: `CUST-VVIT-${Math.floor(1000 + Math.random() * 9000)}`,
      appliedDate: new Date().toLocaleDateString(),
      purpose: form.purpose,
      status: 'UNDER_PROCESS'
    };
    setRecords([newRecord, ...records]);
    setOpenModal(false);
  };

  const handleRefresh = () => {
    // Refresh records
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HEADER MATCHING SCREENSHOT 3 ── */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Orange vertical accent line */}
          <Box sx={{ width: 3, height: 18, bgcolor: '#f97316', borderRadius: '2px' }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#ea580c' }}>
            Custodian Certificate
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            + Apply For Custodian Certificate
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh sx={{ fontSize: 16 }} />}
            onClick={handleRefresh}
            sx={{
              bgcolor: '#f1f5f9',
              color: '#334155',
              borderColor: '#cbd5e1',
              textTransform: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              px: 1.8,
              py: 0.6,
              borderRadius: '4px',
              '&:hover': { bgcolor: '#e2e8f0', borderColor: '#94a3b8' }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ── MAIN CONTENT MATCHING SCREENSHOT 3 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minHeight: 480,
          p: records.length === 0 ? 0 : 2,
          display: records.length === 0 ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {records.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            No Data Found!
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Application No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Applied Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{r.applicationNo}</TableCell>
                    <TableCell>{r.appliedDate}</TableCell>
                    <TableCell>{r.purpose}</TableCell>
                    <TableCell align="center">
                      <Chip label={r.status} size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* ── APPLY MODAL ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Apply For Custodian Certificate</DialogTitle>
        <form onSubmit={handleApply}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Purpose of Certificate"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Passport / Visa Application">Passport / Visa Application</MenuItem>
              <MenuItem value="Bank Education Loan Verification">Bank Education Loan Verification</MenuItem>
              <MenuItem value="State Scholarship Document Proof">State Scholarship Document Proof</MenuItem>
              <MenuItem value="Competitive Exam Document Verification">Competitive Exam Document Verification</MenuItem>
            </TextField>
            <TextField
              label="Documents Currently in Institute Custody"
              value={form.documentsHeld}
              disabled
              fullWidth
              size="small"
            />
            <TextField
              label="Period / Duration Required"
              value={form.durationRequired}
              onChange={(e) => setForm({ ...form, durationRequired: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Additional Remarks"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="State any specific details or authorities..."
              multiline
              rows={3}
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

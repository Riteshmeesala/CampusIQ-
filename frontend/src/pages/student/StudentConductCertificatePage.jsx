import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem
} from '@mui/material';

export default function StudentConductCertificatePage() {
  const [records, setRecords] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    certificateType: 'Study & Conduct Certificate (Bonafide)',
    purpose: 'Scholarship / Fee Reimbursement Application',
    academicYear: '2026-27',
    semester: '4-1',
    remarks: ''
  });

  const handleApply = (e) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now(),
      applicationNo: `SC-VVIT-${Math.floor(1000 + Math.random() * 9000)}`,
      appliedDate: new Date().toLocaleDateString(),
      purpose: form.purpose,
      conduct: 'Exemplary / Good',
      status: 'ISSUED'
    };
    setRecords([newRecord, ...records]);
    setOpenModal(false);
  };

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
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Orange vertical accent line */}
          <Box sx={{ width: 3, height: 18, bgcolor: '#f97316', borderRadius: '2px' }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#ea580c' }}>
            Study Conduct
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          onClick={() => setOpenModal(true)}
          sx={{
            bgcolor: '#ea580c',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.82rem',
            textTransform: 'none',
            px: 2.5,
            py: 0.7,
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
            '&:hover': { bgcolor: '#c2410c' }
          }}
        >
          Apply Certificate
        </Button>
      </Box>

      {/* ── MAIN CONTENT MATCHING SCREENSHOT 4 ── */}
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
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Certificate No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Date Issued</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Conduct Remarks</TableCell>
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
                    <TableCell sx={{ color: '#16a34a', fontWeight: 600 }}>{r.conduct}</TableCell>
                    <TableCell align="center">
                      <Chip label={r.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.72rem' }} />
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
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Apply For Study & Conduct Certificate</DialogTitle>
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
              <MenuItem value="Scholarship / Fee Reimbursement Application">Scholarship / Fee Reimbursement Application</MenuItem>
              <MenuItem value="Passport / Visa Application">Passport / Visa Application</MenuItem>
              <MenuItem value="Bank Education Loan">Bank Education Loan</MenuItem>
              <MenuItem value="Bus Pass / Train Concession">Bus Pass / Train Concession</MenuItem>
              <MenuItem value="Higher Studies Application">Higher Studies Application</MenuItem>
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Academic Year"
                value={form.academicYear}
                disabled
                fullWidth
                size="small"
              />
              <TextField
                label="Current Semester"
                value={form.semester}
                disabled
                fullWidth
                size="small"
              />
            </Box>
            <TextField
              label="Remarks / Specific Addressee (Optional)"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="e.g. To whomsoever it may concern / Regional Passport Officer"
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
              Generate Certificate
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

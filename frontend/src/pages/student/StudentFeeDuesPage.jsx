import React, { useState } from 'react';
import {
  Box, Typography, Button, FormControl, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { Search } from '@mui/icons-material';

export default function StudentFeeDuesPage() {
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [dues, setDues] = useState([]);

  // In official VVIT portal, students with no pending dues see 'No Data Found!'
  const SEMESTERS = ['All', '2-1', '2-2', '3-1', '1-2', '1-1', '3-2', '4-1'];

  const handleFilter = () => {
    // All fees are cleared / paid in full for 23BQ1A1268 (No Dues)
    setDues([]);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HEADER MATCHING SCREENSHOT 5 ── */}
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
          Student Fee Dues
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
          <Box sx={{ minWidth: 140 }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mb: 0.4, fontWeight: 600 }}>
              Semester
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                sx={{
                  bgcolor: '#ffffff',
                  fontSize: '0.86rem',
                  height: 36,
                  borderRadius: '4px'
                }}
              >
                {SEMESTERS.map((sem) => (
                  <MenuItem key={sem} value={sem} sx={{ fontSize: '0.86rem' }}>
                    {sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            onClick={handleFilter}
            sx={{
              bgcolor: '#0284c7',
              color: '#ffffff',
              minWidth: 42,
              width: 42,
              height: 36,
              p: 0,
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              '&:hover': { bgcolor: '#0369a1' }
            }}
          >
            <Search sx={{ fontSize: 20 }} />
          </Button>
        </Box>
      </Box>

      {/* ── MAIN CONTENT MATCHING SCREENSHOT 5 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minHeight: 480,
          p: dues.length === 0 ? 0 : 2,
          display: dues.length === 0 ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {dues.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            No Data Found!
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Fee Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Semester</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="right">Due Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dues.map((d, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{d.feeType}</TableCell>
                    <TableCell>{d.semester}</TableCell>
                    <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 700 }}>₹{d.dueAmount.toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Chip label="DUE" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 800 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

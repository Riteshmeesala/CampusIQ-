import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Refresh, FilterAlt } from '@mui/icons-material';

export default function StudentLibraryNewArrivalsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [arrivals, setArrivals] = useState([]);

  const SAMPLE_NEW_ARRIVALS = [
    { sNo: 1, accNo: 'VVIT-CS-2026-01', bookName: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', author: 'Aurélien Géron' },
    { sNo: 2, accNo: 'VVIT-IT-2026-02', bookName: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann' },
    { sNo: 3, accNo: 'VVIT-IT-2026-03', bookName: 'Continuous Delivery Pipelines with Docker and Kubernetes', author: 'Michael Huttermann' },
    { sNo: 4, accNo: 'VVIT-CS-2026-04', bookName: 'Deep Learning with Python (2nd Edition)', author: 'François Chollet' },
  ];

  const handleFilter = (e) => {
    e?.preventDefault();
    if (fromDate && toDate) {
      setArrivals(SAMPLE_NEW_ARRIVALS);
    } else {
      setArrivals([]);
    }
  };

  const handleRefresh = () => {
    setFromDate('');
    setToDate('');
    setArrivals([]);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── FILTER CARD MATCHING SCREENSHOT 3 ── */}
      <Box
        component="form"
        onSubmit={handleFilter}
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          p: { xs: 2, md: 2.5 },
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: '0.98rem', fontWeight: 600, color: '#334155' }}>
            Library New Arrivals Range Reports
          </Typography>
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
              fontSize: '0.8rem',
              fontWeight: 600,
              px: 1.6,
              py: 0.4,
              borderRadius: '4px',
              '&:hover': { bgcolor: '#e2e8f0' }
            }}
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 220 } }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 0.5, fontWeight: 600 }}>
              From Date <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
            </Typography>
            <TextField
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 38,
                  fontSize: '0.86rem',
                  borderRadius: '4px',
                  bgcolor: '#ffffff'
                }
              }}
            />
          </Box>

          <Box sx={{ width: { xs: '100%', sm: 220 } }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 0.5, fontWeight: 600 }}>
              To Date <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
            </Typography>
            <TextField
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 38,
                  fontSize: '0.86rem',
                  borderRadius: '4px',
                  bgcolor: '#ffffff'
                }
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            startIcon={<FilterAlt sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: '#ea580c',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              textTransform: 'none',
              height: 38,
              px: 3,
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
              '&:hover': { bgcolor: '#c2410c' }
            }}
          >
            Filter
          </Button>
        </Box>
      </Box>

      {/* ── TABLE WITH DARK HEADER MATCHING SCREENSHOT 3 ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          bgcolor: '#ffffff',
          minHeight: 400
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 80, fontSize: '0.88rem', py: 1.4 }}>
                S.No
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 220, fontSize: '0.88rem', py: 1.4 }}>
                Acc No
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', py: 1.4 }}>
                Book Name
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 320, fontSize: '0.88rem', py: 1.4 }}>
                Author
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {arrivals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8', fontSize: '0.92rem' }}>
                  No data found.
                </TableCell>
              </TableRow>
            ) : (
              arrivals.map((item) => (
                <TableRow key={item.sNo} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.86rem', py: 1.2 }}>
                    {item.sNo}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0284c7', fontSize: '0.86rem', py: 1.2 }}>
                    {item.accNo}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem', py: 1.2 }}>
                    {item.bookName}
                  </TableCell>
                  <TableCell sx={{ color: '#475569', fontSize: '0.86rem', py: 1.2 }}>
                    {item.author}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

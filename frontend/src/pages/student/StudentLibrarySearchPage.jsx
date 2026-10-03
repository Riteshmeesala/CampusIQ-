import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Radio, RadioGroup, FormControlLabel,
  FormControl, FormLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { FilterAlt } from '@mui/icons-material';

export default function StudentLibrarySearchPage() {
  const [searchBy, setSearchBy] = useState('Title');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  const SAMPLE_BOOKS = [
    { accNo: 'VVIT-CS-1042', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen, Charles E. Leiserson', callNo: '005.1 COR', isbn: '978-0262033848', subject: 'Data Structures & Algorithms', department: 'Information Technology', available: 4 },
    { accNo: 'VVIT-IT-0891', title: 'Computer Networking: A Top-Down Approach', author: 'James F. Kurose, Keith W. Ross', callNo: '004.6 KUR', isbn: '978-0133594140', subject: 'Computer Networks', department: 'Information Technology', available: 6 },
    { accNo: 'VVIT-CS-0412', title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry F. Korth', callNo: '005.74 SIL', isbn: '978-0073523323', subject: 'Database Management Systems', department: 'Information Technology', available: 2 },
    { accNo: 'VVIT-IT-1120', title: 'Cloud Computing: Principles and Paradigms', author: 'Rajkumar Buyya, Christian Vecchiola', callNo: '004.67 BUY', isbn: '978-0470887998', subject: 'Cloud Computing', department: 'Information Technology', available: 5 },
    { accNo: 'VVIT-CS-2219', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', callNo: '006.3 RUS', isbn: '978-0136042594', subject: 'Artificial Intelligence', department: 'Information Technology', available: 3 },
  ];

  const handleFilter = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const filtered = SAMPLE_BOOKS.filter(b => {
      if (searchBy === 'Title') return b.title.toLowerCase().includes(q);
      if (searchBy === 'Acc No') return b.accNo.toLowerCase().includes(q);
      if (searchBy === 'Author') return b.author.toLowerCase().includes(q);
      if (searchBy === 'Call No') return b.callNo.toLowerCase().includes(q);
      if (searchBy === 'ISBN') return b.isbn.toLowerCase().includes(q);
      if (searchBy === 'Subject') return b.subject.toLowerCase().includes(q);
      if (searchBy === 'Department') return b.department.toLowerCase().includes(q);
      return false;
    });
    setResults(filtered);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP TITLE MATCHING SCREENSHOT 2 ── */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
          Library Book Search
        </Typography>
      </Box>

      {/* ── SEARCH BY CARD MATCHING SCREENSHOT 2 ── */}
      <Box
        component="form"
        onSubmit={handleFilter}
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          p: { xs: 2, md: 3 },
          mb: 3
        }}
      >
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
          <FormLabel
            component="legend"
            sx={{
              fontSize: '0.86rem',
              fontWeight: 700,
              color: '#334155 !important',
              mb: 1
            }}
          >
            Search By <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
          </FormLabel>
          <RadioGroup
            row
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            sx={{ gap: { xs: 1, sm: 2 } }}
          >
            {['Title', 'Acc No', 'Author', 'Call No', 'ISBN', 'Subject', 'Department'].map((opt) => (
              <FormControlLabel
                key={opt}
                value={opt}
                control={<Radio size="small" sx={{ color: '#0284c7', '&.Mui-checked': { color: '#0284c7' } }} />}
                label={<Typography sx={{ fontSize: '0.84rem', color: '#334155' }}>{opt}</Typography>}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Box sx={{ maxWidth: 500 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 0.5, fontWeight: 600 }}>
            {searchBy} <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <Button
              type="submit"
              variant="contained"
              startIcon={<FilterAlt sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                textTransform: 'none',
                height: 38,
                px: 2.5,
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                '&:hover': { bgcolor: '#0369a1' }
              }}
            >
              Filter
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── RESULTS CARD MATCHING SCREENSHOT 2 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minHeight: 440,
          p: results.length === 0 ? 0 : 2,
          display: results.length === 0 ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {results.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            No Data Found!
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Acc No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Book Title</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Author</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Call No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Availability</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((b, idx) => (
                  <TableRow key={b.accNo} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{b.accNo}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.title}</TableCell>
                    <TableCell>{b.author}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{b.subject}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{b.callNo}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${b.available} Available`}
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }}
                      />
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

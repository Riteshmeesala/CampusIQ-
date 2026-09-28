import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, TextField, InputAdornment, Tab, Tabs, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem
} from '@mui/material';
import {
  LocalLibrary, Search, MenuBook, OpenInNew, Download,
  CheckCircle, Bookmark, AutoStories, Science,
  Add, Refresh, AssignmentReturn, LibraryBooks
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { libraryAPI } from '../../services/api';

export default function DigitalLibraryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10);
  const [tabIndex, setTabIndex] = useState(initialTab);

  useEffect(() => {
    const qTab = queryParams.get('tab');
    if (qTab !== null) {
      setTabIndex(parseInt(qTab, 10));
    }
  }, [location.search]);

  const [search, setSearch] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ borrower: '', accNumber: '', days: '14' });

  const [issuedBooks, setIssuedBooks] = useState([
    { acc: 'ACC-84920', title: 'Operating System Concepts (10th Ed)', borrower: 'Prof. S. K. Sharma (Faculty)', issued: '10 Feb 2024', due: '10 Mar 2024', status: 'ACTIVE LOAN' },
    { acc: 'ACC-91024', title: 'Deep Learning with Python (François Chollet)', borrower: 'Aarav Patel (21CS001)', issued: '15 Feb 2024', due: '01 Mar 2024', status: 'ACTIVE LOAN' },
    { acc: 'ACC-73819', title: 'Computer Networks: A Top-Down Approach', borrower: 'Divya Reddy (21CS035)', issued: '04 Feb 2024', due: '18 Feb 2024', status: 'OVERDUE (3 DAYS)' },
  ]);

  useEffect(() => {
    const loadServerLibrary = async () => {
      try {
        const res = await libraryAPI.getBorrowed();
        const serverData = res.data?.data || res.data || [];
        if (Array.isArray(serverData) && serverData.length > 0) {
          setIssuedBooks(serverData.map(b => ({
            acc: b.id || 'ACC-9901',
            title: b.bookTitle || b.title,
            borrower: b.borrower || 'Ritesh Meesala (Student)',
            issued: b.issueDate || '15 Aug 2026',
            due: b.dueDate || '15 Sep 2026',
            status: b.status === 'Active' ? 'ACTIVE LOAN' : b.status
          })));
        }
      } catch (err) {
        console.warn('Failed to load borrowed books from server:', err);
      }
    };
    loadServerLibrary();
  }, []);

  const handleIssueBook = () => {
    if (!issueForm.accNumber || !issueForm.borrower) {
      toast.error('Accession Number and Borrower are required');
      return;
    }
    const newLoan = {
      acc: issueForm.accNumber,
      title: 'Catalog Book Entry',
      borrower: issueForm.borrower,
      issued: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      due: '20 Mar 2024',
      status: 'ACTIVE LOAN'
    };
    setIssuedBooks([newLoan, ...issuedBooks]);
    toast.success(`Book ${issueForm.accNumber} issued to ${issueForm.borrower} successfully!`);
    setIssueOpen(false);
    setIssueForm({ borrower: '', accNumber: '', days: '14' });
  };

  const handleRenew = (acc) => {
    toast.success(`Book ${acc} renewed for additional 14 days.`);
  };

  const handleReturn = (acc) => {
    setIssuedBooks(prev => prev.filter(b => b.acc !== acc));
    toast.success(`Book ${acc} marked as RETURNED and restocked to shelf.`);
  };

  const tabLabels = [
    'Book Search',
    'Issue Return'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Institutional Central Library & OPAC"
        subtitle="Search OPAC book catalog, manage book issuance and returns, and access subscribed IEEE / Springer e-resources"
        breadcrumbs={['Home', 'Academic Management', 'Library', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={() => window.open('https://ieeexplore.ieee.org', '_blank')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              IEEE Xplore Gateway
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIssueOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Issue Book
            </Button>
          </Stack>
        }
      />

      {/* Tabs Header */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            navigate(`/faculty/library?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<Search fontSize="small" />} iconPosition="start" label="Book Search" />
          <Tab icon={<AssignmentReturn fontSize="small" />} iconPosition="start" label="Issue Return" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. BOOK SEARCH (TAB 0)                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}`, bgcolor: '#ffffff' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search OPAC Catalog by Book Title, Author, ISBN, or Call Number (e.g. Operating Systems, AI, 005.43)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
                <Typography variant="subtitle1" fontWeight={700}>OPAC Central Library Catalog Records</Typography>
                <Chip label="Total Volume Count: 48,500 Books" color="primary" size="small" sx={{ fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Acc No.', 'Book Title & Edition', 'Authors', 'Publisher & Year', 'Call Number', 'Shelf / Rack', 'Copies Available', 'Action'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { acc: 'ACC-84920', title: 'Operating System Concepts (10th Edition)', author: 'Silberschatz, Galvin & Gagne', pub: 'Wiley (2020)', call: '005.43 SIL', shelf: 'Rack C4 - Shelf 2', avail: '12 / 15 Available' },
                      { acc: 'ACC-91024', title: 'Artificial Intelligence: A Modern Approach (4th Edition)', author: 'Stuart Russell & Peter Norvig', pub: 'Pearson (2022)', call: '006.3 RUS', shelf: 'Rack C5 - Shelf 1', avail: '8 / 10 Available' },
                      { acc: 'ACC-73819', title: 'Computer Networks: A Top-Down Approach (8th Edition)', author: 'James Kurose & Keith Ross', pub: 'Pearson (2021)', call: '004.6 KUR', shelf: 'Rack B2 - Shelf 3', avail: '14 / 20 Available' },
                      { acc: 'ACC-62910', title: 'Database System Concepts (7th Edition)', author: 'Silberschatz, Korth & Sudarshan', pub: 'McGraw-Hill (2019)', call: '005.74 SIL', shelf: 'Rack C3 - Shelf 4', avail: '6 / 8 Available' },
                    ].map((b, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{b.acc}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>{b.title}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{b.author}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{b.pub}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{b.call}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600, color: COLORS.secondary }}>{b.shelf}</TableCell>
                        <TableCell><Chip label={b.avail} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: 10 }} /></TableCell>
                        <TableCell>
                          <Button size="small" variant="contained" onClick={() => { setIssueForm({ ...issueForm, accNumber: b.acc }); setIssueOpen(true); }} sx={{ fontSize: 10, textTransform: 'none', py: 0.1, bgcolor: COLORS.secondary }}>
                            Issue Book
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. ISSUE RETURN (TAB 1)                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Active Book Loans & Return Circulation Desk</Typography>
              <Chip label={`${issuedBooks.length} Active Borrowed Books`} color="primary" size="small" sx={{ fontWeight: 600 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Accession No.', 'Book Title', 'Borrower Name & ID', 'Issue Date', 'Due Date', 'Loan Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issuedBooks.map((loan, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{loan.acc}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{loan.title}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{loan.borrower}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{loan.issued}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 700, color: loan.status.includes('OVERDUE') ? '#dc2626' : '#16a34a' }}>{loan.due}</TableCell>
                      <TableCell>
                        <Chip
                          label={loan.status}
                          size="small"
                          sx={{
                            bgcolor: loan.status.includes('OVERDUE') ? '#fee2e2' : '#dcfce7',
                            color: loan.status.includes('OVERDUE') ? '#b91c1c' : '#166534',
                            fontWeight: 700,
                            fontSize: 10
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" color="success" onClick={() => handleReturn(loan.acc)} sx={{ fontSize: 10, textTransform: 'none', py: 0.1 }}>
                            Return
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => handleRenew(loan.acc)} sx={{ fontSize: 10, textTransform: 'none', py: 0.1 }}>
                            Renew
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Issue Book Dialog */}
      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Circulation: Issue Library Book</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Book Accession Number"
              placeholder="e.g. ACC-84920"
              value={issueForm.accNumber}
              onChange={e => setIssueForm({ ...issueForm, accNumber: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Borrower Roll No. / Employee ID"
              placeholder="e.g. 21CS001 or FAC-102"
              value={issueForm.borrower}
              onChange={e => setIssueForm({ ...issueForm, borrower: e.target.value })}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Loan Period"
              value={issueForm.days}
              onChange={e => setIssueForm({ ...issueForm, days: e.target.value })}
            >
              <MenuItem value="14">14 Days (Standard Student Loan)</MenuItem>
              <MenuItem value="30">30 Days (Faculty Research Loan)</MenuItem>
              <MenuItem value="90">Semester Long Book-Bank</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIssueOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleIssueBook} sx={{ bgcolor: COLORS.secondary, fontWeight: 700 }}>
            Confirm Issue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

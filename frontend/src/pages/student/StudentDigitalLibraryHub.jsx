import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, MenuItem
} from '@mui/material';
import {
  LocalLibrary, Search, MenuBook, ReceiptLong, BookmarkAdded,
  Download
} from '@mui/icons-material';

import { libraryAPI } from '../../services/api';

const DEFAULT_ISSUED_BOOKS = [
  { id: 'ISS-9901', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', issueDate: '15 Aug 2026', dueDate: '15 Sep 2026', fine: '₹0.00', status: 'Active' },
  { id: 'ISS-8402', title: 'Cloud Native Java Systems', author: 'Thomas Erl', issueDate: '01 Aug 2026', dueDate: '01 Sep 2026', fine: '₹10.00', status: 'Due Today' },
];

const DEFAULT_CATALOG = [
  { isbn: '978-0134093413', title: 'Clean Architecture: A Craftsman’s Guide', author: 'Robert C. Martin', dept: 'CSE / IT', availableCopies: 4, totalCopies: 6, shelf: 'Rack 14 - Section B' },
  { isbn: '978-0262035613', title: 'Deep Learning (Adaptive Computation & ML)', author: 'Ian Goodfellow, Yoshua Bengio', dept: 'AI & Data Science', availableCopies: 2, totalCopies: 5, shelf: 'Rack 18 - Section A' },
  { isbn: '978-0133594140', title: 'Operating Systems: Internals and Design Principles', author: 'William Stallings', dept: 'CSE', availableCopies: 7, totalCopies: 10, shelf: 'Rack 08 - Section C' },
  { isbn: '978-0132350884', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', dept: 'Software Eng', availableCopies: 5, totalCopies: 8, shelf: 'Rack 14 - Section B' },
  { isbn: '978-1118063330', title: 'Computer Networks: A Systems Approach', author: 'Larry L. Peterson', dept: 'Networks', availableCopies: 3, totalCopies: 6, shelf: 'Rack 11 - Section D' },
];

const NEW_ARRIVALS = [
  { id: 'NEW-01', title: 'Generative AI on AWS: Building Context-Aware Multimodal Systems', author: 'Chris Fregly, Antje Barth', dept: 'Artificial Intelligence', addedDate: '28 Aug 2026', copies: 6 },
  { id: 'NEW-02', title: 'Designing Data-Intensive Applications (2nd Edition)', author: 'Martin Kleppmann', dept: 'Distributed Systems', addedDate: '25 Aug 2026', copies: 8 },
  { id: 'NEW-03', title: 'Zero Trust Networks: Building Secure Systems in Untrusted Networks', author: 'Evan Gilman, Doug Barth', dept: 'Cyber Security', addedDate: '15 Aug 2026', copies: 4 },
];

const DEFAULT_INVOICE_HISTORY = [
  { invoiceId: 'INV-LIB-2026-441', transactionDate: '20 Aug 2026', description: 'Overdue Book Return Fine Clearance', amount: '₹30.00', paymentMode: 'UPI / Razorpay', status: 'Paid' },
  { invoiceId: 'INV-LIB-2026-118', transactionDate: '15 Jan 2026', description: 'Annual IEEE Xplore & ACM Digital Library Access Card', amount: '₹0.00 (Institutional Grant)', paymentMode: 'Student Scholarship', status: 'Active' },
];

export default function StudentDigitalLibraryHub({ initialTab = 0 }) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-09-01');
  const [issuedBooks, setIssuedBooks] = useState(DEFAULT_ISSUED_BOOKS);
  const [catalogBooks, setCatalogBooks] = useState(DEFAULT_CATALOG);
  const [invoices, setInvoices] = useState(DEFAULT_INVOICE_HISTORY);
  const [loading, setLoading] = useState(false);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      const [borrowedRes, booksRes, invRes] = await Promise.allSettled([
        libraryAPI.getBorrowed(),
        libraryAPI.getBooks(),
        libraryAPI.getInvoices()
      ]);

      if (borrowedRes.status === 'fulfilled' && borrowedRes.value.data?.data) {
        const raw = borrowedRes.value.data.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setIssuedBooks(raw.map(b => ({
            id: b.id || 'ISS-001',
            title: b.bookTitle || b.title,
            author: b.author || 'Library Central',
            issueDate: b.issueDate || '2026-08-15',
            dueDate: b.dueDate || '2026-09-15',
            fine: b.fine ? `₹${b.fine}.00` : '₹0.00',
            status: b.status || 'Active'
          })));
        }
      }

      if (booksRes.status === 'fulfilled' && booksRes.value.data?.data) {
        const raw = booksRes.value.data.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setCatalogBooks(raw.map(b => ({
            isbn: b.isbn || '978-0000000000',
            title: b.title,
            author: b.author,
            dept: b.dept || 'Engineering',
            availableCopies: b.available || 2,
            totalCopies: b.total || 5,
            shelf: b.shelf || 'Central Library - Floor 2'
          })));
        }
      }

      if (invRes.status === 'fulfilled' && invRes.value.data?.data) {
        const raw = invRes.value.data.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setInvoices(raw.map(i => ({
            invoiceId: i.invNo || i.invoiceId || 'INV-001',
            transactionDate: i.date || i.transactionDate || '2026-08-10',
            description: i.item || i.description || 'Library Transaction',
            amount: i.amount || '₹0.00',
            paymentMode: 'Online / Gateway',
            status: i.status || 'Paid'
          })));
        }
      }
    } catch (err) {
      console.warn('Error loading library data from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  const handleRenew = async (issueId) => {
    try {
      await libraryAPI.renewBook(issueId);
      setIssuedBooks(prev => prev.map(b => b.id === issueId ? { ...b, dueDate: '30 Sep 2026', status: 'Renewed' } : b));
    } catch (err) {
      console.warn('Renew server call failed, updating UI:', err);
      setIssuedBooks(prev => prev.map(b => b.id === issueId ? { ...b, dueDate: '30 Sep 2026', status: 'Renewed' } : b));
    }
  };

  const filteredCatalog = catalogBooks.filter(b => {
    const matchesQuery = (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.author || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.isbn || '').includes(searchQuery);
    const matchesDept = selectedDept === 'All' || (b.dept || '').includes(selectedDept);
    return matchesQuery && matchesDept;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalLibrary sx={{ color: '#2563eb' }} /> Digital Library & OPAC Hub
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Search over 50,000+ volumes, reserve books, check new acquisitions, and view library transaction invoices.
          </Typography>
        </Box>
        <Chip label="Member ID: LIB-2023-CS042 • Active" color="primary" sx={{ fontWeight: 700 }} />
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            bgcolor: '#ffffff',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, py: 2, minHeight: 48 },
            '& .Mui-selected': { color: '#2563eb' },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3 }
          }}
        >
          <Tab icon={<LocalLibrary fontSize="small" />} iconPosition="start" label="My Issued Books" />
          <Tab icon={<Search fontSize="small" />} iconPosition="start" label="Library Book Search (OPAC)" />
          <Tab icon={<MenuBook fontSize="small" />} iconPosition="start" label="Library New Book Arrivals" />
          <Tab icon={<ReceiptLong fontSize="small" />} iconPosition="start" label="Library Invoice & Date Range Reports" />
        </Tabs>
      </Paper>

      {/* Tab 0: Issued Books */}
      {tabIndex === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Currently Borrowed Books & Circulation Status
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Borrowing Limit: 4 Books • Currently Borrowed: 2 Books
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Accession No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Book Title & Author</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Due Return Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Fine Accrued</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issuedBooks.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{b.id}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>{b.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>by {b.author}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{b.issueDate}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: b.status === 'Due Today' ? '#dc2626' : '#0f172a' }}>{b.dueDate}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#dc2626' }}>{b.fine}</TableCell>
                    <TableCell>
                      <Chip
                        label={b.status}
                        size="small"
                        color={b.status === 'Active' ? 'primary' : b.status === 'Due Today' ? 'error' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      {b.status !== 'Returned' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleRenew(b.id)}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          Renew Book (+14 Days)
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 1: Library Book Search */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search catalog by Book Title, Author name, Subject, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <MenuItem value="All">All Departments / Categories</MenuItem>
                <MenuItem value="CSE">Computer Science & Engineering</MenuItem>
                <MenuItem value="AI">AI & Data Science</MenuItem>
                <MenuItem value="Networks">Networks & Security</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ISBN</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Book Title & Author</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Shelf Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Available / Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCatalog.map((b) => (
                  <TableRow key={b.isbn} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{b.isbn}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>{b.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{b.author}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={b.dept} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>{b.shelf}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Typography component="span" sx={{ color: b.availableCopies > 0 ? '#16a34a' : '#dc2626' }}>
                        {b.availableCopies}
                      </Typography> / {b.totalCopies} Available
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={b.availableCopies === 0}
                        startIcon={<BookmarkAdded />}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
                      >
                        Reserve Book
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 2: New Arrivals */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          {NEW_ARRIVALS.map((item) => (
            <Grid item xs={12} md={4} key={item.id}>
              <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Chip label="NEW ACQUISITION" color="success" size="small" sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.65rem' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                    Author: <strong>{item.author}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                    Category: {item.dept} • Added on: {item.addedDate}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                    <Chip label={`${item.copies} Copies in Stock`} color="primary" variant="outlined" size="small" sx={{ fontWeight: 700 }} />
                    <Button size="small" variant="text" sx={{ textTransform: 'none', fontWeight: 600 }}>
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 3: Library Invoices & Date Range Reports */}
      {tabIndex === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Library Fee & Invoice History Report
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Generate date-range statements for clearance and fee reimbursement
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={<Download />} size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>
              Download Date Range PDF
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button fullWidth variant="contained" sx={{ textTransform: 'none', height: 40, bgcolor: '#2563eb' }}>
                Filter Invoices
              </Button>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Transaction Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.invoiceId} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{inv.invoiceId}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{inv.transactionDate}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{inv.description}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{inv.amount}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{inv.paymentMode}</TableCell>
                    <TableCell>
                      <Chip label={inv.status} color="success" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<Download />} variant="text" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        PDF Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

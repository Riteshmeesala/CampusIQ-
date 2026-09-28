import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip
} from '@mui/material';
import {
  Work, Business, CheckCircle, Download, Add, Visibility,
  Domain, VerifiedUser
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { getSharedInternships, saveSharedInternship, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';

export default function StudentInternshipsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ roll: '', name: '', company: '', role: '', duration: '', stipend: '' });
  const [sharedInternships, setSharedInternships] = useState([]);

  const loadInternships = () => {
    setSharedInternships(getSharedInternships());
  };

  useEffect(() => {
    loadInternships();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.INTERNSHIP_REGISTERED, () => loadInternships());
    return () => unsub();
  }, []);

  const handleApprove = (name) => {
    toast.success(`Internship NOC & academic credit approved for ${name}.`);
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Student Internships & Industry Mentoring"
        subtitle="Track student industrial internships, company offer letters, faculty mentoring reviews, and completion NOC certificates"
        breadcrumbs={['Home', 'Faculty', 'Student Internships']}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
          >
            Record New Internship
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Active Industry Internships', val: '48 Students', sub: 'Final & Pre-Final Year', color: '#2563eb' },
          { label: 'Highest Monthly Stipend', val: '₹ 65,000 / mo', sub: 'Amazon Web Services', color: '#16a34a' },
          { label: 'Average Stipend', val: '₹ 28,500 / mo', sub: 'Top Tier Product Companies', color: COLORS.secondary },
          { label: 'NOC / Approval Requests', val: '5 Pending', sub: 'Requires Faculty Review', color: '#d97706' },
        ].map((k, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{k.label}</Typography>
                <Typography variant="h5" fontWeight={800} color={k.color} my={0.5}>{k.val}</Typography>
                <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Student Internship Records (Batch 2024)
            </Typography>
            <Button size="small" startIcon={<Download />} onClick={() => toast.success('Exporting Internship Ledger (.xlsx)')}>
              Export to Excel
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Roll Number', 'Student Name', 'Company Name', 'Internship Role', 'Duration', 'Stipend', 'Approval Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ...sharedInternships.map(s => ({
                    roll: s.rollNo || '24CS001',
                    name: s.studentName || 'Student',
                    company: s.company,
                    role: s.role,
                    dur: s.duration,
                    stipend: s.stipend || '₹ 25,000/mo',
                    status: s.status ? s.status.toUpperCase() : 'UNDER REVIEW'
                  })),
                  { roll: '21CS001', name: 'Aarav Patel', company: 'Amazon Development Centre', role: 'Software Development Intern', dur: '6 Months (Jan - Jun 2024)', stipend: '₹ 65,000/mo', status: 'APPROVED' },
                  { roll: '21CS014', name: 'Bhavna Sharma', company: 'Microsoft India R&D', role: 'Cloud & AI Engineer Intern', dur: '6 Months (Jan - Jun 2024)', stipend: '₹ 50,000/mo', status: 'APPROVED' },
                  { roll: '21CS028', name: 'Chetan Varma', company: 'Oracle Financial Services', role: 'Full Stack Java Intern', dur: '4 Months (Feb - May 2024)', stipend: '₹ 35,000/mo', status: 'APPROVED' },
                  { roll: '21CS042', name: 'Deepika Rao', company: 'Cisco Systems India', role: 'Network Security Intern', dur: '6 Months (Jan - Jun 2024)', stipend: '₹ 45,000/mo', status: 'UNDER REVIEW' },
                  { roll: '21CS065', name: 'Eshwar Reddy', company: 'Qualcomm India', role: 'Embedded Systems Intern', dur: '6 Months (Jan - Jun 2024)', stipend: '₹ 40,000/mo', status: 'UNDER REVIEW' },
                ].map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.roll}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.secondary }}>{row.company}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.dur}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{row.stipend}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          bgcolor: row.status === 'APPROVED' ? '#dcfce7' : '#fef3c7',
                          color: row.status === 'APPROVED' ? '#166534' : '#92400e',
                          fontWeight: 700,
                          fontSize: 10
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.status === 'UNDER REVIEW' ? (
                        <Button size="small" variant="contained" sx={{ fontSize: 11, textTransform: 'none', py: 0.2 }} onClick={() => handleApprove(row.name)}>
                          Grant NOC
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined" sx={{ fontSize: 11, textTransform: 'none', py: 0.2 }} onClick={() => toast.info(`Viewing Completion Certificate for ${row.name}`)}>
                          View Certificate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Log Student Internship Offer</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Student Roll Number" value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })} />
            <TextField fullWidth label="Student Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth label="Company / Organization" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            <TextField fullWidth label="Job Role / Title" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            <TextField fullWidth label="Monthly Stipend" placeholder="e.g. ₹ 45,000" value={form.stipend} onChange={e => setForm({ ...form, stipend: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { toast.success('Internship logged successfully'); setOpen(false); }}>Save Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

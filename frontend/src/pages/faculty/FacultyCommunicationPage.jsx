import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Tab, Tabs, Divider, IconButton
} from '@mui/material';
import {
  Campaign, Send, Sms, Email, Notifications, Chat,
  Add, CheckCircle, Groups, CalendarToday, EventNote, Download,
  PriorityHigh, Visibility, Edit, Delete
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { broadcastDataChange, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { notificationAPI } from '../../services/api';

export default function FacultyCommunicationPage() {
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

  const [open, setOpen] = useState(false);
  const [circulars, setCirculars] = useState(() => {
    const saved = localStorage.getItem('campusiq_circulars_data');
    return saved ? JSON.parse(saved) : [
      { id: 'CIR-2024-082', title: 'Schedule for 1st Mid-Term Theory Examinations & Seating Plan', target: 'All B.Tech Students & Faculty', date: '20 Feb 2024', category: 'EXAMINATION', priority: 'HIGH', author: 'Controller of Examinations' },
      { id: 'CIR-2024-079', title: 'National Conference on Cloud Native Distributed Systems (NCCNDA)', target: 'Faculty & Researchers', date: '15 Feb 2024', category: 'ACADEMIC EVENT', priority: 'MEDIUM', author: 'R&D Innovation Cell' },
      { id: 'CIR-2024-071', title: 'Tuition Fee Payment Final Due Date & Semester Registration Lock', target: 'All Students', date: '01 Feb 2024', category: 'FINANCE & ACCOUNTS', priority: 'HIGH', author: 'Finance Office' },
      { id: 'CIR-2024-065', title: 'Declaration of Institutional Holiday on Account of National Festival', target: 'All Campus Members', date: '24 Jan 2024', category: 'ADMINISTRATIVE', priority: 'LOW', author: 'Principal Office' },
    ];
  });

  const [form, setForm] = useState({
    title: '',
    target: 'All B.Tech Students & Faculty',
    category: 'EXAMINATION',
    priority: 'HIGH',
    author: 'Prof. S. K. Sharma (HOD)',
    content: ''
  });

  const handlePublishCircular = () => {
    if (!form.title.trim()) {
      toast.error('Notice title is required');
      return;
    }
    const newEntry = {
      id: `CIR-2024-0${circulars.length + 85}`,
      title: form.title,
      target: form.target,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: form.category,
      priority: form.priority,
      author: form.author
    };
    const updated = [newEntry, ...circulars];
    setCirculars(updated);
    localStorage.setItem('campusiq_circulars_data', JSON.stringify(updated));
    broadcastDataChange(DATA_SYNC_EVENTS.EVENT_PUBLISHED, { circular: newEntry, allCirculars: updated });
    
    // Broadcast to backend notification table
    notificationAPI.broadcast({
      subject: form.title,
      message: form.content || `${form.title} - ${form.target}`,
      targetRole: 'ALL'
    }).catch(err => console.warn('Backend notification broadcast error:', err));

    toast.success(`Official Notice "${form.title}" published to student and faculty portals!`);
    setOpen(false);
    setForm({ title: '', target: 'All B.Tech Students & Faculty', category: 'EXAMINATION', priority: 'HIGH', author: 'Prof. S. K. Sharma (HOD)', content: '' });
  };

  const tabLabels = [
    'College Calendar',
    'Notice & Circulars'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="College Communication, Calendar & Circulars"
        subtitle="Institutional academic calendar, master examination milestones, official administrative circulars, and campus broadcasts"
        breadcrumbs={['Home', 'Academic Management', 'Communication', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Downloading Master Academic Calendar (PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Calendar
            </Button>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={() => setOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Create Circular
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
            navigate(`/faculty/communication?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<CalendarToday fontSize="small" />} iconPosition="start" label="College Calendar" />
          <Tab icon={<Notifications fontSize="small" />} iconPosition="start" label="Notice & Circulars" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. COLLEGE CALENDAR (TAB 0)                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Master Institutional Academic Calendar (Even Semester 2023-24)</Typography>
              <Chip label="Autonomous Regulations R22" color="primary" size="small" sx={{ fontWeight: 600 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Event / Academic Milestone', 'Start Date', 'End Date', 'Duration', 'Applicable Cohorts', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { event: 'Commencement of Classwork (Even Semester)', start: '08 Jan 2024', end: '08 Jan 2024', dur: '1 Day', cohort: 'B.Tech II, III, IV Year', status: 'COMPLETED' },
                    { event: '1st Mid-Term Examinations', start: '26 Feb 2024', end: '02 Mar 2024', dur: '1 Week', cohort: 'All UG Students', status: 'IN PROGRESS' },
                    { event: '1st Mid Marks & Attendance Lock on ERP', start: '08 Mar 2024', end: '08 Mar 2024', dur: '1 Day', cohort: 'Faculty Members', status: 'UPCOMING' },
                    { event: 'Annual Cultural & Technical Symposium', start: '22 Mar 2024', end: '23 Mar 2024', dur: '2 Days', cohort: 'All Campus', status: 'UPCOMING' },
                    { event: '2nd Mid-Term Examinations', start: '22 Apr 2024', end: '27 Apr 2024', dur: '1 Week', cohort: 'All UG Students', status: 'UPCOMING' },
                    { event: 'End-Semester Practical Examinations & Viva', start: '02 May 2024', end: '08 May 2024', dur: '1 Week', cohort: 'All Engineering Batches', status: 'UPCOMING' },
                    { event: 'End-Semester Theory Examinations', start: '10 May 2024', end: '25 May 2024', dur: '2 Weeks', cohort: 'All UG & PG Students', status: 'UPCOMING' },
                  ].map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>{row.event}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 700, color: COLORS.secondary }}>{row.start}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.end}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.dur}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.cohort}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            bgcolor: row.status === 'COMPLETED' ? '#f1f5f9' : row.status === 'IN PROGRESS' ? '#eff6ff' : '#ecfdf5',
                            color: row.status === 'COMPLETED' ? '#475569' : row.status === 'IN PROGRESS' ? '#1d4ed8' : '#047857',
                            fontWeight: 700,
                            fontSize: 10
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. NOTICE & CIRCULARS (TAB 1)                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle1" fontWeight={700}>Official Circulars & Bulletins Archive</Typography>
              <Chip label={`${circulars.length} Published Circulars`} color="primary" size="small" sx={{ fontWeight: 600 }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Circular ID', 'Notice Title', 'Category', 'Target Group', 'Date Published', 'Priority', 'Author / Dept', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {circulars.map((c, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{c.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>{c.title}</TableCell>
                      <TableCell><Chip label={c.category} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{c.target}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{c.date}</TableCell>
                      <TableCell>
                        <Chip
                          label={c.priority}
                          size="small"
                          sx={{
                            bgcolor: c.priority === 'HIGH' ? '#fee2e2' : c.priority === 'MEDIUM' ? '#fef3c7' : '#f1f5f9',
                            color: c.priority === 'HIGH' ? '#b91c1c' : c.priority === 'MEDIUM' ? '#92400e' : '#475569',
                            fontWeight: 700,
                            fontSize: 10
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{c.author}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" startIcon={<Download />} onClick={() => toast.success(`Downloading ${c.id}.pdf`)} sx={{ fontSize: 10, textTransform: 'none', py: 0.1 }}>
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Create Circular Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Publish Official Circular / Notice</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Circular / Notice Title"
              placeholder="e.g. Schedule for 1st Mid-Term Examinations"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Target Audience" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                  <MenuItem value="All B.Tech Students & Faculty">All B.Tech Students & Faculty</MenuItem>
                  <MenuItem value="Faculty & Staff Members">Faculty & Staff Members</MenuItem>
                  <MenuItem value="Final Year Batches Only">Final Year Batches Only</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Notice Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="EXAMINATION">EXAMINATION</MenuItem>
                  <MenuItem value="ACADEMIC EVENT">ACADEMIC EVENT</MenuItem>
                  <MenuItem value="FINANCE & ACCOUNTS">FINANCE & ACCOUNTS</MenuItem>
                  <MenuItem value="ADMINISTRATIVE">ADMINISTRATIVE</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Circular Body / Detailed Notice Text"
              placeholder="Enter official circular notification body..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePublishCircular} sx={{ bgcolor: COLORS.secondary, fontWeight: 700 }}>
            Publish & Broadcast
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

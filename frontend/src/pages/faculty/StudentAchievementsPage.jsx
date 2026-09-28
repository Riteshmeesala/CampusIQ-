import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip
} from '@mui/material';
import {
  EmojiEvents, WorkspacePremium, CheckCircle, Add,
  Star, MilitaryTech, Download, Verified
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { getSharedAchievements, saveSharedAchievement, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';

export default function StudentAchievementsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ roll: '', name: '', event: '', prize: '1st Prize / Winner', org: '', date: '' });
  const [sharedAchievements, setSharedAchievements] = useState([]);

  const loadAchievements = () => {
    setSharedAchievements(getSharedAchievements());
  };

  useEffect(() => {
    loadAchievements();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.ACHIEVEMENT_SUBMITTED, () => loadAchievements());
    return () => unsub();
  }, []);

  const handleVerify = (name) => {
    toast.success(`Achievement certificate officially verified and added to student transcript: ${name}`);
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Student Achievements & Honors Verification"
        subtitle="Record, verify, and spotlight student hackathon victories, research paper presentations, sports trophies, and certifications"
        breadcrumbs={['Home', 'Faculty', 'Student Achievement']}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
          >
            Record Student Achievement
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Hackathons & Coding Honors', val: '28 Awards', sub: 'National & State Level', color: '#16a34a' },
          { label: 'Research Papers by Students', val: '14 Published', sub: 'IEEE / Springer Indexed', color: '#2563eb' },
          { label: 'External Certifications', val: '142 Verified', sub: 'AWS, GCP, RedHat, Oracle', color: COLORS.secondary },
          { label: 'Sports & Cultural Trophies', val: '19 Trophies', sub: 'Inter-University Champions', color: '#d97706' },
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
              Verified Student Extracurricular & Technical Achievements
            </Typography>
            <Button size="small" startIcon={<Download />} onClick={() => toast.success('Exporting Institutional Achievement Report (PDF)')}>
              Export Honors Ledger
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Roll Number', 'Student Name', 'Event / Competition', 'Award / Standing', 'Organizing Body', 'Date', 'Verification Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ...sharedAchievements.map(a => ({
                    roll: a.rollNo || '24CS001',
                    name: a.studentName || 'Student',
                    event: a.title,
                    prize: a.category || '1st Prize / Honor',
                    org: a.org,
                    date: a.date,
                    status: (a.status || 'VERIFIED').toUpperCase()
                  })),
                  { roll: '21CS001', name: 'Aarav Patel', event: 'Smart India Hackathon 2023 (Grand Finale)', prize: 'Winner (1st Prize - ₹ 1 Lakh)', org: 'Ministry of Education, Govt of India', date: 'Dec 2023', status: 'VERIFIED' },
                  { roll: '21CS014', name: 'Bhavna Sharma', event: 'IEEE International Student Paper Contest', prize: 'Best Technical Paper Award', org: 'IEEE Hyderabad Section', date: 'Jan 2024', status: 'VERIFIED' },
                  { roll: '21CS045', name: 'Rahul Reddy K.', event: 'ACM ICPC Regional Programming Contest', prize: 'Rank 12 (Honorable Mention)', org: 'ACM Asia Regional', date: 'Nov 2023', status: 'VERIFIED' },
                  { roll: '21CS078', name: 'Sanya Mirza M.', event: 'Google Solution Challenge 2024', prize: 'Top 100 Global Semifinalist', org: 'Google Developer Student Clubs', date: 'Feb 2024', status: 'PENDING VERIFICATION' },
                ].map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.roll}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{row.event}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#16a34a' }}>{row.prize}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.org}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          bgcolor: row.status === 'VERIFIED' ? '#dcfce7' : '#fef3c7',
                          color: row.status === 'VERIFIED' ? '#166534' : '#92400e',
                          fontWeight: 700,
                          fontSize: 10
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.status === 'PENDING VERIFICATION' ? (
                        <Button size="small" variant="contained" sx={{ fontSize: 11, textTransform: 'none', py: 0.2 }} onClick={() => handleVerify(row.name)}>
                          Verify Certificate
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined" sx={{ fontSize: 11, textTransform: 'none', py: 0.2 }} onClick={() => toast.info(`Viewing Verified Certificate for ${row.name}`)}>
                          View Cert
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
        <DialogTitle sx={{ fontWeight: 700 }}>Record Student Achievement</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Student Roll Number" value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })} />
            <TextField fullWidth label="Student Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth label="Competition / Event Name" value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} />
            <TextField fullWidth label="Prize / Standing / Rank" value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })} />
            <TextField fullWidth label="Organizing Institution / Body" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { toast.success('Achievement record logged'); setOpen(false); }}>Save Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

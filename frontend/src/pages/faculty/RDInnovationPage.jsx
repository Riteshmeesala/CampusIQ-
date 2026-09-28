import React, { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Tab, Tabs, Divider
} from '@mui/material';
import {
  Science, Lightbulb, WorkspacePremium, Download, Add,
  CheckCircle, AccountBalance, OpenInNew
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';

export default function RDInnovationPage() {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [pubForm, setPubForm] = useState({ title: '', venue: '', type: 'IEEE Transactions', doi: '', year: '2024' });
  const [publications, setPublications] = useState(() => {
    const saved = localStorage.getItem('campusiq_rd_publications');
    return saved ? JSON.parse(saved) : [
      { title: 'Scalable Federated Learning Architectures for Resource-Constrained Edge Clusters', venue: 'IEEE Transactions on Cloud Computing (Vol. 12)', ind: 'SCI / Scopus', yr: '2023', doi: '10.1109/TCC.2023.10982', cit: 48 },
      { title: 'Autonomous Multi-Agent Task Orchestration in Smart Educational Campuses', venue: 'ACM International Conference on AI & Education (AI-ED 2024)', ind: 'Scopus Indexed', yr: '2024', doi: '10.1145/36109.36211', cit: 16 },
      { title: 'Deep Neural Pruning for Real-time Edge Vision Analytics', venue: 'Springer Journal of Supercomputing (Vol. 78)', ind: 'SCIE / Scopus', yr: '2022', doi: '10.1007/s11227-022-04561-x', cit: 64 },
    ];
  });

  const handleAddPub = () => {
    if (!pubForm.title.trim()) {
      toast.warning('Title is required');
      return;
    }
    const newPub = {
      title: pubForm.title,
      venue: pubForm.venue || 'International Journal of Engineering & Tech',
      ind: 'Scopus Indexed',
      yr: pubForm.year || '2024',
      doi: pubForm.doi || '10.1109/CAMPUS.2024.01',
      cit: 0
    };
    const updated = [newPub, ...publications];
    setPublications(updated);
    localStorage.setItem('campusiq_rd_publications', JSON.stringify(updated));
    toast.success('Research publication logged in institutional R&D repository.');
    setOpen(false);
    setPubForm({ title: '', venue: '', type: 'IEEE Transactions', doi: '', year: '2024' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="R&D, Patents & Innovation Cell"
        subtitle="Track Scopus & IEEE research publications, patent filings, funded research grants (DST, AICTE, SERB), and student incubation startups"
        breadcrumbs={['Home', 'Faculty', 'R&D Innovation']}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
          >
            Add Research Publication
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Scopus / IEEE Publications', val: '18 Papers', sub: 'High Impact Journal Papers', color: '#2563eb' },
          { label: 'Patents Filed & Granted', val: '4 Patents', sub: '2 Granted, 2 Published', color: '#16a34a' },
          { label: 'Sponsored Research Grants', val: '₹ 42.5 Lakhs', sub: 'DST & AICTE Sponsored', color: COLORS.secondary },
          { label: 'Incubation & Student Startups', val: '3 Startups', sub: 'Smart Campus Incubation Hub', color: '#d97706' },
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

      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary" sx={{ px: 2 }}>
          <Tab icon={<Science fontSize="small" />} iconPosition="start" label="Research Publications (IEEE / Scopus)" />
          <Tab icon={<WorkspacePremium fontSize="small" />} iconPosition="start" label="Patents & Intellectual Property" />
          <Tab icon={<AccountBalance fontSize="small" />} iconPosition="start" label="Funded Grants & Projects" />
          <Tab icon={<Lightbulb fontSize="small" />} iconPosition="start" label="Innovation & Incubation Cell" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Paper Title', 'Journal / Conference Venue', 'Indexing', 'Year', 'DOI / URL', 'Citations', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {publications.map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a', maxWidth: 300 }}>{p.title}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{p.venue}</TableCell>
                      <TableCell>
                        <Chip label={p.ind} size="small" color="primary" sx={{ fontSize: 10, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{p.yr}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: '#2563eb' }}>{p.doi}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{p.cit} Citations</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" endIcon={<OpenInNew />} sx={{ fontSize: 11, textTransform: 'none' }} onClick={() => window.open(`https://doi.org/${p.doi}`, '_blank')}>
                          View DOI
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

      {tab === 1 && (
        <Grid container spacing={3}>
          {[
            { title: 'Intelligent Attendance and Engagement Analytics System Using Edge AI Sensors', appNo: 'IN-202341029831', status: 'GRANTED (Patent No: 490218)', type: 'Indian Patent', date: 'Granted: 14 Nov 2023' },
            { title: 'Decentralized Micro-Credentialing Framework on Quantum-Resistant Blockchain', appNo: 'IN-202341088412', status: 'PUBLISHED (Awaiting Examination)', type: 'Indian Patent', date: 'Published: 08 Dec 2023' },
          ].map((pat, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">{pat.title}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">Application No: {pat.appNo} • {pat.type}</Typography>
                <Chip label={pat.status} color="success" size="small" sx={{ fontWeight: 700, my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">{pat.date}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Log Research Publication</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Research Paper Title" value={pubForm.title} onChange={e => setPubForm({ ...pubForm, title: e.target.value })} />
            <TextField fullWidth label="Journal / Conference Name" value={pubForm.venue} onChange={e => setPubForm({ ...pubForm, venue: e.target.value })} />
            <TextField fullWidth label="Digital Object Identifier (DOI)" placeholder="e.g. 10.1109/TCC.2024.1234" value={pubForm.doi} onChange={e => setPubForm({ ...pubForm, doi: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPub}>Save to R&D Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

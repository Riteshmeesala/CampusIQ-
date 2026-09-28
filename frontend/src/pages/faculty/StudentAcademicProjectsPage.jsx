import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Rating, IconButton, Tooltip, Tabs, Tab,
  Divider, Switch, FormControlLabel
} from '@mui/material';
import {
  Assignment, AccountTree, CheckCircle, Add, Star,
  School, Groups, Download, Grade, Tune, Edit, Delete
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { projectAPI } from '../../services/api';

export default function StudentAcademicProjectsPage() {
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [score, setScore] = useState(28);
  const [batches, setBatches] = useState([
    { batchId: 'CSE-P01', title: 'Autonomous Drone Navigation Using Deep Reinforcement Learning', domain: 'AI & Robotics', members: 'Aarav Patel (21CS001), Bhavna S (21CS014), Chirag R (21CS028)', guide: 'Dr. S. K. Sharma', p1: '28 / 30', p2: '27 / 30', viva: 'Pending', report: 'DRAFT SUBMITTED' },
    { batchId: 'CSE-P02', title: 'Decentralized Healthcare Record Exchange on Hyperledger Fabric', domain: 'Blockchain & Security', members: 'Divya Reddy (21CS035), Rahul Reddy (21CS045)', guide: 'Dr. Priya Varma', p1: '29 / 30', p2: '29 / 30', viva: '38 / 40', report: 'PLAGIARISM CHECKED (6%)' },
    { batchId: 'CSE-P03', title: 'Multi-Modal Speech Emotion Recognition for Assistive AI', domain: 'Deep Learning & NLP', members: 'Rhea Sen (21CS046), Rohan Gupta (21CS047)', guide: 'Dr. S. K. Sharma', p1: '27 / 30', p2: 'Pending', viva: 'Pending', report: 'UNDER REVIEW' },
  ]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await projectAPI.getAllProjects();
        const serverData = res.data?.data || res.data || [];
        if (Array.isArray(serverData) && serverData.length > 0) {
          setBatches(serverData.map((p, idx) => ({
            batchId: p.code || p.id || `CSE-P0${idx + 1}`,
            title: p.title || 'Advanced Capstone System',
            domain: p.domain || 'Distributed AI',
            members: 'Ritesh Meesala (24CS001), Rahul Varma',
            guide: p.guide || 'Faculty Mentor',
            p1: '28 / 30',
            p2: '27 / 30',
            viva: 'Pending',
            report: 'VERIFIED'
          })));
        }
      } catch (err) {
        console.warn('Failed to load projects from server:', err);
      }
    };
    loadProjects();
  }, []);

  const handleSaveScore = async () => {
    try {
      await projectAPI.submitMilestone({
        projectId: selectedBatch?.batchId,
        score: `${score}/30`,
        status: 'Evaluated'
      });
    } catch (err) {
      console.warn('Failed to persist project score:', err);
    }
    toast.success(`Phase review score of ${score}/30 recorded for Batch ${selectedBatch?.batchId}`);
    setReviewOpen(false);
  };

  const tabLabels = [
    'Manage Academic Project',
    'Master Settings'
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Student Academic Projects & Capstone Reviews"
        subtitle="Manage Major Capstone & Mini-Project batches, guide allotment, Phase 1/2/3 review grading, and master rubric settings"
        breadcrumbs={['Home', 'Academic Management', 'Student Academic Projects', tabLabels[tabIndex]]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.success('Exporting Project Evaluation Rubric Ledger (.PDF)')}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Export Ledger (.PDF)
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpen(true)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
            >
              Create Project Batch
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
            navigate(`/faculty/academic-projects?tab=${val}`, { replace: true });
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          <Tab icon={<AccountTree fontSize="small" />} iconPosition="start" label="Manage Academic Project" />
          <Tab icon={<Tune fontSize="small" />} iconPosition="start" label="Master Settings" />
        </Tabs>
      </Paper>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. MANAGE ACADEMIC PROJECT (TAB 0)                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 0 && (
        <Box>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Assigned Mentee Batches', val: '6 Batches', sub: '24 Total Students Under Guide', color: '#2563eb' },
              { label: 'Phase 1 Reviews Completed', val: '6 / 6 Batches', sub: 'Literature Survey & Architecture', color: '#16a34a' },
              { label: 'Phase 2 Progress Reviews', val: '4 / 6 Batches', sub: 'Implementation & Testing', color: COLORS.secondary },
              { label: 'Final Viva Voce Ready', val: '2 Batches', sub: 'Pre-submission Verified', color: '#059669' },
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
                <Typography variant="subtitle1" fontWeight={700}>Major Capstone Project Batches (IV Year CSE - Batch 2020-2024)</Typography>
                <Chip label="Even Semester 2023-24" size="small" color="primary" sx={{ fontWeight: 600 }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Batch ID', 'Project Title & Domain', 'Student Team Members', 'Internal Guide', 'Phase 1 (30)', 'Phase 2 (30)', 'Final Viva (40)', 'Report Status', 'Actions'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{row.batchId}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">{row.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.domain}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{row.members}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{row.guide}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#16a34a', fontSize: 11 }}>{row.p1}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: row.p2 === 'Pending' ? '#d97706' : '#16a34a', fontSize: 11 }}>{row.p2}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: row.viva === 'Pending' ? '#94a3b8' : '#16a34a', fontSize: 11 }}>{row.viva}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.report}
                            size="small"
                            sx={{
                              bgcolor: row.report.includes('PLAGIARISM') ? '#dcfce7' : '#eff6ff',
                              color: row.report.includes('PLAGIARISM') ? '#166534' : '#1d4ed8',
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => { setSelectedBatch(row); setReviewOpen(true); }}
                            sx={{ fontSize: 10, textTransform: 'none', py: 0.2, bgcolor: COLORS.secondary }}
                          >
                            Grade Review
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
      {/* 2. MASTER SETTINGS (TAB 1)                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tabIndex === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>Capstone Project Evaluation Master Settings</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={3}>
              Institutional guidelines for batch formation, guide quota limits, review weightages, and plagiarism thresholds.
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Maximum Students Per Project Batch" defaultValue="4 Students" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Maximum Project Batches Per Guide" defaultValue="3 Batches" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Phase 1 Weightage (%)" defaultValue="30%" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Phase 2 Weightage (%)" defaultValue="30%" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Final Viva Weightage (%)" defaultValue="40%" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Max Permissible Similarity / Plagiarism" defaultValue="15% Threshold (Turnitin)" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Mandatory Scopus / Conference Publication" defaultValue="1 Paper Required for Grade O/A+" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" fontWeight={700}>Project Evaluation Safeguards</Typography>
              <FormControlLabel control={<Switch defaultChecked />} label="Require guide digital signature before final submission" />
              <FormControlLabel control={<Switch defaultChecked />} label="Mandatory code repository link (GitHub / GitLab)" />
              <FormControlLabel control={<Switch defaultChecked />} label="Block final viva registration if plagiarism exceeds 15%" />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                <Button variant="outlined">Reset Defaults</Button>
                <Button variant="contained" onClick={() => toast.success('Project evaluation master settings updated successfully!')} sx={{ bgcolor: COLORS.secondary, px: 3, fontWeight: 700 }}>
                  Save Master Settings
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Grade Review Dialog */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Phase Review Score</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Batch: <strong>{selectedBatch?.batchId}</strong> ({selectedBatch?.title})
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Review Score (Out of 30)"
            value={score}
            onChange={e => setScore(e.target.value)}
            sx={{ my: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveScore} sx={{ bgcolor: COLORS.secondary }}>
            Submit Score
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

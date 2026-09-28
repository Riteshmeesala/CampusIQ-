import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  School, EventNote, Work, CheckCircle, Send
} from '@mui/icons-material';

import { placementAPI } from '../../services/api';

const DEFAULT_PLACEMENT_DRIVES = [
  { id: 'DRV-01', company: 'Google Cloud India', role: 'Associate Cloud Engineer / SDE', ctc: '₹28.5 LPA', eligibility: 'CGPA >= 8.5 • Zero Backlogs', lastDate: '10 Sep 2026', testDate: '16 Sep 2026', aiMatch: 94, status: 'Eligible & Applied', stage: 'Online Coding Round 1' },
  { id: 'DRV-02', company: 'Microsoft IDC', role: 'Software Engineer (Full Stack / AI)', ctc: '₹32.0 LPA', eligibility: 'CGPA >= 8.0 • Zero Backlogs', lastDate: '15 Sep 2026', testDate: '22 Sep 2026', aiMatch: 91, status: 'Eligible - Apply Now', stage: 'Application Open' },
  { id: 'DRV-03', company: 'Amazon AWS', role: 'Cloud Solutions Architect Intern + FTE', ctc: '₹24.0 LPA', eligibility: 'CGPA >= 7.5', lastDate: '20 Sep 2026', testDate: '28 Sep 2026', aiMatch: 88, status: 'Eligible - Apply Now', stage: 'Application Open' },
  { id: 'DRV-04', company: 'Goldman Sachs', role: 'Quantitative Technology Analyst', ctc: '₹26.0 LPA', eligibility: 'CGPA >= 8.5', lastDate: '05 Oct 2026', testDate: '12 Oct 2026', aiMatch: 85, status: 'Eligible - Apply Now', stage: 'Upcoming' },
];

const DEFAULT_PLACEMENT_CALENDAR = [
  { date: '10 Sep 2026', time: '05:00 PM', event: 'Google Cloud Pre-Placement Talk (PPT)', venue: 'Auditorium-A / Virtual Stream', type: 'PPT' },
  { date: '16 Sep 2026', time: '10:00 AM - 12:00 PM', event: 'Google Cloud National Coding Challenge Round 1', venue: 'Campus Central Computing Lab', type: 'Assessment' },
  { date: '22 Sep 2026', time: '09:30 AM - 11:30 AM', event: 'Microsoft Online Technical Assessment', venue: 'Online / HackerRank', type: 'Assessment' },
  { date: '25 Sep 2026', time: '02:00 PM - 06:00 PM', event: 'Amazon Technical & System Design Interviews (Round 1 & 2)', venue: 'Placement Cell Interview Suites', type: 'Interview' },
];

export default function StudentPlacementsPortalPage({ initialTab = 0 }) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [drives, setDrives] = useState(DEFAULT_PLACEMENT_DRIVES);
  const [calendar, setCalendar] = useState(DEFAULT_PLACEMENT_CALENDAR);
  const [appliedDrives, setAppliedDrives] = useState({ 'DRV-01': true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPlacementData = async () => {
      try {
        setLoading(true);
        const [drivesRes, calRes] = await Promise.allSettled([
          placementAPI.getDrives(),
          placementAPI.getCalendar()
        ]);

        if (drivesRes.status === 'fulfilled' && drivesRes.value.data?.data) {
          const raw = drivesRes.value.data.data;
          if (Array.isArray(raw) && raw.length > 0) {
            setDrives(raw.map((d, idx) => ({
              id: d.id || `DRV-${idx + 1}`,
              company: d.company || 'Enterprise Partner',
              role: d.role || 'Software Engineer',
              ctc: d.ctc || '₹20.0 LPA',
              eligibility: `CGPA >= ${d.eligibilityCgpa || 7.5}`,
              lastDate: d.deadline || '30 Sep 2026',
              testDate: d.interviewDate || '10 Oct 2026',
              aiMatch: 90,
              status: 'Eligible - Apply Now',
              stage: d.status || 'Application Open'
            })));
          }
        }

        if (calRes.status === 'fulfilled' && calRes.value.data?.data) {
          const raw = calRes.value.data.data;
          if (Array.isArray(raw) && raw.length > 0) {
            setCalendar(raw);
          }
        }
      } catch (err) {
        console.warn('Failed to load placement data from server:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPlacementData();
  }, []);

  const handleApply = async (id) => {
    try {
      await placementAPI.applyDrive(id, { studentRoll: '24CS001' });
    } catch (err) {
      console.warn('Placement application call failed:', err);
    }
    setAppliedDrives(p => ({ ...p, [id]: true }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <School sx={{ color: '#2563eb' }} /> Training & Placements Portal
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Explore on-campus recruitment drives, corporate salary packages, and placement interview schedules.
          </Typography>
        </Box>
        <Chip label="Placement Status: Active Registered (Batch 2027)" color="success" sx={{ fontWeight: 700 }} />
      </Box>

      {/* KPI Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>HIGHEST CTC PACKAGE ON OFFER</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a', mt: 0.5 }}>₹32.0 LPA</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Microsoft Software Engineer</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL ELIGIBLE DRIVES</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2563eb', mt: 0.5 }}>4 Drives</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Tier-1 Dream Company Opportunities</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AI RESUME READINESS SCORE</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#8b5cf6', mt: 0.5 }}>92%</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>High Match for Cloud & AI Engineering</Typography>
          </Paper>
        </Grid>
      </Grid>

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
          <Tab icon={<Work fontSize="small" />} iconPosition="start" label="Placement Drives & Opportunities" />
          <Tab icon={<EventNote fontSize="small" />} iconPosition="start" label="Placements Calendar & Rounds" />
        </Tabs>
      </Paper>

      {/* Tab 0: Placement Drives */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {drives.map((d) => (
            <Grid item xs={12} md={6} key={d.id}>
              <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {d.company}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color: '#2563eb', fontWeight: 700 }}>
                        {d.role}
                      </Typography>
                    </Box>
                    <Chip label={d.ctc} color="success" sx={{ fontWeight: 800, fontSize: '0.85rem' }} />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                    Eligibility: <strong>{d.eligibility}</strong>
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, my: 1.5, flexWrap: 'wrap' }}>
                    <Chip label={`Last Date: ${d.lastDate}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip label={`Test Date: ${d.testDate}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip
                      label={`AI Resume Match: ${d.aiMatch}%`}
                      size="small"
                      sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 800 }}
                    />
                  </Box>

                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                      Stage: <span style={{ color: '#2563eb' }}>{appliedDrives[d.id] ? 'Applied • Shortlisted' : d.stage}</span>
                    </Typography>
                    {appliedDrives[d.id] ? (
                      <Button variant="outlined" color="success" startIcon={<CheckCircle />} size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Applied
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => handleApply(d.id)}
                        endIcon={<Send />}
                        size="small"
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
                      >
                        Apply for Drive
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 1: Placements Calendar */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Placement Drives & Interview Schedule Timeline
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Company Event / Activity</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Location / Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calendar.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {p.date}
                      <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>{p.time}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e40af' }}>{p.event}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.type}
                        size="small"
                        color={p.type === 'Assessment' ? 'primary' : p.type === 'Interview' ? 'error' : 'secondary'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 500 }}>{p.venue}</TableCell>
                    <TableCell>
                      <Button size="small" variant="text" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Add to Calendar
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

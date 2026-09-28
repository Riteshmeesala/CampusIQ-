import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, MenuItem, LinearProgress
} from '@mui/material';
import {
  Download
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { courseAPI } from '../../services/api';

export default function StudentLessonPlanPage() {
  const [selectedCourse, setSelectedCourse] = useState('CS401');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    courseAPI.getAll().then(res => {
      const list = res.data?.data || [];
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourse(list[0].courseCode || 'CS401');
      }
    }).catch(() => {});
  }, []);

  const lessonPlanData = [
    { no: 1, unit: 'Unit 1', topic: 'Introduction to Operating Systems & Evolution', planned: '10 Jan 2024', actual: '10 Jan 2024', co: 'CO1', method: 'Chalk & Board + PPT', status: 'COMPLETED' },
    { no: 2, unit: 'Unit 1', topic: 'OS Structures, System Calls & Architecture', planned: '12 Jan 2024', actual: '12 Jan 2024', co: 'CO1', method: 'Live Terminal Demo', status: 'COMPLETED' },
    { no: 3, unit: 'Unit 1', topic: 'Process Concepts, Process Control Blocks (PCB)', planned: '15 Jan 2024', actual: '15 Jan 2024', co: 'CO1', method: 'Diagrammatic Model', status: 'COMPLETED' },
    { no: 4, unit: 'Unit 2', topic: 'Inter-Process Communication & Shared Memory', planned: '22 Jan 2024', actual: '22 Jan 2024', co: 'CO2', method: 'POSIX C Code Walkthrough', status: 'COMPLETED' },
    { no: 5, unit: 'Unit 2', topic: 'Critical Section Problem & Peterson’s Solution', planned: '29 Jan 2024', actual: '29 Jan 2024', co: 'CO2', method: 'Peer Instruction', status: 'COMPLETED' },
    { no: 6, unit: 'Unit 3', topic: 'Virtual Memory, Demand Paging & Page Faults', planned: '19 Feb 2024', actual: '19 Feb 2024', co: 'CO3', method: 'Simulation Tools', status: 'COMPLETED' },
    { no: 7, unit: 'Unit 4', topic: 'File System Interface & Directory Allocation Methods', planned: '04 Mar 2024', actual: 'Pending', co: 'CO4', method: 'Interactive Lab Session', status: 'SCHEDULED' },
    { no: 8, unit: 'Unit 5', topic: 'Distributed Operating Systems & RPC Mechanisms', planned: '18 Mar 2024', actual: 'Pending', co: 'CO5', method: 'Case Study', status: 'SCHEDULED' },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Course Lesson Plans & Syllabus Tracker"
        subtitle="Track subject syllabus completion rate, planned vs. delivered lecture dates, and Bloom’s Taxonomy Course Outcomes (COs)"
        breadcrumbs={['Home', 'Student', 'Lesson Plan']}
        action={
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => toast.success(`Exporting ${selectedCourse} Master Lesson Plan (PDF)`)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
          >
            Export Syllabus Tracker (PDF)
          </Button>
        }
      />

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}`, bgcolor: '#ffffff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size="small" label="Select Enrolled Subject" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.length > 0 ? (
                courses.map(c => (
                  <MenuItem key={c.id || c.courseCode} value={c.courseCode}>
                    {c.courseCode}: {c.courseName}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem value="CS401">CS401: Operating Systems & Architecture</MenuItem>
                  <MenuItem value="CS403">CS403: Artificial Intelligence</MenuItem>
                  <MenuItem value="CS405">CS405: Full Stack Web Dev Lab</MenuItem>
                  <MenuItem value="CS407">CS407: Computer Networks</MenuItem>
                </>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={700}>Syllabus Delivery Progress</Typography>
                  <Typography variant="caption" fontWeight={800} color="#16a34a">36 / 42 Lectures Delivered (85.7%)</Typography>
                </Box>
                <LinearProgress variant="determinate" value={85.7} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }} />
              </Box>
              <Chip label="On Schedule" color="success" size="small" sx={{ fontWeight: 700 }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Lesson Plan Table */}
      <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Lec #', 'Unit', 'Syllabus Topic & Concepts', 'Planned Date', 'Actual Delivery', 'CO Mapping', 'Teaching Method', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lessonPlanData.map((l, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{l.no}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{l.unit}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>{l.topic}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{l.planned}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: l.actual === 'Pending' ? '#94a3b8' : '#16a34a' }}>{l.actual}</TableCell>
                    <TableCell><Chip label={l.co} size="small" color="primary" sx={{ fontWeight: 700, fontSize: 10 }} /></TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{l.method}</TableCell>
                    <TableCell>
                      <Chip
                        label={l.status}
                        size="small"
                        sx={{
                          bgcolor: l.status === 'COMPLETED' ? '#dcfce7' : '#eff6ff',
                          color: l.status === 'COMPLETED' ? '#166534' : '#1d4ed8',
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
    </Box>
  );
}

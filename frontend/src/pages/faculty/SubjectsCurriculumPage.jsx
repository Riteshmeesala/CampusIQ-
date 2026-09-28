import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Tab, Tabs, Divider, CircularProgress
} from '@mui/material';
import {
  MenuBook, AccountTree, CheckCircle, Download, Add,
  School, Assessment, Class
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { courseAPI } from '../../services/api';

export default function SubjectsCurriculumPage() {
  const [tab, setTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    courseAPI.getAll()
      .then(res => {
        setCourses(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Subjects, Curriculum & CO-PO Mapping"
        subtitle="Course allocation, Course Outcome (CO) to Program Outcome (PO) mapping matrices, and Bloom's Taxonomy question design"
        breadcrumbs={['Home', 'Faculty', 'Subjects & Curriculum']}
        action={
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => toast.success('Exporting NBA / NAAC Outcome-Based Education (OBE) Matrix (PDF)')}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
          >
            Export CO-PO Matrix (PDF)
          </Button>
        }
      />

      <Paper elevation={0} sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary" sx={{ px: 2 }}>
          <Tab icon={<MenuBook fontSize="small" />} iconPosition="start" label="Assigned Courses & Syllabus" />
          <Tab icon={<AccountTree fontSize="small" />} iconPosition="start" label="CO - PO Correlation Matrix" />
          <Tab icon={<Assessment fontSize="small" />} iconPosition="start" label="Bloom's Taxonomy Assessment Plan" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Grid container spacing={3}>
          {(courses.length > 0 ? courses.map((c, idx) => ({
            code: c.courseCode || `CS40${idx + 1}`,
            name: c.courseName,
            credits: `${c.credits || 4}.0 Credits`,
            cos: [
              `CO1: Understand core principles and concepts of ${c.courseName}`,
              `CO2: Analyze implementation strategies and algorithmic methods in ${c.courseCode || 'course'}`,
              `CO3: Evaluate performance, efficiency and security metrics`,
              `CO4: Design and develop real-world capstone modules`
            ]
          })) : [
            { code: 'CS401', name: 'Operating Systems & Architecture', credits: '4.0 Credits', cos: ['CO1: Understand OS kernel architectures and system calls', 'CO2: Analyze process scheduling & concurrency synchronization', 'CO3: Evaluate memory virtualization and paging algorithms', 'CO4: Design distributed deadlock prevention mechanisms'] },
            { code: 'CS403', name: 'Artificial Intelligence & Neural Networks', credits: '3.0 Credits', cos: ['CO1: Formulate search heuristics and game trees', 'CO2: Construct knowledge representation and Bayesian belief nets', 'CO3: Design deep feedforward and convolutional neural networks', 'CO4: Evaluate reinforcement learning agent policies'] },
            { code: 'CS405', name: 'Full Stack Web Applications Lab', credits: '2.0 Credits', cos: ['CO1: Build reactive UI components with React & Material-UI', 'CO2: Develop RESTful Spring Boot microservices', 'CO3: Implement JWT authentication and role-based access control', 'CO4: Containerize and deploy full-stack apps using Docker'] },
          ]).map((c, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip label={c.code} color="primary" sx={{ fontWeight: 700 }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary">{c.credits}</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" mb={2}>
                    {c.name}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                    COURSE OUTCOMES (COs):
                  </Typography>
                  <Stack spacing={1}>
                    {c.cos.map((co, j) => (
                      <Paper key={j} sx={{ p: 1.25, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
                        {co}
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              CS401: Course Outcomes (CO) to Program Outcomes (PO 1-12) Mapping
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Mapping Scale: 3 = Substantial (High), 2 = Moderate (Medium), 1 = Slight (Low), - = No Correlation
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['CO ID', 'PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2'].map(h => (
                      <TableCell key={h} align={h === 'CO ID' ? 'left' : 'center'} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { id: 'CO1', po: [3, 2, 2, 1, 2, '-', '-', '-', 1, 1, 1, 2, 3, 2] },
                    { id: 'CO2', po: [3, 3, 3, 2, 2, '-', '-', '-', 2, 1, 1, 2, 3, 3] },
                    { id: 'CO3', po: [3, 3, 3, 3, 2, '-', '-', '-', 2, 2, 2, 3, 3, 3] },
                    { id: 'CO4', po: [3, 3, 3, 3, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3] },
                    { id: 'Average', po: [3.0, 2.75, 2.75, 2.25, 2.25, 0.25, 0.25, 0.25, 1.75, 1.5, 1.5, 2.5, 3.0, 2.75] },
                  ].map((row, i) => (
                    <TableRow key={i} hover sx={{ bgcolor: row.id === 'Average' ? '#f0fdf4' : 'inherit' }}>
                      <TableCell sx={{ fontWeight: 700, color: row.id === 'Average' ? '#166534' : COLORS.secondary }}>{row.id}</TableCell>
                      {row.po.map((val, j) => (
                        <TableCell key={j} align="center" sx={{ fontWeight: row.id === 'Average' ? 800 : 500, color: row.id === 'Average' ? '#166534' : 'inherit' }}>
                          {val}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

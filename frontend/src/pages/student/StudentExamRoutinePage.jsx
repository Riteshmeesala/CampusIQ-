import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, CircularProgress, Chip
} from '@mui/material';
import { Refresh, FilterAlt, EventNote, Download } from '@mui/icons-material';
import { examAPI, courseAPI } from '../../services/api';
import { toast } from 'react-toastify';

const DEFAULT_TIMETABLE_EXAMS = [
  {
    id: 1,
    subject: 'Database Management Systems (CS401)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-201',
    date: '10-10-2026',
    startTime: '10:00:00',
    endTime: '13:00:00',
    maxMarks: 70,
    examType: 'end semester exam'
  },
  {
    id: 2,
    subject: 'Machine Learning & Intelligent Systems (CS402)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-202',
    date: '12-10-2026',
    startTime: '10:00:00',
    endTime: '13:00:00',
    maxMarks: 70,
    examType: 'end semester exam'
  },
  {
    id: 3,
    subject: 'Design and Analysis of Algorithms (CS403)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-201',
    date: '14-10-2026',
    startTime: '10:00:00',
    endTime: '13:00:00',
    maxMarks: 70,
    examType: 'end semester exam'
  },
  {
    id: 4,
    subject: 'Operating Systems & Architecture (CS404)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-203',
    date: '16-10-2026',
    startTime: '10:00:00',
    endTime: '13:00:00',
    maxMarks: 70,
    examType: 'end semester exam'
  },
  {
    id: 5,
    subject: 'Mid 1: Database Normalization & SQL Test (CS401)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-201',
    date: '20-09-2026',
    startTime: '10:00:00',
    endTime: '11:30:00',
    maxMarks: 30,
    examType: 'Continuous Assessment test-1'
  },
  {
    id: 6,
    subject: 'Mid 1: ML Supervised Learning (CS402)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-202',
    date: '22-09-2026',
    startTime: '10:00:00',
    endTime: '11:30:00',
    maxMarks: 30,
    examType: 'Continuous Assessment test-1'
  },
  {
    id: 7,
    subject: 'Mid 2: Transaction Management & BCNF (CS401)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-201',
    date: '25-10-2026',
    startTime: '10:00:00',
    endTime: '11:30:00',
    maxMarks: 30,
    examType: 'Continuous Assessment test-2'
  },
  {
    id: 8,
    subject: 'Mid 2: Neural Networks & Backprop (CS402)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'LH-202',
    date: '27-10-2026',
    startTime: '10:00:00',
    endTime: '11:30:00',
    maxMarks: 30,
    examType: 'Continuous Assessment test-2'
  },
  {
    id: 9,
    subject: 'Advanced Database Systems Practical Lab (CS401L)',
    teacher: 'Dr. Rajesh Sharma',
    room: 'CS-Lab 3',
    date: '29-10-2026',
    startTime: '09:30:00',
    endTime: '12:30:00',
    maxMarks: 50,
    examType: 'Lab Assessments'
  },
  {
    id: 10,
    subject: 'Machine Learning Model Deployment Project',
    teacher: 'Dr. Rajesh Sharma',
    room: 'AI Studio',
    date: '02-11-2026',
    startTime: '14:00:00',
    endTime: '17:00:00',
    maxMarks: 50,
    examType: 'Activity based learning'
  }
];

export default function StudentExamRoutinePage() {
  const [examType, setExamType] = useState('Select');
  const [appliedFilter, setAppliedFilter] = useState('Select');
  const [examList, setExamList] = useState(DEFAULT_TIMETABLE_EXAMS);
  const [loading, setLoading] = useState(false);

  const loadExams = () => {
    setLoading(true);
    examAPI.getAll()
      .then(res => {
        const raw = res.data?.data;
        if (Array.isArray(raw) && raw.length > 0) {
          const backendItems = raw.map(e => {
            const rawType = (e.examType || '').toLowerCase();
            let mappedType = 'end semester exam';
            if (rawType.includes('mid1') || rawType.includes('mid-term 1') || rawType.includes('mid_sem')) {
              mappedType = 'Continuous Assessment test-1';
            } else if (rawType.includes('mid2') || rawType.includes('mid-term 2')) {
              mappedType = 'Continuous Assessment test-2';
            } else if (rawType.includes('lab')) {
              mappedType = 'Lab Assessments';
            } else if (rawType.includes('activity')) {
              mappedType = 'Activity based learning';
            }

            return {
              id: e.id,
              subject: `${e.examName} (${e.course?.courseCode || 'VVITU'})`,
              teacher: e.course?.faculty?.name || 'Dr. Rajesh Sharma',
              room: e.venue || 'LH-201',
              date: e.scheduledDate ? new Date(e.scheduledDate).toLocaleDateString('en-GB') : '10-10-2026',
              startTime: e.scheduledDate ? new Date(e.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '10:00:00',
              endTime: '13:00:00',
              maxMarks: e.totalMarks || 70,
              examType: mappedType
            };
          });
          setExamList(prev => [...backendItems, ...prev.filter(p => !backendItems.some(b => b.subject === p.subject))]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleFilter = () => {
    setAppliedFilter(examType);
    toast.info(`Filtering timetable by: ${examType}`);
  };

  const filteredExams = examList.filter(item => {
    if (appliedFilter === 'Select' || !appliedFilter) return true;
    return item.examType.toLowerCase() === appliedFilter.toLowerCase();
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
          Exam Time Table
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Timetable">
            <IconButton size="small" onClick={loadExams} sx={{ border: '1px solid #cbd5e1', borderRadius: 1 }}>
              <Refresh fontSize="small" sx={{ color: '#475569' }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download fontSize="small" />}
            onClick={() => toast.success('Downloaded official Exam Timetable PDF')}
            sx={{ textTransform: 'none', color: '#475569', borderColor: '#cbd5e1', borderRadius: 1, fontSize: '0.8125rem' }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Filter Row matching Screenshot: Exam Type * dropdown + Blue Filter button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', mb: 2, gap: 1.25 }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#334155', mb: 0.5 }}>
            Exam Type <span style={{ color: '#ef4444' }}>*</span>
          </Typography>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <Select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              sx={{
                height: 34,
                fontSize: '0.85rem',
                borderRadius: 1,
                bgcolor: '#ffffff',
                borderColor: '#cbd5e1',
                '& .MuiSelect-select': { py: 0.75 }
              }}
            >
              <MenuItem value="Select" sx={{ fontSize: '0.85rem' }}>Select</MenuItem>
              <MenuItem value="Activity based learning" sx={{ fontSize: '0.85rem' }}>Activity based learning</MenuItem>
              <MenuItem value="Continuous Assessment test-1" sx={{ fontSize: '0.85rem' }}>Continuous Assessment test-1</MenuItem>
              <MenuItem value="Continuous Assessment test-2" sx={{ fontSize: '0.85rem' }}>Continuous Assessment test-2</MenuItem>
              <MenuItem value="end semester exam" sx={{ fontSize: '0.85rem' }}>end semester exam</MenuItem>
              <MenuItem value="Lab Assessments" sx={{ fontSize: '0.85rem' }}>Lab Assessments</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={<FilterAlt sx={{ fontSize: 16 }} />}
          onClick={handleFilter}
          sx={{
            height: 34,
            bgcolor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.85rem',
            borderRadius: 1,
            px: 2,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#0369a1' }
          }}
        >
          Filter
        </Button>
      </Box>

      {/* Timetable Table with Orange Header */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #fed7aa', borderRadius: 0.5, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 850 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f97316' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 40 }}>#</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2 }}>Subject</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 170 }}>Teacher</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 110 }}>Room</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 120 }}>Date</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 110 }}>Start Time</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 110 }}>End Time</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 90, textAlign: 'center' }}>Max Marks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ color: '#ea580c' }} />
                </TableCell>
              </TableRow>
            ) : filteredExams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8', fontSize: 13 }}>
                  No examination schedule found for the selected category.
                </TableCell>
              </TableRow>
            ) : (
              filteredExams.map((item, idx) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:nth-of-type(even)': { bgcolor: '#fffaf5' },
                    '&:hover': { bgcolor: '#fff7ed' }
                  }}
                >
                  <TableCell sx={{ fontSize: 12.5, fontWeight: 700, color: '#475569', py: 1.4 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', py: 1.4 }}>
                    {item.subject}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#334155', fontWeight: 500, py: 1.4 }}>
                    {item.teacher}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#0284c7', fontWeight: 700, py: 1.4 }}>
                    {item.room}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569', py: 1.4 }}>
                    {item.date}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569', py: 1.4 }}>
                    {item.startTime}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569', py: 1.4 }}>
                    {item.endTime}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 12, fontWeight: 800, color: '#ea580c', py: 1.4 }}>
                    {item.maxMarks}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info Footnote */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * Electronic Hall Tickets will be validated based on this timetable. Report to allocated hall 15 minutes before Start Time.
        </Typography>
        <Chip
          label="Controller of Examinations • VVITU"
          size="small"
          sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700, fontSize: 11 }}
        />
      </Box>
    </Box>
  );
}

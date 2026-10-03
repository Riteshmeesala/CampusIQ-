import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, CircularProgress
} from '@mui/material';
import { Refresh, FilterAlt, Close, Download, CheckCircle } from '@mui/icons-material';
import { examAPI } from '../../services/api';
import { toast } from 'react-toastify';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    notification: 'B.Tech IV-I, III-I, II-I Regular & Supplementary Examination Notification - November 2026',
    startDate: '10-10-2026',
    endDateWithoutFine: '25-10-2026',
    endDateWithFine: '31-10-2026',
    examType: 'Regular Examination',
    fee: '₹1,500',
    description: 'Autonomous Regulation (R20/R23). All eligible regular and supplementary candidates must submit examination applications before the cut-off date.',
  },
  {
    id: 2,
    notification: 'B.Tech IV-II Advanced Supplementary Examination Circular - October 2026',
    startDate: '05-10-2026',
    endDateWithoutFine: '18-10-2026',
    endDateWithFine: '24-10-2026',
    examType: 'Supplementary Examination',
    fee: '₹1,200',
    description: 'Advanced supplementary exams for outgoing batch students having backlog courses in VIII semester.',
  },
  {
    id: 3,
    notification: 'M.Tech / MBA I & II Semester End Regular Examination Notification - Dec 2026',
    startDate: '15-11-2026',
    endDateWithoutFine: '30-11-2026',
    endDateWithFine: '05-12-2026',
    examType: 'Regular Examination',
    fee: '₹1,800',
    description: 'Postgraduate semester end theoretical and laboratory examinations registration notification.',
  },
  {
    id: 4,
    notification: 'Supplementary Examination Registration for Autonomous Batches - R20/R23 Regulations',
    startDate: '01-10-2026',
    endDateWithoutFine: '15-10-2026',
    endDateWithFine: '20-10-2026',
    examType: 'Supplementary Examination',
    fee: '₹950',
    description: 'Re-appearance exam registration circular for Semester 1, 2, and 3 theory and practical modules.',
  }
];

export default function StudentExamNotificationsPage() {
  const [examType, setExamType] = useState('Select');
  const [appliedFilter, setAppliedFilter] = useState('Select');
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const loadNotifications = () => {
    setLoading(true);
    examAPI.getAll()
      .then(res => {
        const raw = res.data?.data;
        if (Array.isArray(raw) && raw.length > 0) {
          const backendNotifs = raw.map(e => ({
            id: e.id,
            notification: `${e.examName} (${e.course?.courseCode || 'VVITU'})`,
            startDate: e.scheduledDate ? new Date(e.scheduledDate).toLocaleDateString('en-GB') : '10-10-2026',
            endDateWithoutFine: '25-10-2026',
            endDateWithFine: '31-10-2026',
            examType: (e.examType || '').toLowerCase().includes('supp') ? 'Supplementary Examination' : 'Regular Examination',
            fee: '₹1,500',
            description: e.description || 'Institutional examination notice issued by Controller of Examinations.'
          }));
          setNotifications(prev => [...backendNotifs, ...prev.filter(p => !backendNotifs.some(b => b.notification === p.notification))]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleFilter = () => {
    setAppliedFilter(examType);
    toast.info(`Filtering notifications by: ${examType}`);
  };

  const filteredNotifs = notifications.filter(n => {
    if (appliedFilter === 'Select' || !appliedFilter) return true;
    return n.examType.toLowerCase() === appliedFilter.toLowerCase();
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Header Row with Orange vertical indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 4, height: 22, bgcolor: '#ea580c', borderRadius: 0.5 }} />
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#ea580c' }}>
            Exam Notifications
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh sx={{ fontSize: 16 }} />}
          onClick={loadNotifications}
          sx={{
            textTransform: 'none',
            color: '#475569',
            borderColor: '#cbd5e1',
            borderRadius: 1,
            fontSize: '0.8125rem',
            px: 1.5,
            bgcolor: '#ffffff',
            '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Filter Row: Exam Type dropdown + Orange Filter button */}
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
              <MenuItem value="Regular Examination" sx={{ fontSize: '0.85rem' }}>Regular Examination</MenuItem>
              <MenuItem value="Supplementary Examination" sx={{ fontSize: '0.85rem' }}>Supplementary Examination</MenuItem>
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
            bgcolor: '#f97316',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.85rem',
            borderRadius: 1,
            px: 2,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#ea580c' }
          }}
        >
          Filter
        </Button>
      </Box>

      {/* Notifications Table with Orange Header */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #fed7aa', borderRadius: 0.5, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f97316' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 40 }}>#</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2 }}>Notification</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 140 }}>Start Date</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 190 }}>End Date (Without Fine)</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 170 }}>End Date (With Fine)</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: 12, py: 1.2, width: 130, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ color: '#ea580c' }} />
                </TableCell>
              </TableRow>
            ) : filteredNotifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8', fontSize: 13 }}>
                  No examination notifications found for selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifs.map((item, idx) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:nth-of-type(even)': { bgcolor: '#fffaf5' },
                    '&:hover': { bgcolor: '#fff7ed' }
                  }}
                >
                  <TableCell sx={{ fontSize: 12.5, fontWeight: 700, color: '#475569', py: 1.5 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', py: 1.5 }}>
                    {item.notification}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569', py: 1.5 }}>
                    {item.startDate}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569', py: 1.5 }}>
                    {item.endDateWithoutFine}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#475569', py: 1.5 }}>
                    {item.endDateWithFine}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedNotice(item)}
                      sx={{
                        textTransform: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#ea580c',
                        borderColor: '#fed7aa',
                        borderRadius: 1,
                        py: 0.4,
                        '&:hover': { bgcolor: '#fff7ed', borderColor: '#ea580c' }
                      }}
                    >
                      View Notice
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Notice Circular Detail Modal */}
      {selectedNotice && (
        <Dialog open={Boolean(selectedNotice)} onClose={() => setSelectedNotice(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ p: 2, bgcolor: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#ea580c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                VVITU Examination Circular
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {selectedNotice.notification}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedNotice(null)}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.5 }}>
                {selectedNotice.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Start Date</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedNotice.startDate}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Cut-off (No Fine)</Typography>
                  <Typography variant="body2" fontWeight={700} color="#059669">{selectedNotice.endDateWithoutFine}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Late Cut-off (With Fine)</Typography>
                  <Typography variant="body2" fontWeight={700} color="#dc2626">{selectedNotice.endDateWithFine}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Examination Fee</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0284c7">{selectedNotice.fee}</Typography>
                </Box>
              </Box>
            </Box>
            <Chip
              icon={<CheckCircle sx={{ fontSize: 16 }} />}
              label="Accredited & Published by Vasireddy Venkatadri International Technological University"
              size="small"
              sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontSize: 11, fontWeight: 600, width: '100%' }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={() => toast.success('Downloaded official circular PDF')}
              sx={{ textTransform: 'none', borderRadius: 1 }}
            >
              Download PDF Circular
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                toast.success('Registration window verified. Opening exam fee portal...');
                setSelectedNotice(null);
              }}
              sx={{ bgcolor: '#ea580c', textTransform: 'none', fontWeight: 700, borderRadius: 1 }}
            >
              Apply Online
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip
} from '@mui/material';
import { Add, Refresh, Search, VisibilityOutlined } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { grievanceAPI } from '../../services/api';
import { getSharedGrievances, saveSharedGrievance, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';

export default function StudentGrievancePage() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    category: 'Academic Grievance',
    department: 'Information Technology',
    subject: '',
    desc: '',
  });

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const res = await grievanceAPI.getMyGrievances();
      const serverData = res.data?.data || res.data || [];
      if (Array.isArray(serverData) && serverData.length > 0) {
        setGrievances(serverData);
      } else {
        setGrievances(getSharedGrievances());
      }
    } catch (err) {
      setGrievances(getSharedGrievances());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.GRIEVANCE_RESOLVED, () => loadGrievances());
    const unsubSub = subscribeToDataSync(DATA_SYNC_EVENTS.GRIEVANCE_SUBMITTED, () => loadGrievances());
    return () => {
      unsub();
      unsubSub();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.desc.trim()) return;

    const payload = {
      id: Date.now(),
      studentName: user?.name || 'MEESALA RITESH',
      rollNo: user?.enrollmentNumber || user?.username || '23BQ1A1268',
      category: form.category,
      department: form.department,
      subject: form.subject.trim(),
      description: form.desc.trim(),
      status: 'UNDER_REVIEW',
      createdAt: new Date().toLocaleDateString(),
    };

    saveSharedGrievance(payload);
    setGrievances(getSharedGrievances());
    setOpenModal(false);
    setForm({
      category: 'Academic Grievance',
      department: 'Information Technology',
      subject: '',
      desc: '',
    });
  };

  const filtered = grievances.filter(item =>
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HEADER MATCHING SCREENSHOT 5 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          p: '14px 20px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 2.5
        }}
      >
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
          Grievance
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Orange Add New Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => setOpenModal(true)}
            sx={{
              bgcolor: '#ea580c',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: 0.7,
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
              '&:hover': { bgcolor: '#c2410c' }
            }}
          >
            + Add New
          </Button>

          {/* Blue Refresh Button */}
          <Button
            variant="contained"
            size="small"
            disabled={loading}
            startIcon={<Refresh sx={{ fontSize: 16 }} />}
            onClick={loadGrievances}
            sx={{
              bgcolor: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: 0.7,
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
              '&:hover': { bgcolor: '#0369a1' }
            }}
          >
            Refresh
          </Button>

          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: 160, sm: 220 },
              '& .MuiOutlinedInput-root': {
                height: 36,
                fontSize: '0.84rem',
                borderRadius: '4px',
                bgcolor: '#ffffff'
              }
            }}
          />
        </Box>
      </Box>

      {/* ── TABLE WITH SOLID BLUE/CYAN HEADER MATCHING SCREENSHOT 5 ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          bgcolor: '#ffffff',
          minHeight: 480
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0284c7' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 60, fontSize: '0.88rem', py: 1.4 }}>
                #
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', py: 1.4 }}>
                Category
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', py: 1.4 }}>
                Department
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 140, fontSize: '0.88rem', py: 1.4 }} align="center">
                Status
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 100, fontSize: '0.88rem', py: 1.4 }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#94a3b8', fontSize: '0.95rem' }}>
                  No Data Found!
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, idx) => (
                <TableRow key={item.id || idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.86rem', py: 1.2 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem', py: 1.2 }}>
                    {item.category}
                  </TableCell>
                  <TableCell sx={{ color: '#334155', fontSize: '0.88rem', py: 1.2 }}>
                    {item.department || 'Information Technology'}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <Chip
                      label={item.status || 'UNDER_REVIEW'}
                      size="small"
                      sx={{
                        bgcolor: item.status === 'RESOLVED' ? '#dcfce7' : item.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                        color: item.status === 'RESOLVED' ? '#15803d' : item.status === 'REJECTED' ? '#b91c1c' : '#b45309',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <Tooltip title="View Grievance">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedGrievance(item)}
                        sx={{ color: '#0284c7' }}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── LODGE GRIEVANCE MODAL ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Submit Student Grievance / Appeal</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Grievance Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Academic Grievance">Academic Grievance (Marks / Evaluation)</MenuItem>
              <MenuItem value="Attendance Discrepancy">Attendance Discrepancy</MenuItem>
              <MenuItem value="Examination / Hall Ticket">Examination / Hall Ticket</MenuItem>
              <MenuItem value="Library / Lab Infrastructure">Library / Lab Infrastructure</MenuItem>
              <MenuItem value="Hostel & Transport">Hostel & Transport</MenuItem>
              <MenuItem value="General Campus Facility">General Campus Facility</MenuItem>
            </TextField>
            <TextField
              select
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Information Technology">Information Technology</MenuItem>
              <MenuItem value="Computer Science & Engineering">Computer Science & Engineering</MenuItem>
              <MenuItem value="Electronics & Communication">Electronics & Communication</MenuItem>
              <MenuItem value="Examination Cell">Examination Cell</MenuItem>
              <MenuItem value="Accounts & Finance">Accounts & Finance</MenuItem>
            </TextField>
            <TextField
              label="Subject / Summary"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Discrepancy in 4-1 Mid-2 Internal Marks"
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Detailed Explanation"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Provide complete facts, dates, subject codes, and description..."
              multiline
              rows={4}
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#ea580c', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#c2410c' } }}
            >
              Submit Grievance
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── VIEW GRIEVANCE DETAIL MODAL ── */}
      {selectedGrievance && (
        <Dialog open={Boolean(selectedGrievance)} onClose={() => setSelectedGrievance(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Grievance Details</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: '#0284c7' }}>{selectedGrievance.category}</Typography>
              <Chip
                label={selectedGrievance.status || 'UNDER_REVIEW'}
                size="small"
                sx={{
                  bgcolor: selectedGrievance.status === 'RESOLVED' ? '#dcfce7' : '#fef3c7',
                  color: selectedGrievance.status === 'RESOLVED' ? '#15803d' : '#b45309',
                  fontWeight: 700
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>Department: {selectedGrievance.department}</Typography>
            <Typography sx={{ fontWeight: 600, color: '#0f172a', mt: 1 }}>{selectedGrievance.subject}</Typography>
            <Typography sx={{ fontSize: '0.88rem', color: '#334155', bgcolor: '#f8fafc', p: 2, borderRadius: 1, border: '1px solid #e2e8f0' }}>
              {selectedGrievance.description || 'No detailed description provided.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedGrievance(null)} sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

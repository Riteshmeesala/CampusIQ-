import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { getSharedInternships, saveSharedInternship, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';

export default function StudentInternshipsPage() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    company: '',
    role: '',
    duration: '3 Months',
    stipend: '',
    mode: 'Remote',
    status: 'Ongoing'
  });

  const loadInternships = () => {
    setInternships(getSharedInternships());
  };

  useEffect(() => {
    loadInternships();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.INTERNSHIP_REGISTERED, () => loadInternships());
    return () => unsub();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    const item = {
      id: Date.now(),
      studentName: user?.name || 'MEESALA RITESH',
      rollNo: user?.enrollmentNumber || user?.username || '23BQ1A1268',
      ...form
    };
    saveSharedInternship(item);
    setInternships(getSharedInternships());
    setOpenModal(false);
    setForm({ company: '', role: '', duration: '3 Months', stipend: '', mode: 'Remote', status: 'Ongoing' });
  };

  const filtered = internships.filter(item =>
    item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP HEADER MATCHING SCREENSHOT 3 ── */}
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
          Student Internships
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

      {/* ── MAIN CONTENT MATCHING SCREENSHOT 3 ── */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          minHeight: 480,
          p: filtered.length === 0 ? 0 : 2,
          display: filtered.length === 0 ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {filtered.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
            No Data Found!
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Role / Designation</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Stipend</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item, idx) => (
                  <TableRow key={item.id || idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0284c7' }}>{item.company}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.role}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.mode}</TableCell>
                    <TableCell sx={{ color: '#16a34a', fontWeight: 600 }}>{item.stipend || '—'}</TableCell>
                    <TableCell align="center">
                      <Chip label={item.status} size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: '0.72rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* ── ADD NEW INTERNSHIP MODAL ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Register Student Internship</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Company / Organization"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. Microsoft / Amazon / Infosys"
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Role / Designation"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Software Development Intern"
              required
              fullWidth
              size="small"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Duration"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                fullWidth
                size="small"
              />
              <TextField
                select
                label="Mode"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="Remote">Remote</MenuItem>
                <MenuItem value="On-Site">On-Site</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
              </TextField>
            </Box>
            <TextField
              label="Monthly Stipend (Optional)"
              value={form.stipend}
              onChange={(e) => setForm({ ...form, stipend: e.target.value })}
              placeholder="e.g. ₹35,000 / month"
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
              Submit Record
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

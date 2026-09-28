import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Alert, IconButton, Tooltip
} from '@mui/material';
import { FlagOutlined, Add, Refresh } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { grievanceAPI } from '../../services/api';
import { getSharedGrievances, saveSharedGrievance, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';

export default function StudentGrievancePage() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    category: 'Academic',
    subject: '',
    desc: '',
  });
  const [successMsg, setSuccessMsg] = useState('');

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
      console.warn('Failed to load grievances from server, using local fallback:', err);
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
      studentName: user?.name || 'Student',
      rollNo: user?.username || '24CS001',
      category: form.category,
      subject: form.subject.trim(),
      desc: form.desc.trim(),
    };

    try {
      const res = await grievanceAPI.submitGrievance(payload);
      const created = res.data?.data || res.data || payload;
      saveSharedGrievance(created);
      await loadGrievances();
      setOpenModal(false);
      setForm({ category: 'Academic', subject: '', desc: '' });
      setSuccessMsg('Grievance lodged successfully to backend server. Committee will review within 48 hours.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error submitting grievance to backend:', err);
      saveSharedGrievance(payload);
      setGrievances(getSharedGrievances());
      setOpenModal(false);
      setSuccessMsg('Grievance saved locally (offline mode).');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Student Grievance Redressal"
        subtitle="Confidential institutional portal for academic, infrastructure, hostel, and fee grievances"
        breadcrumbs={[
          { label: 'Dashboard', path: '/student/dashboard' },
          { label: 'Grievance' }
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenModal(true)}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 600 }}
          >
            Lodge Grievance
          </Button>
        }
      />

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            My Grievance Tickets
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadGrievances}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
        </Box>

        {grievances.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <FlagOutlined sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No grievances submitted</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 2 }}>Have an institutional issue or query? Lodge a confidential grievance.</Typography>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setOpenModal(true)} sx={{ textTransform: 'none' }}>
              Lodge New Grievance
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {grievances.map((g, idx) => (
              <Box key={idx} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0284c7' }}>{g.id}</Typography>
                    <Chip label={g.category} size="small" sx={{ fontSize: 11, fontWeight: 600 }} />
                  </Box>
                  <Chip
                    label={g.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      bgcolor: g.status === 'Resolved' ? '#dcfce7' : '#fef9c3',
                      color: g.status === 'Resolved' ? '#15803d' : '#854d0e'
                    }}
                  />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f172a', mb: 0.5 }}>{g.subject}</Typography>
                <Typography sx={{ fontSize: 13, color: '#475569', mb: 1.5 }}>{g.desc}</Typography>
                {g.response && (
                  <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', mb: 0.25 }}>Committee Response:</Typography>
                    <Typography sx={{ fontSize: 12.5, color: '#1e3a8a' }}>{g.response}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Lodge Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Lodge Institutional Grievance</DialogTitle>
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
              <MenuItem value="Academic">Academic & Evaluation</MenuItem>
              <MenuItem value="Library Infrastructure">Library Infrastructure & Wi-Fi</MenuItem>
              <MenuItem value="Hostel & Mess">Hostel & Mess Facilities</MenuItem>
              <MenuItem value="Fee & Accounts">Fee & Payment Clarifications</MenuItem>
              <MenuItem value="Transport">Campus Transport & Bus Routes</MenuItem>
              <MenuItem value="Discipline & Anti-Ragging">Discipline & Anti-Ragging Cell</MenuItem>
            </TextField>

            <TextField
              label="Subject / Topic"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief summary of the issue..."
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Detailed Explanation"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              multiline
              rows={4}
              placeholder="Provide complete context, dates, locations, or faculty references..."
              required
              fullWidth
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 600 }}>
              Submit Grievance
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

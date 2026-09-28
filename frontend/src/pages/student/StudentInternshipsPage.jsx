import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Alert } from '@mui/material';
import { BusinessCenterOutlined, Add } from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { getSharedInternships, saveSharedInternship, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';

export default function StudentInternshipsPage() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ company: '', role: '', duration: '3 Months', stipend: '', mode: 'Remote', status: 'Ongoing' });
  const [msg, setMsg] = useState('');

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
      studentName: user?.name || 'Student',
      rollNo: user?.username || '24CS001',
      ...form 
    };
    saveSharedInternship(item);
    setInternships(getSharedInternships());
    setOpenModal(false);
    setForm({ company: '', role: '', duration: '3 Months', stipend: '', mode: 'Remote', status: 'Ongoing' });
    setMsg('Internship details recorded successfully!');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Student Internships & Industry Training"
        subtitle="Manage summer internships, pre-placement offers (PPO), and industry technical projects"
        breadcrumbs={[{ label: 'Dashboard', path: '/student/dashboard' }, { label: 'Internships' }]}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenModal(true)} sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 600 }}>
            Add Internship Record
          </Button>
        }
      />

      {msg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMsg('')}>{msg}</Alert>}

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a', mb: 2 }}>My Registered Internships</Typography>
        {internships.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <BusinessCenterOutlined sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No internship records found</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 2 }}>Register your active or completed internships to earn academic credits.</Typography>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setOpenModal(true)} sx={{ textTransform: 'none' }}>
              Register Internship
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {internships.map((item) => (
              <Box key={item.id} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{item.role}</Typography>
                  <Chip label={item.status} size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: 11 }} />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0284c7', mb: 0.5 }}>{item.company}</Typography>
                <Typography sx={{ fontSize: 12.5, color: '#64748b' }}>Duration: {item.duration} | Mode: {item.mode}</Typography>
                {item.stipend && <Typography sx={{ fontSize: 12, color: '#16a34a', fontWeight: 600, mt: 0.5 }}>Stipend: {item.stipend}</Typography>}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Register Internship Record</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Company / Organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Microsoft / Google / Infosys" required fullWidth size="small" />
            <TextField label="Internship Role / Designation" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Development Intern" required fullWidth size="small" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 Months / 6 Months" required fullWidth size="small" />
              <TextField select label="Work Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} fullWidth size="small">
                <MenuItem value="Remote">Remote</MenuItem>
                <MenuItem value="On-Site">On-Site</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
              </TextField>
            </Box>
            <TextField label="Monthly Stipend (Optional)" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="e.g. ₹45,000 / month" fullWidth size="small" />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 600 }}>Save Internship</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

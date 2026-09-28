import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Divider, Paper
} from '@mui/material';
import {
  Add, Download, Groups, LocationOn, CalendarToday,
  Edit, Delete, CheckCircle, EventAvailable
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { eventAPI } from '../../services/api';
import { broadcastDataChange, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';

export default function DepartmentEventsPage() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('dept_events_data');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Hands-on Workshop on Generative AI & Large Language Models', type: 'Hands-on Workshop', date: 'March 15, 2024', time: '10:00 AM - 04:00 PM', venue: 'Central Computing Center Lab 4', speaker: 'Dr. S. K. Narayanan (Google AI Research)', regs: 120, status: 'UPCOMING' },
      { id: 2, title: 'National Conference on Cloud Native Distributed Architectures (NCCNDA 2024)', type: 'National Conference', date: 'April 05-06, 2024', time: '09:00 AM - 05:00 PM', venue: 'University Main Auditorium', speaker: 'Keynote by IEEE Fellow Prof. V. Raman', regs: 250, status: 'UPCOMING' },
      { id: 3, title: 'Industry Guest Lecture: Microservices & Kubernetes Deployment at Scale', type: 'Guest Lecture', date: 'February 22, 2024', time: '02:00 PM - 04:30 PM', venue: 'Seminar Hall 202', speaker: 'Mr. Arvind Swaminathan (Lead DevOps Architect, AWS)', regs: 180, status: 'COMPLETED' },
      { id: 4, title: '48-Hour Smart Campus AI Innovation Hackathon', type: 'Student Hackathon', date: 'January 18-20, 2024', time: '48 Hours Live Coding', venue: 'Innovation & Incubation Hub', speaker: 'Judged by Industry Panel & Angel Investors', regs: 310, status: 'COMPLETED' },
    ];
  });

  const loadServerEvents = async () => {
    try {
      const res = await eventAPI.getAll();
      const serverData = res.data?.data || res.data || [];
      if (Array.isArray(serverData) && serverData.length > 0) {
        setEvents(serverData);
      }
    } catch (err) {
      console.warn('Failed to load events from server:', err);
    }
  };

  useEffect(() => {
    loadServerEvents();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.EVENT_PUBLISHED, () => loadServerEvents());
    return () => unsub();
  }, []);

  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'Hands-on Workshop', date: '', time: '', venue: '', speaker: '', regs: 60, status: 'UPCOMING' });
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [selectedEv, setSelectedEv] = useState(null);

  const saveEvents = async (list, newlyCreated = null) => {
    setEvents(list);
    localStorage.setItem('dept_events_data', JSON.stringify(list));
    if (newlyCreated) {
      try {
        await eventAPI.publish(newlyCreated);
      } catch (err) {
        console.warn('Failed to publish event to server:', err);
      }
    }
    broadcastDataChange(DATA_SYNC_EVENTS.EVENT_PUBLISHED, { events: list, timestamp: Date.now() });
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setForm({ title: '', type: 'Hands-on Workshop', date: '', time: '', venue: '', speaker: '', regs: 60, status: 'UPCOMING' });
    setOpen(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setForm({ ...ev });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    let updated;
    if (editingEvent) {
      updated = events.map(e => e.id === editingEvent.id ? { ...form, id: editingEvent.id } : e);
      toast.success(`Event "${form.title}" updated successfully!`);
    } else {
      updated = [{ ...form, id: Date.now() }, ...events];
      toast.success(`Event "${form.title}" scheduled and broadcast to students.`);
    }
    saveEvents(updated, editingEvent ? null : form);
    setOpen(false);
  };

  const handleDelete = (id) => {
    const updated = events.filter(e => e.id !== id);
    saveEvents(updated);
    toast.info('Event removed from department calendar.');
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Department Professional Events & Workshops"
        subtitle="Organize, manage and track departmental technical workshops, faculty development programs (FDP), and guest lectures"
        breadcrumbs={['Home', 'Faculty', 'Department Events']}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
          >
            Create New Event
          </Button>
        }
      />

      <Grid container spacing={3}>
        {events.map((ev) => (
          <Grid item xs={12} md={6} key={ev.id}>
            <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Chip
                    label={ev.type}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: 1, fontSize: 11 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={ev.status}
                      size="small"
                      sx={{
                        bgcolor: ev.status === 'UPCOMING' ? '#dcfce7' : '#f1f5f9',
                        color: ev.status === 'UPCOMING' ? '#166534' : '#475569',
                        fontWeight: 700,
                        fontSize: 11
                      }}
                    />
                    <IconButton size="small" onClick={() => handleOpenEdit(ev)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(ev.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight={700} color="#0f172a" mb={1}>
                  {ev.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  <strong>Speaker / Guest:</strong> {ev.speaker}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Grid container spacing={1} sx={{ fontSize: 12, color: '#475569' }}>
                  <Grid item xs={6}>
                    <CalendarToday fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    {ev.date}
                  </Grid>
                  <Grid item xs={6}>
                    <LocationOn fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    {ev.venue}
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 0.5 }}>
                    <Groups fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    <strong>{ev.regs}</strong> Registered Participants
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => toast.success(`Downloading brochure for ${ev.title}`)}
                    sx={{ textTransform: 'none', borderRadius: 1 }}
                  >
                    Brochure
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => { setSelectedEv(ev); setRegModalOpen(true); }}
                    sx={{ textTransform: 'none', borderRadius: 1, bgcolor: COLORS.secondary }}
                  >
                    View Registrations ({ev.regs})
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingEvent ? 'Edit Department Event' : 'Create New Department Event'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Event Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Event Type"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <MenuItem value="Hands-on Workshop">Hands-on Workshop</MenuItem>
              <MenuItem value="National Conference">National Conference</MenuItem>
              <MenuItem value="Guest Lecture">Industry Guest Lecture</MenuItem>
              <MenuItem value="Faculty Development Program">Faculty Development Program (FDP)</MenuItem>
              <MenuItem value="Student Hackathon">Student Hackathon</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Date & Time"
              placeholder="e.g. March 15, 2024, 10:00 AM - 04:00 PM"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
            <TextField
              fullWidth
              label="Venue / Hall"
              placeholder="e.g. Central Computing Center Lab 4"
              value={form.venue}
              onChange={e => setForm({ ...form, venue: e.target.value })}
            />
            <TextField
              fullWidth
              label="Speaker / Resource Person Details"
              placeholder="e.g. Dr. S. K. Narayanan (Google AI Research)"
              value={form.speaker}
              onChange={e => setForm({ ...form, speaker: e.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Event Status"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="UPCOMING">UPCOMING</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              <MenuItem value="POSTPONED">POSTPONED</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingEvent ? 'Save Changes' : 'Schedule Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={regModalOpen} onClose={() => setRegModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Registrations — {selectedEv?.title}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Total Registrations: <strong>{selectedEv?.regs} Students</strong> • Venue: <strong>{selectedEv?.venue}</strong>
          </Typography>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#16a34a', fontWeight: 700, fontSize: 13, mb: 1 }}>
              <CheckCircle fontSize="small" /> All {selectedEv?.regs} student entry passes generated and sent via email.
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Participant attendance will be verified at the venue entrance.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRegModalOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />} onClick={() => toast.success('Exporting participant attendance register (Excel)')}>
            Download Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

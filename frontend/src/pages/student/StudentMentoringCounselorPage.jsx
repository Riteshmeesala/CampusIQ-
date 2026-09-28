import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Avatar, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert
} from '@mui/material';
import {
  AssignmentInd, EventAvailable, Email, Phone,
  AccessTime, LocationOn
} from '@mui/icons-material';
import { mentoringAPI } from '../../services/api';
import {
  getSharedCounseling, bookSharedCounseling, subscribeToDataSync
} from '../../services/dataSync';

const MENTOR_DETAILS = {
  name: 'Prof. Ananya Sen',
  designation: 'Associate Professor & Senior Academic Counselor',
  department: 'Computer Science & Engineering',
  email: 'ananya.sen@campusiq.edu.in',
  phone: '+91 98765 43210',
  cabin: 'Room 304, Academic Block-B',
  availability: 'Mon - Thu (03:00 PM - 04:30 PM)',
  totalMentees: 22,
};

export default function StudentMentoringCounselorPage() {
  const [sessionsList, setSessionsList] = useState(getSharedCounseling());
  const [loading, setLoading] = useState(false);
  const [openBookModal, setOpenBookModal] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [agenda, setAgenda] = useState('');
  const [booked, setBooked] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await mentoringAPI.getMyMentoring();
      const serverSessions = res.data?.data || res.data || [];
      if (Array.isArray(serverSessions) && serverSessions.length > 0) {
        setSessionsList(serverSessions);
      } else {
        setSessionsList(getSharedCounseling());
      }
    } catch (err) {
      console.warn('Failed to load mentoring sessions from server:', err);
      setSessionsList(getSharedCounseling());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const unsub = subscribeToDataSync(() => {
      loadSessions();
    });
    return unsub;
  }, []);

  const handleBookSession = async () => {
    if (!agenda || !preferredDate) return;
    const newSession = {
      studentName: 'Ritesh Meesala',
      rollNo: '24CS001',
      mentorName: MENTOR_DETAILS.name,
      date: preferredDate.replace('T', ' '),
      type: agenda,
      mentorRemarks: 'Session slot requested by student. Awaiting 1-on-1 interaction.',
      outcome: 'Scheduled',
      rating: 5,
      status: 'Pending Review'
    };

    try {
      const res = await mentoringAPI.bookSession(newSession);
      const created = res.data?.data || res.data || newSession;
      bookSharedCounseling(created);
      await loadSessions();
      setBooked(true);
    } catch (err) {
      console.error('Error booking mentoring session on server:', err);
      bookSharedCounseling(newSession);
      setSessionsList(getSharedCounseling());
      setBooked(true);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentInd sx={{ color: '#2563eb' }} /> Student Counselor & Faculty Mentoring
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Connect with your assigned faculty mentor for academic guidance, career roadmap, and 1-on-1 counseling.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Mentor Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: '#2563eb',
                  fontSize: '2rem',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 1.5,
                  boxShadow: '0 8px 16px rgba(37,99,235,0.2)'
                }}
              >
                AS
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {MENTOR_DETAILS.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                {MENTOR_DETAILS.designation}
              </Typography>
              <Chip label={MENTOR_DETAILS.department} size="small" color="primary" sx={{ mt: 1, fontWeight: 700, fontSize: '0.72rem' }} />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                <Email fontSize="small" sx={{ color: '#2563eb' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{MENTOR_DETAILS.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                <Phone fontSize="small" sx={{ color: '#16a34a' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{MENTOR_DETAILS.phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                <LocationOn fontSize="small" sx={{ color: '#dc2626' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{MENTOR_DETAILS.cabin}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                <AccessTime fontSize="small" sx={{ color: '#b45309' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{MENTOR_DETAILS.availability}</Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={<EventAvailable />}
              onClick={() => setOpenBookModal(true)}
              sx={{ mt: 3, textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
            >
              Request 1-on-1 Counseling Slot
            </Button>
          </Paper>
        </Grid>

        {/* Counseling Sessions Timeline & Notes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Mentoring Session Logs & Guidance Records
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Confidential session remarks and recommendations from your mentor
                </Typography>
              </Box>
              <Chip label="Batch 2023-2027 Mentee" color="success" size="small" sx={{ fontWeight: 700 }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sessionsList.map((session) => (
                <Card key={session.id} variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {session.type}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Session Conducted On: <strong>{session.date}</strong>
                        </Typography>
                      </Box>
                      <Chip label={session.outcome} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9', mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                        Mentor Remarks & Action Plan:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        "{session.mentorRemarks}"
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Book Slot Dialog */}
      <Dialog open={openBookModal} onClose={() => setOpenBookModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule Counseling Session</DialogTitle>
        <DialogContent dividers>
          {booked ? (
            <Alert severity="success">
              Counseling request submitted to {MENTOR_DETAILS.name}. You will receive confirmation via email!
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Preferred Date & Time"
                type="datetime-local"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
              <TextField
                label="Agenda / Topic of Discussion"
                multiline
                rows={3}
                fullWidth
                placeholder="E.g. Elective subject selection, internship NOC, higher studies advice..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenBookModal(false); setBooked(false); }} sx={{ textTransform: 'none' }}>Close</Button>
          {!booked && (
            <Button
              variant="contained"
              onClick={handleBookSession}
              disabled={!preferredDate || !agenda}
              sx={{ textTransform: 'none', bgcolor: '#2563eb' }}
            >
              Confirm Appointment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

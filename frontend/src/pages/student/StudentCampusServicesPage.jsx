import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Hotel, DirectionsBus, Inventory2, Campaign, LocationOn,
  Download, QrCode2, Restaurant, Person
} from '@mui/icons-material';
import { campusServicesAPI } from '../../services/api';

const HOSTEL_INFO = {
  block: 'Block-C (Aryabhatta Boys Hostel)',
  roomNo: 'C-314 (3rd Floor)',
  type: '2-Sharing AC Suite',
  roommate: 'Rahul Varma (23CS088)',
  wardenName: 'Dr. B. K. Raman',
  wardenPhone: '+91 98480 11223',
  messCardNo: 'MESS-2023-8902',
};

const MESS_MENU = [
  { day: 'Monday', breakfast: 'Idli & Vada with Sambar / Chutney, Tea/Coffee', lunch: 'Rice, Dal Makhani, Paneer Butter Masala, Roti, Curd', dinner: 'Veg Pulao, Chapati, Mix Veg Curry, Custard' },
  { day: 'Tuesday', breakfast: 'Puri Bhaji, Sprouts Salad, Milk/Tea', lunch: 'Jeera Rice, Yellow Dal Tadka, Aloo Gobi, Roti, Buttermilk', dinner: 'Egg / Paneer Curry, Phulka, Rice, Rasam' },
  { day: 'Wednesday', breakfast: 'Masala Dosa, Sambhar, Coffee', lunch: 'Veg Biryani, Raita, Bagara Baingan, Salad', dinner: 'Chicken Curry / Kadai Paneer, Chapati, Rice, Gulab Jamun' },
  { day: 'Thursday', breakfast: 'Poha & Upma, Boiled Eggs / Fruit, Tea', lunch: 'Rice, Sambar, Bhindi Fry, Curd, Papad', dinner: 'Dal Fry, Jeera Aloo, Tandoori Roti, Kheer' },
  { day: 'Friday', breakfast: 'Uttapam with Chutney, Coffee', lunch: 'Lemon Rice, Rajma Curry, Phulka, Curd', dinner: 'Special Fried Rice, Veg Manchurian, Ice Cream' },
];

const BUS_INFO = {
  routeNo: 'Route 14 - Madhapur to Campus Direct Express',
  busNumber: 'TS 09 UA 4589',
  driverName: 'Mr. G. Nageshwar Rao',
  driverPhone: '+91 98492 55678',
  pickupPoint: 'Madhapur Metro Station Pillar #142',
  pickupTime: '07:45 AM',
  dropTime: '05:40 PM',
  status: 'On-Route (Speed: 42 km/h • 8 mins to Campus)',
  stops: [
    { stop: 'Madhapur Metro Station', time: '07:45 AM', passed: true },
    { stop: 'Jubilee Hills Checkpost', time: '08:00 AM', passed: true },
    { stop: 'Banjara Hills Rd #12', time: '08:15 AM', passed: true },
    { stop: 'Mehdipatnam Express Ring', time: '08:30 AM', passed: true },
    { stop: 'Campus Main Entrance Gate', time: '08:48 AM', passed: false },
  ]
};

const CAMPUS_NOTICES = [
  { id: 1, title: 'Annual Cultural & Tech Fest - Tarang 2026 Schedule', date: '01 Sep 2026', dept: 'Student Affairs', category: 'Festival', urgent: true },
  { id: 2, title: 'Hostel Maintenance & High-Speed Optical Fiber Upgrade', date: '29 Aug 2026', dept: 'Hostel Administration', category: 'Hostel', urgent: false },
  { id: 3, title: 'Bus Route 14 Timetable Adjustment for Examination Period', date: '25 Aug 2026', dept: 'Transport Dept', category: 'Transport', urgent: false },
  { id: 4, title: 'Independence Day Institutional Flag Hoisting Ceremony', date: '14 Aug 2026', dept: 'Principal Office', category: 'General', urgent: false },
];

const YEARBOOK_MEMORIES = [
  { batch: 'Batch of 2027 (CSE)', title: 'National Hackathon Finals Team Photo', count: '48 Photos' },
  { batch: 'Batch of 2027 (CSE)', title: 'Freshers Orientation & Campus Life', count: '120 Photos' },
  { batch: 'Batch of 2027 (CSE)', title: 'Industrial Visit to Infosys & T-Hub', count: '64 Photos' },
];

export default function StudentCampusServicesPage({ initialTab = 0 }) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [outpassModal, setOutpassModal] = useState(false);
  const [outpassSubmitted, setOutpassSubmitted] = useState(false);
  const [hostel, setHostel] = useState(HOSTEL_INFO);
  const [bus, setBus] = useState(BUS_INFO);
  const [yearbook, setYearbook] = useState(YEARBOOK_MEMORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const [hostelRes, busRes, ybRes] = await Promise.allSettled([
          campusServicesAPI.getHostelDetails(),
          campusServicesAPI.getBusRoutes(),
          campusServicesAPI.getYearbook()
        ]);

        if (hostelRes.status === 'fulfilled' && hostelRes.value.data?.data) {
          const h = hostelRes.value.data.data;
          setHostel(prev => ({
            ...prev,
            roomNo: h.allocatedRoom || prev.roomNo,
            block: h.block || prev.block,
            wardenName: h.warden || prev.wardenName,
          }));
        }

        if (busRes.status === 'fulfilled' && busRes.value.data?.data) {
          const routes = busRes.value.data.data;
          if (Array.isArray(routes) && routes.length > 0) {
            const r = routes[0];
            setBus(prev => ({
              ...prev,
              routeNo: `${r.routeNo} - ${r.name}`,
              busNumber: r.busNo || prev.busNumber,
              driverName: r.driver || prev.driverName,
              status: `${r.status} (Speed: ${r.speed || '35 km/h'} • Next: ${r.nextStop || 'Campus'})`
            }));
          }
        }

        if (ybRes.status === 'fulfilled' && ybRes.value.data?.data) {
          const entries = ybRes.value.data.data;
          if (Array.isArray(entries) && entries.length > 0) {
            setYearbook(entries.map(e => ({
              batch: e.batch || 'Batch of 2027',
              title: e.title,
              count: e.quote || 'Campus Memories'
            })));
          }
        }
      } catch (err) {
        console.warn('Failed to load campus services from backend:', err);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hotel sx={{ color: '#2563eb' }} /> Campus Living, Transport & Student Services
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Manage your hostel room allotment, check real-time college bus tracker, view notices, and explore the batch yearbook.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            bgcolor: '#ffffff',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, py: 2, minHeight: 48 },
            '& .Mui-selected': { color: '#2563eb' },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3 }
          }}
        >
          <Tab icon={<Hotel fontSize="small" />} iconPosition="start" label="Hostel & Mess Services" />
          <Tab icon={<DirectionsBus fontSize="small" />} iconPosition="start" label="Check My Bus (Live Tracking)" />
          <Tab icon={<Campaign fontSize="small" />} iconPosition="start" label="Campus Notices & Circulars" />
          <Tab icon={<Inventory2 fontSize="small" />} iconPosition="start" label="Student YearBook & Memories" />
        </Tabs>
      </Paper>

      {/* Tab 0: Hostel */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Room Allocation Card
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Active Term 2026-2027 Allotment
                  </Typography>
                </Box>
                <Chip label="Resident" color="success" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>HOSTEL BLOCK & ROOM</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e40af' }}>
                    {hostel.block} • {hostel.roomNo}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ACCOMMODATION TYPE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    {hostel.type}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ROOMMATE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person sx={{ fontSize: 16, color: '#2563eb' }} /> {hostel.roommate}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>WARDEN IN-CHARGE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    {hostel.wardenName} ({hostel.wardenPhone})
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => { setOutpassModal(true); setOutpassSubmitted(false); }}
                sx={{ mt: 3, textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
              >
                Apply for Hostel Outpass / Leave
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Restaurant sx={{ color: '#ea580c' }} /> Weekly Hostel Mess Menu
                </Typography>
                <Chip label="Veg & Non-Veg Multi-Cuisine" color="secondary" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Day</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Breakfast (07:30 - 09:00)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Lunch (12:30 - 02:00)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Dinner (07:30 - 09:30)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {MESS_MENU.map((m) => (
                      <TableRow key={m.day} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#1e40af' }}>{m.day}</TableCell>
                        <TableCell sx={{ color: '#334155', fontSize: '0.8rem' }}>{m.breakfast}</TableCell>
                        <TableCell sx={{ color: '#334155', fontSize: '0.8rem' }}>{m.lunch}</TableCell>
                        <TableCell sx={{ color: '#334155', fontSize: '0.8rem' }}>{m.dinner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Check My Bus */}
      {tabIndex === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Digital Bus Pass
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Seat Allotted & Verified
                  </Typography>
                </Box>
                <QrCode2 sx={{ fontSize: 42, color: '#2563eb' }} />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ROUTE NAME</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                    {bus.routeNo}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>BUS REGISTRATION NO</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {bus.busNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>DRIVER DETAILS</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    {bus.driverName} ({bus.driverPhone})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>YOUR PICKUP POINT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {bus.pickupPoint} @ {bus.pickupTime}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#dcfce7', borderRadius: 2.5, border: '1px solid #bbf7d0' }}>
                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, display: 'block' }}>
                  GPS LIVE TRACKER STATUS
                </Typography>
                <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700, mt: 0.5 }}>
                  {bus.status}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2.5 }}>
                Route Stops & Real-Time Schedule
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {BUS_INFO.stops.map((st, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: st.passed ? '#bbf7d0' : '#e2e8f0',
                      bgcolor: st.passed ? '#f0fdf4' : '#ffffff'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocationOn sx={{ color: st.passed ? '#16a34a' : '#94a3b8' }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {st.stop}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Scheduled Departure: {st.time}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={st.passed ? 'Departed' : 'Upcoming'}
                      size="small"
                      color={st.passed ? 'success' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Campus Notices */}
      {tabIndex === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Campus Bulletins & Administrative Circulars
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CAMPUS_NOTICES.map((n) => (
              <Card key={n.id} variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={n.category} size="small" color="primary" sx={{ fontWeight: 700 }} />
                      {n.urgent && <Chip label="IMPORTANT" size="small" color="error" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>{n.date}</Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', my: 0.5 }}>
                    {n.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Issued by: <strong>{n.dept}</strong>
                    </Typography>
                    <Button size="small" startIcon={<Download />} variant="text" sx={{ textTransform: 'none', fontWeight: 600 }}>
                      Download Official Circular PDF
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Tab 3: YearBook */}
      {tabIndex === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Class YearBook & Digital Memory Wall
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Cherish memories, milestone photos, and graduating class testimonials
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Download />} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}>
              Download Batch YearBook PDF
            </Button>
          </Box>

          <Grid container spacing={3}>
            {yearbook.map((m, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <Box sx={{ height: 160, bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Inventory2 sx={{ fontSize: 48, color: '#94a3b8' }} />
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {m.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{m.batch}</Typography>
                      <Chip label={m.count} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Outpass Modal */}
      <Dialog open={outpassModal} onClose={() => setOutpassModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply for Hostel Night Outpass</DialogTitle>
        <DialogContent dividers>
          {outpassSubmitted ? (
            <Alert severity="success">Outpass request approved and sent to Chief Warden & Gate Security! Ref: #OUT-2026-902</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Destination / Hometown Address" fullWidth size="small" />
              <TextField label="Departure Date & Time" type="datetime-local" fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Expected Return Date & Time" type="datetime-local" fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Parent / Guardian Contact Phone" fullWidth size="small" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOutpassModal(false)} sx={{ textTransform: 'none' }}>Close</Button>
          {!outpassSubmitted && (
            <Button variant="contained" onClick={() => setOutpassSubmitted(true)} sx={{ textTransform: 'none', bgcolor: '#2563eb' }}>
              Submit Outpass Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

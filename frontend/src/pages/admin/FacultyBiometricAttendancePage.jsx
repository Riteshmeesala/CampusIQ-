import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Divider, LinearProgress, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Paper, Avatar, Stack,
  Grid, InputAdornment
} from '@mui/material';
import {
  Fingerprint, CalendarMonth, CheckCircle, Cancel, AccessTime,
  Refresh, Search, FilterAlt, Download, Print, Apartment,
  Person, ArrowForward, HowToReg, Schedule, VerifiedUser
} from '@mui/icons-material';
import { attendanceAPI, userAPI } from '../../services/api';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';

export default function FacultyBiometricAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('9');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Daily punch modal state
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [punchLogsOpen, setPunchLogsOpen] = useState(false);

  // Manual Punch Dialog State
  const [manualPunchOpen, setManualPunchOpen] = useState(false);
  const [punchForm, setPunchForm] = useState({
    facultyId: '',
    facultyName: '',
    punchDate: new Date().toISOString().split('T')[0],
    punchInTime: '08:45 AM',
    punchOutTime: '05:15 PM',
    status: 'PRESENT',
    deviceId: 'BIO-GATE-01',
    location: 'Main Academic Block Gate',
    remarks: 'Manual entry verified by Admin'
  });
  const [punchSubmitting, setPunchSubmitting] = useState(false);

  const fetchBiometricData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getFacultyBiometricSummary({
        year: Number(selectedYear),
        month: Number(selectedMonth)
      });
      const data = res.data?.data || [];
      setSummaries(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load faculty biometric attendance: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchBiometricData();
  }, [fetchBiometricData]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => {
      const matchSearch =
        (s.facultyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'ALL' || s.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [summaries, searchTerm, deptFilter]);

  // Overall Statistics
  const totalFacultyCount = summaries.length;
  const avgAttendancePct = summaries.length > 0
    ? (summaries.reduce((acc, s) => acc + (Number(s.attendancePercentage) || 0), 0) / summaries.length).toFixed(1)
    : '0.0';
  const facultyPresentToday = summaries.filter(s => s.lastStatus === 'PRESENT' || s.lastStatus === 'LATE').length;

  const handleOpenLogs = (faculty) => {
    setSelectedFaculty(faculty);
    setPunchLogsOpen(true);
  };

  const handleOpenManualPunch = (faculty) => {
    if (faculty) {
      setPunchForm({
        facultyId: faculty.facultyId,
        facultyName: faculty.facultyName,
        punchDate: new Date().toISOString().split('T')[0],
        punchInTime: '08:45 AM',
        punchOutTime: '05:15 PM',
        status: 'PRESENT',
        deviceId: 'BIO-GATE-01',
        location: 'Main Academic Block Gate',
        remarks: 'Admin verified entry'
      });
    }
    setManualPunchOpen(true);
  };

  const handleSavePunch = async () => {
    if (!punchForm.facultyId) {
      toast.warning('Please select or specify a faculty member');
      return;
    }
    setPunchSubmitting(true);
    try {
      await attendanceAPI.punchFacultyBiometric({
        facultyId: Number(punchForm.facultyId),
        facultyName: punchForm.facultyName,
        punchDate: punchForm.punchDate,
        punchInTime: punchForm.punchInTime,
        punchOutTime: punchForm.punchOutTime,
        status: punchForm.status,
        deviceId: punchForm.deviceId,
        location: punchForm.location,
        remarks: punchForm.remarks
      });
      toast.success(`✅ Biometric punch recorded for ${punchForm.facultyName || 'Faculty'}!`);
      setManualPunchOpen(false);
      fetchBiometricData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to record punch: ' + (e.response?.data?.message || e.message));
    } finally {
      setPunchSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Faculty Biometric Attendance System"
        subtitle="Monitor real-time biometric punch logs, days present, late entries, and institutional faculty compliance"
        breadcrumbs={['Home', 'Administration', 'Faculty Attendance & Biometrics']}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchBiometricData}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Fingerprint />}
              onClick={() => handleOpenManualPunch(summaries[0] || null)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, bgcolor: '#0f766e', '&:hover': { bgcolor: '#115e59' } }}
            >
              Record Biometric Punch
            </Button>
          </Stack>
        }
      />

      {/* Top Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL REGISTERED FACULTY
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
                  {totalFacultyCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Faculty Profiles
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 48, height: 48 }}>
                <Person />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  PUNCHED TODAY
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#16a34a" sx={{ mt: 0.5 }}>
                  {facultyPresentToday} / {totalFacultyCount}
                </Typography>
                <Typography variant="caption" color="#16a34a" fontWeight={600}>
                  Present on Campus Today
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 48, height: 48 }}>
                <CheckCircle />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  MONTHLY ATTENDANCE AVG
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#0f766e" sx={{ mt: 0.5 }}>
                  {avgAttendancePct}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  For September 2026
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#ccfbf1', color: '#0f766e', width: 48, height: 48 }}>
                <Fingerprint />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  BIOMETRIC GATE TERMINALS
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#0284c7" sx={{ mt: 0.5 }}>
                  Online & Active
                </Typography>
                <Typography variant="caption" color="#16a34a" fontWeight={600}>
                  ● BIO-GATE-01 (Main Block)
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7', width: 48, height: 48 }}>
                <VerifiedUser />
              </Avatar>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search faculty name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Departments</MenuItem>
              <MenuItem value="Computer Science">Computer Science</MenuItem>
              <MenuItem value="Information Technology">Information Technology</MenuItem>
              <MenuItem value="Electronics & Communication">Electronics & Communication</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {[
                { val: '1', name: 'January' }, { val: '2', name: 'February' },
                { val: '3', name: 'March' }, { val: '4', name: 'April' },
                { val: '5', name: 'May' }, { val: '6', name: 'June' },
                { val: '7', name: 'July' }, { val: '8', name: 'August' },
                { val: '9', name: 'September' }, { val: '10', name: 'October' },
                { val: '11', name: 'November' }, { val: '12', name: 'December' },
              ].map(m => (
                <MenuItem key={m.val} value={m.val}>{m.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Year"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {['2026', '2025', '2024'].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchBiometricData}
              sx={{ borderRadius: 1.5, textTransform: 'none', height: 40, bgcolor: COLORS.secondary }}
            >
              Filter Attendance
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Faculty Attendance Table */}
      <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Faculty Biometric Attendance & Days Present Roster
            </Typography>
            <Chip
              icon={<Fingerprint fontSize="small" />}
              label={`Live Biometric Feed Sync: ${filteredSummaries.length} Faculty Members`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : filteredSummaries.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Fingerprint sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No faculty attendance records found</Typography>
              <Typography variant="body2" color="text.secondary">Try adjusting filters or record a new biometric punch.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Faculty Member', 'Department / Role', 'Working Days', 'Days Present in College', 'Late / Half-Day', 'Attendance %', 'Latest Biometric Punch', 'Action'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSummaries.map((f) => {
                    const pct = Number(f.attendancePercentage) || 0;
                    return (
                      <TableRow key={f.facultyId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#ea580c', fontWeight: 700, fontSize: 13 }}>
                              {f.facultyName?.[0] || 'F'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {f.facultyName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {f.employeeId || 'FAC-' + f.facultyId}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {f.department || 'Computer Science'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {f.designation || 'Faculty Member'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {f.totalWorkingDays} Days
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={`${f.daysPresent} Days Present`}
                            sx={{
                              bgcolor: '#dcfce7',
                              color: '#15803d',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              border: '1px solid #86efac'
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0.75}>
                            {f.daysLate > 0 && (
                              <Chip label={`${f.daysLate} Late`} size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }} />
                            )}
                            {f.daysHalfDay > 0 && (
                              <Chip label={`${f.daysHalfDay} Half-Day`} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 700 }} />
                            )}
                            {f.daysLate === 0 && f.daysHalfDay === 0 && (
                              <Typography variant="caption" color="text.secondary">None (Punctual)</Typography>
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, pct)}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: '#e2e8f0',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: pct >= 85 ? '#16a34a' : pct >= 75 ? '#eab308' : '#dc2626'
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="caption" fontWeight={800} color="#0f172a">
                              {pct}%
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography variant="caption" fontWeight={700} color="#0284c7">
                              {f.lastPunchTime || 'No record'}
                            </Typography>
                            <Box>
                              <Chip
                                label={f.lastStatus || 'PRESENT'}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: f.lastStatus === 'PRESENT' ? '#dcfce7' : '#fee2e2',
                                  color: f.lastStatus === 'PRESENT' ? '#166534' : '#991b1b'
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenLogs(f)}
                              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 11, fontWeight: 700 }}
                            >
                              Punch Logs
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenManualPunch(f)}
                              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 11, fontWeight: 700, bgcolor: '#0f766e' }}
                            >
                              + Punch
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIALOG: VIEW DETAILED DAILY BIOMETRIC PUNCH LOGS               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={punchLogsOpen}
        onClose={() => setPunchLogsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
          Biometric Punch History — {selectedFaculty?.facultyName} ({selectedFaculty?.employeeId})
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing verified campus gate punches for <strong>{selectedFaculty?.facultyName}</strong>
            </Typography>
            <Chip
              label={`${selectedFaculty?.daysPresent || 0} Total Present Days`}
              color="success"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  {['Date', 'Punch In', 'Punch Out', 'Working Duration', 'Status', 'Device / Gate', 'Remarks'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedFaculty?.recentPunches || []).map((p, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{p.punchDate}</TableCell>
                    <TableCell sx={{ color: '#16a34a', fontWeight: 600 }}>{p.punchInTime || '--:--'}</TableCell>
                    <TableCell sx={{ color: '#0284c7', fontWeight: 600 }}>{p.punchOutTime || '--:--'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{p.workingHours || '8h 30m'}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.status || 'PRESENT'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: 10,
                          bgcolor: p.status === 'PRESENT' ? '#dcfce7' : p.status === 'LATE' ? '#fef3c7' : '#e0e7ff',
                          color: p.status === 'PRESENT' ? '#166534' : p.status === 'LATE' ? '#b45309' : '#4338ca'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{p.deviceId || 'BIO-GATE-01'}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{p.remarks || 'Biometric verified'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setPunchLogsOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIALOG: MANUAL / SIMULATE BIOMETRIC PUNCH ENTRY                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={manualPunchOpen}
        onClose={() => setManualPunchOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
          Record Faculty Biometric Punch
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Simulate or manually record a biometric attendance punch for faculty in the college campus.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Faculty Member"
                value={punchForm.facultyId}
                onChange={e => {
                  const fid = e.target.value;
                  const found = summaries.find(s => String(s.facultyId) === String(fid));
                  setPunchForm(prev => ({
                    ...prev,
                    facultyId: fid,
                    facultyName: found ? found.facultyName : ''
                  }));
                }}
              >
                {summaries.map(s => (
                  <MenuItem key={s.facultyId} value={s.facultyId}>
                    {s.facultyName} ({s.employeeId} - {s.department})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Punch Date"
                value={punchForm.punchDate}
                onChange={e => setPunchForm({ ...punchForm, punchDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Punch Status"
                value={punchForm.status}
                onChange={e => setPunchForm({ ...punchForm, status: e.target.value })}
              >
                <MenuItem value="PRESENT">PRESENT</MenuItem>
                <MenuItem value="LATE">LATE</MenuItem>
                <MenuItem value="HALF_DAY">HALF_DAY</MenuItem>
                <MenuItem value="ON_LEAVE">ON_LEAVE</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Punch In Time"
                value={punchForm.punchInTime}
                onChange={e => setPunchForm({ ...punchForm, punchInTime: e.target.value })}
                placeholder="08:45 AM"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Punch Out Time"
                value={punchForm.punchOutTime}
                onChange={e => setPunchForm({ ...punchForm, punchOutTime: e.target.value })}
                placeholder="05:15 PM"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Biometric Device ID"
                value={punchForm.deviceId}
                onChange={e => setPunchForm({ ...punchForm, deviceId: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Gate Location"
                value={punchForm.location}
                onChange={e => setPunchForm({ ...punchForm, location: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Remarks"
                value={punchForm.remarks}
                onChange={e => setPunchForm({ ...punchForm, remarks: e.target.value })}
                placeholder="e.g. Verified by biometric reader at main gate"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setManualPunchOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSavePunch}
            variant="contained"
            disabled={punchSubmitting}
            sx={{ textTransform: 'none', bgcolor: '#0f766e', '&:hover': { bgcolor: '#115e59' } }}
          >
            {punchSubmitting ? 'Recording...' : 'Save Biometric Punch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

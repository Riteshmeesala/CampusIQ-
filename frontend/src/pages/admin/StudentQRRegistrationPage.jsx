import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Tooltip, IconButton, Divider, Avatar,
  InputAdornment, Tab, Tabs
} from '@mui/material';
import {
  QrCode2, FileDownload, FileUpload, Refresh, Search, CheckCircle,
  ErrorOutline, Warning, ContentCopy, Print, School, Person, Email,
  Badge, Class, FilterAlt, Close, HelpOutline
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { registrationAPI } from '../../services/api';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { anim } from '../../theme/animations';
import { toast } from 'react-toastify';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics',
  'Mechanical Engineering', 'Civil Engineering', 'Electrical & Electronics',
  'Mathematics', 'Physics', 'Humanities & Sciences'
];

const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

export default function StudentQRRegistrationPage() {
  const [tabIndex,        setTabIndex]        = useState(0);
  const [registrations,   setRegistrations]   = useState([]);
  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);

  // Search & Filter
  const [search,          setSearch]          = useState('');
  const [deptFilter,      setDeptFilter]      = useState('ALL');
  const [semFilter,       setSemFilter]       = useState('ALL');

  // QR Code Settings
  const defaultUrl = `${window.location.origin}/register/student`;
  const [regUrl,          setRegUrl]          = useState(defaultUrl);
  const [posterOpen,      setPosterOpen]      = useState(false);

  // Excel Import States
  const fileInputRef = useRef(null);
  const [importing,       setImporting]       = useState(false);
  const [previewRows,     setPreviewRows]     = useState([]);
  const [fileName,        setFileName]        = useState('');
  const [importReport,    setImportReport]    = useState(null);
  const [reportOpen,      setReportOpen]      = useState(false);

  // Manual Student Registration State
  const [manualForm,      setManualForm]      = useState({
    name: '',
    enrollmentNumber: '',
    email: '',
    department: 'Computer Science',
    semester: '1-1',
    section: 'Section A',
    phoneNumber: '',
    username: '',
    password: ''
  });
  const [manualSaving,    setManualSaving]    = useState(false);

  const handleManualSubmit = async (e) => {
    e?.preventDefault();
    if (!manualForm.name.trim() || !manualForm.enrollmentNumber.trim() || !manualForm.email.trim()) {
      toast.warning('Please enter Student Name, Enrollment Number, and Email');
      return;
    }
    setManualSaving(true);
    try {
      const roll = manualForm.enrollmentNumber.trim().toUpperCase();
      const studentPayload = {
        name: manualForm.name.trim(),
        enrollmentNumber: roll,
        email: manualForm.email.trim(),
        department: manualForm.department,
        semester: manualForm.semester,
        section: manualForm.section,
        phoneNumber: manualForm.phoneNumber.trim() || '9876543210',
        username: manualForm.username.trim() || roll,
        password: manualForm.password.trim() || `Student@${roll}`,
      };
      
      await registrationAPI.importExcelStudents({ students: [studentPayload] });
      toast.success(`✅ Student ${roll} registered successfully into the database!`);
      setManualForm({
        name: '',
        enrollmentNumber: '',
        email: '',
        department: 'Computer Science',
        semester: '1-1',
        section: 'Section A',
        phoneNumber: '',
        username: '',
        password: ''
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register student manually');
    } finally {
      setManualSaving(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRes, statsRes] = await Promise.all([
        registrationAPI.getAllRegistrations(),
        registrationAPI.getRegistrationStats(),
      ]);
      setRegistrations(allRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (err) {
      toast.error('Failed to load student registration records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const q = search.toLowerCase();
      const matchesSearch =
        (r.name || '').toLowerCase().includes(q) ||
        (r.enrollmentNumber || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.username || '').toLowerCase().includes(q);

      const matchesDept = deptFilter === 'ALL' || r.department === deptFilter;
      const matchesSem  = semFilter === 'ALL' || r.semester === semFilter;

      return matchesSearch && matchesDept && matchesSem;
    });
  }, [registrations, search, deptFilter, semFilter]);

  // Copy registration link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(regUrl);
    toast.success('Registration URL copied to clipboard!');
  };

  // Export Registered Students to Excel (.xlsx)
  const handleExportExcel = () => {
    if (registrations.length === 0) {
      toast.warning('No student registrations available to export.');
      return;
    }

    const exportData = registrations.map((r, idx) => ({
      'S.No': idx + 1,
      'Student Name': r.name,
      'Enrollment Number': r.enrollmentNumber,
      'Email': r.email,
      'Mobile Number': r.phoneNumber || 'N/A',
      'Department': r.department,
      'Course': r.course || 'B.Tech',
      'Year': r.year || '1st Year',
      'Semester': r.semester || '1-1',
      'Section': r.section || 'Section A',
      'Username': r.username,
      'Registration Status': r.status,
      'Registered Date': r.createdAt ? r.createdAt.split('T')[0] : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered Students');

    // Auto-fit column widths
    const maxProps = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length + 4, 16)
    }));
    worksheet['!cols'] = maxProps;

    XLSX.writeFile(workbook, `CampusIQ_Student_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel spreadsheet generated and downloaded!');
  };

  // Parse Excel File on Client
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          toast.error('The selected file contains no data rows.');
          return;
        }

        // Header mapping
        const headers = rawJson[0].map(h => (h || '').toString().trim().toLowerCase());
        const rows = [];

        const findCol = (terms) => {
          for (let i = 0; i < headers.length; i++) {
            const h = headers[i];
            if (terms.some(t => h.includes(t))) return i;
          }
          return -1;
        };

        const nameIdx       = findCol(['name', 'student name', 'full name']);
        const enrollIdx     = findCol(['enroll', 'roll', 'reg', 'id']);
        const emailIdx      = findCol(['email', 'mail']);
        const phoneIdx      = findCol(['phone', 'mobile', 'contact']);
        const deptIdx       = findCol(['dept', 'department', 'branch']);
        const courseIdx     = findCol(['course', 'program']);
        const yearIdx       = findCol(['year']);
        const semIdx        = findCol(['sem', 'semester']);
        const secIdx        = findCol(['sec', 'section']);
        const userIdx       = findCol(['user', 'username']);
        const passIdx       = findCol(['pass', 'password']);

        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const name = nameIdx !== -1 ? (row[nameIdx] || '').toString().trim() : '';
          const enrollmentNumber = enrollIdx !== -1 ? (row[enrollIdx] || '').toString().trim().toUpperCase() : '';
          const email = emailIdx !== -1 ? (row[emailIdx] || '').toString().trim().toLowerCase() : '';

          // Skip completely blank rows
          if (!name && !enrollmentNumber && !email) continue;

          rows.push({
            name,
            enrollmentNumber,
            email,
            phoneNumber: phoneIdx !== -1 ? (row[phoneIdx] || '').toString().trim() : '',
            department: deptIdx !== -1 ? (row[deptIdx] || 'Computer Science').toString().trim() : 'Computer Science',
            course: courseIdx !== -1 ? (row[courseIdx] || 'B.Tech').toString().trim() : 'B.Tech',
            year: yearIdx !== -1 ? (row[yearIdx] || '1st Year').toString().trim() : '1st Year',
            semester: semIdx !== -1 ? (row[semIdx] || '1-1').toString().trim() : '1-1',
            section: secIdx !== -1 ? (row[secIdx] || 'Section A').toString().trim() : 'Section A',
            username: userIdx !== -1 && row[userIdx] ? (row[userIdx] || '').toString().trim() : enrollmentNumber.toLowerCase(),
            password: passIdx !== -1 && row[passIdx] ? (row[passIdx] || '').toString().trim() : `Student@${enrollmentNumber}`,
          });
        }

        if (rows.length === 0) {
          toast.error('Could not map any student rows. Please check column headers.');
          return;
        }

        setPreviewRows(rows);
        toast.info(`Parsed ${rows.length} student rows from ${file.name}. Ready to import.`);
      } catch (err) {
        toast.error('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Excel Imported Rows to Backend
  const handleExecuteImport = async () => {
    if (previewRows.length === 0) {
      toast.warning('No student records to import.');
      return;
    }

    setImporting(true);
    try {
      const res = await registrationAPI.importExcelStudents({ students: previewRows });
      const report = res.data.data;
      setImportReport(report);
      setReportOpen(true);
      setPreviewRows([]);
      setFileName('');
      loadData();
      toast.success(`Import complete! ${report.importedSuccessfully} students created.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Excel import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Student Registration Scanner & Excel Import"
        subtitle="Manage mobile QR code registrations, review submitted student records, export data, and batch import students via Excel"
        breadcrumbs={['Home', 'Admin', 'Student Scanner & Excel']}
      />

      {/* Top Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.1) }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textMuted }}>
                  TOTAL QR REGISTRATIONS
                </Typography>
                <QrCode2 sx={{ color: COLORS.primary }} />
              </Box>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: COLORS.primary }}>
                {stats?.total || registrations.length}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
                Students registered via QR scan
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.15) }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textMuted }}>
                  ACTIVE / READY
                </Typography>
                <CheckCircle sx={{ color: '#059669' }} />
              </Box>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>
                {stats?.registered || registrations.length}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
                Verified student accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.2) }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textMuted }}>
                  IMPORTED FROM EXCEL
                </Typography>
                <FileUpload sx={{ color: '#7c3aed' }} />
              </Box>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed' }}>
                {stats?.imported || 0}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
                Batch created from spreadsheets
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.25) }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textMuted }}>
                  ACTIONS QUICK BAR
                </Typography>
                <School sx={{ color: '#d97706' }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={handleExportExcel}
                  sx={{ borderRadius: 2, fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Export
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Print />}
                  onClick={() => setPosterOpen(true)}
                  sx={{ borderRadius: 2, fontSize: '0.72rem', fontWeight: 700, background: COLORS.gradBlue }}
                >
                  QR Poster
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Navigation */}
      <Card sx={{ borderRadius: 3.5, border: `1px solid ${COLORS.borderLight}`, ...anim.fadeInUp(0.3) }}>
        <Box sx={{ borderBottom: `1px solid ${COLORS.borderLight}`, px: 2, pt: 1 }}>
          <Tabs
            value={tabIndex}
            onChange={(e, val) => setTabIndex(val)}
            sx={{
              '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.9rem', minHeight: 48 },
              '& .Mui-selected': { color: `${COLORS.primary} !important` }
            }}
          >
            <Tab icon={<QrCode2 sx={{ fontSize: 20 }} />} iconPosition="start" label="1. QR Code Generator" />
            <Tab icon={<School sx={{ fontSize: 20 }} />} iconPosition="start" label={`2. Registered Students (${registrations.length})`} />
            <Tab icon={<Person sx={{ fontSize: 20 }} />} iconPosition="start" label="3. Enter Student Manually" />
            <Tab icon={<FileUpload sx={{ fontSize: 20 }} />} iconPosition="start" label="4. Import from Excel" />
          </Tabs>
        </Box>

        {/* TAB 0: QR CODE GENERATOR & POSTER */}
        {tabIndex === 0 && (
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Grid container spacing={4} alignItems="center">
              {/* QR Code Preview Box */}
              <Grid item xs={12} md={5} sx={{ textAlign: 'center' }}>
                <Paper sx={{
                  p: 3,
                  display: 'inline-block',
                  borderRadius: 4,
                  bgcolor: '#ffffff',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                  border: '2px solid #eff6ff',
                }}>
                  <QRCodeSVG
                    value={regUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 1.5 }}>
                    Scan to Open Student Registration
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block' }}>
                    Works on any smartphone camera
                  </Typography>
                </Paper>
              </Grid>

              {/* QR Configuration & Tools */}
              <Grid item xs={12} md={7}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>
                  Student Onboarding QR Code
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 3 }}>
                  Share or display this QR code at campus registration desks, orientation events, or student notices. Scanning opens the mobile registration portal.
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Student Registration URL (Configurable for LAN / Mobile Wi-Fi)"
                  value={regUrl}
                  onChange={e => setRegUrl(e.target.value)}
                  helperText="Tip for Mobile Scanning: If testing from a phone on the same Wi-Fi, change 'localhost' to your computer's local IP (e.g. http://192.168.x.x:3000/register/student)"
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Copy Link">
                          <IconButton onClick={handleCopyLink} edge="end">
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Quick URL Presets */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Presets:</Typography>
                  <Chip
                    size="small"
                    label="Localhost (Port 3000)"
                    onClick={() => setRegUrl(`http://localhost:3000/register/student`)}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={`Origin (${window.location.hostname || 'localhost'})`}
                    onClick={() => setRegUrl(`${window.location.origin}/register/student`)}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label="Alternative Route (/scan-register)"
                    onClick={() => setRegUrl(`${window.location.origin}/scan-register`)}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopy />}
                    onClick={handleCopyLink}
                    sx={{ borderRadius: 2.5, fontWeight: 700, background: COLORS.gradBlue }}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => setPosterOpen(true)}
                    sx={{ borderRadius: 2.5, fontWeight: 700 }}
                  >
                    Printable Poster
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={handleExportExcel}
                    sx={{ borderRadius: 2.5, fontWeight: 700 }}
                  >
                    Export All to Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* TAB 1: REGISTERED STUDENTS DIRECTORY */}
        {tabIndex === 1 && (
          <CardContent sx={{ p: 0 }}>
            {/* Search and Filters */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${COLORS.borderLight}` }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, roll no, email, or username..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: COLORS.textMuted }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3.5}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Department"
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Departments</MenuItem>
                    {DEPARTMENTS.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3.5}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Semester"
                    value={semFilter}
                    onChange={e => setSemFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Semesters</MenuItem>
                    {SEMESTERS.map(s => (
                      <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {/* Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : filteredRegistrations.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <School sx={{ fontSize: 44, color: COLORS.textMuted, mb: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>No registered students found.</Typography>
                <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.5 }}>
                  Students registering via the QR Code form will show up here in real-time.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.78rem', py: 1.5 } }}>
                      <TableCell sx={{ minWidth: 160 }}>Student Name</TableCell>
                      <TableCell sx={{ minWidth: 110 }}>Enrollment No</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Email</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>Department</TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Sem / Sec</TableCell>
                      <TableCell sx={{ minWidth: 110 }}>Username</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                      <TableCell sx={{ minWidth: 110 }}>Registered On</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRegistrations.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: '#eff6ff', color: COLORS.primary, fontSize: '0.75rem', fontWeight: 700 }}>
                              {r.name?.[0] || 'S'}
                            </Avatar>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: COLORS.textPrimary }}>
                              {r.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: COLORS.primary, fontSize: '0.82rem' }}>
                          {r.enrollmentNumber}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: COLORS.textMuted }}>
                          {r.email}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {r.department}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Sem {r.semester || '1-1'} ({r.section || 'A'})
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          {r.username}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.status || 'REGISTERED'}
                            size="small"
                            sx={{
                              bgcolor: r.status === 'IMPORTED' ? '#ede9fe' : '#ecfdf5',
                              color: r.status === 'IMPORTED' ? '#6d28d9' : '#047857',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem', color: COLORS.textMuted }}>
                          {r.createdAt ? r.createdAt.split('T')[0] : 'Today'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}

        {/* TAB 2: ENTER STUDENT MANUALLY */}
        {tabIndex === 2 && (
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>
                ✍️ Enter Student Details Manually
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                Directly register an individual student into the institution database without requiring mobile QR code scanning or Excel spreadsheet uploads.
              </Typography>
            </Box>

            <Paper sx={{ p: 3.5, borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, bgcolor: '#ffffff' }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Student Full Name"
                    placeholder="e.g. Rahul Sharma"
                    value={manualForm.name}
                    onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Enrollment / Roll Number"
                    placeholder="e.g. 24CS005"
                    value={manualForm.enrollmentNumber}
                    onChange={e => setManualForm(p => ({ ...p, enrollmentNumber: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Official Email Address"
                    placeholder="e.g. rahul.sharma@campusiq.edu"
                    value={manualForm.email}
                    onChange={e => setManualForm(p => ({ ...p, email: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Phone Number"
                    placeholder="e.g. 9876543210"
                    value={manualForm.phoneNumber}
                    onChange={e => setManualForm(p => ({ ...p, phoneNumber: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Department"
                    value={manualForm.department}
                    onChange={e => setManualForm(p => ({ ...p, department: e.target.value }))}
                  >
                    {DEPARTMENTS.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Current Semester"
                    value={manualForm.semester}
                    onChange={e => setManualForm(p => ({ ...p, semester: e.target.value }))}
                  >
                    {SEMESTERS.map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Assigned Section"
                    value={manualForm.section}
                    onChange={e => setManualForm(p => ({ ...p, section: e.target.value }))}
                  >
                    <MenuItem value="Section A">Section A</MenuItem>
                    <MenuItem value="Section B">Section B</MenuItem>
                    <MenuItem value="Section C">Section C</MenuItem>
                    <MenuItem value="Section D">Section D</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Portal Username (Optional)"
                    placeholder="Leave blank to use Roll Number"
                    value={manualForm.username}
                    onChange={e => setManualForm(p => ({ ...p, username: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Initial Password (Optional)"
                    placeholder="Default: Student@{RollNumber}"
                    value={manualForm.password}
                    onChange={e => setManualForm(p => ({ ...p, password: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setManualForm({
                    name: '', enrollmentNumber: '', email: '', department: 'Computer Science',
                    semester: '1-1', section: 'Section A', phoneNumber: '', username: '', password: ''
                  })}
                  sx={{ borderRadius: 2.5, fontWeight: 700 }}
                >
                  Clear Fields
                </Button>
                <Button
                  variant="contained"
                  disabled={manualSaving}
                  onClick={handleManualSubmit}
                  startIcon={manualSaving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                  sx={{ background: COLORS.gradBlue, borderRadius: 2.5, px: 3.5, fontWeight: 700 }}
                >
                  {manualSaving ? 'Saving to Database...' : 'Register Student Now'}
                </Button>
              </Box>
            </Paper>
          </CardContent>
        )}

        {/* TAB 3: IMPORT STUDENTS FROM EXCEL */}
        {tabIndex === 3 && (
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>
                Bulk Import Students from Excel Spreadsheet
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                Upload `.xlsx`, `.xls`, or `.csv` files. The system will automatically map column headers (`Student Name`, `Enrollment Number`, `Email`, `Department`, `Semester`, `Section`, `Username`, `Password`), detect duplicates, and create student accounts.
              </Typography>
            </Box>

            {/* Dropzone / Upload Box */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed #93c5fd',
                borderRadius: 4,
                p: 4,
                textAlign: 'center',
                bgcolor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#eff6ff', borderColor: COLORS.primary }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <FileUpload sx={{ fontSize: 48, color: COLORS.primary, mb: 1.5 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: '1.05rem' }}>
                {fileName ? fileName : 'Click to Upload or Drag & Drop Excel File'}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.5 }}>
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
              </Typography>
            </Box>

            {/* Preview of Parsed Rows */}
            {previewRows.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: COLORS.textPrimary }}>
                    Parsed Preview ({previewRows.length} Student Rows Detected)
                  </Typography>
                  <Button
                    variant="contained"
                    disabled={importing}
                    onClick={handleExecuteImport}
                    startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                    sx={{ background: COLORS.gradBlue, borderRadius: 2.5, fontWeight: 700 }}
                  >
                    {importing ? 'Importing Accounts...' : `Create ${previewRows.length} Student Accounts`}
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 3, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.75rem' } }}>
                        <TableCell>#</TableCell>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Enrollment No</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Sem / Sec</TableCell>
                        <TableCell>Username</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewRows.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.name}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: COLORS.primary, fontSize: '0.8rem' }}>{row.enrollmentNumber}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }}>{row.email}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }}>{row.department}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }}>{row.semester} ({row.section})</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{row.username}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        )}
      </Card>

      {/* IMPORT REPORT MODAL */}
      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', borderBottom: `1px solid ${COLORS.borderLight}`, pb: 1.5 }}>
          Excel Import Validation & Processing Report
        </DialogTitle>
        <DialogContent sx={{ py: 2.5 }}>
          {importReport && (
            <Box>
              {/* Metrics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textMuted }}>TOTAL ROWS</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.textPrimary }}>{importReport.totalRecords}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#ecfdf5', borderRadius: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857' }}>IMPORTED</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669' }}>{importReport.importedSuccessfully}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fffbeb', borderRadius: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309' }}>DUPLICATES</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#d97706' }}>{importReport.duplicateRecords || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#b91c1c' }}>INVALID</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#dc2626' }}>{importReport.invalidRecords || 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Errors List */}
              {importReport.errors && importReport.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#b91c1c', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorOutline fontSize="small" /> Failed Records ({importReport.errors.length})
                  </Typography>
                  <Paper sx={{ border: '1px solid #fecaca', borderRadius: 2.5, maxHeight: 180, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#fef2f2', fontWeight: 700, fontSize: '0.75rem' } }}>
                          <TableCell>Row</TableCell>
                          <TableCell>Identifier</TableCell>
                          <TableCell>Validation Issue / Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importReport.errors.map((err, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Row {err.row}</TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{err.enrollmentNumber || err.name || 'N/A'}</TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', color: '#b91c1c' }}>{err.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.borderLight}` }}>
          <Button variant="contained" onClick={() => setReportOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINTABLE QR POSTER DIALOG */}
      <Dialog
        open={posterOpen}
        onClose={() => setPosterOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ border: '3px solid #2563eb', borderRadius: 4, p: 4, bgcolor: '#ffffff' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, mb: 0.5, letterSpacing: '-0.02em' }}>
              CampusIQ<span style={{ color: '#f59e0b' }}>+</span>
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>
              Student Registration Portal
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 3 }}>
              Scan the QR code below with your mobile phone to complete student onboarding
            </Typography>

            <Box sx={{ p: 2, bgcolor: '#f8fafc', display: 'inline-block', borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, mb: 3 }}>
              <QRCodeSVG
                value={regUrl}
                size={240}
                level="H"
                includeMargin={true}
              />
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
              {regUrl}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} sx={{ background: COLORS.gradBlue, borderRadius: 2.5, fontWeight: 700 }}>
            Print Poster
          </Button>
          <Button variant="outlined" onClick={() => setPosterOpen(false)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

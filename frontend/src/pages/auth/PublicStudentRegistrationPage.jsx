import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  MenuItem, Alert, CircularProgress, InputAdornment, IconButton,
  Divider, Container, Paper, Avatar, Stepper, Step, StepLabel,
  Stack, Chip
} from '@mui/material';
import {
  School, Person, Email, Phone, Badge, Lock, Visibility,
  VisibilityOff, CheckCircle, ArrowForward, Login, ArrowBack,
  MarkEmailRead, Timer, Refresh, ShieldOutlined, AccountCircle,
  Domain, Class, CalendarMonth
} from '@mui/icons-material';
import { registrationAPI } from '../../services/api';
import { COLORS } from '../../theme/theme';
import { anim } from '../../theme/animations';
import vvituLogo from '../../assets/vvitu-logo.png';

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics',
  'Mechanical Engineering', 'Civil Engineering', 'Electrical & Electronics',
  'Mathematics', 'Physics', 'Humanities & Sciences'
];

const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D'];
const BATCH_YEARS = ['2026-2030', '2025-2029', '2024-2028', '2023-2027', '2022-2026'];

const STEPS = ['Student Information', 'Email OTP Verification', 'Account Activated'];

export default function PublicStudentRegistrationPage() {
  const navigate = useNavigate();

  // Active step in registration flow: 0 = Info Form, 1 = OTP Verification, 2 = Success
  const [activeStep, setActiveStep] = useState(0);

  const [form, setForm] = useState({
    name: '',
    enrollmentNumber: '',
    email: '',
    phoneNumber: '',
    department: 'Computer Science',
    course: 'B.Tech Computer Science & Engineering',
    year: '1st Year',
    semester: '1-1',
    section: 'Section A',
    batchYear: '2025-2029',
    dateOfBirth: '',
    gender: 'Male',
    guardianName: '',
    guardianPhone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [infoMessage,  setInfoMessage]  = useState('');

  // OTP Verification state
  const [otpCode,      setOtpCode]      = useState('');
  const [emailSent,    setEmailSent]    = useState(false);
  const [syncedOtp,    setSyncedOtp]    = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successData,  setSuccessData]  = useState(null);

  // Timer countdowns for OTP expiry and resend cooldown
  useEffect(() => {
    let timer = null;
    if (activeStep === 1 && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeStep, otpExpiresIn]);

  useEffect(() => {
    let cooldownTimer = null;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (field, value) => {
    setError('');
    let val = value;
    // Auto-normalize Roll Number
    if (field === 'enrollmentNumber') {
      val = value.trim().toUpperCase();
    }
    // Auto-normalize email
    if (field === 'email') {
      val = value.trim().toLowerCase();
    }
    setForm(prev => ({ ...prev, [field]: val }));
  };

  // Validate official @vvit.net domain
  const isOfficialEmail = (email) => {
    const em = (email || '').trim().toLowerCase();
    return em.endsWith('@vvit.net') || em.endsWith('@vvitu.net');
  };

  // Stage 1: Submit Registration Details and Request OTP
  const handleInitiateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const normRoll = (form.enrollmentNumber || '').trim().toUpperCase();
    const normEmail = (form.email || '').trim().toLowerCase();

    // Validations
    if (!form.name.trim()) {
      setError('Please enter your full name as officially registered with the college.');
      return;
    }
    if (!normRoll) {
      setError('Official Roll Number / Enrollment Number is required.');
      return;
    }
    if (!normEmail) {
      setError('Official College Email address is required.');
      return;
    }
    if (!isOfficialEmail(normEmail)) {
      setError('Official registration requires your institutional email ending with @vvit.net. Personal emails (Gmail, Yahoo, etc.) are strictly rejected.');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        enrollmentNumber: normRoll,
        email: normEmail,
        phoneNumber: form.phoneNumber ? form.phoneNumber.trim() : '',
        department: form.department,
        course: form.course,
        year: form.year,
        semester: form.semester,
        section: form.section,
        batchYear: form.batchYear,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim(),
        address: form.address.trim(),
        password: form.password,
      };

      const res = await registrationAPI.initiateRegistration(payload);
      const data = res.data?.data || {};
      setEmailSent(Boolean(data.emailSent));
      if (data.otpCode) {
        setSyncedOtp(String(data.otpCode));
      }
      setInfoMessage(res.data?.message || 'Verification code sent to your official email!');
      setActiveStep(1);
      setOtpExpiresIn(600); // 10 minutes
      setResendCooldown(25); // 25s cooldown before resend
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration initiation failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: Verify OTP and Complete Account Activation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!otpCode || otpCode.trim().length === 0) {
      setError('Please enter the 6-digit verification code received in your college email.');
      return;
    }

    setLoading(true);
    try {
      const res = await registrationAPI.completeRegistration({
        enrollmentNumber: form.enrollmentNumber.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        otp: otpCode.trim(),
      });

      const data = res.data?.data || {};
      setSuccessData({
        name: data.name || form.name,
        enrollmentNumber: data.enrollmentNumber || form.enrollmentNumber.toUpperCase(),
        username: data.username || form.enrollmentNumber.toUpperCase(),
        email: data.email || form.email.toLowerCase(),
        department: data.department || form.department,
        course: data.course || form.course,
        year: data.year || form.year,
        semester: data.semester || form.semester,
        section: data.section || form.section,
        batchYear: data.batchYear || form.batchYear,
      });
      setActiveStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP. Please verify and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await registrationAPI.resendOtp({
        enrollmentNumber: form.enrollmentNumber.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
      });
      const data = res.data?.data || {};
      setEmailSent(Boolean(data.emailSent));
      if (data.otpCode) {
        setSyncedOtp(String(data.otpCode));
      }
      setInfoMessage(res.data?.message || 'A fresh verification OTP has been sent to your email.');
      setOtpExpiresIn(600);
      setResendCooldown(30);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      py: { xs: 3, sm: 6 },
      px: { xs: 2, sm: 3 },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Container maxWidth="md">
        {/* Header Branding */}
        <Box sx={{ textAlign: 'center', mb: 3.5, ...anim.fadeInUp(0.05) }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 1.5,
            bgcolor: '#ffffff',
            px: 3,
            py: 1.2,
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              p: 0.2
            }}>
              <Box component="img" src={vvituLogo} alt="VVITU Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                VVITU <span style={{ color: COLORS.primary }}>ERP</span> Registration
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', display: 'block' }}>
                Vasireddy Venkatadri Int. Tech. University
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: COLORS.textMuted, maxWidth: 540, mx: 'auto' }}>
            Official Student Onboarding &amp; Identity Verification Portal. Register using your institution-assigned Roll Number and official college email.
          </Typography>
        </Box>

        {/* Stepper Progress */}
        <Card sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          px: { xs: 1.5, sm: 3 },
          py: 2
        }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: COLORS.primary },
                      '&.Mui-completed': { color: '#059669' }
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>

        {/* ======================================================== */}
        {/* STEP 2: REGISTRATION SUCCESS CARD                         */}
        {/* ======================================================== */}
        {activeStep === 2 && successData && (
          <Card sx={{
            borderRadius: 4,
            border: `1px solid ${COLORS.borderLight}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            textAlign: 'center',
            p: { xs: 2.5, sm: 4 },
            ...anim.fadeInUp(0.1)
          }}>
            <Avatar sx={{
              bgcolor: '#ecfdf5',
              color: '#059669',
              width: 76,
              height: 76,
              mx: 'auto',
              mb: 2,
              border: '2px solid #a7f3d0'
            }}>
              <CheckCircle sx={{ fontSize: 48 }} />
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.textPrimary, mb: 0.5 }}>
              Student Account Activated!
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 3 }}>
              Welcome, <strong>{successData.name}</strong>! Your official VVITU ERP student identity is verified and active.
            </Typography>

            <Paper sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: `1px solid ${COLORS.borderLight}`, mb: 3, textAlign: 'left' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.textMuted, display: 'block', mb: 1.5, letterSpacing: '0.04em' }}>
                PERMANENT ACADEMIC IDENTITY CREDENTIALS
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">Roll Number / Enrollment:</Typography>
                  <Typography variant="body2" fontWeight={800} color={COLORS.primary}>{successData.enrollmentNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">Portal Login Username:</Typography>
                  <Typography variant="body2" fontWeight={800}>{successData.username}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">Official Email:</Typography>
                  <Typography variant="body2" fontWeight={700}>{successData.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">Department:</Typography>
                  <Typography variant="body2" fontWeight={700}>{successData.department}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">Current Year / Semester:</Typography>
                  <Typography variant="body2" fontWeight={700}>{successData.year} &bull; Semester {successData.semester}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" display="block">Class Section &amp; Batch:</Typography>
                  <Typography variant="body2" fontWeight={700}>{successData.section} ({successData.batchYear || '2025-2029'})</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5, textAlign: 'left', fontWeight: 600 }}>
              Your account has been granted automatic access to the Student Portal. Relevant department faculty and administrators have been synchronized.
            </Alert>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              endIcon={<Login />}
              sx={{
                background: COLORS.gradBlue,
                borderRadius: 3,
                py: 1.6,
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
              }}
            >
              Proceed to Student Login
            </Button>
          </Card>
        )}

        {/* ======================================================== */}
        {/* STEP 1: EMAIL OTP VERIFICATION SCREEN                     */}
        {/* ======================================================== */}
        {activeStep === 1 && (
          <Card sx={{
            borderRadius: 4,
            border: `1px solid ${COLORS.borderLight}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            ...anim.fadeInUp(0.15)
          }}>
            <Box sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              borderBottom: `1px solid ${COLORS.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldOutlined sx={{ color: COLORS.primary }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: COLORS.textPrimary }}>
                  Email Identity Verification
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => { setActiveStep(0); setError(''); setInfoMessage(''); }}
                startIcon={<ArrowBack fontSize="small" />}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Back to Edit
              </Button>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: '#eff6ff',
                color: COLORS.primary,
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                border: '2px solid #bfdbfe'
              }}>
                <MarkEmailRead sx={{ fontSize: 36 }} />
              </Avatar>

              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>
                Verify Official College Email
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 2 }}>
                We sent a 6-digit verification code to:
              </Typography>

              <Chip
                label={form.email}
                icon={<Email fontSize="small" />}
                sx={{ fontWeight: 800, px: 1, py: 2, fontSize: '0.9rem', bgcolor: '#eff6ff', color: COLORS.primary, mb: 2 }}
              />

              {/* Sync Status Banner */}
              {emailSent ? (
                <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5, textAlign: 'left', fontWeight: 600 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    Official Email Dispatched
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Verification code has been sent to <strong>{form.email}</strong>. Please check your Outlook inbox or spam folder.
                  </Typography>
                  {syncedOtp && (
                    <Button
                      size="small"
                      onClick={() => setOtpCode(syncedOtp)}
                      sx={{ mt: 1, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', color: '#047857' }}
                    >
                      Instant Auto-Fill: {syncedOtp}
                    </Button>
                  )}
                </Alert>
              ) : syncedOtp ? (
                <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2.5, textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#b45309' }}>
                    Mail Server Offline / Unconfigured Credentials
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                    SMTP email dispatch could not reach external inbox. Your Instant-Sync verification code has been synchronized directly with the database:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fef3c7', p: 1.5, borderRadius: 2, border: '1px dashed #f59e0b' }}>
                    <Typography variant="h6" sx={{ letterSpacing: '0.25em', fontWeight: 900, color: '#92400e', fontFamily: 'monospace' }}>
                      {syncedOtp}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setOtpCode(syncedOtp)}
                      sx={{
                        bgcolor: '#d97706',
                        '&:hover': { bgcolor: '#b45309' },
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        borderRadius: 1.5,
                        px: 1.5
                      }}
                    >
                      ⚡ Auto-Fill Code
                    </Button>
                  </Box>
                </Alert>
              ) : null}

              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, textAlign: 'left', fontWeight: 600 }}>
                  {error}
                </Alert>
              )}

              {infoMessage && !emailSent && !syncedOtp && (
                <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5, textAlign: 'left', fontWeight: 600 }}>
                  {infoMessage}
                </Alert>
              )}

              <Box component="form" onSubmit={handleVerifyOtp} sx={{ maxWidth: 380, mx: 'auto' }}>
                <TextField
                  required
                  fullWidth
                  autoFocus
                  label="Enter 6-Digit OTP"
                  placeholder="e.g. 870512"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em', fontWeight: 800 }
                  }}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: otpExpiresIn > 60 ? COLORS.textMuted : '#ef4444' }}>
                    <Timer fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Expires in: {formatTimer(otpExpiresIn)}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    startIcon={<Refresh fontSize="small" />}
                    sx={{ fontWeight: 700 }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </Button>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || otpCode.length < 6}
                  sx={{
                    background: COLORS.gradBlue,
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 800,
                    fontSize: '1rem',
                    boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Activate Account'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ======================================================== */}
        {/* STEP 0: INITIAL REGISTRATION FORM                         */}
        {/* ======================================================== */}
        {activeStep === 0 && (
          <Card sx={{
            borderRadius: 4,
            border: `1px solid ${COLORS.borderLight}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            ...anim.fadeInUp(0.15)
          }}>
            <Box sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              borderBottom: `1px solid ${COLORS.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School sx={{ color: COLORS.primary }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: COLORS.textPrimary }}>
                  Step 1: Student Information &amp; Academic Segregation
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => navigate('/login')}
                startIcon={<Login fontSize="small" />}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Already Registered? Login
              </Button>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleInitiateSubmit}>
                <Grid container spacing={2.5}>
                  {/* Full Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label="Full Student Name"
                      placeholder="e.g. Alex Johnson"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Enrollment Number / Roll Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label="Enrollment / Roll Number"
                      placeholder="e.g. 23BQ1A1268"
                      value={form.enrollmentNumber}
                      onChange={e => handleChange('enrollmentNumber', e.target.value)}
                      helperText="Normalized to uppercase; serves as your permanent login ID"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Badge sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Official College Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      type="email"
                      label="Official College Email (@vvit.net)"
                      placeholder="23bq1a1268@vvit.net"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      error={form.email.length > 0 && !isOfficialEmail(form.email)}
                      helperText={
                        form.email.length > 0 && !isOfficialEmail(form.email)
                          ? "Must be your institutional Outlook account ending with @vvit.net"
                          : "Used for 2-stage verification & portal access"
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Mobile Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Mobile Number"
                      placeholder="e.g. +91 9848012345"
                      value={form.phoneNumber}
                      onChange={e => handleChange('phoneNumber', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Academic Segregation Divider */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 0.5 }}>
                      <Chip label="ACADEMIC SEGREGATION &amp; CLASS ALLOCATION" size="small" sx={{ fontWeight: 800, fontSize: '0.75rem', bgcolor: '#f1f5f9' }} />
                    </Divider>
                  </Grid>

                  {/* Department */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Department"
                      value={form.department}
                      onChange={e => handleChange('department', e.target.value)}
                    >
                      {DEPARTMENTS.map(d => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Course / Program */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Course / Program"
                      placeholder="e.g. B.Tech Information Technology"
                      value={form.course}
                      onChange={e => handleChange('course', e.target.value)}
                    />
                  </Grid>

                  {/* Batch Year */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Batch Year"
                      value={form.batchYear}
                      onChange={e => handleChange('batchYear', e.target.value)}
                    >
                      {BATCH_YEARS.map(b => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Year of Study */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Year of Study"
                      value={form.year}
                      onChange={e => handleChange('year', e.target.value)}
                    >
                      {YEARS.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Semester */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Semester"
                      value={form.semester}
                      onChange={e => handleChange('semester', e.target.value)}
                    >
                      {SEMESTERS.map(s => (
                        <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Section */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Section"
                      value={form.section}
                      onChange={e => handleChange('section', e.target.value)}
                    >
                      {SECTIONS.map(sec => (
                        <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Personal & Guardian Information Divider */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 0.5 }}>
                      <Chip label="PERSONAL &amp; GUARDIAN INFORMATION" size="small" sx={{ fontWeight: 800, fontSize: '0.75rem', bgcolor: '#f1f5f9' }} />
                    </Divider>
                  </Grid>

                  {/* Date of Birth */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date of Birth"
                      placeholder="YYYY-MM-DD"
                      value={form.dateOfBirth}
                      onChange={e => handleChange('dateOfBirth', e.target.value)}
                    />
                  </Grid>

                  {/* Gender */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Gender"
                      value={form.gender}
                      onChange={e => handleChange('gender', e.target.value)}
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Guardian Name */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Father / Guardian Name"
                      placeholder="e.g. Robert Johnson"
                      value={form.guardianName}
                      onChange={e => handleChange('guardianName', e.target.value)}
                    />
                  </Grid>

                  {/* Guardian Contact */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Guardian Phone Number"
                      placeholder="e.g. +91 9848012345"
                      value={form.guardianPhone}
                      onChange={e => handleChange('guardianPhone', e.target.value)}
                    />
                  </Grid>

                  {/* Address */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Residential Address"
                      placeholder="City, State"
                      value={form.address}
                      onChange={e => handleChange('address', e.target.value)}
                    />
                  </Grid>

                  {/* Security Credentials Divider */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 0.5 }}>
                      <Chip label="PORTAL PASSWORD SECURITY" size="small" sx={{ fontWeight: 800, fontSize: '0.75rem', bgcolor: '#f1f5f9' }} />
                    </Divider>
                  </Grid>

                  {/* Password */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      type={showPassword ? 'text' : 'password'}
                      label="Choose Portal Password"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={e => handleChange('password', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: COLORS.textMuted, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Confirm Password */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      size="small"
                      type={showPassword ? 'text' : 'password'}
                      label="Confirm Portal Password"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={e => handleChange('confirmPassword', e.target.value)}
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      endIcon={<ArrowForward />}
                      sx={{
                        background: COLORS.gradBlue,
                        borderRadius: 3,
                        py: 1.6,
                        fontWeight: 800,
                        fontSize: '1rem',
                        boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Email OTP Verification'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

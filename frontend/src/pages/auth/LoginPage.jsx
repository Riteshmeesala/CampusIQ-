import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LockOutlined, PersonOutline, School, AdminPanelSettings,
  SupervisorAccount, AutoAwesome, AccountBalance, Close,
  Visibility, VisibilityOff
} from '@mui/icons-material';

const DASH = {
  ADMIN: '/admin/dashboard',
  FACULTY: '/faculty/dashboard',
  STUDENT: '/student/dashboard',
};

const STAKEHOLDERS = [
  { role: 'STUDENT', label: 'Student', icon: <School sx={{ fontSize: 18 }} />, placeholder: 'Enter Student Roll No / Email (e.g. 24CS001)' },
  { role: 'FACULTY', label: 'Faculty', icon: <SupervisorAccount sx={{ fontSize: 18 }} />, placeholder: 'Enter Faculty ID / Email (e.g. faculty_raj)' },
  { role: 'ADMIN', label: 'Admin', icon: <AdminPanelSettings sx={{ fontSize: 18 }} />, placeholder: 'Enter Admin Username (e.g. admin)' },
];

const DEFAULT_CREDS = {
  ADMIN: { username: 'admin', password: 'Admin@123' },
  FACULTY: { username: 'faculty_raj', password: 'Admin@123' },
  STUDENT: { username: '24CS001', password: 'Student@123' },
};

export default function LoginPage() {
  const navigate = useNavigate();
  useLocation();
  const { login, verifyOtp, pendingEmail, user, isAuthenticated, loading } = useAuth();

  const [activeStakeholder, setActiveStakeholder] = useState('STUDENT');
  const [step, setStep] = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [form, setForm] = useState(DEFAULT_CREDS.STUDENT);
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpUser, setOtpUser] = useState(pendingEmail || '');

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(DASH[user.role] || '/', { replace: true });
      return;
    }

    // Auto-load remembered credentials for the last active or default stakeholder
    const lastRole = localStorage.getItem('campusiq_last_role') || 'STUDENT';
    setActiveStakeholder(lastRole);
    const saved = localStorage.getItem(`campusiq_remembered_${lastRole}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.username) {
          setForm({ username: parsed.username || '', password: parsed.password || '' });
          setRememberMe(true);
          return;
        }
      } catch (err) {
        // ignore JSON parse error
      }
    }
    setForm(DEFAULT_CREDS[lastRole] || DEFAULT_CREDS.STUDENT);
  }, [loading, isAuthenticated, user, navigate]);

  const handleStakeholderChange = (role) => {
    setActiveStakeholder(role);
    setError('');
    localStorage.setItem('campusiq_last_role', role);
    const saved = localStorage.getItem(`campusiq_remembered_${role}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.username) {
          setForm({ username: parsed.username || '', password: parsed.password || '' });
          setRememberMe(true);
          return;
        }
      } catch (e) {}
    }
    setForm(DEFAULT_CREDS[role] || { username: '', password: '' });
  };

  const currentStakeholder = STAKEHOLDERS.find(s => s.role === activeStakeholder) || STAKEHOLDERS[0];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Enter username and password');
      return;
    }
    setBusy(true);
    setError('');

    // Save or clear credentials based on Remember Me
    if (rememberMe) {
      localStorage.setItem('campusiq_last_role', activeStakeholder);
      localStorage.setItem(`campusiq_remembered_${activeStakeholder}`, JSON.stringify({
        username: form.username.trim(),
        password: form.password
      }));
    } else {
      localStorage.removeItem(`campusiq_remembered_${activeStakeholder}`);
    }

    try {
      const result = await login(form.username.trim(), form.password);
      if (result.twoFactorRequired) {
        setOtpUser(form.username.trim());
        setStep('otp');
        setAlertMsg('OTP sent to your registered institutional email.');
        return;
      }
      const dest = DASH[result.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || 'Invalid username or password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await verifyOtp(otpUser, otp);
      const dest = DASH[result.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Background Geometric Accent Orbs */}
      <div style={{
        position: 'absolute',
        width: 340,
        height: 340,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00d2b4, #0284c7)',
        top: '12%',
        right: '27%',
        zIndex: 1,
        opacity: 0.95
      }} />

      <div style={{
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: '50%',
        backgroundColor: '#9b8edc',
        bottom: '10%',
        left: '25%',
        zIndex: 1,
        opacity: 0.95
      }} />

      <div style={{
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: '50%',
        backgroundColor: '#00d2b4',
        bottom: '36%',
        left: '20%',
        zIndex: 1
      }} />

      <div style={{
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: '#0284c7',
        top: '36%',
        right: '20%',
        zIndex: 1
      }} />

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 440,
        margin: '20px',
        boxSizing: 'border-box'
      }}>
        {/* Institutional & Project Header Banner */}
        <div style={{
          textAlign: 'center',
          marginBottom: 16
        }}>
          {/* Brand Logo & Name */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#ffffff',
            padding: '8px 20px',
            borderRadius: 30,
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: 8
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <AccountBalance sx={{ fontSize: 19 }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.1,
                letterSpacing: '-0.3px'
              }}>
                CampusIQ<span style={{ color: '#0284c7' }}>+</span>
              </div>
              <div style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                AI Campus Intelligence Platform
              </div>
            </div>
            <div style={{
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              border: '1px solid #dbeafe'
            }}>
              <AutoAwesome sx={{ fontSize: 11 }} /> AI
            </div>
          </div>
        </div>

        {/* Clear White Login Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05)',
          border: '1px solid #e2e8f0',
          padding: '32px 30px 24px',
          boxSizing: 'border-box'
        }}>
          {/* Top Lock Security Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 14
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '2px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
              backgroundColor: '#ecfeff'
            }}>
              <LockOutlined sx={{ fontSize: 22, color: '#06b6d4' }} />
            </div>
          </div>

          {/* Title */}
          <h2 style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 6px',
            letterSpacing: '-0.3px'
          }}>
            {currentStakeholder.label} Login
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#64748b',
            margin: '0 0 16px',
          }}>
            Select your stakeholder portal to access your dashboard
          </p>

          {/* 3 Stakeholders Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: 4,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            marginBottom: 18,
            gap: 4
          }}>
            {STAKEHOLDERS.map((stk) => {
              const isSelected = activeStakeholder === stk.role;
              return (
                <button
                  key={stk.role}
                  type="button"
                  onClick={() => handleStakeholderChange(stk.role)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#0284c7' : '#64748b',
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: isSelected ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {stk.icon}
                  <span>{stk.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dismissible Status / Alert Bar */}
          {alertMsg && !error && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: 6,
              padding: '8px 12px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#1d4ed8',
              fontSize: 12,
              fontWeight: 500
            }}>
              <span>{alertMsg}</span>
              <button
                type="button"
                onClick={() => setAlertMsg('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#1d4ed8',
                  padding: 0,
                  display: 'flex'
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              padding: '8px 12px',
              marginBottom: 16,
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          {step === 'login' ? (
            <form onSubmit={handleLogin} method="POST">
              {/* Username / Roll No Input */}
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  backgroundColor: '#eef2ff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <PersonOutline sx={{ fontSize: 18, color: '#64748b', marginRight: '8px' }} />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder={currentStakeholder.placeholder}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    autoComplete="username"
                    required
                    style={{
                      width: '100%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      outline: 'none',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  backgroundColor: '#eef2ff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  <LockOutlined sx={{ fontSize: 18, color: '#64748b', marginRight: '8px' }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                    required
                    style={{
                      width: '100%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      outline: 'none',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#0f172a',
                      letterSpacing: showPwd ? 'normal' : '1.5px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: 0,
                      display: 'flex'
                    }}
                  >
                    {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 18,
                fontSize: 12.5,
                color: '#475569'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: '#0099ff',
                      cursor: 'pointer',
                      width: 15,
                      height: 15
                    }}
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Vibrant Blue Login Button */}
              <button
                type="submit"
                disabled={busy}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#0099ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.75 : 1,
                  boxShadow: '0 4px 12px rgba(0, 153, 255, 0.3)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {busy ? 'Authenticating...' : 'Login'}
              </button>

              {/* Quick Login Stakeholder Chips */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, textAlign: 'center' }}>
                  Quick Fill Stakeholder
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { role: 'ADMIN', label: 'Admin', icon: '🛡️', un: 'admin' },
                    { role: 'FACULTY', label: 'Faculty', icon: '👨‍🏫', un: 'faculty_raj' },
                    { role: 'STUDENT', label: 'Student', icon: '🎓', un: '24CS001' }
                  ].map((s) => (
                    <button
                      key={s.role}
                      type="button"
                      onClick={() => {
                        handleStakeholderChange(s.role);
                        setForm(DEFAULT_CREDS[s.role]);
                      }}
                      style={{
                        padding: '6px 4px',
                        fontSize: 11.5,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: activeStakeholder === s.role ? '1.5px solid #0099ff' : '1px solid #cbd5e1',
                        backgroundColor: activeStakeholder === s.role ? '#eff6ff' : '#f8fafc',
                        color: activeStakeholder === s.role ? '#0284c7' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <span>{s.icon} {s.label}</span>
                      <span style={{ fontSize: 9.5, color: '#64748b' }}>({s.un})</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* OTP Form */
            <form onSubmit={handleOtp}>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                Enter the 6-digit verification OTP sent to your registered institutional account.
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: 8,
                  fontSize: 22,
                  fontWeight: 800,
                  padding: '10px',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  marginBottom: 16,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={busy}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#0099ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {busy ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div style={{
            marginTop: 18,
            textAlign: 'center'
          }}>
            <button
              type="button"
              onClick={() => setAlertMsg('Password reset instructions have been sent to your administrator.')}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 6,
                display: 'inline-block'
              }}
            >
              Forgot Your Password?
            </button>
            <div style={{
              fontSize: 11.5,
              color: '#94a3b8',
              marginTop: 2
            }}>
              © 2026 — CampusIQ+ Smart Campus Intelligence Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

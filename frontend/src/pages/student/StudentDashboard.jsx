import {
  ArrowForward,
  BarChart,
  CalendarMonth, Payment,
  TrendingUp,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button, Card, CardContent,
  Chip,
  Grid,
  Typography
} from '@mui/material';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title, Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import AttendanceBar from '../../components/shared/AttendanceBar';
import PageHeader from '../../components/shared/PageHeader';
import PerformanceBadge from '../../components/shared/PerformanceBadge';
import StatCard from '../../components/shared/StatCard';
import { useAuth } from '../../context/AuthContext';
import { aiAPI, attendanceAPI, feeAPI, gpaAPI, notifAPI, resultAPI, academicRecordAPI } from '../../services/api';
import { getSharedStudentCgpa, subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { COLORS, getAttColor, getPerfColor } from '../../theme/theme';
import { anim, shimmerBg } from '../../theme/animations';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler,
  Title, Tooltip, Legend
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.studentId || user?.id;

  const [attendance,      setAttendance]      = useState(null);
  const [results,         setResults]         = useState([]);
  const [fees,            setFees]            = useState([]);
  const [notifs,          setNotifs]          = useState([]);
  const [aiData,          setAiData]          = useState(null);
  const [gpa,             setGpa]             = useState(null);
  const [academicProfile, setAcademicProfile] = useState(null);
  const [loading,         setLoading]         = useState(true);

  const loadDashboardData = () => {
    if (!studentId) return;
    Promise.allSettled([
      attendanceAPI.getMyAttendance(),
      resultAPI.getMyResults(),
      feeAPI.getMyFees(),
      gpaAPI.getMyGpa(),
      notifAPI.getUnread(),
      aiAPI.getMyPerformance(),
      academicRecordAPI.getMyRecords(),
    ]).then(([att, res, fee, gpaRes, ntf, ai, acad]) => {
      let liveAcademicData = null;
      if (acad.status === 'fulfilled') {
        liveAcademicData = acad.value.data?.data || null;
        setAcademicProfile(liveAcademicData);
      }

      if (att.status === 'fulfilled') {
        const records = att.value.data.data || [];
        const byCourse = {};
        records.forEach(r => {
          const code = r.course?.courseCode || 'UNK';
          const name = r.course?.courseName || code;
          if (!byCourse[code]) byCourse[code] = { subjectCode: code, subjectName: name, present: 0, total: 0 };
          byCourse[code].total++;
          if (r.status === 'PRESENT' || r.status === 'LATE') byCourse[code].present++;
        });
        const subjects = Object.values(byCourse).map(s => ({
          ...s,
          percentage: s.total ? (s.present/s.total)*100 : 0,
          classesNeededFor75: Math.max(0, Math.ceil((0.75 * s.total - s.present) / 0.25)),
        }));
        const totalPresent = subjects.reduce((s,x) => s+x.present, 0);
        const totalClasses = subjects.reduce((s,x) => s+x.total, 0);
        setAttendance({ 
          overallPercentage: totalClasses > 0 ? (totalPresent/totalClasses)*100 : 0,
          totalPresent, totalClasses, subjectBreakdown: subjects
        });
      }
      if (res.status === 'fulfilled') setResults(res.value.data.data || []);
      if (fee.status === 'fulfilled') setFees(fee.value.data.data || []);
      if (ntf.status === 'fulfilled') {
        const unreadList = ntf.value.data?.data || [];
        setNotifs(Array.isArray(unreadList) ? unreadList : []);
      }
      if (gpaRes.status === 'fulfilled') setGpa(gpaRes.value.data.data);
      if (ai.status  === 'fulfilled') {
        const raw = ai.value.data.data;
        setAiData(raw ? {
          ...raw,
          averageMarksPercentage: parseFloat(raw.overallPercentage || 0),
          overallAttendance: parseFloat(raw.attendancePercentage || 0),
          performanceCategory: raw.performanceCategory,
        } : null);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('focus', loadDashboardData);
    const unsubscribe = subscribeToDataSync(() => {
      loadDashboardData();
    });
    return () => {
      window.removeEventListener('focus', loadDashboardData);
      unsubscribe();
    };
  }, [studentId, user]);

  // Determine current active semester from student or default to '1-1'
  const userSem = user?.semester ? String(user.semester) : '1-1';
  const activeSemKey = academicProfile?.semesterRecords?.[userSem] ? userSem : '1-1';
  const liveSubjects = academicProfile?.semesterRecords?.[activeSemKey] || [];
  const currentSemSummary = academicProfile?.semesterSummaries?.[activeSemKey] || null;

  // Live CGPA & SGPA from unified single source of truth
  const sharedCgpaEntry = getSharedStudentCgpa(studentId);
  const liveCgpa = sharedCgpaEntry?.cgpa || academicProfile?.overallCgpa || currentSemSummary?.cgpa || gpa?.cgpa || 8.5;
  const liveSgpa = sharedCgpaEntry?.sgpa || currentSemSummary?.sgpa || gpa?.sgpa || 8.5;

  // Live average marks calculation from database
  const liveAvgMarks = liveSubjects.length > 0
    ? (liveSubjects.reduce((s, r) => s + (r.totalMarks ? parseFloat(r.totalMarks) : 0), 0) / liveSubjects.length)
    : (results.length ? (results.reduce((s, r) => s + (r.percentage ? parseFloat(r.percentage) : 0), 0) / results.length) : 85);

  // Live overall attendance
  const liveAttendancePct = currentSemSummary?.attendancePercentage
    ? parseFloat(currentSemSummary.attendancePercentage)
    : (attendance?.overallPercentage || 88.5);

  const pendingFees = fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE');

  // Bar chart — marks per subject (uses live subjects from database)
  const barData = {
    labels: liveSubjects.length > 0
      ? liveSubjects.slice(0, 8).map(s => s.subjectCode)
      : results.slice(0, 8).map(r => r.exam?.course?.courseCode || r.exam?.examName || 'N/A'),
    datasets: [{
      label: 'Marks (Total / 100)',
      data: liveSubjects.length > 0
        ? liveSubjects.slice(0, 8).map(s => Math.round(parseFloat(s.totalMarks || 0)))
        : results.slice(0, 8).map(r => Math.round(parseFloat(r.percentage || 0))),
      backgroundColor: (liveSubjects.length > 0 ? liveSubjects.slice(0, 8) : results.slice(0, 8)).map(item => {
        const p = parseFloat(item.totalMarks || item.percentage || 0);
        return `${getPerfColor(p)}cc`;
      }),
      borderRadius: 10, borderSkipped: false,
    }]
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { max: 100, min: 0, grid: { color: '#f1f5f908' }, ticks: { font: { size: 11, family: 'Inter' } } },
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' } } }
    }
  };

  // Radar chart — subject attendance
  const subj = liveSubjects.length > 0
    ? liveSubjects.slice(0, 6).map(s => ({ subjectCode: s.subjectCode, percentage: parseFloat(s.attendancePercentage || 85) }))
    : (attendance?.subjectBreakdown?.slice(0, 6) || []);

  const radarData = {
    labels: subj.map(s => s.subjectCode || s.subjectName),
    datasets: [{
      label: 'Attendance %',
      data: subj.map(s => s.percentage),
      backgroundColor: `${COLORS.secondary}18`,
      borderColor: COLORS.secondary, pointBackgroundColor: COLORS.secondary,
      borderWidth: 2, pointRadius: 4,
    }]
  };
  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { size: 10, family: 'Inter' } } } },
    plugins: { legend: { display: false } }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Shimmer welcome bar */}
        <Box sx={{ height: 80, borderRadius: 4, ...shimmerBg }} />
        <Grid container spacing={2.5}>
          {[1,2,3,4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Box sx={{ height: 140, borderRadius: 4, ...shimmerBg }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <Box sx={{ height: 300, borderRadius: 4, ...shimmerBg }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ height: 300, borderRadius: 4, ...shimmerBg }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome banner */}
      <Box sx={{
        mb: 3, p: 3, borderRadius: 4,
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 60%, ${COLORS.secondaryLight} 100%)`,
        position: 'relative', overflow: 'hidden',
        ...anim.fadeInUp(0),
      }}>
        <Box sx={{
          position: 'absolute', top: -30, right: -30, width: 150, height: 150,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -20, right: 60, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(245,158,11,0.08)',
        }} />
        <Typography variant="h5" sx={{
          color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', position: 'relative',
        }}>
          Welcome back, {user?.name?.split(' ')[0] || user?.username} 👋
        </Typography>
        <Typography sx={{
          color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', mt: 0.5, position: 'relative',
        }}>
          Here's your academic overview for today
        </Typography>
      </Box>

      {/* Critical alerts */}
      {notifs.filter(n => n.type === 'ATTENDANCE' || n.type === 'AI_ALERT').slice(0, 2).map((n, i) => (
        <Alert
          key={n.id}
          severity={n.type === 'AI_ALERT' ? 'error' : 'warning'}
          sx={{ mb: 1.5, ...anim.fadeInUp(0.1 + i * 0.05) }}
          icon={<Warning fontSize="small" />}
        >
          {n.message}
        </Alert>
      ))}

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp />}
            label="Cumulative CGPA"
            value={Number(liveCgpa || 8.5).toFixed(2)}
            sub={`Sem ${activeSemKey} SGPA: ${Number(liveSgpa || 8.5).toFixed(2)}`}
            color={COLORS.secondary}
            index={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CalendarMonth />}
            label="Attendance"
            value={`${Number(liveAttendancePct || 88.5).toFixed(1)}%`}
            sub={liveAttendancePct >= 75 ? '✅ Above 75%' : '⚠️ Below 75%'}
            color={getAttColor(liveAttendancePct || 88.5)}
            index={1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<BarChart />}
            label="Avg Marks"
            value={`${Number(liveAvgMarks || 85).toFixed(1)}%`}
            sub={`Grade: ${liveAvgMarks >= 90 ? 'S' : liveAvgMarks >= 80 ? 'A' : liveAvgMarks >= 70 ? 'B' : liveAvgMarks >= 60 ? 'C' : liveAvgMarks >= 50 ? 'D' : liveAvgMarks >= 40 ? 'E' : 'F'}`}
            color={getPerfColor(liveAvgMarks || 85)}
            index={2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Payment />}
            label="Pending Fees"
            value={pendingFees.length}
            sub={pendingFees.length > 0 ? 'Action required' : 'All cleared ✅'}
            color={pendingFees.length > 0 ? COLORS.critical : COLORS.excellent}
            index={3}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          {/* Charts row */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={7}>
              <Card sx={{ height: 300, ...anim.fadeInUp(0.25) }}>
                <CardContent sx={{ height: '100%', pb: '16px !important' }}>
                  <Typography variant="h6" fontWeight={700} mb={1.5} sx={{ letterSpacing: '-0.01em' }}>
                    Marks by Subject
                  </Typography>
                  {results.length > 0
                    ? <Box sx={{ height: 220 }}><Bar data={barData} options={barOpts} /></Box>
                    : <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary" variant="body2">No results yet</Typography>
                      </Box>
                  }
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Card sx={{ height: 300, ...anim.fadeInUp(0.3) }}>
                <CardContent sx={{ height: '100%', pb: '16px !important' }}>
                  <Typography variant="h6" fontWeight={700} mb={1.5} sx={{ letterSpacing: '-0.01em' }}>
                    Attendance Radar
                  </Typography>
                  {subj.length > 0
                    ? <Box sx={{ height: 220 }}><Radar data={radarData} options={radarOpts} /></Box>
                    : <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary" variant="body2">No data</Typography>
                      </Box>
                  }
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Attendance breakdown */}
          <Card sx={{ mb: 2.5, ...anim.fadeInUp(0.35) }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                  Attendance by Subject
                </Typography>
                <Button size="small" endIcon={<ArrowForward fontSize="small" />}
                  onClick={() => navigate('/student/attendance')}
                  sx={{ fontSize: '0.8rem', borderRadius: 2 }}>View all</Button>
              </Box>
              {attendance?.subjectBreakdown?.length > 0
                ? attendance.subjectBreakdown.map(s => (
                    <AttendanceBar
                      key={s.subjectCode}
                      subjectName={s.subjectName}
                      subjectCode={s.subjectCode}
                      percentage={s.percentage}
                      present={s.present}
                      total={s.total}
                      classesNeeded={s.classesNeededFor75}
                    />
                  ))
                : <Typography color="text.secondary" variant="body2" textAlign="center" py={3}>No attendance data</Typography>
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* Performance badge */}
          {aiData && (
            <Card sx={{ mb: 2.5, ...anim.fadeInUp(0.2) }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2} sx={{ letterSpacing: '-0.01em' }}>
                  AI Performance
                </Typography>
                <PerformanceBadge percentage={aiData.averageMarksPercentage || liveAvgMarks} />
                <Box sx={{
                  mt: 2, p: 1.5, borderRadius: 3,
                  bgcolor: aiData.riskLevel === 'HIGH' ? COLORS.criticalBg
                         : aiData.riskLevel === 'MEDIUM' ? COLORS.moderateBg : COLORS.greenBg,
                  border: `1px solid ${aiData.riskLevel === 'HIGH' ? COLORS.critical
                         : aiData.riskLevel === 'MEDIUM' ? COLORS.moderate : COLORS.excellent}15`,
                }}>
                  <Typography variant="caption" fontWeight={700} sx={{
                    color: aiData.riskLevel === 'HIGH' ? COLORS.critical
                          : aiData.riskLevel === 'MEDIUM' ? COLORS.moderate : COLORS.excellent
                  }}>
                    Risk Level: {aiData.riskLevel}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" mt={0.3}>
                    Predicted SGPA: {aiData.predictedSgpa?.toFixed(2) || '—'}
                  </Typography>
                </Box>
                <Button
                  fullWidth variant="outlined" endIcon={<ArrowForward fontSize="small" />}
                  onClick={() => navigate('/student/ai-insights')}
                  sx={{ mt: 2, borderRadius: 3, fontSize: '0.8rem' }}
                >
                  View Full Analysis
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card sx={{ mb: 2.5, ...anim.fadeInUp(0.3) }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ letterSpacing: '-0.01em' }}>
                Quick Actions
              </Typography>
              {[
                { icon: '📊', label: 'View Results', path: '/student/results', color: COLORS.secondary },
                { icon: '💳', label: 'Pay Fees', path: '/student/fees', color: COLORS.accent, badge: pendingFees.length },
                { icon: '🗓️', label: 'Exam Schedule', path: '/student/exams', color: COLORS.primary },
                { icon: '🤖', label: 'AI Study Plan', path: '/student/study-plan', color: COLORS.excellent },
                { icon: '💬', label: 'Grok AI Chat', path: '/chatbot', color: '#7c3aed' },
              ].map((a, i) => (
                <Box
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderRadius: 3, cursor: 'pointer', mb: 0.5,
                    transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                    '&:hover': {
                      bgcolor: `${a.color}08`,
                      transform: 'translateX(6px)',
                      '& .action-icon': { transform: 'scale(1.15)' },
                    },
                  }}
                >
                  <Typography className="action-icon" fontSize="1.2rem"
                    sx={{ transition: 'transform 0.2s ease' }}>{a.icon}</Typography>
                  <Typography variant="body2" fontWeight={600} color={COLORS.textPrimary} flex={1}>{a.label}</Typography>
                  {a.badge > 0 && (
                    <Chip label={a.badge} size="small" sx={{
                      background: COLORS.gradDanger, color: '#fff',
                      height: 20, fontSize: '0.7rem', fontWeight: 700,
                    }} />
                  )}
                  <ArrowForward sx={{ fontSize: 14, color: COLORS.textMuted, transition: 'transform 0.2s' }} />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Notifications */}
          {notifs.length > 0 && (
            <Card sx={{ ...anim.fadeInUp(0.4) }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={1.5} sx={{ letterSpacing: '-0.01em' }}>
                  Notifications
                </Typography>
                {notifs.slice(0, 4).map((n, i) => (
                  <Box key={n.id} sx={{
                    p: 1.5, borderRadius: 3, mb: 1,
                    bgcolor: n.type === 'ATTENDANCE' ? COLORS.atRiskBg
                           : n.type === 'AI_ALERT'   ? COLORS.criticalBg : COLORS.bgBase,
                    border: `1px solid ${n.type === 'ATTENDANCE' ? COLORS.atRisk + '20'
                           : n.type === 'AI_ALERT' ? COLORS.critical + '20' : COLORS.border}`,
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'translateX(4px)' },
                  }}>
                    <Typography variant="caption" fontWeight={700} color={COLORS.textPrimary}>{n.title}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.3 }}>
                      {n.message.slice(0, 70)}{n.message.length > 70 ? '...' : ''}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
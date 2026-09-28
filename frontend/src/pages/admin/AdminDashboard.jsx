import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Box, Card, CardContent, Typography, Chip, Table, Button,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Avatar
} from '@mui/material';
import { People, School, Payment, Visibility, Groups, ArrowForward } from '@mui/icons-material';
import { userAPI, examAPI, feeAPI } from '../../services/api';
import { subscribeToDataSync } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import { COLORS } from '../../theme/theme';
import { anim, stagger, shimmerBg } from '../../theme/animations';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students,    setStudents]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [exams,        setExams]        = useState([]);
  const [pendingFees,  setPendingFees]  = useState(0);
  const [loading,      setLoading]      = useState(true);

  const loadAdminData = () => {
    Promise.allSettled([
      userAPI.getStudents(),
      userAPI.getStats(),
      examAPI.getUpcoming(),
      feeAPI.getAllFees(),
    ]).then(([stu, st, ex, fees]) => {
      if (stu.status === 'fulfilled')  setStudents(stu.value.data.data || []);
      if (st.status === 'fulfilled')   setStats(st.value.data.data);
      if (ex.status === 'fulfilled')   setExams(ex.value.data.data || []);
      if (fees.status === 'fulfilled') {
        const allFees = fees.value.data.data || [];
        setPendingFees(allFees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE').length);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAdminData();
    window.addEventListener('focus', loadAdminData);
    const unsub = subscribeToDataSync(() => {
      loadAdminData();
    });
    return () => {
      window.removeEventListener('focus', loadAdminData);
      unsub();
    };
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ height: 60, borderRadius: 4, ...shimmerBg }} />
      <Grid container spacing={2.5}>
        {[1,2,3,4].map(i => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Box sx={{ height: 140, borderRadius: 4, ...shimmerBg }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const totalStudents = stats?.totalStudents || students.length;
  const totalFaculty  = stats?.totalFaculty  || 0;

  return (
    <Box>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome, ${user?.name} — Complete system overview`}
        breadcrumbs={['Home','Admin Dashboard']}
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { icon:<People />,  label:'Total Students', value: totalStudents,  color: COLORS.secondary },
          { icon:<Groups />,  label:'Faculty Members', value: totalFaculty,  color: COLORS.primary },
          { icon:<School />,  label:'Upcoming Exams',  value: exams.length,  color: COLORS.excellent },
          { icon:<Payment />, label:'Pending Fees',    value: pendingFees,   color: pendingFees > 0 ? COLORS.critical : COLORS.accent },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}><StatCard {...s} index={i} /></Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Students Table */}
        <Grid item xs={12} md={8}>
          <Card sx={anim.fadeInUp(0.2)}>
            <CardContent>
              <Box sx={{ display:'flex', justifyContent:'space-between', mb:2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>All Students</Typography>
                <Button size="small" endIcon={<Visibility fontSize="small" />} onClick={() => navigate('/admin/students')}
                  sx={{ color: COLORS.secondary, borderRadius: 2 }}>View All</Button>
              </Box>
              <TableContainer sx={{ borderRadius: 3, border: `1px solid ${COLORS.borderLight}` }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Name','Enrollment','Department','Email','Status'].map(h => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.slice(0,8).map((s, i) => (
                      <TableRow key={i} hover sx={{ cursor:'pointer' }} onClick={() => navigate(`/admin/students/${s.id}`)}>
                        <TableCell>
                          <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                            <Box sx={{
                              p: '1.5px', borderRadius: '50%',
                              background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.secondaryLight})`,
                            }}>
                              <Avatar sx={{ width:28, height:28, bgcolor: '#fff', color: COLORS.secondary, fontSize:11, fontWeight: 700 }}>
                                {s.name?.[0]}
                              </Avatar>
                            </Box>
                            <Typography variant="body2" sx={{ fontSize:12, fontWeight: 600 }}>{s.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize:11, fontFamily: "'JetBrains Mono', monospace", color: COLORS.textMuted }}>
                          {s.enrollmentNumber}
                        </TableCell>
                        <TableCell sx={{ fontSize:11 }}>{s.department}</TableCell>
                        <TableCell sx={{ fontSize:11 }}>{s.email}</TableCell>
                        <TableCell>
                          <Chip label={s.active ? 'Active' : 'Inactive'} size="small"
                            sx={{ fontSize:10, fontWeight: 700,
                              bgcolor: s.active ? COLORS.excellentBg : '#fee2e2',
                              color: s.active ? COLORS.excellent : COLORS.critical }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb:2.5, ...anim.fadeInUp(0.25) }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ letterSpacing: '-0.01em' }}>Quick Actions</Typography>
              {[
                { label:'Manage Students', path:'/admin/students', color: COLORS.secondary, icon: '👥' },
                { label:'QR Registration & Excel Import', path:'/admin/student-scanner', color: COLORS.primary, icon: '📱' },
                { label:'Academic & Marks Manager', path:'/admin/academic-records', color: COLORS.primary, icon: '📊' },
                { label:'Manage Faculty',  path:'/admin/faculty',  color: COLORS.primary, icon: '👨‍🏫' },
                { label:'Faculty Subject Allocation', path:'/admin/faculty-assignments', color: COLORS.secondary, icon: '📚' },
                { label:'View All Exams',  path:'/student/exams',  color: COLORS.excellent, icon: '📝' },
                { label:'Fee Management',  path:'/student/fees',   color: COLORS.accent, icon: '💰' },
                { label:'Publish CGPA',    path:'/admin/publish-cgpa', color: COLORS.excellent, icon: '🎓' },
              ].map((btn, i) => (
                <Box key={i} onClick={() => navigate(btn.path)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderRadius: 3, cursor: 'pointer', mb: 0.5,
                    border: `1px solid ${COLORS.borderLight}`,
                    transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                    '&:hover': {
                      bgcolor: `${btn.color}06`, borderColor: `${btn.color}25`,
                      transform: 'translateX(4px)',
                    },
                  }}>
                  <Typography fontSize="1.1rem">{btn.icon}</Typography>
                  <Typography variant="body2" fontWeight={600} flex={1}>{btn.label}</Typography>
                  <ArrowForward sx={{ fontSize: 14, color: COLORS.textMuted }} />
                </Box>
              ))}
            </CardContent>
          </Card>
          <Card sx={anim.fadeInUp(0.3)}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ letterSpacing: '-0.01em' }}>
                Upcoming Exams ({exams.length})
              </Typography>
              {exams.slice(0,4).map((e, i) => (
                <Box key={i} sx={{
                  mb:1.5, pb:1.5, borderBottom: i < 3 ? `1px solid ${COLORS.borderLight}` : 'none',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateX(4px)' },
                }}>
                  <Typography variant="body2" fontWeight={600}>{e.examName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {e.course?.courseCode} • {e.scheduledDate?.split('T')[0]}
                  </Typography>
                </Box>
              ))}
              {exams.length === 0 && <Typography variant="body2" color="textSecondary">No upcoming exams</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

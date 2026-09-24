import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Badge,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Tooltip, Chip, Button, useMediaQuery, Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon, PeopleAltOutlined, CalendarMonthOutlined,
  PaymentOutlined, BarChartOutlined, PsychologyOutlined,
  ChatBubbleOutline, LogoutOutlined, Menu as MenuIcon, NotificationsOutlined,
  SchoolOutlined, AssessmentOutlined, AutoGraphOutlined,
  LibraryBooksOutlined, Close, PersonOutline, TrendingUpOutlined,
  CampaignOutlined, EventNoteOutlined, MenuBookOutlined,
  ScheduleOutlined, GradeOutlined, AccountBalanceOutlined, QrCode2Outlined,
  SearchOutlined, SpeedOutlined, WarningAmberOutlined,
  GroupOutlined, MenuBook, BusinessCenterOutlined, AssignmentOutlined,
  AutoStoriesOutlined, LocalLibraryOutlined, SupervisorAccountOutlined,
  EmojiEventsOutlined, ScienceOutlined, DescriptionOutlined,
  KeyboardArrowRight, ExpandMore, ArrowRight, FactCheckOutlined,
  PeopleOutline, AutoAwesome, Tune, BadgeOutlined,
  AccessTimeOutlined, PollOutlined, HotelOutlined, DirectionsBusOutlined,
  Inventory2Outlined, FlagOutlined, RateReviewOutlined, FileDownloadOutlined,
  WorkspacePremiumOutlined, AssignmentIndOutlined, QuestionAnswerOutlined,
  ReceiptLongOutlined, FolderOutlined, ErrorOutline
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { notifAPI } from '../../services/api';
import { COLORS } from '../../theme/theme';
import FloatingCampusBot from '../shared/FloatingCampusBot';

const DRAWER_W = 270;

function SidebarItem({ icon, label, path, active, onClick, hasSub, isOpen, isOrangeDashboard }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.2, px: 0.8 }}>
      <ListItemButton
        onClick={onClick}
        sx={{
          borderRadius: 1,
          py: 0.75,
          px: 1.5,
          bgcolor: isOrangeDashboard && active ? '#ea580c' : active ? '#eff6ff' : 'transparent',
          color: isOrangeDashboard && active ? '#ffffff' : active ? '#1d4ed8' : '#334155',
          '&:hover': {
            bgcolor: isOrangeDashboard && active ? '#ea580c' : active ? '#eff6ff' : '#f8fafc',
            color: isOrangeDashboard && active ? '#ffffff' : active ? '#1d4ed8' : '#0f172a',
            '& .MuiListItemIcon-root': {
              color: isOrangeDashboard && active ? '#ffffff' : '#2563eb',
            },
          },
          transition: 'all 0.12s ease',
        }}
      >
        <ListItemIcon sx={{
          minWidth: 32,
          color: isOrangeDashboard && active ? '#ffffff' : active ? '#2563eb' : '#64748b',
          '& svg': { fontSize: '1.2rem' }
        }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.8125rem',
            fontWeight: active ? 700 : 500,
            color: isOrangeDashboard && active ? '#ffffff' : active ? '#1d4ed8' : '#334155',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        />
        {hasSub && (
          isOpen ? (
            <ExpandMore sx={{ fontSize: 16, color: '#64748b' }} />
          ) : (
            <KeyboardArrowRight sx={{ fontSize: 16, color: '#94a3b8' }} />
          )
        )}
      </ListItemButton>
    </ListItem>
  );
}

function SubmenuItem({ label, active, onClick, hasSub }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.15, pl: 3.5, pr: 0.8 }}>
      <ListItemButton
        onClick={onClick}
        sx={{
          borderRadius: 1,
          py: 0.5,
          px: 1.2,
          bgcolor: active ? '#eff6ff' : 'transparent',
          color: active ? '#1d4ed8' : '#475569',
          '&:hover': {
            bgcolor: '#f1f5f9',
            color: '#0f172a',
            '& svg': { color: '#2563eb' }
          },
        }}
      >
        <ArrowRight sx={{ fontSize: 16, color: active ? '#2563eb' : '#94a3b8', mr: 0.75 }} />
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.78rem',
            fontWeight: active ? 700 : 500,
            color: active ? '#1d4ed8' : '#475569',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        />
        {hasSub && (
          <KeyboardArrowRight sx={{ fontSize: 14, color: '#94a3b8' }} />
        )}
      </ListItemButton>
    </ListItem>
  );
}

function SectionHeading({ title }) {
  return (
    <Typography
      sx={{
        px: 2,
        pt: 1.75,
        pb: 0.5,
        fontSize: '0.6875rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#94a3b8',
      }}
    >
      {title}
    </Typography>
  );
}

export default function AppLayout() {
  const { user, logout, isAdmin, isFaculty, isStudent } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const theme      = useTheme();
  const isMobile   = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Collapsible Submenu States
  const [profileExpanded, setProfileExpanded] = useState(location.pathname.startsWith('/faculty/profile'));
  const [attendanceExpanded, setAttendanceExpanded] = useState(location.pathname.startsWith('/student/attendance') || location.pathname.startsWith('/faculty/attendance'));
  const [dashboardsExpanded, setDashboardsExpanded] = useState(location.pathname.startsWith('/faculty/attendance-dashboards'));
  const [hrExpanded, setHrExpanded] = useState(location.pathname.startsWith('/faculty/human-resources'));
  const [academicsExpanded, setAcademicsExpanded] = useState(location.pathname.startsWith('/faculty/academics'));
  const [lessonPlanExpanded, setLessonPlanExpanded] = useState(location.pathname.startsWith('/faculty/lesson-plan'));
  const [impactExpanded, setImpactExpanded] = useState(location.pathname.startsWith('/faculty/impact-recognitions'));
  const [academicProjectsExpanded, setAcademicProjectsExpanded] = useState(location.pathname.startsWith('/faculty/academic-projects'));
  const [assignmentExpanded, setAssignmentExpanded] = useState(location.pathname.startsWith('/faculty/assignments'));
  const [studyMaterialExpanded, setStudyMaterialExpanded] = useState(location.pathname.startsWith('/faculty/study-material'));
  const [communicationExpanded, setCommunicationExpanded] = useState(location.pathname.startsWith('/faculty/communication'));
  const [libraryExpanded, setLibraryExpanded] = useState(location.pathname.startsWith('/faculty/library'));
  const [mentoringExpanded, setMentoringExpanded] = useState(location.pathname.startsWith('/faculty/student-mentoring'));
  const [resultReportsExpanded, setResultReportsExpanded] = useState(location.pathname.startsWith('/faculty/result-reports'));

  useEffect(() => {
    if (location.pathname.startsWith('/faculty/profile')) setProfileExpanded(true);
    if (location.pathname.startsWith('/student/attendance') || location.pathname.startsWith('/faculty/attendance')) setAttendanceExpanded(true);
    if (location.pathname.startsWith('/faculty/attendance-dashboards')) setDashboardsExpanded(true);
    if (location.pathname.startsWith('/faculty/human-resources')) setHrExpanded(true);
    if (location.pathname.startsWith('/faculty/academics')) setAcademicsExpanded(true);
    if (location.pathname.startsWith('/faculty/lesson-plan')) setLessonPlanExpanded(true);
    if (location.pathname.startsWith('/faculty/impact-recognitions')) setImpactExpanded(true);
    if (location.pathname.startsWith('/faculty/academic-projects')) setAcademicProjectsExpanded(true);
    if (location.pathname.startsWith('/faculty/assignments')) setAssignmentExpanded(true);
    if (location.pathname.startsWith('/faculty/study-material')) setStudyMaterialExpanded(true);
    if (location.pathname.startsWith('/faculty/communication')) setCommunicationExpanded(true);
    if (location.pathname.startsWith('/faculty/library')) setLibraryExpanded(true);
    if (location.pathname.startsWith('/faculty/student-mentoring')) setMentoringExpanded(true);
    if (location.pathname.startsWith('/faculty/result-reports')) setResultReportsExpanded(true);
  }, [location.pathname]);

  useEffect(() => {
    if (user?.id) {
      notifAPI.getUnreadCount()
        .then(r => {
          const data = r.data.data;
          setNotifCount(typeof data === 'number' ? data : (data?.count ?? data?.unread ?? 0));
        })
        .catch(() => {});
    }
  }, [user]);

  const queryParams = new URLSearchParams(location.search);
  const activeProfileTab = location.pathname === '/faculty/profile' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeAttendanceTab = (location.pathname === '/student/attendance' || location.pathname === '/faculty/attendance') ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeDashboardsTab = location.pathname === '/faculty/attendance-dashboards' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeHrTab = location.pathname === '/faculty/human-resources' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeAcademicsTab = location.pathname === '/faculty/academics' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeLessonPlanTab = location.pathname === '/faculty/lesson-plan' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeImpactTab = location.pathname === '/faculty/impact-recognitions' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeAcademicProjectsTab = location.pathname === '/faculty/academic-projects' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeAssignmentTab = location.pathname === '/faculty/assignments' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeStudyMaterialTab = location.pathname === '/faculty/study-material' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeCommunicationTab = location.pathname === '/faculty/communication' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeLibraryTab = location.pathname === '/faculty/library' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeMentoringTab = location.pathname === '/faculty/student-mentoring' ? parseInt(queryParams.get('tab') || '0', 10) : -1;
  const activeResultReportsTab = location.pathname === '/faculty/result-reports' ? parseInt(queryParams.get('tab') || '0', 10) : -1;

  const profileSubItems = [
    { label: 'Profile Info', tab: 0 },
    { label: 'Educational Info', tab: 1 },
    { label: 'Experience', tab: 2 },
    { label: 'Payroll', tab: 3 },
    { label: 'Bank Info', tab: 4 },
    { label: 'Documents', tab: 5 },
    { label: 'Research ID\'s', tab: 6 },
    { label: 'Expertise', tab: 7 },
    { label: 'Professional Body', tab: 8 },
    { label: 'Additional Qualification', tab: 9 },
    { label: 'Ph.D Status', tab: 10 },
  ];

  const attendanceSubItems = [
    { label: 'Mark Daily Attendance', tab: 0 },
    { label: 'Subject Wise Monthly Attendance Reports', tab: 1 },
    { label: 'Subject Wise Date Range Attendance Report', tab: 2 },
    { label: 'Date Range Attendance Reports', tab: 3 },
  ];

  const dashboardsSubItems = [
    { label: 'Students Master Attendance', tab: 0 },
    { label: 'Unmarked Attendance Monitoring', tab: 1 },
  ];

  const hrSubItems = [
    { label: 'Self Appraisal', tab: 0 },
    { label: 'Employee Attendance', tab: 1, hasSub: true },
    { label: 'Payroll Report', tab: 2 },
    { label: 'Employee Leaves', tab: 3 },
    { label: 'Apply Leave', tab: 4 },
    { label: 'Class Swap Approval', tab: 5 },
    { label: 'Self Leave Report', tab: 6 },
    { label: 'Consolidated Leave Report', tab: 7 },
    { label: 'Leave History Report', tab: 8 },
  ];

  const academicsSubItems = [
    { label: 'Timetable Automation', tab: 0 },
    { label: 'Faculty Availability', tab: 1 },
    { label: 'Faculty Workload', tab: 2 },
    { label: 'Faculty Time Tables', tab: 3 },
    { label: 'Master Settings', tab: 4, hasSub: true },
  ];

  const lessonPlanSubItems = [
    { label: 'Lesson Plan Logs', tab: 0 },
    { label: 'Create Lesson Plan Bulk Upload', tab: 1, hasSub: true },
    { label: 'Create Lesson Plan Manually', tab: 2, hasSub: true },
  ];

  const impactSubItems = [
    { label: 'Faculty Achievement', tab: 0, hasSub: true },
    { label: 'Governance & Administration', tab: 1, hasSub: true },
    { label: 'Teaching Improvements', tab: 2 },
    { label: 'Duties Performed', tab: 3 },
  ];

  const academicProjectsSubItems = [
    { label: 'Manage Academic Project', tab: 0 },
    { label: 'Master Settings', tab: 1, hasSub: true },
  ];

  const assignmentSubItems = [
    { label: 'Create Assignment', tab: 0 },
  ];

  const studyMaterialSubItems = [
    { label: 'Upload Study Material', tab: 0 },
  ];

  const communicationSubItems = [
    { label: 'College Calendar', tab: 0 },
    { label: 'Notice & Circulars', tab: 1 },
  ];

  const librarySubItems = [
    { label: 'Book Search', tab: 0 },
    { label: 'Issue Return', tab: 1 },
  ];

  const mentoringSubItems = [
    { label: 'Mentoring Schedule', tab: 0 },
    { label: 'Mentoring Session Remarks', tab: 1 },
    { label: 'Mentoring Reports', tab: 2, hasSub: true },
  ];

  const resultReportsSubItems = [
    { label: 'Internal Exam Results', tab: 0 },
    { label: 'Subject-Wise Result Report', tab: 1 },
  ];

  const studentSidebarSections = [
    {
      heading: null,
      items: [
        { icon: <DashboardIcon fontSize="small" />, label: 'Dashboard', path: '/student/dashboard', isOrange: true },
        { icon: <AutoGraphOutlined fontSize="small" />, label: 'AI Performance Insights', path: '/student/ai-insights' },
        { icon: <PsychologyOutlined fontSize="small" />, label: 'AI Study Plan Generator', path: '/student/study-plan' },
        { icon: <ChatBubbleOutline fontSize="small" />, label: 'Campus Intelligence AI', path: '/chatbot' },
      ]
    },
    {
      heading: 'Pages',
      items: [
        { icon: <CalendarMonthOutlined fontSize="small" />, label: 'Calendar', path: '/student/calendar' },
        { icon: <AccessTimeOutlined fontSize="small" />, label: 'Class Routine', path: '/student/class-routine' },
        { icon: <PollOutlined fontSize="small" />, label: 'Student Satisfaction Survey', path: '/student/satisfaction-survey' },
        { icon: <AssessmentOutlined fontSize="small" />, label: 'Course End Survey', path: '/student/course-end-survey' },
        { icon: <NotificationsOutlined fontSize="small" />, label: 'Exam Notification', path: '/student/exam-notifications' },
        { icon: <ChatBubbleOutline fontSize="small" />, label: 'Exam Routine', path: '/student/exam-routine' },
        { icon: <MenuBookOutlined fontSize="small" />, label: 'Exam Results', path: '/student/exam-results' },
        { icon: <BarChartOutlined fontSize="small" />, label: 'Monthly Attendance', path: '/student/monthly-attendance' },
        { icon: <MenuBookOutlined fontSize="small" />, label: 'Attendance Summary', path: '/student/attendance-summary' },
        { icon: <AssignmentIndOutlined fontSize="small" />, label: 'Student Counseller', path: '/student/counselor' },
        { icon: <EmojiEventsOutlined fontSize="small" />, label: 'Student Achievements', path: '/student/achievements' },
        { icon: <BusinessCenterOutlined fontSize="small" />, label: 'Student Internships', path: '/student/internships' },
        { icon: <DescriptionOutlined fontSize="small" />, label: 'Apply Leaves', path: '/student/apply-leaves' },
        { icon: <ErrorOutline fontSize="small" />, label: 'Warnings', path: '/student/warnings' },
        { icon: <FlagOutlined fontSize="small" />, label: 'Grievance', path: '/student/grievance' },
        { icon: <QuestionAnswerOutlined fontSize="small" />, label: 'My Approvals', path: '/student/my-approvals' },
        { icon: <LocalLibraryOutlined fontSize="small" />, label: 'Library', path: '/student/library' },
        { icon: <SearchOutlined fontSize="small" />, label: 'Library Book Search', path: '/student/library-search' },
        { icon: <MenuBook fontSize="small" />, label: 'Library New Book Arrivals', path: '/student/library-new-arrivals' },
        { icon: <ReceiptLongOutlined fontSize="small" />, label: 'Library Invoice Date Range Reports', path: '/student/library-invoices' },
        { icon: <HotelOutlined fontSize="small" />, label: 'Hostel', path: '/student/hostel' },
        { icon: <DescriptionOutlined fontSize="small" />, label: 'Notices', path: '/student/notices' },
        { icon: <PaymentOutlined fontSize="small" />, label: 'Fee Dues', path: '/student/fee-dues' },
        { icon: <AssignmentOutlined fontSize="small" />, label: 'Assignments', path: '/student/assignments' },
        { icon: <FolderOutlined fontSize="small" />, label: 'Project Details', path: '/student/project-details' },
        { icon: <DirectionsBusOutlined fontSize="small" />, label: 'Check My Bus', path: '/student/bus-tracking' },
        { icon: <Inventory2Outlined fontSize="small" />, label: 'YearBook', path: '/student/yearbook' },
        { icon: <SchoolOutlined fontSize="small" />, label: 'Placements', path: '/student/placements' },
        { icon: <CalendarMonthOutlined fontSize="small" />, label: 'Placements Calendar', path: '/student/placements-calendar' },
        { icon: <RateReviewOutlined fontSize="small" />, label: 'Feedback', path: '/student/feedback' },
        { icon: <FileDownloadOutlined fontSize="small" />, label: 'Download-Study Material', path: '/student/study-material' },
        { icon: <WorkspacePremiumOutlined fontSize="small" />, label: 'Transfer Certificate', path: '/student/transfer-certificate' },
        { icon: <WorkspacePremiumOutlined fontSize="small" />, label: 'Custodian Certificate', path: '/student/custodian-certificate' },
        { icon: <WorkspacePremiumOutlined fontSize="small" />, label: 'Study And Conduct Certificate', path: '/student/conduct-certificate' },
      ]
    }
  ];

  const adminNav = [
    { icon: <DashboardIcon fontSize="small" />,  label: 'Executive Dashboard', path: '/admin/dashboard' },
    { icon: <PeopleAltOutlined fontSize="small" />,  label: 'Student Records',     path: '/admin/students' },
    { icon: <AssessmentOutlined fontSize="small" />, label: 'Semester Final Marks Manager', path: '/admin/academic-records' },
    { icon: <QrCode2Outlined fontSize="small" />,    label: 'QR Registration & Excel Import', path: '/admin/student-scanner' },
    { icon: <SchoolOutlined fontSize="small" />,     label: 'Faculty Directory',   path: '/admin/faculty' },
    { icon: <BarChartOutlined fontSize="small" />,   label: 'Institutional Insights', path: '/student/ai-insights' },
    { icon: <PaymentOutlined fontSize="small" />,    label: 'Tuition & Billing',   path: '/student/fees' },
    { icon: <EventNoteOutlined fontSize="small" />,  label: 'Examination Registry',path: '/student/exams' },
    { icon: <GradeOutlined fontSize='small'/>,       label: 'GPA & CGPA Release',  path: '/admin/publish-cgpa' },
    { icon: <AssessmentOutlined fontSize="small" />, label: 'Publish Results',     path: '/admin/publish-results' },
    { icon: <CampaignOutlined fontSize="small" />,   label: 'Broadcast Email',     path: '/admin/broadcast-email' },
    { icon: <CampaignOutlined fontSize="small" />,   label: 'Campus Bulletins',    path: '/announcements' },
    { icon: <ChatBubbleOutline fontSize="small" />,  label: 'Campus Intelligence', path: '/chatbot' },
  ];

  // Faculty Full Categorized Navigation Matching Institutional ERP Screenshot
  const facultySidebarSections = [
    {
      heading: null,
      items: [
        { icon: <DashboardIcon fontSize="small" />, label: 'Dashboard', path: '/faculty/dashboard', isOrange: true },
        { icon: <SpeedOutlined fontSize="small" />, label: 'Advance Dashboard', path: '/faculty/advance-dashboard' },
        { icon: <SearchOutlined fontSize="small" />, label: 'Student Search', path: '/faculty/student-search' },
        {
          icon: <PersonOutline fontSize="small" />,
          label: 'My Profile',
          path: '/faculty/profile',
          hasSub: true,
          isProfileGroup: true
        },
      ]
    },
    {
      heading: 'Administration Management',
      items: [
        { icon: <SchoolOutlined fontSize="small" />, label: 'Student Enrollment & ..', path: '/admin/students', hasSub: true },
        {
          icon: <CalendarMonthOutlined fontSize="small" />,
          label: 'Students Attendance',
          path: '/student/attendance',
          hasSub: true,
          isAttendanceGroup: true
        },
        {
          icon: <AssessmentOutlined fontSize="small" />,
          label: 'Attendance Dashboards',
          path: '/faculty/attendance-dashboards',
          hasSub: true,
          isDashboardsGroup: true
        },
        { icon: <SchoolOutlined fontSize="small" />, label: 'Depts Professional Eve..', path: '/faculty/department-events', hasSub: true },
        { icon: <WarningAmberOutlined fontSize="small" />, label: 'Student Warnings', path: '/faculty/student-warnings', hasSub: true },
        {
          icon: <GroupOutlined fontSize="small" />,
          label: 'Human Resources',
          path: '/faculty/human-resources',
          hasSub: true,
          isHrGroup: true
        },
      ]
    },
    {
      heading: 'Fee Management',
      items: [
        { icon: <PaymentOutlined fontSize="small" />, label: 'Fee Management', path: '/student/fees', hasSub: true },
      ]
    },
    {
      heading: 'Academic Management',
      items: [
        {
          icon: <MenuBook fontSize="small" />,
          label: 'College Academics',
          path: '/faculty/academics',
          hasSub: true,
          isAcademicsGroup: true
        },
        {
          icon: <LibraryBooksOutlined fontSize="small" />,
          label: 'Faculty Lesson Plan',
          path: '/faculty/lesson-plan',
          hasSub: true,
          isLessonPlanGroup: true
        },
        {
          icon: <AutoGraphOutlined fontSize="small" />,
          label: 'Faculty Impact & Reco..',
          path: '/faculty/impact-recognitions',
          hasSub: true,
          isImpactGroup: true
        },
        { icon: <DescriptionOutlined fontSize="small" />, label: 'Academic Uploads', path: '/faculty/academic-uploads' },
        { icon: <AutoStoriesOutlined fontSize="small" />, label: 'VOV Magazine', path: '/faculty/vov-magazine' },
        { icon: <BusinessCenterOutlined fontSize="small" />, label: 'Student Internships', path: '/faculty/student-internships' },
        {
          icon: <SchoolOutlined fontSize="small" />,
          label: 'Student Academic Proj..',
          path: '/faculty/academic-projects',
          hasSub: true,
          isAcademicProjectsGroup: true
        },
        { icon: <AssignmentOutlined fontSize="small" />, label: 'Assign Task', path: '/faculty/assign-task' },
        {
          icon: <AssignmentOutlined fontSize="small" />,
          label: 'Assignment',
          path: '/faculty/assignments',
          hasSub: true,
          isAssignmentGroup: true
        },
        {
          icon: <MenuBookOutlined fontSize="small" />,
          label: 'Study Material',
          path: '/faculty/study-material',
          hasSub: true,
          isStudyMaterialGroup: true
        },
        {
          icon: <CampaignOutlined fontSize="small" />,
          label: 'Communication',
          path: '/faculty/communication',
          hasSub: true,
          isCommunicationGroup: true
        },
        {
          icon: <LocalLibraryOutlined fontSize="small" />,
          label: 'Library',
          path: '/faculty/library',
          hasSub: true,
          isLibraryGroup: true
        },
        {
          icon: <SupervisorAccountOutlined fontSize="small" />,
          label: 'Student Mentoring',
          path: '/faculty/student-mentoring',
          hasSub: true,
          isMentoringGroup: true
        },
        { icon: <EmojiEventsOutlined fontSize="small" />, label: 'Student Achievement', path: '/faculty/student-achievements', hasSub: true },
      ]
    },
    {
      heading: 'R&D Innovation',
      items: [
        { icon: <ScienceOutlined fontSize="small" />, label: 'R&D Innovation', path: '/faculty/rd-innovation', hasSub: true },
      ]
    },
    {
      heading: 'Post-Examination Management',
      items: [
        {
          icon: <BadgeOutlined fontSize="small" />,
          label: 'Result Reports',
          path: '/faculty/result-reports',
          hasSub: true,
          isResultReportsGroup: true
        },
      ]
    },
    {
      heading: 'Examination Module',
      items: [
        { icon: <DescriptionOutlined fontSize="small" />, label: 'Subjects & Curriculum', path: '/faculty/subjects-curriculum', hasSub: true },
        { icon: <AssessmentOutlined fontSize="small" />, label: 'Marks Ledger', path: '/admin/academic-records', hasSub: true },
        { icon: <AssessmentOutlined fontSize="small" />, label: 'Publish Marks / Results', path: '/faculty/publish-results' },
      ]
    }
  ];

  const DrawerContent = (
    <Box sx={{
      height: '100%',
      backgroundColor: '#ffffff',
      borderRight: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Brand Header */}
      <Box sx={{ px: 2.2, py: 2, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: `1px solid ${COLORS.border}` }}>
        <Box sx={{
          width: 34,
          height: 34,
          borderRadius: 1,
          backgroundColor: isFaculty ? '#ea580c' : '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: isFaculty ? '0 2px 8px rgba(234, 88, 12, 0.3)' : '0 2px 8px rgba(37, 99, 235, 0.3)'
        }}>
          <AccountBalanceOutlined sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{
            color: '#0f172a',
            fontWeight: 800,
            fontSize: '0.96rem',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}>
            CampusIQ<span style={{ color: isFaculty ? '#ea580c' : '#2563eb' }}>+</span>
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            {isFaculty ? 'FACULTY ERP SUITE' : isAdmin ? 'ADMINISTRATIVE ERP' : 'STUDENT ERP SUITE'}
          </Typography>
        </Box>
        {isMobile && (
          <IconButton sx={{ color: COLORS.textSecond }} onClick={() => setMobileOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1, px: 0.5 }}>
        {isFaculty ? (
          facultySidebarSections.map((sec, sIdx) => (
            <Box key={sIdx} sx={{ mb: 1 }}>
              {sec.heading && <SectionHeading title={sec.heading} />}
              <List disablePadding>
                {sec.items.map((item, i) => {
                  const active = location.pathname === item.path;

                  // Helper for Rendering Collapsible Section
                  const renderSubmenu = (isOpen, toggleFn, subItems, activeTab) => (
                    <React.Fragment key={i}>
                      <SidebarItem
                        icon={item.icon}
                        label={item.label}
                        path={item.path}
                        active={active}
                        hasSub={true}
                        isOpen={isOpen}
                        onClick={() => {
                          toggleFn(!isOpen);
                          navigate(`${item.path}?tab=0`);
                          if (isMobile) setMobileOpen(false);
                        }}
                      />
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ py: 0.5, bgcolor: '#f8fafc', borderRadius: 1, my: 0.25 }}>
                          {subItems.map((sub) => (
                            <SubmenuItem
                              key={sub.tab}
                              label={sub.label}
                              active={activeTab === sub.tab}
                              hasSub={sub.hasSub}
                              onClick={() => {
                                navigate(`${item.path}?tab=${sub.tab}`);
                                if (isMobile) setMobileOpen(false);
                              }}
                            />
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );

                  if (item.isProfileGroup) return renderSubmenu(profileExpanded, setProfileExpanded, profileSubItems, activeProfileTab);
                  if (item.isAttendanceGroup) return renderSubmenu(attendanceExpanded, setAttendanceExpanded, attendanceSubItems, activeAttendanceTab);
                  if (item.isDashboardsGroup) return renderSubmenu(dashboardsExpanded, setDashboardsExpanded, dashboardsSubItems, activeDashboardsTab);
                  if (item.isHrGroup) return renderSubmenu(hrExpanded, setHrExpanded, hrSubItems, activeHrTab);
                  if (item.isAcademicsGroup) return renderSubmenu(academicsExpanded, setAcademicsExpanded, academicsSubItems, activeAcademicsTab);
                  if (item.isLessonPlanGroup) return renderSubmenu(lessonPlanExpanded, setLessonPlanExpanded, lessonPlanSubItems, activeLessonPlanTab);
                  if (item.isImpactGroup) return renderSubmenu(impactExpanded, setImpactExpanded, impactSubItems, activeImpactTab);
                  if (item.isAcademicProjectsGroup) return renderSubmenu(academicProjectsExpanded, setAcademicProjectsExpanded, academicProjectsSubItems, activeAcademicProjectsTab);
                  if (item.isAssignmentGroup) return renderSubmenu(assignmentExpanded, setAssignmentExpanded, assignmentSubItems, activeAssignmentTab);
                  if (item.isStudyMaterialGroup) return renderSubmenu(studyMaterialExpanded, setStudyMaterialExpanded, studyMaterialSubItems, activeStudyMaterialTab);
                  if (item.isCommunicationGroup) return renderSubmenu(communicationExpanded, setCommunicationExpanded, communicationSubItems, activeCommunicationTab);
                  if (item.isLibraryGroup) return renderSubmenu(libraryExpanded, setLibraryExpanded, librarySubItems, activeLibraryTab);
                  if (item.isMentoringGroup) return renderSubmenu(mentoringExpanded, setMentoringExpanded, mentoringSubItems, activeMentoringTab);
                  if (item.isResultReportsGroup) return renderSubmenu(resultReportsExpanded, setResultReportsExpanded, resultReportsSubItems, activeResultReportsTab);

                  return (
                    <SidebarItem
                      key={i}
                      icon={item.icon}
                      label={item.label}
                      path={item.path}
                      active={active}
                      hasSub={item.hasSub}
                      isOrangeDashboard={item.isOrange}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileOpen(false);
                      }}
                    />
                  );
                })}
              </List>
            </Box>
          ))
        ) : !isAdmin ? (
          studentSidebarSections.map((sec, sIdx) => (
            <Box key={sIdx} sx={{ mb: 1 }}>
              {sec.heading && <SectionHeading title={sec.heading} />}
              <List disablePadding>
                {sec.items.map((item, i) => {
                  const active = location.pathname === item.path;
                  return (
                    <SidebarItem
                      key={i}
                      icon={item.icon}
                      label={item.label}
                      path={item.path}
                      active={active}
                      isOrangeDashboard={item.isOrange}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileOpen(false);
                      }}
                    />
                  );
                })}
              </List>
            </Box>
          ))
        ) : (
          <List disablePadding>
            {adminNav.map((item, i) => {
              const active = location.pathname === item.path;
              return (
                <SidebarItem
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  active={active}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                />
              );
            })}
          </List>
        )}
      </Box>

      {/* Footer Profile & Logout */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${COLORS.border}`, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: isFaculty ? '#ea580c' : COLORS.primary, fontSize: '0.85rem', fontWeight: 700 }}>
              {user?.name?.[0] || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Faculty Member'}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                {user?.role || 'FACULTY'}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Log Out">
            <IconButton size="small" onClick={logout} sx={{ color: '#ef4444' }}>
              <LogoutOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_W}px)` },
          ml: { md: `${DRAWER_W}px` },
          bgcolor: '#ffffff',
          borderBottom: `1px solid ${COLORS.border}`,
          color: '#0f172a',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: '#475569' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
              Academic Term: Even Semester 2023-2024
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Campus Intelligence AI Assistant">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ChatBubbleOutline />}
                onClick={() => navigate('/chatbot')}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: 12, display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Campus AI
              </Button>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton onClick={() => navigate('/announcements')} sx={{ color: '#64748b' }}>
                <Badge badgeContent={notifCount} color="error">
                  <NotificationsOutlined />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_W }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_W },
          }}
        >
          {DrawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_W },
          }}
          open
        >
          {DrawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, width: { md: `calc(100% - ${DRAWER_W}px)` }, mt: '64px' }}>
        <Outlet />
      </Box>

      <FloatingCampusBot />
    </Box>
  );
}

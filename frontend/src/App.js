import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage          from './pages/auth/LoginPage';
import StudentDashboard   from './pages/student/StudentDashboard';
import FacultyDashboard   from './pages/faculty/FacultyDashboard';
import AdminDashboard     from './pages/admin/AdminDashboard';
import AttendancePage     from './pages/attendance/AttendancePage';
import FeePage            from './pages/fees/FeePage';
import ExamPage           from './pages/exams/ExamPage';
import ResultPage         from './pages/results/ResultPage';
import AIInsightsPage     from './pages/ai/AIInsightsPage';
import ChatbotPage        from './pages/ai/ChatbotPage';
import StudyPlanPage      from './pages/ai/StudyPlanPage';
import StudentDetails     from './pages/student/StudentDetails';
import FacultyDetails     from './pages/faculty/FacultyDetails';
import StudentsList       from './pages/admin/StudentsList';
import FacultyList        from './pages/admin/FacultyList';
import FacultySchedulePage from './pages/faculty/FacultySchedulePage';
import FacultyCoursesPage  from './pages/faculty/FacultyCoursesPage';
import FacultyTimetablePage from './pages/faculty/FacultyTimetablePage';
import GPAPage            from './pages/student/GPAPage';
import SemesterResultsPage from './pages/student/SemesterResultsPage';
import StudentAssignmentsPortal from './pages/student/StudentAssignmentsPortal';
import StudentStudyMaterialPage from './pages/student/StudentStudyMaterialPage';
import StudentMentoringPortal from './pages/student/StudentMentoringPortal';
import StudentProjectsPortal from './pages/student/StudentProjectsPortal';
import StudentLibraryPage from './pages/student/StudentLibraryPage';
import StudentLessonPlanPage from './pages/student/StudentLessonPlanPage';
import NotFoundPage       from './pages/NotFoundPage';
import AnnouncementsPage  from './pages/announcements/AnnouncementsPage';
import PublishCGPAPage from './pages/admin/PublishCGPAPage';
import StudentAcademicRecordsPage from './pages/admin/StudentAcademicRecordsPage';
import FacultySubjectAssignmentPage from './pages/admin/FacultySubjectAssignmentPage';
import StudentQRRegistrationPage from './pages/admin/StudentQRRegistrationPage';
import PublicStudentRegistrationPage from './pages/auth/PublicStudentRegistrationPage';
import PublishResultPage from './pages/results/PublishResultPage';
import BroadcastEmailPage from './pages/admin/BroadcastEmailPage';

// Dedicated Independent Student ERP Modules
import StudentApplyLeavesPage from './pages/student/StudentApplyLeavesPage';
import StudentWarningsPage from './pages/student/StudentWarningsPage';
import StudentGrievancePage from './pages/student/StudentGrievancePage';
import StudentApprovalsPage from './pages/student/StudentApprovalsPage';
import StudentAchievementsPage from './pages/student/StudentAchievementsPage';
import StudentInternshipsPage from './pages/student/StudentInternshipsPage';
import StudentExamNotificationsPage from './pages/student/StudentExamNotificationsPage';
import StudentExamRoutinePage from './pages/student/StudentExamRoutinePage';
import StudentExamResultsPage from './pages/student/StudentExamResultsPage';
import StudentMonthlyAttendancePage from './pages/student/StudentMonthlyAttendancePage';
import StudentAttendanceSummaryPage from './pages/student/StudentAttendanceSummaryPage';
import StudentLibrarySearchPage from './pages/student/StudentLibrarySearchPage';
import StudentLibraryNewArrivalsPage from './pages/student/StudentLibraryNewArrivalsPage';
import StudentLibraryInvoicesPage from './pages/student/StudentLibraryInvoicesPage';
import StudentCalendarPage from './pages/student/StudentCalendarPage';
import StudentClassRoutinePage from './pages/student/StudentClassRoutinePage';
import StudentSatisfactionSurveyPage from './pages/student/StudentSatisfactionSurveyPage';
import StudentCourseEndSurveyPage from './pages/student/StudentCourseEndSurveyPage';
import StudentPlacementsPage from './pages/student/StudentPlacementsPage';
import StudentPlacementsCalendarPage from './pages/student/StudentPlacementsCalendarPage';
import StudentTransferCertificatePage from './pages/student/StudentTransferCertificatePage';
import StudentCustodianCertificatePage from './pages/student/StudentCustodianCertificatePage';
import StudentConductCertificatePage from './pages/student/StudentConductCertificatePage';
import StudentHostelPage from './pages/student/StudentHostelPage';
import StudentNoticesPage from './pages/student/StudentNoticesPage';
import StudentBusTrackingPage from './pages/student/StudentBusTrackingPage';
import StudentYearbookPage from './pages/student/StudentYearbookPage';
import StudentFeedbackPage from './pages/student/StudentFeedbackPage';
import StudentMentoringCounselorPage from './pages/student/StudentMentoringCounselorPage';
import StudentProjectDetailsPage from './pages/student/StudentProjectDetailsPage';
import StudentFeeDuesPage from './pages/student/StudentFeeDuesPage';

// Newly added institutional Faculty Session modules
import AdvanceDashboard from './pages/faculty/AdvanceDashboard';
import StudentSearchPage from './pages/faculty/StudentSearchPage';
import AttendanceDashboardsPage from './pages/faculty/AttendanceDashboardsPage';
import DepartmentEventsPage from './pages/faculty/DepartmentEventsPage';
import FacultyStudentWarningsPage from './pages/faculty/StudentWarningsPage';
import HumanResourcesPage from './pages/faculty/HumanResourcesPage';
import CollegeAcademicsPage from './pages/faculty/CollegeAcademicsPage';
import FacultyLessonPlanPage from './pages/faculty/FacultyLessonPlanPage';
import FacultyImpactPage from './pages/faculty/FacultyImpactPage';
import AcademicUploadsPage from './pages/faculty/AcademicUploadsPage';
import VOVMagazinePage from './pages/faculty/VOVMagazinePage';
import FacultyStudentInternshipsPage from './pages/faculty/StudentInternshipsPage';
import StudentAcademicProjectsPage from './pages/faculty/StudentAcademicProjectsPage';
import AssignTaskPage from './pages/faculty/AssignTaskPage';
import StudyMaterialPage from './pages/faculty/StudyMaterialPage';
import FacultyCommunicationPage from './pages/faculty/FacultyCommunicationPage';
import DigitalLibraryPage from './pages/faculty/DigitalLibraryPage';
import StudentMentoringPage from './pages/faculty/StudentMentoringPage';
import FacultyStudentAchievementsPage from './pages/faculty/StudentAchievementsPage';
import RDInnovationPage from './pages/faculty/RDInnovationPage';
import SubjectsCurriculumPage from './pages/faculty/SubjectsCurriculumPage';
import AssignmentsPage from './pages/faculty/AssignmentsPage';
import ResultReportsPage from './pages/faculty/ResultReportsPage';

function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN')   return <Navigate to="/admin/dashboard"   replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/student" element={<PublicStudentRegistrationPage />} />
        <Route path="/scan-register" element={<PublicStudentRegistrationPage />} />
        <Route path="/"      element={<RoleHome />} />

        {/* Short aliases */}
        <Route path="/admin"   element={<Navigate to="/admin/dashboard"   replace />} />
        <Route path="/faculty" element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* ── DEDICATED INDIVIDUAL STUDENT MODULE ROUTES ── */}
            <Route path="/student/dashboard"
              element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/calendar"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentCalendarPage /></ProtectedRoute>} />
            <Route path="/student/class-routine"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentClassRoutinePage /></ProtectedRoute>} />
            <Route path="/student/satisfaction-survey"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentSatisfactionSurveyPage /></ProtectedRoute>} />
            <Route path="/student/course-end-survey"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentCourseEndSurveyPage /></ProtectedRoute>} />
            <Route path="/student/exam-notifications"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentExamNotificationsPage /></ProtectedRoute>} />
            <Route path="/student/exam-routine"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentExamRoutinePage /></ProtectedRoute>} />
            <Route path="/student/exam-results"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentExamResultsPage /></ProtectedRoute>} />
            <Route path="/student/monthly-attendance"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentMonthlyAttendancePage /></ProtectedRoute>} />
            <Route path="/student/attendance-summary"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentAttendanceSummaryPage /></ProtectedRoute>} />
            <Route path="/student/attendance"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentAttendanceSummaryPage /></ProtectedRoute>} />
            <Route path="/student/counselor"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentMentoringCounselorPage /></ProtectedRoute>} />
            <Route path="/student/achievements"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentAchievementsPage /></ProtectedRoute>} />
            <Route path="/student/internships"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentInternshipsPage /></ProtectedRoute>} />
            <Route path="/student/apply-leaves"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentApplyLeavesPage /></ProtectedRoute>} />
            <Route path="/student/warnings"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentWarningsPage /></ProtectedRoute>} />
            <Route path="/student/grievance"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentGrievancePage /></ProtectedRoute>} />
            <Route path="/student/my-approvals"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentApprovalsPage /></ProtectedRoute>} />
            <Route path="/student/library"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentLibrarySearchPage /></ProtectedRoute>} />
            <Route path="/student/library-search"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentLibrarySearchPage /></ProtectedRoute>} />
            <Route path="/student/library-new-arrivals"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentLibraryNewArrivalsPage /></ProtectedRoute>} />
            <Route path="/student/library-invoices"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentLibraryInvoicesPage /></ProtectedRoute>} />
            <Route path="/student/hostel"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentHostelPage /></ProtectedRoute>} />
            <Route path="/student/notices"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentNoticesPage /></ProtectedRoute>} />
            <Route path="/student/fee-dues"
              element={<ProtectedRoute roles={['STUDENT','ADMIN','FACULTY']}><FeePage /></ProtectedRoute>} />
            <Route path="/student/fees"
              element={<ProtectedRoute roles={['STUDENT','ADMIN','FACULTY']}><FeePage /></ProtectedRoute>} />
            <Route path="/student/assignments"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentAssignmentsPortal /></ProtectedRoute>} />
            <Route path="/student/project-details"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentProjectDetailsPage /></ProtectedRoute>} />
            <Route path="/student/academic-projects"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentProjectDetailsPage /></ProtectedRoute>} />
            <Route path="/student/bus-tracking"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentBusTrackingPage /></ProtectedRoute>} />
            <Route path="/student/yearbook"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentYearbookPage /></ProtectedRoute>} />
            <Route path="/student/placements"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentPlacementsPage /></ProtectedRoute>} />
            <Route path="/student/placements-calendar"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentPlacementsCalendarPage /></ProtectedRoute>} />
            <Route path="/student/feedback"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentFeedbackPage /></ProtectedRoute>} />
            <Route path="/student/study-material"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentStudyMaterialPage /></ProtectedRoute>} />
            <Route path="/student/transfer-certificate"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentTransferCertificatePage /></ProtectedRoute>} />
            <Route path="/student/custodian-certificate"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentCustodianCertificatePage /></ProtectedRoute>} />
            <Route path="/student/conduct-certificate"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentConductCertificatePage /></ProtectedRoute>} />

            {/* Core & Academic history features */}
            <Route path="/student/exams"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentExamNotificationsPage /></ProtectedRoute>} />
            <Route path="/student/results"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentExamResultsPage /></ProtectedRoute>} />
            <Route path="/student/semester-records"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><SemesterResultsPage /></ProtectedRoute>} />
            <Route path="/student/academic-history"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><SemesterResultsPage /></ProtectedRoute>} />
            <Route path="/student/gpa"
              element={<ProtectedRoute roles={['STUDENT']}><GPAPage /></ProtectedRoute>} />
            <Route path="/student/ai-insights"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><AIInsightsPage /></ProtectedRoute>} />
            <Route path="/student/study-plan"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudyPlanPage /></ProtectedRoute>} />
            <Route path="/student/mentoring"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentMentoringCounselorPage /></ProtectedRoute>} />
            <Route path="/student/lesson-plan"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><StudentLessonPlanPage /></ProtectedRoute>} />
            <Route path="/student/profile"
              element={<ProtectedRoute roles={['STUDENT']}><StudentDetails /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ChatbotPage />} />

            {/* ── FACULTY ── */}
            <Route path="/faculty/dashboard"
              element={<ProtectedRoute roles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/advance-dashboard"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><AdvanceDashboard /></ProtectedRoute>} />
            <Route path="/faculty/student-search"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><StudentSearchPage /></ProtectedRoute>} />
            <Route path="/faculty/profile"
              element={<ProtectedRoute roles={['FACULTY']}><FacultyDetails /></ProtectedRoute>} />
            <Route path="/faculty/attendance-dashboards"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><AttendanceDashboardsPage /></ProtectedRoute>} />
            <Route path="/faculty/department-events"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><DepartmentEventsPage /></ProtectedRoute>} />
            <Route path="/faculty/student-warnings"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyStudentWarningsPage /></ProtectedRoute>} />
            <Route path="/faculty/human-resources"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><HumanResourcesPage /></ProtectedRoute>} />
            <Route path="/faculty/academics"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><CollegeAcademicsPage /></ProtectedRoute>} />
            <Route path="/faculty/lesson-plan"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyLessonPlanPage /></ProtectedRoute>} />
            <Route path="/faculty/impact-recognitions"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyImpactPage /></ProtectedRoute>} />
            <Route path="/faculty/academic-uploads"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><AcademicUploadsPage /></ProtectedRoute>} />
            <Route path="/faculty/vov-magazine"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><VOVMagazinePage /></ProtectedRoute>} />
            <Route path="/faculty/student-internships"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyStudentInternshipsPage /></ProtectedRoute>} />
            <Route path="/faculty/academic-projects"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><StudentAcademicProjectsPage /></ProtectedRoute>} />
            <Route path="/faculty/assign-task"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><AssignTaskPage /></ProtectedRoute>} />
            <Route path="/faculty/assignments"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><AssignmentsPage /></ProtectedRoute>} />
            <Route path="/faculty/study-material"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><StudyMaterialPage /></ProtectedRoute>} />
            <Route path="/faculty/communication"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyCommunicationPage /></ProtectedRoute>} />
            <Route path="/faculty/library"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><DigitalLibraryPage /></ProtectedRoute>} />
            <Route path="/faculty/student-mentoring"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><StudentMentoringPage /></ProtectedRoute>} />
            <Route path="/faculty/student-achievements"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyStudentAchievementsPage /></ProtectedRoute>} />
            <Route path="/faculty/rd-innovation"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><RDInnovationPage /></ProtectedRoute>} />
            <Route path="/faculty/subjects-curriculum"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><SubjectsCurriculumPage /></ProtectedRoute>} />
            <Route path="/faculty/result-reports"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><ResultReportsPage /></ProtectedRoute>} />
            <Route path="/faculty/courses"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyCoursesPage /></ProtectedRoute>} />
            <Route path="/faculty/timetable"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultyTimetablePage /></ProtectedRoute>} />
            <Route path="/faculty/schedule"
              element={<ProtectedRoute roles={['FACULTY','ADMIN']}><FacultySchedulePage /></ProtectedRoute>} />
            <Route path="/announcements"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><AnnouncementsPage /></ProtectedRoute>} />

            {/* ── ADMIN ── */}
            <Route path="/admin/dashboard"
              element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><StudentsList /></ProtectedRoute>} />
            <Route path="/admin/students/:id"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><StudentDetails /></ProtectedRoute>} />
            <Route path="/admin/academic-records"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><StudentAcademicRecordsPage /></ProtectedRoute>} />
            <Route path="/admin/faculty"
              element={<ProtectedRoute roles={['ADMIN']}><FacultyList /></ProtectedRoute>} />
            <Route path="/admin/faculty-assignments"
              element={<ProtectedRoute roles={['ADMIN']}><FacultySubjectAssignmentPage /></ProtectedRoute>} />
            <Route path="/admin/faculty/:id"
              element={<ProtectedRoute roles={['ADMIN']}><FacultyDetails /></ProtectedRoute>} />
            <Route path="/admin/student-scanner"
              element={<ProtectedRoute roles={['ADMIN']}><StudentQRRegistrationPage /></ProtectedRoute>} />
            <Route path="/admin/excel-import"
              element={<ProtectedRoute roles={['ADMIN']}><StudentQRRegistrationPage /></ProtectedRoute>} />
            <Route path="/admin/publish-cgpa" 
              element={<ProtectedRoute roles={['ADMIN']}><PublishCGPAPage /></ProtectedRoute> }/> 
            <Route path="/admin/publish-results"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><PublishResultPage /></ProtectedRoute>} />
            <Route path="/admin/broadcast-email"
              element={<ProtectedRoute roles={['ADMIN']}><BroadcastEmailPage /></ProtectedRoute>} />
            <Route path="/faculty/publish-results"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><PublishResultPage /></ProtectedRoute>} />
            <Route path="/publish-results"
              element={<ProtectedRoute roles={['ADMIN','FACULTY']}><PublishResultPage /></ProtectedRoute>} />

            {/* Direct fallback routes for core pages */}
            <Route path="/attendance"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><AttendancePage /></ProtectedRoute>} />
            <Route path="/fees"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><FeePage /></ProtectedRoute>} />
            <Route path="/exams"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><ExamPage /></ProtectedRoute>} />
            <Route path="/results"
              element={<ProtectedRoute roles={['STUDENT','FACULTY','ADMIN']}><ResultPage /></ProtectedRoute>} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
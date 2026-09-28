import axios from 'axios';
import { broadcastDataChange, DATA_SYNC_EVENTS } from './dataSync';

// Backend runs at :8080/api  (server.servlet.context-path=/api in application.properties)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// ── REQUEST INTERCEPTOR: attach JWT to every request ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusiq_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR: handle 401 globally & auto-sync mutations ─────────────
api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const url = response.config?.url || '';
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      if (url.includes('/fees')) {
        broadcastDataChange(DATA_SYNC_EVENTS.FEE_UPDATED, response.data);
      } else if (url.includes('/attendance')) {
        broadcastDataChange(DATA_SYNC_EVENTS.ATTENDANCE_UPDATED, response.data);
      } else if (url.includes('/exams')) {
        broadcastDataChange(DATA_SYNC_EVENTS.EXAM_UPDATED, response.data);
      } else if (url.includes('/results') || url.includes('/academic-records') || url.includes('/cgpa')) {
        broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, response.data);
      } else if (url.includes('/timetable')) {
        broadcastDataChange(DATA_SYNC_EVENTS.TIMETABLE_UPDATED, response.data);
      } else if (url.includes('/courses')) {
        broadcastDataChange(DATA_SYNC_EVENTS.COURSE_UPDATED, response.data);
      } else if (url.includes('/users') || url.includes('/registrations') || url.includes('/faculty-assignments')) {
        broadcastDataChange(DATA_SYNC_EVENTS.USER_DATA_UPDATED, response.data);
      } else if (url.includes('/notifications') || url.includes('/announcements')) {
        broadcastDataChange(DATA_SYNC_EVENTS.NOTIFICATION_DISPATCHED, response.data);
      } else if (url.includes('/leaves')) {
        broadcastDataChange(DATA_SYNC_EVENTS.LEAVE_APPLIED, response.data);
      } else if (url.includes('/grievances')) {
        broadcastDataChange(DATA_SYNC_EVENTS.GRIEVANCE_SUBMITTED, response.data);
      } else if (url.includes('/certificates')) {
        broadcastDataChange(DATA_SYNC_EVENTS.CERTIFICATE_REQUESTED, response.data);
      } else if (url.includes('/mentoring')) {
        broadcastDataChange(DATA_SYNC_EVENTS.COUNSELING_REQUESTED, response.data);
      } else if (url.includes('/warnings')) {
        broadcastDataChange(DATA_SYNC_EVENTS.WARNING_ISSUED, response.data);
      } else if (url.includes('/surveys')) {
        broadcastDataChange(DATA_SYNC_EVENTS.SURVEY_SUBMITTED, response.data);
      } else if (url.includes('/projects')) {
        broadcastDataChange(DATA_SYNC_EVENTS.PROJECT_PROGRESS_SUBMITTED, response.data);
      } else {
        broadcastDataChange('CAMPUSIQ_DATA_MUTATED', response.data);
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // If 401 on a non-auth endpoint → token expired/invalid → logout
    if (status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('campusiq_token');
      localStorage.removeItem('campusiq_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// Each maps to a Spring Boot @RestController endpoint
// Base path: http://localhost:8080/api/...
// ══════════════════════════════════════════════════════════════════════════

// POST /auth/login  → { username, password } → { accessToken, userId, username, name, email, role }
// POST /auth/register
export const authAPI = {
  login:      (data)  => api.post('/auth/login', data),
  register:   (data)  => api.post('/auth/register', data),
  verifyOtp:  (data)  => api.post('/auth/verify-otp', data),
  resendOtp:  (email) => api.post(`/auth/resend-otp?email=${email}`),
  enable2FA:  ()      => api.post('/auth/2fa/enable'),
  disable2FA: ()      => api.post('/auth/2fa/disable'),
};

// GET /attendance/my          → student sees own attendance
// GET /attendance/student/{id}
// POST /attendance/mark
export const attendanceAPI = {
  getMyAttendance:            ()                    => api.get('/attendance/my'),
  getStudentAttendance:       (studentId)           => api.get(`/attendance/student/${studentId}`),
  getStudentCoursePct:        (studentId, courseId) => api.get(`/attendance/student/${studentId}/course/${courseId}/percentage`),
  markAttendance:             (data)                => api.post('/attendance/mark', data),
  mark:                       (data)                => api.post('/attendance/mark', data),
  getAllAttendance:           ()                    => api.get('/attendance/all'),
  getByDateAndCourse:         (courseId, date)      => api.get(`/attendance/course/${courseId}/date/${date}`),
  // Faculty Biometric Attendance (Admin & Faculty)
  getFacultyBiometricSummary: (params)              => api.get('/attendance/faculty/summary', { params }),
  getAllFacultyBiometric:     ()                    => api.get('/attendance/faculty/all'),
  getMyFacultyBiometric:      ()                    => api.get('/attendance/faculty/my'),
  punchFacultyBiometric:      (data)                => api.post('/attendance/faculty/punch', data),
};

// GET /fees/my
// GET /fees/student/{id}
export const feeAPI = {
  getMyFees:          ()      => api.get('/fees/my'),
  getStudentFees:     (id)    => api.get(`/fees/student/${id}`),
  getAllFees:         ()      => api.get('/fees/all'),
  getFees:            ()      => api.get('/fees'),
  createFee:          (data)  => api.post('/fees', data),
  getMyPendingAmount: ()      => api.get('/fees/my/pending-amount'),
  createPaymentOrder: (feeId) => api.post(`/fees/${feeId}/create-order`),
  verifyPayment:      (data)  => api.post('/fees/verify-payment', data),
  getReceipts:        ()      => api.get('/fees/receipts'),
  getConfig:          ()      => api.get('/fees/config'),
  updateFee:          (id, data) => api.put(`/fees/${id}`, data),
  updateFeeStatus:    (id, status) => api.patch(`/fees/${id}/status`, { status }),
  deleteFee:          (id)    => api.delete(`/fees/${id}`),
};

// GET /exams/upcoming
// GET /exams
export const examAPI = {
  createExam:   (data)       => api.post('/exams', data),
  getAll:       ()           => api.get('/exams'),
  getAllExams:  ()           => api.get('/exams'),
  getUpcoming:  ()           => api.get('/exams/upcoming'),
  getExamById:  (id)         => api.get(`/exams/${id}`),
  updateExam:   (id, data)   => api.put(`/exams/${id}`, data),
  updateStatus: (id, status) => api.patch(`/exams/${id}/status?status=${status}`),
  deleteExam:   (id)         => api.delete(`/exams/${id}`),
  getByCourse:  (cid)        => api.get(`/exams/course/${cid}`),
  getMyExams:   ()           => api.get('/exams/my'),
};

// GET /results/my
// GET /results/student/{id}
export const resultAPI = {
  publishResults:    (data)      => api.post('/results/publish', data),       // legacy — kept for compatibility
  publishMid:        (data)      => api.post('/results/publish/mid', data),   // Faculty+Admin
  publishSem:        (data)      => api.post('/results/publish/sem', data),   // Admin only
  getMyResults:      ()          => api.get('/results/my'),
  getStudentResults: (studentId) => api.get(`/results/student/${studentId}`),
  getExamResults:    (examId)    => api.get(`/results/exam/${examId}`),
  getAllResults:      ()         => api.get('/results/all'),
};

// GET /analytics/performance/my
export const analyticsAPI = {
  getMyPerformance:      ()          => api.get('/analytics/performance/my'),
  getStudentPerformance: (studentId) => api.get(`/analytics/performance/student/${studentId}`),
};

// GET /notifications
export const notificationAPI = {
  getAll:        (page = 0, size = 20) => api.get('/notifications', { params: { page, size } }),
  getUnread:     () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markRead:      (id) => api.patch(`/notifications/${id}/read`),
  markAllRead:   () => api.patch('/notifications/read-all'),
  broadcast:     (data) => api.post('/notifications/broadcast', data),
};

// POST /chatbot/chat and session management (ChatGPT / Gemini style)
export const chatbotAPI = {
  sendMessage:        (message, history, sessionId) => api.post('/chatbot/chat', { message, history: history || [], sessionId }),
  getSessions:        ()                            => api.get('/chatbot/sessions'),
  getSessionMessages: (sessionId)                   => api.get(`/chatbot/sessions/${sessionId}`),
  createSession:      (title)                       => api.post('/chatbot/sessions', { title }),
  togglePinSession:   (sessionId)                   => api.put(`/chatbot/sessions/${sessionId}/pin`),
  renameSession:      (sessionId, title)            => api.put(`/chatbot/sessions/${sessionId}/title`, { title }),
  deleteSession:      (sessionId)                   => api.delete(`/chatbot/sessions/${sessionId}`),
};

// GET/POST/PUT/DELETE /courses
export const courseAPI = {
  getAll:       ()        => api.get('/courses'),
  getMyCourses: ()        => api.get('/courses/my'),           // faculty's own courses
  getById:      (id)      => api.get(`/courses/${id}`),
  getByFaculty: (fid)     => api.get(`/courses/faculty/${fid}`),
  create:       (data)    => api.post('/courses', data),       // faculty + admin
  update:       (id, d)   => api.put(`/courses/${id}`, d),     // faculty + admin
  delete:       (id)      => api.delete(`/courses/${id}`),     // faculty + admin
};

// GET/POST/PUT/DELETE /timetable
export const timetableAPI = {
  getMy:        ()          => api.get('/timetable/my'),
  getByFaculty: (facultyId) => api.get(`/timetable/faculty/${facultyId}`),
  getByCourse:  (courseId)  => api.get(`/timetable/course/${courseId}`),
  create:       (data)      => api.post('/timetable', data),
  update:       (id, data)  => api.put(`/timetable/${id}`, data),
  delete:       (id)        => api.delete(`/timetable/${id}`),
};

// ── Aliases for backward compatibility with page components ──────────────
export const aiAPI = {
  getMyPerformance:      ()                         => api.get('/analytics/performance/my'),
  getStudentPerformance: (studentId)                => api.get(`/analytics/performance/student/${studentId}`),
  chat:                  (message, history, sessionId) => api.post('/chatbot/chat', { message, history: history || [], sessionId }),
  getSessions:        ()                            => api.get('/chatbot/sessions'),
  getSessionMessages: (sessionId)                   => api.get(`/chatbot/sessions/${sessionId}`),
  createSession:      (title)                       => api.post('/chatbot/sessions', { title }),
  togglePinSession:   (sessionId)                   => api.put(`/chatbot/sessions/${sessionId}/pin`),
  renameSession:      (sessionId, title)            => api.put(`/chatbot/sessions/${sessionId}/title`, { title }),
  deleteSession:      (sessionId)                   => api.delete(`/chatbot/sessions/${sessionId}`),
  generateStudyPlan:     ()                         => api.get('/analytics/performance/my'),
};

export const notifAPI = notificationAPI;


// GET /users/students, /users/faculty, /users/{id}, /users/stats
export const userAPI = {
  getStudents: (params) => api.get('/users/students', { params }),
  getAllStudents: (params) => api.get('/users/students', { params }),
  getFaculty: () => api.get('/users/faculty'),
  getAllFaculty: () => api.get('/users/faculty'),
  getById: (id) => api.get(`/users/${id}`),
  getMyProfile: () => api.get('/users/me'),
  getMyFull: () => api.get('/users/me/full'),
  getStats: () => api.get('/users/stats'),
  updateProfileImage: (profileImage) => api.put('/users/me/profile-image', { profileImage }),
  // ── ADMIN CREATE ──
  createStudent: (data) => api.post('/users/students', data),
  createMultipleStudents: (data) => api.post('/users/students/bulk', data),
  createFaculty: (data) => api.post('/users/faculty', data),
  createMultipleFaculty: (data) => api.post('/users/faculty/bulk', data),
  // ── ADMIN UPDATE/DELETE/VERIFY ──
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  verifyUser: (id, data) => api.put(`/users/${id}/verify`, data),
  updateStatus: (id, active) => api.put(`/users/${id}/status`, { active }),
  broadcastEmail: (data) => api.post('/users/broadcast', data),
};

// GET /schedule/my, /schedule/course/{id}, /schedule/faculty/{id}
export const scheduleAPI = {
  addSchedule: (data) => api.post('/schedule', data),
  getMySchedules: () => api.get('/schedule/my'),
  getCourseSchedules: (id) => api.get(`/schedule/course/${id}`),
  getFacultySchedules: (id) => api.get(`/schedule/faculty/${id}`),
  deleteSchedule: (id) => api.delete(`/schedule/${id}`),
};

// Department & College Events
export const eventAPI = {
  getAll: () => api.get('/department-events'),
  publish: (data) => api.post('/department-events/publish', data),
};

// GPA endpoints
export const gpaAPI = {
  getMyGpa: () => api.get('/results/my/gpa'),
  getStudentGpa: (id) => api.get(`/results/student/${id}/gpa`),
  getSemesterGpa: (id, sem) => api.get(`/results/student/${id}/semester/${sem}`), 
};

// CGPA publish — ADMIN ONLY
export const cgpaUploadAPI = {
  publishCgpa: (data) => api.post('/cgpa/publish', data),
  getStudentCgpa: (id) => api.get(`/cgpa/student/${id}`),
  getMyCgpa: () => api.get('/cgpa/my'),
  getAllCgpa: () => api.get('/cgpa/all'),
};

// ── SEMESTER-WISE ACADEMIC RECORDS (1-1 to 4-2) ──
export const academicRecordAPI = {
  getMyRecords: () => api.get('/academic-records/my'),
  getMySemester: (semCode) => api.get(`/academic-records/my/semester/${semCode}`),
  getStudentRecords: (studentId) => api.get(`/academic-records/student/${studentId}`),
  getStudentSemester: (studentId, semCode) => api.get(`/academic-records/student/${studentId}/semester/${semCode}`),
  updateSubjectMarks: (studentId, data) => api.post(`/academic-records/student/${studentId}/marks`, data),
  batchUpdateSemester: (studentId, data) => api.post(`/academic-records/student/${studentId}/batch-update`, data),
  importCsv: (rows) => api.post('/academic-records/import/csv', rows),
};

// ── FACULTY SUBJECT ASSIGNMENTS ──
export const facultyAssignmentAPI = {
  getAll:             ()         => api.get('/faculty-assignments/all'),
  getByFaculty:       (facultyId)=> api.get(`/faculty-assignments/faculty/${facultyId}`),
  getMyAssignments:   ()         => api.get('/faculty-assignments/my'),
  createAssignment:   (data)     => api.post('/faculty-assignments', data),
  updateAssignment:   (id, data) => api.put(`/faculty-assignments/${id}`, data),
  deleteAssignment:   (id)       => api.delete(`/faculty-assignments/${id}`),
};

// POST /announcements/send*
export const announcementAPI = {
  getAll:           ()     => api.get('/announcements'),
  sendToAll:        (data) => api.post('/announcements/send', data),
  sendHoliday:      (data) => api.post('/announcements/send/holiday', data),
  sendExamReminder: (data) => api.post('/announcements/send/exam', data),
  sendEvent:        (data) => api.post('/announcements/send/event', data),
};

// ── STUDENT REGISTRATION SCANNER & EXCEL IMPORT ──
export const registrationAPI = {
  submitPublicRegistration: (data) => api.post('/registrations/public', data),
  getAllRegistrations:      ()     => api.get('/registrations/all'),
  getRegistrationStats:     ()     => api.get('/registrations/stats'),
  importExcelStudents:      (data) => api.post('/registrations/import-excel', data),
  deleteRegistration:       (id)   => api.delete(`/registrations/${id}`),
};

// ── STUDENT LEAVE MANAGEMENT ──
export const leaveAPI = {
  getAll:           ()                      => api.get('/leaves'),
  getMyLeaves:      ()                      => api.get('/leaves/my'),
  applyLeave:       (data)                  => api.post('/leaves/apply', data),
  updateStatus:     (id, status, remarks)   => api.put(`/leaves/${id}/status`, { status, remarks }),
};

// ── CERTIFICATES ──
export const certificateAPI = {
  getAll:             ()      => api.get('/certificates'),
  getMyCertificates:  ()      => api.get('/certificates'),
  requestCertificate: (data)  => api.post('/certificates/request', data),
  verifyCertificate:  (id)    => api.get(`/certificates/verify/${id}`),
};

// ── GRIEVANCES ──
export const grievanceAPI = {
  getAll:           ()                => api.get('/grievances'),
  getMyGrievances:  ()                => api.get('/grievances'),
  submitGrievance:  (data)            => api.post('/grievances/submit', data),
  resolveGrievance: (id, response)    => api.put(`/grievances/${id}/resolve`, { response }),
};

// ── MENTORING & COUNSELING ──
export const mentoringAPI = {
  getAll:         ()                 => api.get('/mentoring'),
  getMyMentoring: ()                 => api.get('/mentoring'),
  bookSession:    (data)             => api.post('/mentoring/book', data),
  updateRemarks:  (id, mentorRemarks)=> api.put(`/mentoring/${id}/remarks`, { mentorRemarks }),
};

// ── PLACEMENTS ──
export const placementAPI = {
  getDrives:      ()               => api.get('/placements/drives'),
  getCalendar:    ()               => api.get('/placements/calendar'),
  applyDrive:     (driveId, data)  => api.post(`/placements/apply/${driveId}`, data || {}),
};

// ── DIGITAL LIBRARY ──
export const libraryAPI = {
  getOverview:    ()               => api.get('/library'),
  getBooks:       (query)          => api.get('/library/books', { params: { query } }),
  getBorrowed:    ()               => api.get('/library/borrowed'),
  renewBook:      (issueId)        => api.post(`/library/renew/${issueId}`),
  getInvoices:    ()               => api.get('/library/invoices'),
};

// ── ACADEMIC PROJECTS ──
export const projectAPI = {
  getMyProjects:    ()      => api.get('/projects'),
  getAllProjects:   ()      => api.get('/projects'),
  submitMilestone:  (data)  => api.post('/projects/submit-milestone', data),
};

// ── STUDENT WARNINGS ──
export const warningAPI = {
  getAll:               ()     => api.get('/warnings'),
  getMyWarnings:        ()     => api.get('/warnings'),
  issueWarning:         (data) => api.post('/warnings/issue', data),
  acknowledgeWarning:   (id)   => api.post(`/warnings/${id}/acknowledge`),
};

// ── SURVEYS & FEEDBACK ──
export const surveyAPI = {
  submitSurvey: (data) => api.post('/surveys/submit', data),
  getSummary:   ()     => api.get('/surveys/summary'),
};

// ── CAMPUS SERVICES ──
export const campusServicesAPI = {
  getOverview:    () => api.get('/campus-services'),
  getHostelDetails: () => api.get('/campus-services/hostel'),
  getBusRoutes:   () => api.get('/campus-services/bus-routes'),
  getYearbook:    () => api.get('/campus-services/yearbook'),
};

export default api;
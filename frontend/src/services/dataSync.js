/**
 * CampusIQ+ Central Cross-Role Data Sync Manager
 * Synchronizes real-time state changes between Admin, Faculty, and Student sessions
 * using BroadcastChannel, LocalStorage stores, and DOM CustomEvents.
 */

const SYNC_BUS_NAME = 'campusiq_cross_role_sync_bus';
let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    broadcastChannel = new BroadcastChannel(SYNC_BUS_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported, falling back to storage events');
}

export const DATA_SYNC_EVENTS = {
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
  ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
  ASSIGNMENT_SUBMITTED: 'ASSIGNMENT_SUBMITTED',
  ASSIGNMENT_GRADED: 'ASSIGNMENT_GRADED',
  EVENT_PUBLISHED: 'EVENT_PUBLISHED',
  LESSON_PLAN_UPDATED: 'LESSON_PLAN_UPDATED',
  STUDENT_PROFILE_UPDATED: 'STUDENT_PROFILE_UPDATED',
  FACULTY_PROFILE_UPDATED: 'FACULTY_PROFILE_UPDATED',
  LEAVE_APPLIED: 'LEAVE_APPLIED',
  LEAVE_STATUS_CHANGED: 'LEAVE_STATUS_CHANGED',
  GRIEVANCE_SUBMITTED: 'GRIEVANCE_SUBMITTED',
  GRIEVANCE_RESOLVED: 'GRIEVANCE_RESOLVED',
  CERTIFICATE_REQUESTED: 'CERTIFICATE_REQUESTED',
  CERTIFICATE_ISSUED: 'CERTIFICATE_ISSUED',
  COUNSELING_REQUESTED: 'COUNSELING_REQUESTED',
  COUNSELING_REMARKS_ADDED: 'COUNSELING_REMARKS_ADDED',
  PROJECT_PROGRESS_SUBMITTED: 'PROJECT_PROGRESS_SUBMITTED',
  ACHIEVEMENT_SUBMITTED: 'ACHIEVEMENT_SUBMITTED',
  ACHIEVEMENT_VERIFIED: 'ACHIEVEMENT_VERIFIED',
  INTERNSHIP_REGISTERED: 'INTERNSHIP_REGISTERED',
  FEE_PAID: 'FEE_PAID',
  FEE_UPDATED: 'FEE_UPDATED',
  SURVEY_SUBMITTED: 'SURVEY_SUBMITTED',
  WARNING_ISSUED: 'WARNING_ISSUED',
  RESULT_PUBLISHED: 'RESULT_PUBLISHED',
  NOTIFICATION_DISPATCHED: 'NOTIFICATION_DISPATCHED',
  EXAM_UPDATED: 'EXAM_UPDATED',
  TIMETABLE_UPDATED: 'TIMETABLE_UPDATED',
  COURSE_UPDATED: 'COURSE_UPDATED',
  USER_DATA_UPDATED: 'USER_DATA_UPDATED',
};

// Dispatch a synchronization event to all roles (Admin, Faculty, Student)
export const broadcastDataChange = (eventType, payload = {}) => {
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('campusiq_user') || '{}');
  } catch (e) {}

  const syncPayload = {
    type: eventType,
    payload,
    timestamp: Date.now(),
    sourceUser: currentUser
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(syncPayload);
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }

  try {
    localStorage.setItem('campusiq_last_sync_event', JSON.stringify(syncPayload));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('campusiq_sync', { detail: syncPayload }));
    } catch (e) {}
  }
};

// Subscribe to synchronization events - supports both (callback) and (eventType, callback)
export const subscribeToDataSync = (arg1, arg2) => {
  let targetEvent = null;
  let callback = null;

  if (typeof arg1 === 'function') {
    callback = arg1;
  } else if (typeof arg1 === 'string' && typeof arg2 === 'function') {
    targetEvent = arg1;
    callback = arg2;
  } else if (typeof arg2 === 'function') {
    callback = arg2;
  }

  if (!callback) return () => {};

  const dispatchEvent = (data) => {
    if (!data) return;
    if (!targetEvent || targetEvent === '*' || data.type === targetEvent) {
      try {
        callback(data);
      } catch (err) {
        console.error('Error in sync subscriber:', err);
      }
    }
  };

  const handleMessage = (event) => {
    if (event.data) {
      dispatchEvent(event.data);
    }
  };

  const handleCustomEvent = (event) => {
    if (event.detail) {
      dispatchEvent(event.detail);
    }
  };

  const handleStorageEvent = (event) => {
    if (event.key === 'campusiq_last_sync_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        dispatchEvent(parsed);
      } catch (e) {}
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('campusiq_sync', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('campusiq_sync', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
};

// ==========================================
// CENTRAL PERSISTED SHARED DATA STORES
// ==========================================

const getStorageItem = (key, defaultVal) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setStorageItem = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

// 1. LEAVES
const INITIAL_LEAVES = [];

export const getSharedLeaves = () => getStorageItem('campusiq_store_leaves', INITIAL_LEAVES);
export const saveSharedLeave = (newLeave) => {
  const current = getSharedLeaves();
  const updated = [newLeave, ...current];
  setStorageItem('campusiq_store_leaves', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.LEAVE_APPLIED, newLeave);
  return updated;
};
export const updateSharedLeaveStatus = (leaveId, status, approverName) => {
  const current = getSharedLeaves();
  const updated = current.map(l => l.id === leaveId ? { ...l, status, approvedBy: approverName } : l);
  setStorageItem('campusiq_store_leaves', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.LEAVE_STATUS_CHANGED, { leaveId, status, approverName });
  return updated;
};

// 2. GRIEVANCES
const INITIAL_GRIEVANCES = [];

export const getSharedGrievances = () => getStorageItem('campusiq_store_grievances', INITIAL_GRIEVANCES);
export const saveSharedGrievance = (newGrv) => {
  const current = getSharedGrievances();
  const updated = [newGrv, ...current];
  setStorageItem('campusiq_store_grievances', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.GRIEVANCE_SUBMITTED, newGrv);
  return updated;
};
export const resolveSharedGrievance = (grvId, responseText) => {
  const current = getSharedGrievances();
  const updated = current.map(g => g.id === grvId ? { ...g, status: 'Resolved', response: responseText } : g);
  setStorageItem('campusiq_store_grievances', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.GRIEVANCE_RESOLVED, { grvId, responseText });
  return updated;
};

// 3. CERTIFICATES
const INITIAL_CERTIFICATES = [];

export const getSharedCertificates = () => getStorageItem('campusiq_store_certificates', INITIAL_CERTIFICATES);
export const requestSharedCertificate = (newCert) => {
  const current = getSharedCertificates();
  const updated = [newCert, ...current];
  setStorageItem('campusiq_store_certificates', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.CERTIFICATE_REQUESTED, newCert);
  return updated;
};

// 4. COUNSELING & MENTORING SESSIONS
const INITIAL_COUNSELING = [];

export const getSharedCounseling = () => getStorageItem('campusiq_store_counseling', INITIAL_COUNSELING);
export const bookSharedCounseling = (newSession) => {
  const current = getSharedCounseling();
  const updated = [newSession, ...current];
  setStorageItem('campusiq_store_counseling', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.COUNSELING_REQUESTED, newSession);
  return updated;
};
export const addSharedCounselingRemarks = (sessionId, remarks, outcome) => {
  const current = getSharedCounseling();
  const updated = current.map(s => s.id === sessionId ? { ...s, mentorRemarks: remarks, outcome, status: 'Completed' } : s);
  setStorageItem('campusiq_store_counseling', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.COUNSELING_REMARKS_ADDED, { sessionId, remarks, outcome });
  return updated;
};

// 5. ACHIEVEMENTS & INTERNSHIPS
const INITIAL_ACHIEVEMENTS = [];

export const getSharedAchievements = () => getStorageItem('campusiq_store_achievements', INITIAL_ACHIEVEMENTS);
export const saveSharedAchievement = (newAch) => {
  const current = getSharedAchievements();
  const updated = [newAch, ...current];
  setStorageItem('campusiq_store_achievements', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.ACHIEVEMENT_SUBMITTED, newAch);
  return updated;
};

// 6. WARNINGS
const INITIAL_WARNINGS = [];

export const getSharedWarnings = () => getStorageItem('campusiq_store_warnings', INITIAL_WARNINGS);
export const issueSharedWarning = (newWrn) => {
  const current = getSharedWarnings();
  const updated = [newWrn, ...current];
  setStorageItem('campusiq_store_warnings', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.WARNING_ISSUED, newWrn);
  return updated;
};

// 7. FEE TRANSACTIONS
const INITIAL_FEE_RECEIPTS = [];

export const getSharedFeeReceipts = () => getStorageItem('campusiq_store_fee_receipts', INITIAL_FEE_RECEIPTS);
export const recordSharedFeePayment = (newPayment) => {
  const current = getSharedFeeReceipts();
  const updated = [newPayment, ...current];
  setStorageItem('campusiq_store_fee_receipts', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.FEE_PAID, newPayment);
  return updated;
};

// 8. UNIFIED SINGLE SOURCE OF TRUTH: RESULTS & CGPA STORE
const INITIAL_CGPA_STORE = {};

export const getSharedCgpaMap = () => getStorageItem('campusiq_store_cgpa_map', INITIAL_CGPA_STORE);

export const getSharedStudentCgpa = (studentId) => {
  const map = getSharedCgpaMap();
  return map[studentId] || map[String(studentId)] || null;
};

export const updateSharedStudentCgpa = (studentId, cgpa, semester = null, remarks = '') => {
  const map = getSharedCgpaMap();
  const numericCgpa = parseFloat(cgpa) || 8.5;
  const updatedEntry = {
    studentId,
    cgpa: numericCgpa,
    sgpa: numericCgpa,
    semester,
    remarks,
    updatedAt: Date.now()
  };
  map[studentId] = updatedEntry;
  map[String(studentId)] = updatedEntry;
  setStorageItem('campusiq_store_cgpa_map', map);
  broadcastDataChange(DATA_SYNC_EVENTS.RESULT_PUBLISHED, updatedEntry);
  return updatedEntry;
};

// 9. INTERNSHIPS
const INITIAL_INTERNSHIPS = [];
export const getSharedInternships = () => getStorageItem('campusiq_store_internships', INITIAL_INTERNSHIPS);
export const saveSharedInternship = (newInternship) => {
  const current = getSharedInternships();
  const updated = [newInternship, ...current];
  setStorageItem('campusiq_store_internships', updated);
  broadcastDataChange(DATA_SYNC_EVENTS.INTERNSHIP_REGISTERED, newInternship);
  return updated;
};


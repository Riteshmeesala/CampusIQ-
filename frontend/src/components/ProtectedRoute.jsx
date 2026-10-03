import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DASH = {
  ADMIN:   '/admin/dashboard',
  FACULTY: '/faculty/dashboard',
  STUDENT: '/student/dashboard',
};

const Spinner = ({ msg = 'Loading…' }) => (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0D1757 0%, #1A237E 100%)',
  }}>
    <div style={{ textAlign: 'center', color: '#fff' }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #FFB300',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{msg}</div>
    </div>
    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
  </div>
);

/**
 * ProtectedRoute wraps routes that require authentication.
 *
 * Usage 1 — any authenticated user:
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<AppLayout />}> ... </Route>
 *   </Route>
 *
 * Usage 2 — specific roles:
 *   <ProtectedRoute roles={['STUDENT']}>
 *     <StudentDashboard />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Still loading auth state from localStorage
  if (loading) return <Spinner msg="Loading VVITU ERP…" />;

  // Not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but wrong role for this route
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DASH[user.role] || '/'} replace />;
  }

  // Render children (component) or nested routes (outlet)
  return children ?? <Outlet />;
};

export default ProtectedRoute;

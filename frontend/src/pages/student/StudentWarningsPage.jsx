import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { ErrorOutline, Refresh, CheckCircleOutline } from '@mui/icons-material';
import { warningAPI } from '../../services/api';
import { getSharedWarnings, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';

export default function StudentWarningsPage() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const res = await warningAPI.getMyWarnings();
      const serverData = res.data?.data || res.data || [];
      if (Array.isArray(serverData) && serverData.length > 0) {
        setWarnings(serverData);
      } else {
        setWarnings(getSharedWarnings());
      }
    } catch (err) {
      console.warn('Failed to load warnings from server:', err);
      setWarnings(getSharedWarnings());
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await warningAPI.acknowledgeWarning(id);
      await loadWarnings();
    } catch (err) {
      console.warn('Failed to acknowledge warning on server:', err);
    }
  };

  useEffect(() => {
    loadWarnings();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.WARNING_ISSUED, () => loadWarnings());
    return () => unsub();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="Academic & Attendance Warnings"
        subtitle="Institutional attendance shortages, disciplinary alerts, and counselor advisory notices"
        breadcrumbs={[
          { label: 'Dashboard', path: '/student/dashboard' },
          { label: 'Warnings' }
        ]}
      />

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Active Warning Notices
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadWarnings}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
        </Box>

        {warnings.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 2, border: '1px dashed #86efac' }}>
            <CheckCircleOutline sx={{ fontSize: 44, color: '#16a34a', mb: 1 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>Good Standing - No Active Warnings</Typography>
            <Typography sx={{ fontSize: 13, color: '#4ade80' }}>Your academic attendance and institutional standing are in compliance.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {warnings.map((w, idx) => (
              <Box key={idx} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #fecaca', bgcolor: '#fff5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorOutline sx={{ color: '#dc2626' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#991b1b' }}>{w.type}</Typography>
                  </Box>
                  <Chip label={w.severity || 'Notice'} size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 11 }} />
                </Box>
                <Typography sx={{ fontSize: 13.5, color: '#334155', mb: 1.5, lineHeight: 1.6 }}>{w.text}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>Issued By: <strong>{w.issuedBy}</strong></span>
                  <span>Date: {w.date}</span>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

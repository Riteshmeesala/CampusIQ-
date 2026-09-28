import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { QuestionAnswerOutlined, Refresh, CheckCircle, HourglassEmpty } from '@mui/icons-material';
import { leaveAPI, certificateAPI } from '../../services/api';
import { getSharedLeaves, DATA_SYNC_EVENTS, subscribeToDataSync } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';

export default function StudentApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const [leavesRes, certsRes] = await Promise.allSettled([
        leaveAPI.getMyLeaves(),
        certificateAPI.getMyCertificates()
      ]);

      const serverLeaves = (leavesRes.status === 'fulfilled' && (leavesRes.value.data?.data || leavesRes.value.data)) || getSharedLeaves();
      const serverCerts = (certsRes.status === 'fulfilled' && (certsRes.value.data?.data || certsRes.value.data)) || [];

      const combined = [
        ...serverLeaves.map(l => ({
          id: l.id,
          type: `${l.type} Request`,
          description: `${l.reason || 'Leave application'} (${l.fromDate} to ${l.toDate})`,
          date: l.dateApplied,
          approver: l.approvedBy || 'Department Faculty HOD',
          status: l.status
        })),
        ...serverCerts.map(c => ({
          id: c.id,
          type: `${c.type} Clearance`,
          description: `Purpose: ${c.purpose || 'Institutional Document Request'}`,
          date: c.dateApplied || c.issueDate || '2026-09-01',
          approver: 'Academic Registrar / Dean Office',
          status: c.status || 'Approved'
        }))
      ];

      setApprovals(combined);
    } catch (err) {
      console.warn('Failed to fetch approvals from server:', err);
      const leaves = getSharedLeaves();
      setApprovals(leaves.map(l => ({
        id: l.id,
        type: `${l.type} Request`,
        description: `${l.reason} (${l.fromDate} to ${l.toDate})`,
        date: l.dateApplied,
        approver: l.approvedBy || 'Department Faculty HOD',
        status: l.status
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    const unsub = subscribeToDataSync(DATA_SYNC_EVENTS.LEAVE_STATUS_CHANGED, () => loadApprovals());
    const unsubApply = subscribeToDataSync(DATA_SYNC_EVENTS.LEAVE_APPLIED, () => loadApprovals());
    const unsubCert = subscribeToDataSync(DATA_SYNC_EVENTS.CERTIFICATE_REQUESTED, () => loadApprovals());
    return () => {
      unsub();
      unsubApply();
      unsubCert();
    };
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader
        title="My Approvals Tracker"
        subtitle="Real-time institutional status for On-Duty (OD) slips, certificates, event permissions, and leave requests"
        breadcrumbs={[
          { label: 'Dashboard', path: '/student/dashboard' },
          { label: 'My Approvals' }
        ]}
      />

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Approval Status & Verification
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadApprovals}><Refresh fontSize="small" /></IconButton>
          </Tooltip>
        </Box>

        {approvals.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <QuestionAnswerOutlined sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No pending or processed approvals</Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Submitted leave requests, OD approvals, and event permissions will appear here.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {approvals.map((item, idx) => (
              <Box key={idx} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{item.type}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>({item.id})</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: '#475569', mb: 0.5 }}>{item.description}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748b' }}>Authorized Reviewer: <strong>{item.approver}</strong></Typography>
                </Box>
                <Chip
                  label={item.status}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    bgcolor: item.status === 'Approved' ? '#dcfce7' : '#fef9c3',
                    color: item.status === 'Approved' ? '#15803d' : '#854d0e'
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

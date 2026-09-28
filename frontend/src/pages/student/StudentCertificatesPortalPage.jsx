import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Divider
} from '@mui/material';
import {
  WorkspacePremium, Print, Download, Verified, QrCode2
} from '@mui/icons-material';
import { certificateAPI } from '../../services/api';
import {
  getSharedCertificates, requestSharedCertificate, subscribeToDataSync
} from '../../services/dataSync';

export default function StudentCertificatesPortalPage({ initialTab = 0 }) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [certList, setCertList] = useState(getSharedCertificates());
  const [loading, setLoading] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [applyModal, setApplyModal] = useState(false);
  const [certType, setCertType] = useState('Study And Conduct Certificate');
  const [purpose, setPurpose] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await certificateAPI.getMyCertificates();
      const serverCerts = res.data?.data || res.data || [];
      if (Array.isArray(serverCerts) && serverCerts.length > 0) {
        setCertList(serverCerts);
      } else {
        setCertList(getSharedCertificates());
      }
    } catch (err) {
      console.warn('Failed to load certificates from server, using local fallback:', err);
      setCertList(getSharedCertificates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    const unsub = subscribeToDataSync(() => {
      loadCertificates();
    });
    return unsub;
  }, []);

  const getCertTypeName = (idx) => {
    if (idx === 0) return 'Transfer Certificate (TC)';
    if (idx === 1) return 'Custodian Certificate';
    return 'Study And Conduct Certificate';
  };

  const handleOpenApply = () => {
    setCertType(getCertTypeName(tabIndex));
    setApplyModal(true);
    setAppliedSuccess(false);
  };

  const handleApply = async () => {
    if (!purpose) return;
    const newCert = {
      studentName: 'Ritesh Meesala',
      rollNo: '24CS001',
      type: certType,
      purpose,
      applyDate: new Date().toISOString().split('T')[0],
      issueDate: 'Pending Verification',
      status: 'In Processing',
      verifiedBy: 'Registrar Office'
    };

    try {
      const res = await certificateAPI.requestCertificate(newCert);
      const created = res.data?.data || res.data || newCert;
      requestSharedCertificate(created);
      await loadCertificates();
      setAppliedSuccess(true);
      setPurpose('');
    } catch (err) {
      console.error('Error submitting certificate to server:', err);
      requestSharedCertificate(newCert);
      setCertList(getSharedCertificates());
      setAppliedSuccess(true);
      setPurpose('');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkspacePremium sx={{ color: '#2563eb' }} /> Institutional Certificates Portal
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Apply for, generate, and download verified Transfer Certificates (TC), Custodian Certificates, and Study & Conduct Certificates.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Verified />}
          onClick={handleOpenApply}
          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
        >
          Apply for Certificate
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            bgcolor: '#ffffff',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, py: 2, minHeight: 48 },
            '& .Mui-selected': { color: '#2563eb' },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3 }
          }}
        >
          <Tab icon={<WorkspacePremium fontSize="small" />} iconPosition="start" label="Transfer Certificate (TC)" />
          <Tab icon={<WorkspacePremium fontSize="small" />} iconPosition="start" label="Custodian Certificate" />
          <Tab icon={<WorkspacePremium fontSize="small" />} iconPosition="start" label="Study And Conduct Certificate" />
        </Tabs>
      </Paper>

      {/* Certificate Viewer / Card */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              {getCertTypeName(tabIndex)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
              Official digitally signed document with cryptographic verification QR code.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>CANDIDATE NAME</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>RITESH MEESALA</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ROLL / HALL TICKET NO</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>23CS042</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PROGRAM & BRANCH</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>B.Tech - Computer Science & Eng</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>CONDUCT & CHARACTER</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>EXEMPLARY & SATISFACTORY</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Print />}
                onClick={() => setPreviewCert(getCertTypeName(tabIndex))}
                sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb' }}
              >
                Preview & Print
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                onClick={() => setPreviewCert(getCertTypeName(tabIndex))}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Download PDF
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
              Issued Certificate History & Verification Logs
            </Typography>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Certificate No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Certificate Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Issue Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certList.map((cert) => (
                    <TableRow key={cert.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{cert.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e40af' }}>{cert.type}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{cert.issueDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={cert.status}
                          color={cert.status.includes('Issued') || cert.status.includes('Verified') ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Print />} onClick={() => setPreviewCert(cert.type)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Certificate Print Preview Modal */}
      <Dialog open={!!previewCert} onClose={() => setPreviewCert(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Official Certificate Preview</span>
          <Chip label="Official University Document" color="primary" size="small" sx={{ fontWeight: 700 }} />
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              p: 4,
              bgcolor: '#ffffff',
              border: '6px double #0f172a',
              borderRadius: 2,
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
          >
            {/* Header / Watermark */}
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: 1 }}>
              CAMPUS IQ INSTITUTE OF TECHNOLOGY & SCIENCE
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 2 }}>
              (An Autonomous Institution Approved by AICTE, Affiliated to University & Accredited by NAAC with 'A+' Grade)
            </Typography>
            <Divider sx={{ my: 2, borderColor: '#0f172a' }} />

            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e40af', textDecoration: 'underline', my: 2 }}>
              {previewCert?.toUpperCase()}
            </Typography>

            <Typography variant="body1" sx={{ color: '#1e293b', lineHeight: 2, textAlign: 'justify', my: 3 }}>
              This is to certify that Mr./Ms. <strong>RITESH MEESALA</strong>, bearing Hall Ticket Number <strong>23CS042</strong>, is a bonafide student of this institution pursuing <strong>Bachelor of Technology (B.Tech)</strong> in <strong>Computer Science & Engineering</strong> during the academic period <strong>2023 - 2027</strong>.
              <br /><br />
              During his/her period of study in this college, his/her academic performance has been outstanding and conduct has been found to be <strong>EXEMPLARY & SATISFACTORY</strong>.
            </Typography>

            <Grid container spacing={2} sx={{ mt: 4, pt: 3, alignItems: 'center' }}>
              <Grid item xs={4} sx={{ textAlign: 'left' }}>
                <QrCode2 sx={{ fontSize: 72, color: '#0f172a' }} />
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>
                  Scan to Verify Online
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Chip icon={<Verified />} label="OFFICIAL SEAL" color="primary" sx={{ fontWeight: 800 }} />
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  REGISTRAR & PRINCIPAL
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Campus IQ Autonomous College
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewCert(null)} sx={{ textTransform: 'none' }}>Close</Button>
          <Button variant="contained" startIcon={<Print />} sx={{ textTransform: 'none', bgcolor: '#2563eb' }} onClick={() => window.print()}>
            Print Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Certificate Modal */}
      <Dialog open={applyModal} onClose={() => setApplyModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply for Official Certificate</DialogTitle>
        <DialogContent dividers>
          {appliedSuccess ? (
            <Alert severity="success">
              Application submitted! Your digital certificate will be generated and signed within 24 hours. Ref: #REQ-CERT-2026-990
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Certificate Type"
                fullWidth
                size="small"
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
              >
                <MenuItem value="Transfer Certificate (TC)">Transfer Certificate (TC)</MenuItem>
                <MenuItem value="Custodian Certificate">Custodian Certificate</MenuItem>
                <MenuItem value="Study And Conduct Certificate">Study And Conduct Certificate</MenuItem>
              </TextField>
              <TextField
                label="Purpose / Reason of Requirement"
                multiline
                rows={3}
                fullWidth
                placeholder="E.g. Passport application, higher education abroad, visa verification, educational loan..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApplyModal(false)} sx={{ textTransform: 'none' }}>Close</Button>
          {!appliedSuccess && (
            <Button variant="contained" onClick={handleApply} disabled={!purpose} sx={{ textTransform: 'none', bgcolor: '#2563eb' }}>
              Submit Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

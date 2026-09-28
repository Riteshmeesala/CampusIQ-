import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Chip, Divider, Grid, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, IconButton,
} from '@mui/material';
import { Upload, CheckCircle, Info, RestartAlt, PersonAdd } from '@mui/icons-material';
import { userAPI, cgpaUploadAPI } from '../../services/api';
import { updateSharedStudentCgpa } from '../../services/dataSync';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';

/**
 * PublishCGPAPage  —  ADMIN ONLY
 *
 * Admin can:
 *  • Enter a CGPA (0–10) for each student manually, OR
 *  • Paste / upload a CSV in the format:  studentId,cgpa
 *
 * Semester field (optional):
 *  • Leave blank  → record is treated as cumulative CGPA
 *  • Select 1-8   → record is stored as SGPA for that semester
 */
export default function PublishCGPAPage() {

  const [students,  setStudents]  = useState([]);
  const [cgpaMap,   setCgpaMap]   = useState({});       // { studentId: cgpaString }
  const [semester,  setSemester]  = useState('');       // '' = cumulative
  const [remarks,   setRemarks]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [published, setPublished] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [csvText,   setCsvText]   = useState('');
  const [csvError,  setCsvError]  = useState('');

  // Manual Student Entry Modal State
  const [manualStudentDialog, setManualStudentDialog] = useState(false);
  const [manualStudentForm, setManualStudentForm] = useState({
    rollNo: '',
    name: '',
    cgpa: '',
    department: 'Computer Science'
  });

  const handleAddManualStudent = () => {
    if (!manualStudentForm.rollNo.trim() || !manualStudentForm.cgpa.trim()) {
      toast.warning('Please enter Roll Number and CGPA');
      return;
    }
    const val = parseFloat(manualStudentForm.cgpa);
    if (isNaN(val) || val < 0 || val > 10) {
      toast.warning('CGPA must be between 0.00 and 10.00');
      return;
    }
    const matched = students.find(s => s.enrollmentNumber?.toLowerCase() === manualStudentForm.rollNo.trim().toLowerCase());
    const studentId = matched ? matched.id : Date.now();

    if (!matched) {
      const newS = {
        id: studentId,
        enrollmentNumber: manualStudentForm.rollNo.trim().toUpperCase(),
        name: manualStudentForm.name.trim() || manualStudentForm.rollNo.trim().toUpperCase(),
        department: manualStudentForm.department
      };
      setStudents(prev => [newS, ...prev]);
    }

    setCgpaMap(prev => ({ ...prev, [studentId]: String(val) }));
    toast.success(`Added ${manualStudentForm.rollNo} with CGPA ${val} to publishing list!`);
    setManualStudentDialog(false);
    setManualStudentForm({ rollNo: '', name: '', cgpa: '', department: 'Computer Science' });
  };

  /* ── Load students ────────────────────────────────────────── */
  useEffect(() => {
    userAPI.getStudents()
      .then(r => {
        const list = r.data.data || [];
        setStudents(list);
        const init = {};
        list.forEach(s => { init[s.id] = ''; });
        setCgpaMap(init);
      })
      .catch(() => toast.error('Failed to load students'));
  }, []);

  /* ── Helpers ──────────────────────────────────────────────── */
  const handleCgpaChange = (studentId, value) =>
    setCgpaMap(prev => ({ ...prev, [studentId]: value }));

  const filledCount = Object.values(cgpaMap).filter(v => v !== '').length;

  const getCgpaColor = (v) => {
    if (!v || isNaN(v)) return {};
    const n = parseFloat(v);
    if (n >= 8.5) return { bgcolor: '#dcfce7', color: '#166534' };
    if (n >= 7.0) return { bgcolor: '#dbeafe', color: '#1e40af' };
    if (n >= 5.0) return { bgcolor: '#fef9c3', color: '#854d0e' };
    return { bgcolor: '#fee2e2', color: '#dc2626' };
  };

  /* ── CSV import ───────────────────────────────────────────── */
  const handleCsvImport = () => {
    setCsvError('');
    const lines = csvText.trim().split('\n').filter(Boolean);
    const updated = { ...cgpaMap };
    const errors  = [];

    lines.forEach((line, idx) => {
      const [idPart, cgpaPart] = line.split(',').map(s => s.trim());
      const id   = parseInt(idPart);
      const cgpa = parseFloat(cgpaPart);

      if (isNaN(id))   { errors.push(`Line ${idx + 1}: invalid student ID "${idPart}"`); return; }
      if (isNaN(cgpa)) { errors.push(`Line ${idx + 1}: invalid CGPA "${cgpaPart}"`); return; }
      if (cgpa < 0 || cgpa > 10) { errors.push(`Line ${idx + 1}: CGPA must be 0–10`); return; }

      updated[id] = String(cgpa);
    });

    if (errors.length) { setCsvError(errors.join(' | ')); return; }
    setCgpaMap(updated);
    setCsvText('');
    toast.success('CSV imported successfully');
  };

  /* ── Reset ────────────────────────────────────────────────── */
  const handleReset = () => {
    const init = {};
    students.forEach(s => { init[s.id] = ''; });
    setCgpaMap(init);
    setRemarks('');
    setSemester('');
    setPublished([]);
    setCsvText('');
    setCsvError('');
  };

  /* ── Publish ──────────────────────────────────────────────── */
  const handlePublish = async () => {
    if (filledCount === 0) { toast.warning('Enter CGPA for at least one student'); return; }

    const studentCgpaMap = {};
    for (const [id, val] of Object.entries(cgpaMap)) {
      if (val === '') continue;
      const n = parseFloat(val);
      if (isNaN(n) || n < 0 || n > 10) {
        toast.error(`Invalid CGPA for student ID ${id} — must be between 0 and 10`);
        return;
      }
      studentCgpaMap[id] = n;
    }

    setConfirmOpen(false);
    setSaving(true);
    try {
      const res = await cgpaUploadAPI.publishCgpa({
        studentCgpaMap,
        semester: semester === '' ? null : parseInt(semester),
        remarks,
      });
      const records = res.data.data || [];
      setPublished(records);

      // Single source of truth: Sync to cross-role shared store and emit live event
      for (const [id, val] of Object.entries(studentCgpaMap)) {
        updateSharedStudentCgpa(Number(id), val, semester === '' ? null : parseInt(semester), remarks);
      }

      toast.success(`✅ ${records.length || Object.keys(studentCgpaMap).length} CGPA record(s) updated successfully across Student, Faculty & Admin!`);
      handleReset();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to publish CGPA');
    } finally {
      setSaving(false);
    }
  };

  /* ── UI ───────────────────────────────────────────────────── */
  return (
    <Box>
      <PageHeader
        title="Publish Student CGPAs"
        subtitle="Admin: Upload official CGPA / SGPA values — students can view them instantly"
        breadcrumbs={['Home', 'Admin', 'Publish CGPA']}
      />

      <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
        🔒 <strong>Admin-only action.</strong> Published CGPA values are immediately visible to
        students in their GPA tracker. Double-check values before publishing.
      </Alert>

      {/* ── Step 1: Settings ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={2}>Step 1 — Configure Upload</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Semester (optional)</InputLabel>
                <Select
                  value={semester}
                  label="Semester (optional)"
                  onChange={e => setSemester(e.target.value)}
                >
                  <MenuItem value="">— Cumulative CGPA —</MenuItem>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <MenuItem key={s} value={String(s)}>Semester {s} (SGPA)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth size="small" label="Remarks (optional)"
                value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="e.g., End-semester 2025 results"
              />
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Leave semester blank to publish cumulative CGPA. Select a semester number to publish SGPA for that semester.
          </Typography>
        </CardContent>
      </Card>

      {/* ── Step 2: CSV import ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>Step 2 — CSV Import (optional)</Typography>
            <Tooltip title="Format: one entry per line → studentId,cgpa  e.g.  101,8.75">
              <IconButton size="small"><Info fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Paste CSV rows (studentId,cgpa) to auto-fill the table below. Format: <code>101,8.75</code>
          </Typography>
          <TextField
            fullWidth multiline rows={4} size="small"
            label="Paste CSV here"
            value={csvText}
            onChange={e => { setCsvText(e.target.value); setCsvError(''); }}
            placeholder={"101,8.75\n102,7.50\n103,9.00"}
            sx={{ fontFamily: 'monospace' }}
          />
          {csvError && (
            <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>{csvError}</Alert>
          )}
          <Button
            variant="outlined" size="small" sx={{ mt: 1.5 }}
            onClick={handleCsvImport}
            disabled={!csvText.trim()}
          >
            Import CSV
          </Button>
        </CardContent>
      </Card>

      {/* ── Step 3: Manual entry table ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>Step 3 — Enter / Review CGPA Values</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setManualStudentDialog(true)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: COLORS.primary }}
              >
                ➕ Add Student Manually
              </Button>
              <Chip
                label={`${filledCount}/${students.length} filled`}
                size="small"
                sx={{ bgcolor: filledCount > 0 ? '#dcfce7' : '#f1f5f9',
                      color: filledCount > 0 ? '#166534' : '#64748b', fontWeight: 700 }}
              />
              <Button size="small" startIcon={<RestartAlt />} onClick={handleReset}
                sx={{ color: 'text.secondary' }}>Reset</Button>
            </Box>
          </Box>
          <Divider />
          <TableContainer sx={{ maxHeight: 480, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Enrollment No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 160 }}>CGPA (0 – 10)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map(s => {
                  const val = cgpaMap[s.id] || '';
                  const n   = parseFloat(val);
                  const valid = val !== '' && !isNaN(n) && n >= 0 && n <= 10;
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {s.enrollmentNumber || s.username}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {s.department || '—'}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" type="number" value={val}
                          onChange={e => handleCgpaChange(s.id, e.target.value)}
                          inputProps={{ min: 0, max: 10, step: 0.01 }}
                          sx={{ width: 120 }}
                          placeholder="e.g. 8.75"
                          error={val !== '' && !valid}
                          helperText={val !== '' && !valid ? 'Must be 0–10' : ''}
                        />
                      </TableCell>
                      <TableCell>
                        {valid ? (
                          <Chip
                            label={n.toFixed(2)}
                            size="small"
                            sx={{ fontWeight: 700, ...getCgpaColor(val) }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── Publish button ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained" size="large"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Upload />}
          disabled={saving || filledCount === 0}
          onClick={() => setConfirmOpen(true)}
          sx={{ borderRadius: 2, bgcolor: COLORS.primary, px: 4 }}
        >
          {saving ? 'Publishing…' : `Publish ${filledCount} CGPA Record(s)`}
        </Button>
      </Box>

      {/* ── Published summary ── */}
      {published.length > 0 && (
        <Card sx={{ mt: 3, border: `2px solid ${COLORS.excellent}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <CheckCircle sx={{ color: COLORS.excellent }} />
              <Typography variant="h6" fontWeight={700} color={COLORS.excellent}>
                ✅ CGPA Records Published!
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {published.length} student(s) can now view their official CGPA.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CGPA</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {published.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.student?.name}</TableCell>
                      <TableCell>{r.semester ? `Sem ${r.semester}` : 'Cumulative'}</TableCell>
                      <TableCell>
                        <Chip label={parseFloat(r.cgpaValue).toFixed(2)} size="small"
                          sx={{ fontWeight: 700, ...getCgpaColor(String(r.cgpaValue)) }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {r.remarks || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Confirm dialog ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm CGPA Publish</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You are about to publish official CGPA values for{' '}
            <strong>{filledCount} student(s)</strong>
            {semester ? ` for Semester ${semester}` : ' (Cumulative CGPA)'}.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
            Students will immediately see these values in their GPA Tracker.
            This action can be corrected by publishing updated values.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handlePublish} variant="contained"
            sx={{ bgcolor: COLORS.primary, borderRadius: 2 }}>
            Yes, Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Student CGPA Entry Dialog */}
      <Dialog open={manualStudentDialog} onClose={() => setManualStudentDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>
          ➕ Add Student to CGPA Ledger
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            label="Roll Number / Enrollment No. *"
            size="small"
            placeholder="e.g. 24CS001"
            value={manualStudentForm.rollNo}
            onChange={e => setManualStudentForm(p => ({ ...p, rollNo: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Student Full Name (optional)"
            size="small"
            placeholder="e.g. Ritesh Meesala"
            value={manualStudentForm.name}
            onChange={e => setManualStudentForm(p => ({ ...p, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="CGPA / SGPA (0.00 – 10.00) *"
            size="small"
            type="number"
            placeholder="e.g. 8.95"
            value={manualStudentForm.cgpa}
            onChange={e => setManualStudentForm(p => ({ ...p, cgpa: e.target.value }))}
            inputProps={{ min: 0, max: 10, step: 0.01 }}
            fullWidth
          />
          <TextField
            label="Department"
            size="small"
            value={manualStudentForm.department}
            onChange={e => setManualStudentForm(p => ({ ...p, department: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualStudentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddManualStudent} sx={{ bgcolor: COLORS.primary }}>
            Add to List
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
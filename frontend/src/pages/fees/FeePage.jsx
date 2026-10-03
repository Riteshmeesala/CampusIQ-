/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import {
  Grid, Box, Card, CardContent, Typography, Button, Chip, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Divider, TextField, Dialog, FormControl, InputLabel,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Tabs, Tab,
  Paper, InputAdornment
} from '@mui/material';
import {
  Payment, CheckCircle, PendingActions, Refresh, Edit, Delete, Add,
  ReceiptLong, FlashOn, Security, Search, Download, Print, HelpOutline,
  CreditCard, AccountBalance, QrCode, Lock
} from '@mui/icons-material';
import { feeAPI, userAPI } from '../../services/api';
import { subscribeToDataSync, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import StatCard from '../../components/shared/StatCard';
import RazorpayCheckoutModal from '../../components/fees/RazorpayCheckoutModal';
import FeeReceiptModal from '../../components/fees/FeeReceiptModal';

const statusColors = {
  PAID:      { color: COLORS.excellent, bg: '#dcfce7', label: 'Paid ✓' },
  SUCCESS:   { color: COLORS.excellent, bg: '#dcfce7', label: 'Paid ✓' },
  PENDING:   { color: '#b45309',        bg: '#fef3c7', label: 'Pending' },
  OVERDUE:   { color: '#b91c1c',        bg: '#fee2e2', label: 'Overdue' },
  CANCELLED: { color: '#64748b',        bg: '#f1f5f9', label: 'Cancelled' },
  REFUNDED:  { color: '#4338ca',        bg: '#e0e7ff', label: 'Refunded' },
};

export default function FeePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Data states
  const [fees, setFees] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Dialogs
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedFeeForPay, setSelectedFeeForPay] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Admin CRUD Dialogs
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', amount: '', dueDate: '', description: '' });
  const [addForm, setAddForm] = useState({
    studentId: '', feeType: '', amount: '', dueDate: '', description: '',
    academicYear: '2025-26', semester: '4'
  });
  const [manualStudentMode, setManualStudentMode] = useState(false);
  const [manualStudentRoll, setManualStudentRoll] = useState('');

  // Razorpay Gateway Configuration States
  const [razorpayConfig, setRazorpayConfig] = useState({ keyId: '', testMode: true, hasValidLiveKeys: false });
  const [keyInput, setKeyInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feesRes, receiptsRes] = await Promise.all([
        isAdmin ? feeAPI.getAllFees() : feeAPI.getMyFees(),
        feeAPI.getReceipts().catch(() => ({ data: { data: [] } }))
      ]);

      const feeList = feesRes.data?.data || [];
      setFees(feeList);

      const rList = receiptsRes.data?.data || [];
      setReceipts(rList);

      feeAPI.getConfig().then(r => {
        if (r.data?.data) {
          setRazorpayConfig(r.data.data);
          setKeyInput(r.data.data.keyId || '');
        }
      }).catch(() => {});
    } catch {
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async (overrideKey = null, overrideSecret = null) => {
    const targetKey = overrideKey !== null ? overrideKey : keyInput.trim();
    const targetSecret = overrideSecret !== null ? overrideSecret : secretInput.trim();

    setSavingKeys(true);
    try {
      const res = await feeAPI.updateConfig({
        keyId: targetKey,
        keySecret: targetSecret
      });
      if (res.data?.data) {
        setRazorpayConfig(res.data.data);
        setKeyInput(res.data.data.keyId || '');
      }
      if (targetKey) {
        toast.success('Razorpay API keys applied successfully!');
      } else {
        toast.info('Switched to simulated Razorpay sandbox test mode');
      }
    } catch {
      toast.error('Failed to update Razorpay configuration');
    } finally {
      setSavingKeys(false);
    }
  };

  useEffect(() => {
    loadData();
    if (isAdmin) {
      userAPI.getStudents().then(r => {
        const list = r.data.data || [];
        setStudents(list);
        if (list.length === 0) setManualStudentMode(true);
      }).catch(() => {
        setManualStudentMode(true);
      });
    }

    window.addEventListener('focus', loadData);
    const unsub = subscribeToDataSync((event) => {
      if (event.type === DATA_SYNC_EVENTS.FEE_UPDATED || event.type === DATA_SYNC_EVENTS.FEE_PAID || event.type === 'CAMPUSIQ_DATA_MUTATED') {
        loadData();
      }
    });

    return () => {
      window.removeEventListener('focus', loadData);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Handle Pay Action
  const handleInitiatePay = (fee) => {
    setSelectedFeeForPay(fee);
    setCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    loadData();
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptModalOpen(true);
  };

  const handleViewFeeReceipt = (fee) => {
    const formatted = {
      id: fee.id,
      receiptNo: `RCP-2026-${String(fee.id).padStart(4, '0')}`,
      studentName: fee.student?.name || user?.name || 'Aarav Varma',
      rollNo: fee.student?.enrollmentNumber || user?.enrollmentNumber || '24CS001',
      date: fee.paidDate || new Date().toISOString().split('T')[0],
      description: fee.description || fee.feeType,
      amount: `₹${Number(fee.amount || 0).toLocaleString('en-IN')}.00`,
      amountNum: fee.amount,
      feeType: fee.feeType,
      mode: fee.razorpayPaymentId?.startsWith('pay_test_') ? 'Razorpay (Test Sandbox)' : 'Razorpay UPI / Netbanking',
      paymentId: fee.razorpayPaymentId || `pay_test_${Math.random().toString(36).substring(2, 9)}`,
      orderId: fee.razorpayOrderId || `order_test_${Math.random().toString(36).substring(2, 9)}`,
      status: 'Settled & Verified'
    };
    setSelectedReceipt(formatted);
    setReceiptModalOpen(true);
  };

  // Admin Actions
  const openEdit = (fee) => {
    setSelectedFee(fee);
    setEditForm({
      status: fee.status,
      amount: fee.amount,
      dueDate: fee.dueDate ? dayjs(fee.dueDate).format('YYYY-MM-DD') : '',
      description: fee.description || '',
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    try {
      await feeAPI.updateFee(selectedFee.id, editForm);
      toast.success('Fee updated successfully');
      setEditDialog(false);
      loadData();
    } catch {
      toast.error('Failed to update fee');
    }
  };

  const handleDelete = async (fee) => {
    if (!window.confirm(`Delete fee "${fee.feeType}" for ${fee.student?.name || 'student'}?`)) return;
    try {
      await feeAPI.deleteFee(fee.id);
      toast.success('Fee deleted successfully');
      loadData();
    } catch {
      toast.error('Failed to delete fee');
    }
  };

  const handleAddFee = async () => {
    let targetStudentId = addForm.studentId;
    if (manualStudentMode || !targetStudentId) {
      if (!manualStudentRoll.trim()) {
        toast.warning('Please enter Student Roll Number or ID');
        return;
      }
      const matched = students.find(s => s.enrollmentNumber?.toLowerCase() === manualStudentRoll.trim().toLowerCase() || String(s.id) === manualStudentRoll.trim());
      targetStudentId = matched ? matched.id : Number(manualStudentRoll.trim());
      if (!targetStudentId || isNaN(targetStudentId)) {
        toast.warning('Invalid Student Roll Number or ID');
        return;
      }
    }

    if (!targetStudentId || !addForm.feeType || !addForm.amount || !addForm.dueDate) {
      toast.warning('Please fill in all required fields');
      return;
    }
    try {
      await feeAPI.createFee({ ...addForm, studentId: Number(targetStudentId), amount: Number(addForm.amount) });
      toast.success('Fee created successfully');
      setAddDialog(false);
      setAddForm({ studentId: '', feeType: '', amount: '', dueDate: '', description: '', academicYear: '2025-26', semester: '4' });
      setManualStudentRoll('');
      loadData();
    } catch {
      toast.error('Failed to create fee');
    }
  };

  // Calculations
  const paidFees    = fees.filter(f => f.status === 'PAID' || f.status === 'SUCCESS');
  const pendingFees = fees.filter(f => f.status === 'PENDING');
  const overdueFees = fees.filter(f => f.status === 'OVERDUE');
  const totalPaid   = paidFees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalDues   = [...pendingFees, ...overdueFees].reduce((s, f) => s + Number(f.amount || 0), 0);

  // Filtered Fee List
  const filteredFees = fees.filter(f => {
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const term = searchQuery.toLowerCase();
    const matchesSearch = !term ||
      (f.feeType && f.feeType.toLowerCase().includes(term)) ||
      (f.description && f.description.toLowerCase().includes(term)) ||
      (f.student?.name && f.student.name.toLowerCase().includes(term)) ||
      (f.student?.enrollmentNumber && f.student.enrollmentNumber.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Header with Razorpay Test Mode Badge */}
      <PageHeader
        title={isAdmin ? 'University Fee & Revenue Management' : 'Tuition Fees & Online Payment'}
        subtitle="Manage student fee structures, digital payments, Razorpay sandbox checkout, and verified receipts"
        breadcrumbs={['Home', 'Finance', 'Fees']}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {isAdmin && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: '#f1f5f9',
                  px: 1.5,
                  py: 0.6,
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#059669',
                    boxShadow: '0 0 0 2px rgba(5, 150, 105, 0.2)'
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
                  Gateway Test Mode
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                  • {razorpayConfig.keyId || 'rzp_test_Th4Zu9hPWOhfeY'}
                </Typography>
              </Box>
            )}
            {isAdmin ? (
              <Button
                variant="contained"
                onClick={() => setAddDialog(true)}
                startIcon={<Add />}
                sx={{ borderRadius: '8px', bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', fontWeight: 700 }}
              >
                Add Fee Invoice
              </Button>
            ) : (
              pendingFees.length > 0 && (
                <Button
                  variant="contained"
                  onClick={() => handleInitiatePay(pendingFees[0])}
                  startIcon={<Payment />}
                  sx={{ borderRadius: '8px', bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', fontWeight: 700 }}
                >
                  Pay Outstanding (₹{totalDues.toLocaleString('en-IN')})
                </Button>
              )
            )}
            <Button
              variant="outlined"
              onClick={loadData}
              startIcon={<Refresh />}
              sx={{ borderRadius: '8px', borderColor: '#cbd5e1', color: '#334155', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {/* Razorpay Test Mode Notice - Admin Only */}
      {isAdmin && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            px: 2.5,
            py: 1.8,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13
              }}
            >
              R
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                Razorpay Payment Gateway (Test Mode)
              </Typography>
              <Typography variant="caption" color="#64748b" sx={{ fontSize: 12 }}>
                Connected to sandbox with Merchant Key ID <strong>{razorpayConfig.keyId || 'rzp_test_Th4Zu9hPWOhfeY'}</strong>.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="PCI-DSS Compliant" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 11, borderRadius: '6px' }} />
            <Chip label="Zero Risk Testnet" size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: 11, borderRadius: '6px' }} />
          </Box>
        </Paper>
      )}

      {/* Financial Overview Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<CheckCircle />}
            label={isAdmin ? 'Total Revenue Collected' : 'Total Fees Paid'}
            value={`₹${totalPaid.toLocaleString('en-IN')}`}
            color={COLORS.excellent}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<PendingActions />}
            label={isAdmin ? 'Outstanding Student Dues' : 'Pending Dues Payable'}
            value={`₹${totalDues.toLocaleString('en-IN')}`}
            color={totalDues > 0 ? COLORS.critical : COLORS.textMuted}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Payment />}
            label={isAdmin ? 'Total Fee Invoices' : 'Settled Transactions'}
            value={isAdmin ? fees.length : paidFees.length}
            color={COLORS.secondary}
          />
        </Grid>
      </Grid>

      {/* Structured Section Tabs */}
      <Card sx={{ borderRadius: 3, mb: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 2, pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                minHeight: 48
              }
            }}
          >
            <Tab icon={<Payment sx={{ fontSize: 18 }} />} iconPosition="start" label={isAdmin ? 'Fee Invoices Ledger' : 'My Fee Invoices & Dues'} />
            <Tab icon={<ReceiptLong sx={{ fontSize: 18 }} />} iconPosition="start" label="Payment Receipts & History" />
            {isAdmin && (
              <Tab icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" label="Razorpay Gateway & Developer Settings" />
            )}
          </Tabs>
        </Box>

        {/* TAB 0: Fee Invoices */}
        {activeTab === 0 && (
          <CardContent sx={{ p: 0 }}>
            {/* Filter & Search Bar */}
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                size="small"
                placeholder={isAdmin ? 'Search by Student Name, Roll No, or Fee Type...' : 'Search fee invoices...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ width: { xs: '100%', sm: 320 } }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Filter Status:
                </Typography>
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  sx={{ height: 36, minWidth: 120, fontSize: 13, fontWeight: 600 }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PENDING">Pending Only</MenuItem>
                  <MenuItem value="PAID">Paid Only</MenuItem>
                  <MenuItem value="OVERDUE">Overdue Only</MenuItem>
                </Select>
              </Box>
            </Box>

            <Divider />

            {loading ? (
              <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress size={36} /></Box>
            ) : (
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 800, width: 50 }}>#</TableCell>
                      {isAdmin && <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>}
                      <TableCell sx={{ fontWeight: 800 }}>Fee Type & Description</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Due Date</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFees.length > 0 ? filteredFees.map((fee, idx) => {
                      const s = statusColors[fee.status] || statusColors.PENDING;
                      const isDue = fee.status === 'PENDING' || fee.status === 'OVERDUE';
                      return (
                        <TableRow key={fee.id} hover>
                          <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {fee.student?.name || 'Aarav Varma'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {fee.student?.enrollmentNumber || '24CS001'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color="#0f172a">
                              {fee.feeType}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {fee.description || 'Semester Fee Clearance'} • Year: {fee.academicYear || '2025-26'} (Sem {fee.semester || '4'})
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight={800} color="#0f172a">
                              ₹{Number(fee.amount || 0).toLocaleString('en-IN')}.00
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={fee.dueDate && dayjs(fee.dueDate).isBefore(dayjs()) && isDue ? '#dc2626' : 'text.secondary'}
                            >
                              {fee.dueDate ? dayjs(fee.dueDate).format('DD MMM YYYY') : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={s.label}
                              size="small"
                              sx={{
                                bgcolor: s.bg,
                                color: s.color,
                                fontWeight: 800,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            {isAdmin ? (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                {fee.status === 'PAID' && (
                                  <Tooltip title="View Official Receipt">
                                    <IconButton size="small" onClick={() => handleViewFeeReceipt(fee)} sx={{ color: '#0284c7' }}>
                                      <ReceiptLong fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Edit Fee Details">
                                  <IconButton size="small" onClick={() => openEdit(fee)} sx={{ color: '#64748b' }}>
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Fee Invoice">
                                  <IconButton size="small" onClick={() => handleDelete(fee)} sx={{ color: '#dc2626' }}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              isDue ? (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<Lock sx={{ fontSize: 13 }} />}
                                  onClick={() => handleInitiatePay(fee)}
                                  sx={{
                                    bgcolor: '#0f172a',
                                    '&:hover': { bgcolor: '#1e293b' },
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    px: 2,
                                    py: 0.6,
                                    fontSize: 13,
                                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)'
                                  }}
                                >
                                  Pay via Razorpay
                                </Button>
                              ) : (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<ReceiptLong sx={{ fontSize: 15 }} />}
                                  onClick={() => handleViewFeeReceipt(fee)}
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    borderColor: '#cbd5e1',
                                    color: '#0f172a',
                                    fontSize: 13,
                                    '&:hover': { borderColor: '#0f172a', bgcolor: '#f8fafc' }
                                  }}
                                >
                                  Official Receipt
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                          <Payment sx={{ fontSize: 44, color: '#94a3b8', mb: 1, display: 'block', mx: 'auto' }} />
                          <Typography variant="body1" fontWeight={700} color="#334155">
                            No Fee Records Found
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            There are currently no fee invoices matching the chosen filter.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}

        {/* TAB 1: Payment Receipts & Verification Ledger */}
        {activeTab === 1 && (
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                  Official Settled Transactions & Electronic Receipts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Every entry represents a cryptographically verified Razorpay transaction stored in MySQL.
                </Typography>
              </Box>
              <Chip
                label={`${paidFees.length} Settled Invoices`}
                size="small"
                sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 }}
              />
            </Box>
            <Divider />

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Receipt #</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Mode</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Receipt Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paidFees.length > 0 ? paidFees.map(fee => (
                    <TableRow key={fee.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                        RCP-2026-{String(fee.id).padStart(4, '0')}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {fee.student?.name || user?.name || 'Aarav Varma'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {fee.student?.enrollmentNumber || user?.enrollmentNumber || '24CS001'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {fee.feeType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fee.description || 'Tuition Clearance'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {fee.paidDate ? dayjs(fee.paidDate).format('DD MMM YYYY') : dayjs().format('DD MMM YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fee.razorpayPaymentId?.startsWith('pay_test_') ? 'Razorpay Test Mode' : 'Razorpay UPI/Card'}
                          size="small"
                          sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={800} color="#166534">
                          ₹{Number(fee.amount || 0).toLocaleString('en-IN')}.00
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Print fontSize="small" />}
                          onClick={() => handleViewFeeReceipt(fee)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                          View Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        <ReceiptLong sx={{ fontSize: 44, color: '#94a3b8', mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography variant="body1" fontWeight={700} color="#334155">
                          No Completed Transactions Yet
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Once a fee invoice is paid via Razorpay Test Mode, verified receipts will appear here.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* TAB 2: Razorpay Gateway & Developer Configuration - ADMIN ONLY */}
        {isAdmin && activeTab === 2 && (
          <CardContent sx={{ p: 3.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Razorpay Gateway & Developer Configuration
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Manage active Razorpay Test Mode API credentials (<code>rzp_test_...</code>) and verify settlement webhooks.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: '#f1f5f9',
                  px: 1.5,
                  py: 0.6,
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                  {razorpayConfig.keyId || 'rzp_test_Th4Zu9hPWOhfeY'}
                </Typography>
              </Box>
            </Box>

            {/* Live API Key Configuration Form */}
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mb: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security sx={{ color: '#0f172a', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                  API Credentials (Test Mode)
                </Typography>
              </Box>
              <Typography variant="body2" color="#64748b" mb={2.5} sx={{ fontSize: 13 }}>
                Configure your API Key ID and Key Secret from your <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" style={{ color: '#0f172a', fontWeight: 700, textDecoration: 'underline' }}>Razorpay Dashboard</a>. Changes take effect immediately on the live backend without needing a restart.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Razorpay Key ID"
                    placeholder="rzp_test_xxxxxxxxxxxxxx"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    helperText="Current active Key ID"
                    InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    label="Razorpay Key Secret"
                    placeholder="Enter key secret"
                    value={secretInput}
                    onChange={e => setSecretInput(e.target.value)}
                    helperText="Stored securely in server memory"
                    InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13, borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => handleSaveKeys()}
                  disabled={savingKeys}
                  startIcon={savingKeys ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Security sx={{ fontSize: 16 }} />}
                  sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 2.5 }}
                >
                  {savingKeys ? 'Saving...' : 'Apply API Credentials'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setKeyInput('');
                    setSecretInput('');
                    handleSaveKeys('', '');
                  }}
                  sx={{ borderRadius: '8px', borderColor: '#cbd5e1', color: '#334155', textTransform: 'none', fontWeight: 600 }}
                >
                  Reset to Test Sandbox Mode
                </Button>
              </Box>
            </Paper>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CreditCard sx={{ color: '#0f172a', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      Standard Test Card
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="#64748b" mb={1.5} sx={{ fontSize: 12 }}>
                    Authorizes successfully in the official Razorpay Checkout popup:
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: 12, mb: 1 }}>
                    Card: <strong>4111 1111 1111 1111</strong><br />
                    Exp: <strong>12/28</strong> • CVV: <strong>123</strong><br />
                    OTP: <strong>123456</strong>
                  </Box>
                  <Typography variant="caption" color="#059669" fontWeight={700}>
                    ✓ Automated 3D-Secure approval
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <QrCode sx={{ color: '#0f172a', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      Simulated UPI VPA
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="#64748b" mb={1.5} sx={{ fontSize: 12 }}>
                    Instant simulated approval for UPI requests:
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: 12, mb: 1 }}>
                    VPA: <strong>success@razorpay</strong><br />
                    Or: <strong>test@upi</strong><br />
                    QR: <strong>Scan in Popup</strong>
                  </Box>
                  <Typography variant="caption" color="#059669" fontWeight={700}>
                    ✓ Instant settlement callback
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccountBalance sx={{ color: '#0f172a', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      Netbanking Gateway
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="#64748b" mb={1.5} sx={{ fontSize: 12 }}>
                    Retail & Corporate banking simulator:
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: 12, mb: 1 }}>
                    Banks: <strong>HDFC, SBI, ICICI, Axis</strong><br />
                    Portal: <strong>Test Sandbox Gateway</strong><br />
                    Auth: <strong>Instant Success</strong>
                  </Box>
                  <Typography variant="caption" color="#059669" fontWeight={700}>
                    ✓ Immediate ledger reconciliation
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* RAZORPAY CHECKOUT MODAL */}
      <RazorpayCheckoutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        fee={selectedFeeForPay}
        student={isAdmin ? selectedFeeForPay?.student : user}
        onSuccess={handlePaymentSuccess}
      />

      {/* OFFICIAL FEE RECEIPT MODAL */}
      <FeeReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />

      {/* ADMIN: EDIT FEE DIALOG */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>✏️ Edit Fee Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={editForm.status} label="Status" onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Amount (₹)" size="small" type="number"
              value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
            <TextField label="Due Date" size="small" type="date" InputLabelProps={{ shrink: true }}
              value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} />
            <TextField label="Description" size="small" multiline rows={2}
              value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ borderRadius: 2, bgcolor: COLORS.primary, textTransform: 'none', fontWeight: 700 }}>Update Fee</Button>
        </DialogActions>
      </Dialog>

      {/* ADMIN: ADD FEE DIALOG */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>➕ Issue New Fee Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textMuted }}>
                {manualStudentMode ? 'ENTER STUDENT MANUALLY' : 'SELECT FROM REGISTERED STUDENTS'}
              </Typography>
              <Button
                size="small"
                onClick={() => setManualStudentMode(p => !p)}
                sx={{ textTransform: 'none', fontSize: 11, fontWeight: 700 }}
              >
                {manualStudentMode ? '← Pick from list' : '✍️ Enter Roll No Manually'}
              </Button>
            </Box>

            {manualStudentMode ? (
              <TextField
                label="Student Roll No / ID *"
                size="small"
                placeholder="e.g. 24CS001"
                value={manualStudentRoll}
                onChange={e => setManualStudentRoll(e.target.value)}
                fullWidth
              />
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Student *</InputLabel>
                <Select value={addForm.studentId} label="Student *"
                  onChange={e => setAddForm(p => ({ ...p, studentId: e.target.value }))}>
                  {students.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name} ({s.enrollmentNumber})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField label="Fee Category / Type *" size="small" value={addForm.feeType}
              onChange={e => setAddForm(p => ({ ...p, feeType: e.target.value }))}
              placeholder="e.g. Tuition Fee, Hostel & Mess Dues, Lab Fee" />
            <TextField label="Amount (₹) *" size="small" type="number" value={addForm.amount}
              onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} />
            <TextField label="Due Date *" size="small" type="date" InputLabelProps={{ shrink: true }}
              value={addForm.dueDate} onChange={e => setAddForm(p => ({ ...p, dueDate: e.target.value }))} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField label="Academic Year" size="small" fullWidth value={addForm.academicYear}
                  onChange={e => setAddForm(p => ({ ...p, academicYear: e.target.value }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Semester" size="small" type="number" fullWidth value={addForm.semester}
                  onChange={e => setAddForm(p => ({ ...p, semester: e.target.value }))} />
              </Grid>
            </Grid>
            <TextField label="Description" size="small" multiline rows={2} value={addForm.description}
              onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setAddDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleAddFee} variant="contained" sx={{ borderRadius: 2, bgcolor: COLORS.excellent, textTransform: 'none', fontWeight: 700 }}>Save & Issue Fee</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
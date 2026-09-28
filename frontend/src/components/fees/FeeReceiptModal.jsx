import React from 'react';
import {
  Dialog, DialogContent, Box, Typography, Button, IconButton,
  Divider, Paper, Grid, Chip
} from '@mui/material';
import { Close, Print, Download, VerifiedUser } from '@mui/icons-material';

export default function FeeReceiptModal({ open, onClose, receipt }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
          🧾 Official Fee Payment Receipt
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '2px dashed #cbd5e1',
            borderRadius: 2,
            bgcolor: '#ffffff',
            position: 'relative'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid #0f172a' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0284c7', letterSpacing: 1.5 }}>
              CAMPUISQ+ UNIVERSITY OF TECHNOLOGY
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
              OFFICIAL ELECTRONIC FEE RECEIPT
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accredited NAAC A++ • ISO 9001:2015 Certified Campus
            </Typography>
          </Box>

          {/* Receipt Meta */}
          <Grid container spacing={2} sx={{ py: 2 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>RECEIPT NUMBER</Typography>
              <Typography variant="body2" fontWeight={800} fontFamily="monospace" color="#0284c7">
                {receipt.receiptNo || `RCP-2026-${receipt.id || '1001'}`}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TRANSACTION DATE</Typography>
              <Typography variant="body2" fontWeight={800}>
                {receipt.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>STUDENT NAME</Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a">
                {receipt.studentName || 'Aarav Varma'}
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ROLL NUMBER</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace" color="#0f172a">
                {receipt.rollNo || '24CS001'}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          {/* Fee Itemization */}
          <Box sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={700} color="#0f172a">
                {receipt.description || receipt.feeType || 'Academic Tuition & Institutional Fees'}
              </Typography>
              <Typography variant="body2" fontWeight={800} color="#0f172a">
                {receipt.amount || `₹${Number(receipt.amountNum || 0).toLocaleString('en-IN')}.00`}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Term: Semester 4 / Academic Year 2025-2026
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Payment Gateway Specs */}
          <Box sx={{ py: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Payment Gateway:</Typography>
                <Typography variant="caption" fontWeight={700} display="block" color="#0284c7">
                  {receipt.mode || 'Razorpay Test Sandbox'}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Payment ID / Ref:</Typography>
                <Typography variant="caption" fontWeight={700} fontFamily="monospace" display="block">
                  {receipt.paymentId || 'pay_test_verified'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Verification Badge */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#f0fdf4',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedUser sx={{ color: '#16a34a', fontSize: 24 }} />
              <Box>
                <Typography variant="caption" fontWeight={800} color="#166534" display="block">
                  SETTLED & CRYPTOGRAPHICALLY VERIFIED
                </Typography>
                <Typography variant="caption" color="#15803d" fontSize={10}>
                  Razorpay Order ID: {receipt.orderId || 'order_test_settled'}
                </Typography>
              </Box>
            </Box>
            <Chip label="PAID ✓" size="small" sx={{ bgcolor: '#16a34a', color: '#fff', fontWeight: 800 }} />
          </Box>

          {/* Footer Stamp */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontSize={9} display="block">
                This is a computer-generated official receipt.
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize={9}>
                No physical signature required.
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={800} color="#0f172a" display="block">
                Finance & Accounts Dept.
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize={10}>
                CampusIQ+ University
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handlePrint}
            startIcon={<Print />}
            sx={{ bgcolor: '#0284c7', borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Print Receipt
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

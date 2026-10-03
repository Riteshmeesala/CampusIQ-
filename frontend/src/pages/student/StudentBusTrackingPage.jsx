import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper
} from '@mui/material';
import {
  OpenInNew, DirectionsBus, Phone
} from '@mui/icons-material';

export default function StudentBusTrackingPage() {

  const vehicleInfo = {
    vehicleNumber: 'TS28M9219',
    driverName: 'Rajesh',
    driverPhone: '+91 98480 12345',
    vehicleType: 'Minivan',
    status: 'Active',
    startDate: '2023-12-12',
    endDate: '--',
    currentLocation: 'Near Manikonda / VVIT Campus Hub',
    speed: '38 km/h'
  };

  const handleOpenMaps = () => {
    window.open('https://maps.google.com/?q=17.4116,78.3752', '_blank');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── TOP TITLE MATCHING SCREENSHOT 1 ── */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Track Your Vehicle
        </Typography>
      </Box>

      {/* ── 2-CARD GRID LAYOUT MATCHING SCREENSHOT 1 ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3, alignItems: 'start' }}>
        {/* Left Card: Map View */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            overflow: 'hidden'
          }}
        >
          {/* Card Header with orange vertical accent */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <Box sx={{ width: 3, height: 18, bgcolor: '#f97316', borderRadius: '2px' }} />
            <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: '#ea580c' }}>
              Vehicle Number : {vehicleInfo.vehicleNumber}
            </Typography>
          </Box>

          {/* Interactive Simulated Map Container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 480,
              bgcolor: '#e5e7eb',
              overflow: 'hidden'
            }}
          >
            {/* Embedded Google Maps iframe centered around Hyderabad / Guntur route */}
            <iframe
              title="Vehicle Tracking Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15228.660144988716!2d78.3752!3d17.4116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb96a0d4218bf5%3A0xb30deca559a43a67!2sManikonda%2C%20Hyderabad!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`}
            />

            {/* "Open in Maps" Button on Top Left matching screenshot */}
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenMaps}
              endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: '#ffffff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                border: '1px solid #bfdbfe',
                py: 0.5,
                px: 1.5,
                borderRadius: '4px',
                '&:hover': { bgcolor: '#eff6ff' },
                zIndex: 10
              }}
            >
              Open in Maps
            </Button>

            {/* Live Status Badge overlay on Map */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                p: '6px 12px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                zIndex: 10
              }}
            >
              <DirectionsBus sx={{ fontSize: 18, color: '#16a34a' }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                LIVE • {vehicleInfo.speed}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Right Card: Vehicle Details */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            overflow: 'hidden'
          }}
        >
          {/* Card Header with orange vertical accent */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <Box sx={{ width: 3, height: 18, bgcolor: '#f97316', borderRadius: '2px' }} />
            <Typography sx={{ fontSize: '0.98rem', fontWeight: 700, color: '#ea580c' }}>
              Vehicle Details
            </Typography>
          </Box>

          {/* Details List matching Screenshot 1 */}
          <Box sx={{ p: '20px 24px', display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.88rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <Typography sx={{ width: 110, color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                Driver Name:
              </Typography>
              <Typography sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                {vehicleInfo.driverName}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <Typography sx={{ width: 110, color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                Vehicle Type:
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.86rem' }}>
                {vehicleInfo.vehicleType}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <Typography sx={{ width: 110, color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                Status:
              </Typography>
              <Typography sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                {vehicleInfo.status}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <Typography sx={{ width: 110, color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                Start Date:
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.86rem' }}>
                {vehicleInfo.startDate}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <Typography sx={{ width: 110, color: '#0284c7', fontWeight: 600, fontSize: '0.86rem' }}>
                End Date:
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.86rem' }}>
                {vehicleInfo.endDate}
              </Typography>
            </Box>

            {/* Quick Driver Contact helper */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<Phone sx={{ fontSize: 16 }} />}
                href={`tel:${vehicleInfo.driverPhone}`}
                sx={{
                  color: '#16a34a',
                  borderColor: '#bbf7d0',
                  bgcolor: '#f0fdf4',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' }
                }}
              >
                Call Driver ({vehicleInfo.driverPhone})
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

import React, { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip
} from '@mui/material';
import {
  CloudUpload, Download, Delete, PictureAsPdf, Slideshow,
  Code, VideoLibrary, MenuBook, Visibility
} from '@mui/icons-material';
import PageHeader from '../../components/shared/PageHeader';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import { broadcastDataChange } from '../../services/dataSync';

export default function AcademicUploadsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', course: 'CS401', type: 'Lecture Notes (PDF)', unit: 'Unit 3' });

  const handleUpload = () => {
    if (!form.title.trim()) {
      toast.warning('Document title is required');
      return;
    }
    const newMaterial = {
      id: Date.now(),
      title: form.title,
      type: form.type || 'Lecture Notes (PDF)',
      code: form.course || 'CS401',
      size: '6.4 MB',
      author: 'Faculty Member',
      year: 'Current Term'
    };

    const existing = JSON.parse(localStorage.getItem('campusiq_study_materials') || '[]');
    localStorage.setItem('campusiq_study_materials', JSON.stringify([newMaterial, ...existing]));

    broadcastDataChange('STUDY_MATERIAL_UPLOADED', { material: newMaterial });
    toast.success(`Academic material "${form.title}" uploaded and published to student portal.`);
    setOpen(false);
    setForm({ title: '', course: 'CS401', type: 'Lecture Notes (PDF)', unit: 'Unit 3' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <PageHeader
        title="Academic Uploads & Course Repository"
        subtitle="Upload and manage lecture PPTs, unit notes, laboratory manuals, and recorded video sessions for students"
        breadcrumbs={['Home', 'Faculty', 'Academic Uploads']}
        action={
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: COLORS.secondary }}
          >
            Upload Learning Material
          </Button>
        }
      />

      <Card sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, px: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Published Course Materials & Digital Notes
            </Typography>
            <Chip label="14 Files Available" color="primary" size="small" sx={{ fontWeight: 700 }} />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Document Title', 'Subject & Code', 'Category', 'Unit', 'File Size', 'Upload Date', 'Downloads', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { title: 'Unit 3: Inter-Process Communication & Semaphore Notes', code: 'CS401', type: 'PDF Document', unit: 'Unit 3', size: '4.2 MB', date: '14 Feb 2024', dls: 142, icon: <PictureAsPdf color="error" /> },
                  { title: 'CS403: Deep Convolutional Neural Networks Slide Deck', code: 'CS403', type: 'Presentation Slides', unit: 'Unit 4', size: '12.8 MB', date: '22 Feb 2024', dls: 189, icon: <Slideshow color="warning" /> },
                  { title: 'CS405: Full Stack React & Spring Boot Lab Manual R22', code: 'CS405', type: 'Lab Manual', unit: 'Lab Module', size: '6.5 MB', date: '10 Jan 2024', dls: 210, icon: <Code color="primary" /> },
                  { title: 'Video Lecture: Memory Management & Paging Simulation', code: 'CS401', type: 'Video Lecture', unit: 'Unit 4', size: 'Stream URL', date: '28 Feb 2024', dls: 98, icon: <VideoLibrary color="secondary" /> },
                ].map((item, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {item.icon}
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.type}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.secondary, fontSize: 12 }}>{item.code}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Chip label={item.type} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{item.unit}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{item.size}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{item.date}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{item.dls} Downloads</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Download File">
                          <IconButton size="small" color="primary" onClick={() => toast.success(`Downloading ${item.title}`)}>
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove File">
                          <IconButton size="small" color="error" onClick={() => toast.info('File removed')}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Academic Material</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Document Title" placeholder="e.g. Unit 4 Neural Network Architectures" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <TextField select fullWidth label="Course / Subject" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
              <MenuItem value="CS401">CS401: Operating Systems & Architecture</MenuItem>
              <MenuItem value="CS403">CS403: Artificial Intelligence & Neural Networks</MenuItem>
              <MenuItem value="CS405">CS405: Full Stack Web Applications Lab</MenuItem>
            </TextField>
            <TextField select fullWidth label="Resource Category" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['Lecture Notes (PDF)', 'PowerPoint Slide Deck (PPT)', 'Laboratory Manual & Code', 'Previous Question Paper', 'Reference Reading'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
              Choose File from Device (PDF, PPT, ZIP)
              <input type="file" hidden />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload}>Publish to Students</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

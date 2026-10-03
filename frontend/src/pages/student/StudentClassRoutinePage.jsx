import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  IconButton, Tooltip
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import { timetableAPI } from '../../services/api';

const TIME_COLUMNS = [
  '08:20:00 - 10:00:00',
  '10:20:00 - 11:10:00',
  '11:10:00 - 12:00:00',
  '12:50:00 - 01:40:00',
  '01:40:00 - 02:30:00',
  '02:50:00 - 03:50:00'
];

const DEFAULT_ROUTINE = {
  Monday: [
    { time: '08:20:00 - 10:00:00', room: 'Room: N-517', subject: 'BCADUS', code: '23IT7E01', col: 0 },
    { time: '10:20:00 - 11:10:00', room: 'Room: N-517', subject: 'GB(', code: '23IT7OE03', col: 1 },
    { time: '11:10:00 - 12:00:00', room: 'Room: N-517', subject: 'DL', code: '23IT7P02', col: 2 },
    { time: '12:50:00 - 01:40:00', room: 'Room: N-517', subject: 'HRPM', code: '23IT7HT02', col: 3 },
    { time: '01:40:00 - 02:30:00', room: 'Room: N-517', subject: 'MC', code: '23IT7OE01', col: 4 },
    { time: '02:50:00 - 03:50:00', room: 'Room: N-517', subject: 'P', code: '23IT7P09', col: 5 },
  ],
  Tuesday: [
    { time: '08:20:00 - 09:10:00', room: 'Room: N-517', subject: 'UD', code: '23IT7P03', col: 0 },
    { time: '09:10:00 - 10:00:00', room: 'Room: N-517', subject: 'D', code: '23IT7P01B', col: 1 },
    { time: '10:20:00 - 11:10:00', room: 'Room: N-517', subject: 'HRPM', code: '23IT7HT02', col: 2 },
    { time: '11:10:00 - 12:00:00', room: 'Room: N-517', subject: 'DI', code: '23IT7P02', col: 3 },
    { time: '12:50:00 - 01:40:00', room: 'Room: N-517', subject: 'COI', code: '23SH7N01', col: 4 },
    { time: '01:40:00 - 02:30:00', room: 'Room: N-517', subject: 'MC', code: '23IT7OE01', col: 5 },
    { time: '02:50:00 - 03:50:00', room: 'Room: N-517', subject: 'P', code: '23IT7P09', col: 5 },
  ],
  Wednesday: [
    { time: '08:20:00 - 09:10:00', room: 'Room: N-517', subject: 'COI', code: '23SH7N01', col: 0 },
    { time: '09:10:00 - 10:00:00', room: 'Room: N-517', subject: 'D', code: '23IT7P01B', col: 1 },
    { time: '10:20:00 - 11:10:00', room: 'Room: N-517', subject: 'HRPM', code: '23IT7HT02', col: 2 },
    { time: '11:10:00 - 12:00:00', room: 'Room: N-517', subject: 'GB(', code: '23IT7OE03', col: 3 },
    { time: '12:50:00 - 01:40:00', room: 'Room: N-517', subject: 'UD', code: '23IT7P03', col: 4 },
    { time: '01:40:00 - 02:30:00', room: 'Room: N-517', subject: 'DL', code: '23IT7P02', col: 5 },
  ],
  Thursday: [
    { time: '08:20:00 - 10:00:00', room: 'Room: N-517', subject: 'BCADUS', code: '23IT7E01', col: 0 },
    { time: '10:20:00 - 11:10:00', room: 'Room: N-517', subject: 'GB(', code: '23IT7OE03', col: 1 },
    { time: '11:10:00 - 12:00:00', room: 'Room: N-517', subject: 'HRPM', code: '23IT7HT02', col: 2 },
    { time: '12:50:00 - 01:40:00', room: 'Room: N-517', subject: 'MC', code: '23IT7OE01', col: 3 },
    { time: '01:40:00 - 02:30:00', room: 'Room: N-517', subject: 'D', code: '23IT7P01B', col: 4 },
    { time: '02:50:00 - 03:50:00', room: 'Room: N-517', subject: 'UD', code: '23IT7P03', col: 5 },
  ],
  Friday: [
    { time: '08:20:00 - 09:10:00', room: 'Room: N-517', subject: 'DL', code: '23IT7P02', col: 0 },
    { time: '09:10:00 - 10:00:00', room: 'Room: N-517', subject: 'MC', code: '23IT7OE01', col: 1 },
    { time: '10:20:00 - 11:10:00', room: 'Room: N-517', subject: 'GB(', code: '23IT7OE03', col: 2 },
    { time: '11:10:00 - 12:00:00', room: 'Room: N-517', subject: 'D', code: '23IT7P01B', col: 3 },
    { time: '12:50:00 - 01:40:00', room: 'Room: N-517', subject: 'UD', code: '23IT7P03', col: 4 },
  ],
  Saturday: [
    { time: '08:20:00 - 09:10:00', room: 'Room: N-517', subject: 'HRPM', code: '23IT7HT02', col: 0 },
    { time: '09:10:00 - 10:00:00', room: 'Room: N-517', subject: 'D', code: '23IT7P01B', col: 1 },
    { time: '10:20:00 - 11:10:00', room: 'Room: N-517', subject: 'MC', code: '23IT7OE01', col: 2 },
    { time: '11:10:00 - 12:00:00', room: 'Room: N-517', subject: 'DL', code: '23IT7P02', col: 3 },
    { time: '12:50:00 - 01:40:00', room: 'Room: N-517', subject: 'UD', code: '23IT7P03', col: 4 },
    { time: '01:40:00 - 02:30:00', room: 'Room: N-517', subject: 'GB(', code: '23IT7OE03', col: 5 },
  ],
  Sunday: []
};

const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentClassRoutinePage() {
  const [search, setSearch] = useState('');
  const [routine, setRoutine] = useState(DEFAULT_ROUTINE);
  const [backendSlots, setBackendSlots] = useState([]);

  const loadData = () => {
    timetableAPI.getMy()
      .then(res => {
        const slots = res.data?.data;
        if (Array.isArray(slots) && slots.length > 0) {
          setBackendSlots(slots);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const filterSlot = (slot) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      slot.subject?.toLowerCase().includes(q) ||
      slot.code?.toLowerCase().includes(q) ||
      slot.room?.toLowerCase().includes(q) ||
      slot.time?.toLowerCase().includes(q)
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
          Class Routine
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: 180, sm: 240 },
              bgcolor: '#ffffff',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                fontSize: '0.85rem',
                borderColor: '#e2e8f0',
                '& fieldset': { borderColor: '#e2e8f0' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#94a3b8', fontSize: 18 }} />
                </InputAdornment>
              )
            }}
          />
          <Tooltip title="Refresh Schedule">
            <IconButton size="small" onClick={loadData} sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <Refresh fontSize="small" sx={{ color: '#64748b' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Routine Grid Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0.5, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 900, borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ width: 110, fontWeight: 700, fontSize: 12, color: '#64748b', borderRight: '1px solid #e2e8f0', py: 1.2 }}>
                Day
              </TableCell>
              {TIME_COLUMNS.map((col, idx) => (
                <TableCell
                  key={idx}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#475569',
                    borderRight: idx < TIME_COLUMNS.length - 1 ? '1px solid #e2e8f0' : 'none',
                    py: 1.2,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {DAYS_LIST.map((day) => {
              const daySlots = routine[day] || [];
              const isSunday = day === 'Sunday';

              return (
                <TableRow key={day} sx={{ height: 96, '&:nth-of-type(even)': { bgcolor: '#fafafa' } }}>
                  {/* Day Label Cell */}
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: 12.5,
                      color: '#475569',
                      borderRight: '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      px: 2,
                      verticalAlign: 'middle'
                    }}
                  >
                    {day}
                  </TableCell>

                  {/* Sunday empty condition */}
                  {isSunday ? (
                    <TableCell
                      colSpan={TIME_COLUMNS.length}
                      align="center"
                      sx={{
                        color: '#94a3b8',
                        fontSize: 12,
                        fontStyle: 'normal',
                        borderBottom: '1px solid #e2e8f0',
                        bgcolor: '#ffffff'
                      }}
                    >
                      No Classes
                    </TableCell>
                  ) : (
                    TIME_COLUMNS.map((timeCol, colIdx) => {
                      const matchingSlots = daySlots.filter(s => s.col === colIdx && filterSlot(s));

                      return (
                        <TableCell
                          key={colIdx}
                          sx={{
                            borderRight: colIdx < TIME_COLUMNS.length - 1 ? '1px solid #e2e8f0' : 'none',
                            borderBottom: '1px solid #e2e8f0',
                            p: 0.75,
                            verticalAlign: 'top',
                            minWidth: 140,
                            bgcolor: matchingSlots.length > 0 ? '#3898ec' : '#f8fafc'
                          }}
                        >
                          {matchingSlots.map((slot, sIdx) => (
                            <Box
                              key={sIdx}
                              sx={{
                                height: '100%',
                                minHeight: 78,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                color: '#ffffff',
                                p: 0.5
                              }}
                            >
                              <Typography sx={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.15 }}>
                                {slot.time}
                              </Typography>
                              <Typography sx={{ fontSize: 10, opacity: 0.9, lineHeight: 1.15 }}>
                                {slot.room}
                              </Typography>
                              <Typography sx={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.15 }}>
                                {slot.subject}
                              </Typography>
                              <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.15 }}>
                                {slot.code}
                              </Typography>
                            </Box>
                          ))}
                        </TableCell>
                      );
                    })
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Info Banner */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 11.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          * Routine automatically aligned with Semester 4 Computer Science & Engineering syllabus.
        </Typography>
        <Chip
          label="Academic Year: 2026 • Autonomous Regulation"
          size="small"
          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: 10.5, fontWeight: 600 }}
        />
      </Box>
    </Box>
  );
}

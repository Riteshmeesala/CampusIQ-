import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Add,
  AccessTime, Place
} from '@mui/icons-material';
import { examAPI, eventAPI } from '../../services/api';
import { subscribeToDataSync, broadcastDataChange, DATA_SYNC_EVENTS } from '../../services/dataSync';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Category styling config
const CATEGORY_STYLES = {
  EXAM: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', icon: '📝', label: 'Exam' },
  WORKSHOP: { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe', icon: '🚀', label: 'Workshop' },
  HACKATHON: { bg: '#dcfce7', text: '#15803d', border: '#86efac', icon: '💻', label: 'Hackathon' },
  HOLIDAY: { bg: '#fef3c7', text: '#b45309', border: '#fde68a', icon: '🟡', label: 'Holiday' },
  ACADEMIC: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', icon: '🏛️', label: 'Academic' },
  FEST: { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa', icon: '🏆', label: 'Tech Fest' }
};

export default function StudentCalendarPage() {
  const { user } = useAuth();
  const isAdminOrFaculty = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  // Navigation State (defaults to current active month: September 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)
  const [selectedDay, setSelectedDay] = useState(26);

  const [exams, setExams] = useState([]);
  const [deptEvents, setDeptEvents] = useState([]);

  // Manual Add Event Dialog State (for Admin / Faculty)
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'ACADEMIC',
    date: '2026-09-28',
    time: '10:00 AM - 01:00 PM',
    venue: 'Auditorium Hall A',
    coordinator: user?.name || 'Academic Dean',
    description: 'Special technical session for B.Tech students'
  });

  const loadCalendarData = useCallback(() => {
    Promise.allSettled([
      examAPI.getAll(),
      eventAPI.getAll()
    ]).then(([exRes, evRes]) => {
      if (exRes.status === 'fulfilled') {
        setExams(exRes.value.data?.data || []);
      }
      if (evRes.status === 'fulfilled') {
        setDeptEvents(evRes.value.data?.data || []);
      }
    });
  }, []);

  useEffect(() => {
    loadCalendarData();
    window.addEventListener('focus', loadCalendarData);
    const unsub = subscribeToDataSync((event) => {
      if (
        event.type === DATA_SYNC_EVENTS.EXAM_UPDATED ||
        event.type === 'EVENT_PUBLISHED' ||
        event.type === 'CAMPUSIQ_DATA_MUTATED'
      ) {
        loadCalendarData();
      }
    });
    return () => {
      window.removeEventListener('focus', loadCalendarData);
      unsub();
    };
  }, [loadCalendarData]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    setSelectedDay(26);
  };

  // Base Institutional Events Seeder
  const baseCollegeEvents = useMemo(() => [
    {
      id: 'CE-01',
      date: '2026-09-02',
      title: 'AI Tech Orientation',
      category: 'ACADEMIC',
      time: '10:00 AM - 12:00 PM',
      venue: 'LH-201',
      coordinator: 'Dr. Rajesh Sharma',
      description: 'Orientation on advanced computing infrastructure, GPU access, and AI curriculum for Semester 4.'
    },
    {
      id: 'CE-02',
      date: '2026-09-10',
      title: 'Mid-Term 1: DBMS (CS401)',
      category: 'EXAM',
      time: '10:00 AM - 11:30 AM',
      venue: 'LH-201',
      coordinator: 'Dr. Rajesh Sharma',
      description: 'Continuous assessment covering relational algebra, SQL optimization, and normalization.'
    },
    {
      id: 'CE-03',
      date: '2026-09-12',
      title: 'Mid-Term 1: ML (CS402)',
      category: 'EXAM',
      time: '10:00 AM - 11:30 AM',
      venue: 'LH-202',
      coordinator: 'Dr. Rajesh Sharma',
      description: 'Continuous assessment covering linear models, decision tree algorithms, and loss functions.'
    },
    {
      id: 'CE-04',
      date: '2026-09-13',
      title: 'Second Saturday (Holiday)',
      category: 'HOLIDAY',
      time: 'All Day',
      venue: 'Campus Wide',
      coordinator: 'Central Administration',
      description: 'Official institutional monthly holiday for all departments.'
    },
    {
      id: 'CE-05',
      date: '2026-09-14',
      title: 'Mid-Term 1: Algorithms (CS403)',
      category: 'EXAM',
      time: '10:00 AM - 11:30 AM',
      venue: 'LH-201',
      coordinator: 'Dr. Rajesh Sharma',
      description: 'Continuous assessment covering divide and conquer, recurrence relations, and dynamic programming.'
    },
    {
      id: 'CE-06',
      date: '2026-09-15',
      title: 'Engineers Day Symposium',
      category: 'ACADEMIC',
      time: '09:30 AM - 04:30 PM',
      venue: 'Main Auditorium',
      coordinator: 'Faculty of Engineering',
      description: 'National Engineers Day keynote lectures, project demonstrations, and alumni guest speakers.'
    },
    {
      id: 'CE-07',
      date: '2026-09-18',
      title: 'AI & Cloud Computing Workshop',
      category: 'WORKSHOP',
      time: '10:00 AM - 04:00 PM',
      venue: 'CS-Lab 3 & Computing Lab 4',
      coordinator: 'Dr. Rajesh Sharma',
      description: 'Hands-on practical workshop covering Docker containers, Kubernetes deployment, and LLM fine-tuning.'
    },
    {
      id: 'CE-08',
      date: '2026-09-24',
      title: 'Smart Campus Hackathon 2026',
      category: 'HACKATHON',
      time: '08:00 AM - 08:00 PM',
      venue: 'Incubation Center Block-A',
      coordinator: 'Prof. Ananya Sen',
      description: 'Annual 24-hour innovation challenge solving smart city and automated educational workflows.'
    },
    {
      id: 'CE-09',
      date: '2026-09-26',
      title: 'Continuous Evaluation Review',
      category: 'ACADEMIC',
      time: '02:00 PM - 05:00 PM',
      venue: 'Department Faculty Room',
      coordinator: 'Dr. Rajesh Sharma',
      description: 'Departmental faculty meeting and student grade review for Mid-Term 1 results.'
    },
    {
      id: 'CE-10',
      date: '2026-10-02',
      title: 'Gandhi Jayanti (Holiday)',
      category: 'HOLIDAY',
      time: 'All Day',
      venue: 'Campus Wide',
      coordinator: 'Central Administration',
      description: 'National public holiday commemorating the birth of Mahatma Gandhi.'
    },
    {
      id: 'CE-11',
      date: '2026-10-05',
      title: 'Mid Evaluation Deadline',
      category: 'ACADEMIC',
      time: '05:00 PM',
      venue: 'Academic Section',
      coordinator: 'Dean of Academics',
      description: 'Final date for faculty to lock and submit Mid-Term 1 internal grades.'
    },
    {
      id: 'CE-12',
      date: '2026-10-10',
      title: 'Fee Clearance Deadline',
      category: 'ACADEMIC',
      time: '04:00 PM',
      venue: 'Finance Office',
      coordinator: 'Accounts Registrar',
      description: 'Last date for tuition and examination fee settlement without late penalty surcharge.'
    },
    {
      id: 'CE-13',
      date: '2026-10-15',
      title: 'University Exam: DBMS',
      category: 'EXAM',
      time: '10:00 AM - 01:00 PM',
      venue: 'Auditorium Hall A',
      coordinator: 'Controller of Examinations',
      description: 'Comprehensive Semester End University Examination for CS401 Database Management Systems.'
    },
    {
      id: 'CE-14',
      date: '2026-10-18',
      title: 'University Exam: ML & AI',
      category: 'EXAM',
      time: '10:00 AM - 01:00 PM',
      venue: 'Auditorium Hall A',
      coordinator: 'Controller of Examinations',
      description: 'Comprehensive Semester End University Examination for CS402 Machine Learning & Intelligent Systems.'
    },
    {
      id: 'CE-15',
      date: '2026-10-28',
      title: 'Annual Project Expo & Tech Fest',
      category: 'FEST',
      time: '09:00 AM - 05:00 PM',
      venue: 'Campus Open Air Theatre',
      coordinator: 'Student Technical Council',
      description: 'Annual inter-college engineering project exhibition, robotics arena, and hack challenge.'
    }
  ], []);

  // Merge Database Exams and Department Events into Calendar
  const allEvents = useMemo(() => {
    const list = [...baseCollegeEvents];

    // Merge database exams
    exams.forEach(ex => {
      if (ex.scheduledDate) {
        const dStr = ex.scheduledDate.split('T')[0];
        if (!list.some(e => e.date === dStr && e.title.includes(ex.examName))) {
          list.push({
            id: `EX-${ex.id}`,
            date: dStr,
            title: ex.examName,
            category: 'EXAM',
            time: ex.scheduledDate.split('T')[1]?.slice(0, 5) || '10:00 AM',
            venue: ex.venue || 'Examination Hall',
            coordinator: 'Controller of Examinations',
            description: ex.description || 'Institutional examination session.'
          });
        }
      }
    });

    // Merge department events
    deptEvents.forEach(ev => {
      const dStr = ev.startDate || ev.date;
      if (dStr && !list.some(e => e.title === ev.title)) {
        list.push({
          id: ev.id || `EVT-${Math.random()}`,
          date: dStr,
          title: ev.title,
          category: (ev.category || 'ACADEMIC').toUpperCase().includes('HACK') ? 'HACKATHON' : 'WORKSHOP',
          time: ev.time || '10:00 AM - 04:00 PM',
          venue: ev.venue || 'Block A',
          coordinator: ev.coordinator || 'Department Coordinator',
          description: ev.description || 'Departmental scheduled event.'
        });
      }
    });

    return list;
  }, [baseCollegeEvents, exams, deptEvents]);

  // Compute 42 Grid Cells for Current Month View
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0: Sun, 1: Mon...
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Preceding month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        day: dayNum,
        isCurrentMonth: false,
        dateStr,
        isToday: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = currentYear === 2026 && currentMonth === 8 && day === 26; // Sep 26, 2026 is today in project
      cells.push({
        day,
        isCurrentMonth: true,
        dateStr,
        isToday
      });
    }

    // Trailing days of next month to complete fixed 42 cells (6 full rows)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        isCurrentMonth: false,
        dateStr,
        isToday: false
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allEvents]);

  // Selected date full string
  const selectedDateStr = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  }, [currentYear, currentMonth, selectedDay]);

  // Events on selected day or upcoming
  const selectedDayEvents = eventsByDate[selectedDateStr] || [];

  // Upcoming events sorted chronologically
  const upcomingEventsList = useMemo(() => {
    const todayStr = '2026-09-26';
    return allEvents
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents]);

  // Handle adding an event (Admin / Faculty)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;
    setSubmitting(true);
    try {
      await eventAPI.publish({
        title: eventForm.title,
        category: eventForm.category,
        startDate: eventForm.date,
        endDate: eventForm.date,
        venue: eventForm.venue,
        coordinator: eventForm.coordinator,
        description: eventForm.description,
        time: eventForm.time
      });
      broadcastDataChange('EVENT_PUBLISHED', eventForm);
      toast.success('✅ College event scheduled successfully!');
      setOpenModal(false);
      loadCalendarData();
    } catch (err) {
      toast.error('Failed to publish event: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      bgcolor: '#f1f5f9',
      p: { xs: 1.5, sm: 2.5 }
    }}>
      {/* 2-Column Responsive Layout matching User's Screenshot */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 2.5,
        maxWidth: 1600,
        mx: 'auto'
      }}>
        {/* ── LEFT CARD: COLLEGE CALENDAR ── */}
        <Box sx={{
          flex: { xs: '1 1 100%', lg: '0 0 74%' },
          bgcolor: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          p: { xs: 2, sm: 2.5 }
        }}>
          {/* Header Title with Orange Accent Line */}
          <Box sx={{
            borderLeft: '3px solid #f97316',
            pl: 1.2,
            py: 0.1,
            mb: 2.5
          }}>
            <Typography sx={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#f97316',
              letterSpacing: '-0.01em'
            }}>
              College Calendar
            </Typography>
          </Box>

          {/* Navigation Controls Bar */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}>
            {/* Left Chevron Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                onClick={handlePrevMonth}
                sx={{
                  minWidth: '28px',
                  width: '28px',
                  height: '26px',
                  p: 0,
                  bgcolor: '#0099ff',
                  color: '#ffffff',
                  borderRadius: '3px',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#0080d6', boxShadow: 'none' }
                }}
              >
                <ChevronLeft sx={{ fontSize: 18 }} />
              </Button>
              <Button
                onClick={handleNextMonth}
                sx={{
                  minWidth: '28px',
                  width: '28px',
                  height: '26px',
                  p: 0,
                  bgcolor: '#0099ff',
                  color: '#ffffff',
                  borderRadius: '3px',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#0080d6', boxShadow: 'none' }
                }}
              >
                <ChevronRight sx={{ fontSize: 18 }} />
              </Button>
            </Box>

            {/* Centered Month & Year Title */}
            <Typography sx={{
              fontSize: '17px',
              fontWeight: 600,
              color: '#1e293b'
            }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Typography>

            {/* Right "today" Button */}
            <Button
              onClick={handleToday}
              sx={{
                bgcolor: '#0099ff',
                color: '#ffffff',
                textTransform: 'lowercase',
                fontSize: '12px',
                fontWeight: 600,
                px: 1.5,
                py: '2px',
                height: '26px',
                borderRadius: '3px',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0080d6', boxShadow: 'none' }
              }}
            >
              today
            </Button>
          </Box>

          {/* Calendar Grid Table */}
          <Box sx={{
            border: '1px solid #e2e8f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            {/* Weekdays Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              bgcolor: '#ffffff',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {WEEKDAYS.map((day) => (
                <Box
                  key={day}
                  sx={{
                    textAlign: 'center',
                    py: 0.9,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#334155',
                    borderRight: '1px solid #e2e8f0'
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>

            {/* Day Cells Grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              bgcolor: '#ffffff'
            }}>
              {calendarCells.map((cell, idx) => {
                const cellEvents = eventsByDate[cell.dateStr] || [];
                const isSelected = cell.isCurrentMonth && cell.day === selectedDay;

                return (
                  <Box
                    key={idx}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setSelectedDay(cell.day);
                      }
                    }}
                    sx={{
                      minHeight: { xs: 68, sm: 84, md: 90 },
                      p: 0.6,
                      borderRight: '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0',
                      bgcolor: cell.isToday
                        ? '#fef9c3' // Soft light yellow for Today as in screenshot!
                        : (isSelected ? '#f0f9ff' : '#ffffff'),
                      cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'background-color 0.15s ease',
                      '&:hover': cell.isCurrentMonth ? {
                        bgcolor: cell.isToday ? '#fef08a' : '#f8fafc'
                      } : {}
                    }}
                  >
                    {/* Date Number on Top Right */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      pr: 0.4,
                      pt: 0.2,
                      mb: 0.4
                    }}>
                      <Typography sx={{
                        fontSize: '11px',
                        fontWeight: cell.isToday ? 700 : 400,
                        color: cell.isCurrentMonth ? (cell.isToday ? '#854d0e' : '#334155') : '#94a3b8',
                        lineHeight: 1
                      }}>
                        {cell.day}
                      </Typography>
                    </Box>

                    {/* Event Badges inside Cell */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                      {cellEvents.slice(0, 2).map((ev) => {
                        const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.ACADEMIC;
                        return (
                          <Tooltip
                            key={ev.id}
                            title={`${ev.title} (${ev.time} • ${ev.venue})`}
                            arrow
                          >
                            <Box sx={{
                              fontSize: '9.5px',
                              fontWeight: 600,
                              px: 0.5,
                              py: 0.2,
                              borderRadius: '2px',
                              bgcolor: style.bg,
                              color: style.text,
                              border: `1px solid ${style.border}`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.2
                            }}>
                              {style.icon} {ev.title}
                            </Box>
                          </Tooltip>
                        );
                      })}
                      {cellEvents.length > 2 && (
                        <Typography sx={{ fontSize: '9px', color: '#0284c7', fontWeight: 700, pl: 0.5 }}>
                          +{cellEvents.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* ── RIGHT CARD: UPCOMING EVENT ── */}
        <Box sx={{
          flex: { xs: '1 1 100%', lg: '0 0 24%' },
          bgcolor: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header Title with Orange Accent Line */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '3px solid #f97316',
            pl: 1.2,
            py: 0.1,
            mb: 2.5
          }}>
            <Typography sx={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#f97316',
              letterSpacing: '-0.01em'
            }}>
              Upcoming Event
            </Typography>

            {/* Quick Add Event (Admin & Faculty) */}
            {isAdminOrFaculty && (
              <Button
                onClick={() => setOpenModal(true)}
                size="small"
                startIcon={<Add sx={{ fontSize: 15 }} />}
                sx={{
                  fontSize: '11px',
                  fontWeight: 700,
                  bgcolor: '#f97316',
                  color: '#ffffff',
                  px: 1,
                  py: 0.2,
                  borderRadius: '3px',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#ea580c', boxShadow: 'none' }
                }}
              >
                Add Event
              </Button>
            )}
          </Box>

          {/* Selected Date Focus Indicator */}
          {selectedDayEvents.length > 0 && (
            <Box sx={{
              mb: 2,
              p: 1.5,
              borderRadius: '4px',
              bgcolor: '#f0f9ff',
              border: '1px solid #bae6fd'
            }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', mb: 0.5 }}>
                Selected Date: {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}
              </Typography>
              {selectedDayEvents.map(ev => (
                <Typography key={ev.id} sx={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                  • {ev.title} ({ev.time})
                </Typography>
              ))}
            </Box>
          )}

          {/* Upcoming Events Feed */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 220px)'
          }}>
            {upcomingEventsList.slice(0, 8).map((ev) => {
              const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.ACADEMIC;
              return (
                <Box
                  key={ev.id}
                  sx={{
                    p: 1.5,
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#f8fafc',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: '#cbd5e1',
                      bgcolor: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  {/* Category Chip & Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`
                    }}>
                      {style.icon} {style.label}
                    </span>
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                      {ev.date}
                    </Typography>
                  </Box>

                  {/* Title */}
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, mb: 0.5 }}>
                    {ev.title}
                  </Typography>

                  {/* Timing & Venue */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569', fontSize: '11.5px', mb: 0.3 }}>
                    <AccessTime sx={{ fontSize: 13, color: '#64748b' }} />
                    <span>{ev.time}</span>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569', fontSize: '11.5px', mb: 0.8 }}>
                    <Place sx={{ fontSize: 13, color: '#64748b' }} />
                    <span>{ev.venue}</span>
                  </Box>

                  {/* Description */}
                  <Typography sx={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                    {ev.description}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* ── MODAL: SCHEDULE NEW EVENT (ADMIN & FACULTY) ── */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a', pb: 1 }}>
          📅 Schedule College Event
        </DialogTitle>
        <form onSubmit={handleSaveEvent}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Event Title"
              size="small"
              required
              fullWidth
              value={eventForm.title}
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="e.g. Guest Lecture on Cloud Architecture"
            />
            <TextField
              select
              label="Category"
              size="small"
              fullWidth
              value={eventForm.category}
              onChange={e => setEventForm({ ...eventForm, category: e.target.value })}
            >
              <MenuItem value="ACADEMIC">Academic / Lecture</MenuItem>
              <MenuItem value="EXAM">Examination</MenuItem>
              <MenuItem value="WORKSHOP">Workshop & Hands-On</MenuItem>
              <MenuItem value="HACKATHON">Hackathon & Coding</MenuItem>
              <MenuItem value="HOLIDAY">Institutional Holiday</MenuItem>
              <MenuItem value="FEST">Technical Fest / Symposium</MenuItem>
            </TextField>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                size="small"
                required
                fullWidth
                value={eventForm.date}
                onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Time"
                size="small"
                fullWidth
                value={eventForm.time}
                onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                placeholder="e.g. 10:00 AM - 01:00 PM"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Venue"
                size="small"
                fullWidth
                value={eventForm.venue}
                onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                placeholder="e.g. Auditorium Hall A"
              />
              <TextField
                label="Coordinator"
                size="small"
                fullWidth
                value={eventForm.coordinator}
                onChange={e => setEventForm({ ...eventForm, coordinator: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
              />
            </Box>
            <TextField
              label="Description"
              size="small"
              multiline
              rows={3}
              fullWidth
              value={eventForm.description}
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              placeholder="Describe event agenda, prerequisites, or target semester..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ color: '#64748b' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
            >
              {submitting ? 'Publishing...' : 'Publish Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

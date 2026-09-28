import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, IconButton,
  Avatar, CircularProgress, Tooltip, Paper,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, InputBase
} from '@mui/material';
import {
  AutoAwesome, Refresh, ContentCopy, Check,
  Mic, MicOff, ArrowUpward, Search,
  PushPin, PushPinOutlined, DeleteOutline, DriveFileRenameOutline,
  FolderOutlined, ScheduleOutlined, LocalLibraryOutlined,
  ExtensionOutlined, CodeOutlined, MoreHoriz,
  MenuOpen, Menu, EditNote, ChatBubbleOutline,
  School, SupervisorAccount, AdminPanelSettings,
  Close, NorthEast
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { aiAPI } from '../../services/api';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import StructuredAIResponse from '../../components/shared/StructuredAIResponse';

export default function ChatbotPage() {
  const { user } = useAuth();
  const userRole = (user?.role || 'STUDENT').toUpperCase();

  // Sidebar & Session State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState('New Chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Chat Stream State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Rename Dialog State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);
  const [newTitleInput, setNewTitleInput] = useState('');

  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Role persona config
  const roleConfig = useMemo(() => {
    if (userRole === 'FACULTY') {
      return {
        label: 'Faculty Mode',
        icon: <SupervisorAccount sx={{ fontSize: 16 }} />,
        color: '#7c3aed',
        bgColor: '#f5f3ff',
        borderColor: '#ddd6fe',
        subtitle: 'Instructional Planning & Grading Assistant',
        defaultChips: [
          'What are my assigned lectures today?',
          'How do I publish semester & mid marks?',
          'Generate quiz questions for my next lecture',
          'List students with <75% attendance',
          'Draft a research paper outline on Distributed AI'
        ],
        overview: [
          { step: 'Step 1: Teaching Schedule', desc: 'Inspect lecture halls, daily timetable slots, and lab rooms.' },
          { step: 'Step 2: Marks Publishing', desc: 'Publish mid and semester marks with real-time student syncing.' },
          { step: 'Step 3: Attendance Tracking', desc: 'Audit student attendance registers and alert low attendees.' },
          { step: 'Step 4: AI Course Tools', desc: 'Generate multi-choice quizzes, rubrics, and research outlines.' }
        ]
      };
    }
    if (userRole === 'ADMIN') {
      return {
        label: 'Admin Mode',
        icon: <AdminPanelSettings sx={{ fontSize: 16 }} />,
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fecaca',
        subtitle: 'Campus Governance & Circulars Engine',
        defaultChips: [
          'Draft bad weather holiday circular',
          'Simplify deadline notice for fee clearance',
          'Campus enrollment & faculty statistics',
          'Institutional audit checklist',
          'Overview of upcoming semester exams'
        ],
        overview: [
          { step: 'Step 1: Institutional Circulars', desc: 'Draft bad weather emergency notices and academic advisories.' },
          { step: 'Step 2: Campus Analytics', desc: 'Instant student enrollment, faculty counts, and fee summaries.' },
          { step: 'Step 3: Financial Clearance', desc: 'Issue automated fee settlement reminders and audit dues.' },
          { step: 'Step 4: Examination Governance', desc: 'Schedule exam datesheets, venues, and hall ticket gates.' }
        ]
      };
    }
    return {
      label: 'Student Mode',
      icon: <School sx={{ fontSize: 16 }} />,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      subtitle: 'Academic & Career Intelligence Assistant',
      defaultChips: [
        'Check my attendance % & exam eligibility',
        'What is my current timetable today?',
        'Show my pending fees & invoices',
        'How to prepare for upcoming Semester Exams?',
        'DSA & Full-Stack Spring Boot study plan'
      ],
      overview: [
        { step: 'Step 1: Attendance & Hall Tickets', desc: 'Audit lecture attendance % and check exam eligibility.' },
        { step: 'Step 2: Timetable & Venues', desc: 'Locate today’s classrooms, lab halls, and faculty instructors.' },
        { step: 'Step 3: CGPA & Results', desc: 'Inspect semester GPA, marks transcripts, and study strategies.' },
        { step: 'Step 4: Fee Clearances', desc: 'Review invoice balances, receipts, and online settlements.' }
      ]
    };
  }, [userRole]);

  // Load chat sessions from backend on mount
  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await aiAPI.getSessions();
      const list = res.data?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setSessions(list);
      } else {
        // Fallback default role-aligned seed sessions so sidebar feels alive like ChatGPT
        const defaultSeeds = userRole === 'ADMIN' ? [
          { sessionId: 'seed_adm_1', title: 'Simplify Deadline Notice', pinned: true, role: 'ADMIN', updatedAt: new Date().toISOString() },
          { sessionId: 'seed_adm_2', title: 'Bad Weather Emergency Circular', pinned: false, role: 'ADMIN', updatedAt: new Date().toISOString() },
          { sessionId: 'seed_adm_3', title: 'Semester Enrollment Audit', pinned: false, role: 'ADMIN', updatedAt: new Date().toISOString() }
        ] : userRole === 'FACULTY' ? [
          { sessionId: 'seed_fac_1', title: 'Lesson Plan: Distributed AI', pinned: true, role: 'FACULTY', updatedAt: new Date().toISOString() },
          { sessionId: 'seed_fac_2', title: 'Classroom Quiz: Binary Trees', pinned: false, role: 'FACULTY', updatedAt: new Date().toISOString() },
          { sessionId: 'seed_fac_3', title: 'Attendance Shortage Review', pinned: false, role: 'FACULTY', updatedAt: new Date().toISOString() }
        ] : [
          { sessionId: 'seed_stu_1', title: 'Attendance & Hall Ticket Eligibility', pinned: true, role: 'STUDENT', updatedAt: new Date().toISOString() },
          { sessionId: 'seed_stu_2', title: 'Timetable & Room 302 Schedule', pinned: false, role: 'STUDENT', updatedAt: new Date().toISOString() },
          { sessionId: 'seed_stu_3', title: 'DSA & Spring Boot Roadmap', pinned: false, role: 'STUDENT', updatedAt: new Date().toISOString() }
        ];
        setSessions(defaultSeeds);
      }
    } catch (err) {
      console.warn('Failed to load sessions from server, using local fallback:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.id, userRole]);

  // Select a session and load its messages
  const selectSession = async (session) => {
    if (activeSessionId === session.sessionId) return;
    setActiveSessionId(session.sessionId);
    setActiveSessionTitle(session.title || 'Conversation');
    setLoading(true);

    try {
      const res = await aiAPI.getSessionMessages(session.sessionId);
      const msgs = res.data?.data || [];
      if (Array.isArray(msgs) && msgs.length > 0) {
        setMessages(msgs);
      } else {
        // If empty or seed, initialize with conversation title prompt
        setMessages([
          {
            role: 'assistant',
            content: `### 🎯 ${session.title}\nLoaded previous session history for **${user?.name || 'User'}** (${roleConfig.label}). How can I assist you with this thread?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: roleConfig.defaultChips
          }
        ]);
      }
    } catch (err) {
      setMessages([
        {
          role: 'assistant',
          content: `### 🎯 ${session.title}\nLoaded session thread for **${user?.name || 'User'}**. Ask any follow-up question below.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: roleConfig.defaultChips
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Start a fresh new chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveSessionTitle('New Chat');
    setMessages([]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Toggle Pin on a session
  const handleTogglePin = async (e, s) => {
    e.stopPropagation();
    try {
      await aiAPI.togglePinSession(s.sessionId);
      setSessions(prev => prev.map(item => item.sessionId === s.sessionId ? { ...item, pinned: !item.pinned } : item));
      toast.info(s.pinned ? 'Unpinned from top' : '📌 Pinned to top');
    } catch (err) {
      // Optimistic fallback
      setSessions(prev => prev.map(item => item.sessionId === s.sessionId ? { ...item, pinned: !item.pinned } : item));
    }
  };

  // Open Rename Dialog
  const handleOpenRename = (e, s) => {
    e.stopPropagation();
    setSessionToRename(s);
    setNewTitleInput(s.title || '');
    setRenameDialogOpen(true);
  };

  // Save Renamed Session Title
  const handleSaveRename = async () => {
    if (!sessionToRename || !newTitleInput.trim()) return;
    const trimmed = newTitleInput.trim();
    try {
      await aiAPI.renameSession(sessionToRename.sessionId, trimmed);
      setSessions(prev => prev.map(s => s.sessionId === sessionToRename.sessionId ? { ...s, title: trimmed } : s));
      if (activeSessionId === sessionToRename.sessionId) {
        setActiveSessionTitle(trimmed);
      }
      toast.success('Conversation renamed');
    } catch (err) {
      setSessions(prev => prev.map(s => s.sessionId === sessionToRename.sessionId ? { ...s, title: trimmed } : s));
      if (activeSessionId === sessionToRename.sessionId) {
        setActiveSessionTitle(trimmed);
      }
    } finally {
      setRenameDialogOpen(false);
      setSessionToRename(null);
    }
  };

  // Delete a session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await aiAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      toast.success('Conversation deleted');
    } catch (err) {
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    }
  };

  // Speech to text initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setListening(false);
      };

      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      toast.info('Speech Recognition not supported in this browser. Use Chrome/Edge.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Execute Sending a Message
  const executeSend = async (queryText) => {
    const query = queryText.trim();
    if (!query || loading) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: query, time: timeStr };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat(query, history, activeSessionId);

      const outer = res?.data;
      const inner = outer?.data || outer || {};
      const reply = inner.response || inner.reply || 'No response received.';
      const suggestions = inner.suggestions || roleConfig.defaultChips;
      const sessionIdReturned = inner.sessionId || activeSessionId;
      const titleReturned = inner.sessionTitle || activeSessionTitle;

      // Update or prepend session in the sidebar
      if (sessionIdReturned) {
        setActiveSessionId(sessionIdReturned);
        setActiveSessionTitle(titleReturned);

        setSessions(prev => {
          const existingIndex = prev.findIndex(s => s.sessionId === sessionIdReturned);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              title: titleReturned,
              updatedAt: new Date().toISOString()
            };
            // Move to top of recents
            const [item] = updated.splice(existingIndex, 1);
            return [item, ...updated];
          } else {
            return [
              {
                sessionId: sessionIdReturned,
                title: titleReturned,
                pinned: false,
                role: userRole,
                updatedAt: new Date().toISOString()
              },
              ...prev
            ];
          }
        });
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          suggestions: suggestions,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      const errMsg = err?.response?.data?.message
        || 'Connection error — ensure Campus AI backend service is running.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `### ⚠️ Connection Notice\n\n${errMsg}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    executeSend(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyResponse = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied response to clipboard');
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => (s.title || '').toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const pinnedSessions = useMemo(() => {
    return filteredSessions.filter(s => s.pinned);
  }, [filteredSessions]);

  const recentSessions = useMemo(() => {
    return filteredSessions.filter(s => !s.pinned);
  }, [filteredSessions]);

  return (
    <Box sx={{
      height: 'calc(100vh - 74px)',
      display: 'flex',
      bgcolor: '#ffffff',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. LEFT SIDEBAR (CHATGPT / GEMINI STYLE)                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Box sx={{
        width: sidebarOpen ? { xs: '100%', sm: 260, md: 270 } : 0,
        minWidth: sidebarOpen ? { xs: '100%', sm: 260, md: 270 } : 0,
        height: '100%',
        bgcolor: '#f8fafc',
        borderRight: sidebarOpen ? `1px solid ${COLORS.border}` : 'none',
        display: sidebarOpen ? 'flex' : 'none',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: { xs: 1200, sm: 10 },
        position: { xs: 'absolute', sm: 'relative' },
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}>
        {/* Sidebar Header: Brand + Search + Collapse */}
        <Box sx={{
          p: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${COLORS.borderLight}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <AutoAwesome sx={{ fontSize: 16 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em', fontSize: '0.98rem' }}>
              ChatGPT
            </Typography>
            <Chip
              label="Grok"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: '#e2e8f0',
                color: '#334155'
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Search Conversations">
              <IconButton
                size="small"
                onClick={() => setShowSearch(!showSearch)}
                sx={{ color: showSearch ? '#2563eb' : '#64748b', '&:hover': { bgcolor: '#e2e8f0' } }}
              >
                <Search sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Collapse Sidebar">
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(false)}
                sx={{ color: '#64748b', '&:hover': { bgcolor: '#e2e8f0' } }}
              >
                <MenuOpen sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Optional Search Bar */}
        {showSearch && (
          <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#ffffff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              px: 1,
              py: 0.4
            }}>
              <Search sx={{ fontSize: 16, color: '#94a3b8', mr: 0.75 }} />
              <InputBase
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                sx={{ fontSize: '0.8rem', flex: 1 }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        )}

        {/* Primary Action: + New Chat Button */}
        <Box sx={{ p: 1.5, pb: 1 }}>
          <Box
            onClick={handleNewChat}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.75,
              py: 1.1,
              borderRadius: '10px',
              bgcolor: activeSessionId === null ? '#eff6ff' : '#ffffff',
              border: activeSessionId === null ? '1px solid #bfdbfe' : `1px solid ${COLORS.border}`,
              color: activeSessionId === null ? '#2563eb' : '#0f172a',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              '&:hover': {
                bgcolor: '#f1f5f9',
                borderColor: '#cbd5e1'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <EditNote sx={{ fontSize: 20, color: activeSessionId === null ? '#2563eb' : '#475569' }} />
              <span>New chat</span>
            </Box>
            <Chip
              label={userRole}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: roleConfig.bgColor,
                color: roleConfig.color,
                border: `1px solid ${roleConfig.borderColor}`
              }}
            />
          </Box>
        </Box>

        {/* Quick Nav Category Shortcuts (matching ChatGPT layout) */}
        <Box sx={{ px: 1.5, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {[
            { label: 'Library', icon: <LocalLibraryOutlined sx={{ fontSize: 17 }} />, path: '/student/library' },
            { label: 'Projects', icon: <FolderOutlined sx={{ fontSize: 17 }} />, path: '/student/projects' },
            { label: 'Scheduled', icon: <ScheduleOutlined sx={{ fontSize: 17 }} />, path: '/student/exams' },
            { label: 'Plugins', icon: <ExtensionOutlined sx={{ fontSize: 17 }} /> },
            { label: 'Codex', icon: <CodeOutlined sx={{ fontSize: 17 }} /> },
          ].map((item) => (
            <Box
              key={item.label}
              onClick={() => {
                if (item.path) window.location.href = item.path;
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 0.7,
                borderRadius: '8px',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                '&:hover': {
                  bgcolor: '#f1f5f9',
                  color: '#0f172a'
                }
              }}
            >
              <Box sx={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </Box>
              <span>{item.label}</span>
            </Box>
          ))}
        </Box>

        {/* Scrollable Recents & Pinned Section */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' }
        }}>
          {/* ── PINNED SECTION ── */}
          {pinnedSessions.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  mb: 0.5,
                  display: 'block',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Pinned
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {pinnedSessions.map((s) => (
                  <SessionListItem
                    key={s.sessionId}
                    session={s}
                    active={activeSessionId === s.sessionId}
                    onSelect={() => selectSession(s)}
                    onTogglePin={(e) => handleTogglePin(e, s)}
                    onRename={(e) => handleOpenRename(e, s)}
                    onDelete={(e) => handleDeleteSession(e, s.sessionId)}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* ── RECENTS SECTION ── */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                mb: 0.5,
                display: 'block',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Recents
            </Typography>

            {loadingSessions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={18} sx={{ color: '#94a3b8' }} />
              </Box>
            ) : recentSessions.length === 0 ? (
              <Typography variant="body2" sx={{ px: 1.5, py: 1, color: '#94a3b8', fontSize: '0.78rem' }}>
                No recent conversations found.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {recentSessions.map((s) => (
                  <SessionListItem
                    key={s.sessionId}
                    session={s}
                    active={activeSessionId === s.sessionId}
                    onSelect={() => selectSession(s)}
                    onTogglePin={(e) => handleTogglePin(e, s)}
                    onRename={(e) => handleOpenRename(e, s)}
                    onDelete={(e) => handleDeleteSession(e, s.sessionId)}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Sidebar Footer: Current Stakeholder Profile */}
        <Box sx={{
          p: 1.5,
          borderTop: `1px solid ${COLORS.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#ffffff'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: roleConfig.color,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#0f172a', fontSize: '0.82rem' }}>
                {user?.name || 'Campus Stakeholder'}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: roleConfig.color, fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>
                {roleConfig.label}
              </Typography>
            </Box>
          </Box>
          <Tooltip title={roleConfig.subtitle}>
            <IconButton size="small" sx={{ color: '#94a3b8' }}>
              <NorthEast sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN CHAT CONTAINER                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Box sx={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Header Bar */}
        <Box sx={{
          px: { xs: 1.5, sm: 3 },
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${COLORS.borderLight}`,
          bgcolor: '#ffffff',
          zIndex: 5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {!sidebarOpen && (
              <Tooltip title="Open Sidebar">
                <IconButton
                  size="small"
                  onClick={() => setSidebarOpen(true)}
                  sx={{ color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }}
                >
                  <Menu sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                noWrap
                sx={{
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  maxWidth: { xs: 180, sm: 360 }
                }}
              >
                {activeSessionTitle}
              </Typography>
              <Chip
                label="Grok AI"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: '#f1f5f9',
                  color: '#475569'
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Stakeholder Role Badge */}
            <Chip
              icon={roleConfig.icon}
              label={roleConfig.label}
              size="small"
              sx={{
                height: 26,
                fontSize: '0.75rem',
                fontWeight: 700,
                bgcolor: roleConfig.bgColor,
                color: roleConfig.color,
                border: `1px solid ${roleConfig.borderColor}`,
                '& .MuiChip-icon': { color: `${roleConfig.color} !important` }
              }}
            />

            <Tooltip title="New Chat">
              <IconButton
                size="small"
                onClick={handleNewChat}
                sx={{
                  bgcolor: '#f8fafc',
                  border: `1px solid ${COLORS.borderLight}`,
                  color: '#475569',
                  '&:hover': { bgcolor: '#f1f5f9', color: '#2563eb' }
                }}
              >
                <EditNote sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Chat Messages Stream */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2.5,
          px: { xs: 1.5, sm: 3, md: 6 },
          maxWidth: 960,
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '4px' }
        }}>
          {messages.length === 0 ? (
            /* ── EMPTY STATE: STAKEHOLDER PERSONA WELCOME ── */
            <Box sx={{
              my: 'auto',
              py: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <Box sx={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                bgcolor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(15,23,42,0.12)',
                mb: 2
              }}>
                <AutoAwesome sx={{ fontSize: 28 }} />
              </Box>

              <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', letterSpacing: '-0.02em', mb: 0.75 }}>
                Welcome, {user?.name ? user.name.split(' ')[0] : 'Campus Member'}!
              </Typography>

              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 520, mb: 3, fontSize: '0.9rem', lineHeight: 1.6 }}>
                Grok AI is fully configured for your role as <strong>{roleConfig.label}</strong>.
                Ask any operational, schedule, or procedural query below to receive systematic step-by-step guidance.
              </Typography>

              {/* Stakeholder Capability Cards Grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
                width: '100%',
                maxWidth: 680,
                mb: 3.5,
                textAlign: 'left'
              }}>
                {roleConfig.overview.map((item, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 1.75,
                      bgcolor: '#f8fafc',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '12px',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        borderColor: '#93c5fd',
                        boxShadow: '0 2px 8px rgba(37,99,235,0.06)'
                      }
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#0f172a', fontSize: '0.84rem', mb: 0.35 }}>
                      {item.step}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5, display: 'block' }}>
                      {item.desc}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              {/* Role-Specific Quick Suggestion Chips */}
              <Box sx={{ width: '100%', maxWidth: 680 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.25 }}>
                  Recommended Prompts for {roleConfig.label}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {roleConfig.defaultChips.map((chip, idx) => (
                    <Box
                      key={idx}
                      onClick={() => executeSend(chip)}
                      sx={{
                        px: 1.75,
                        py: 0.85,
                        bgcolor: '#ffffff',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        '&:hover': {
                          bgcolor: roleConfig.bgColor,
                          borderColor: roleConfig.borderColor,
                          color: roleConfig.color,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      {chip}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            /* ── CHAT MESSAGES ── */
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: 0.5
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    gap: 1.5,
                    maxWidth: isUser ? { xs: '90%', sm: '80%' } : '100%',
                    flexDirection: isUser ? 'row-reverse' : 'row'
                  }}>
                    {/* Avatar */}
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: isUser ? '#2563eb' : '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        mt: 0.25,
                        flexShrink: 0
                      }}
                    >
                      {isUser ? (user?.name ? user.name.charAt(0).toUpperCase() : 'U') : <AutoAwesome sx={{ fontSize: 16 }} />}
                    </Avatar>

                    {/* Bubble */}
                    <Box sx={{
                      bgcolor: isUser ? '#2563eb' : '#ffffff',
                      color: isUser ? '#ffffff' : '#0f172a',
                      border: isUser ? 'none' : `1px solid ${COLORS.border}`,
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      p: isUser ? 1.5 : 2,
                      px: isUser ? 2 : 2.5,
                      boxShadow: isUser ? '0 1px 3px rgba(37,99,235,0.18)' : '0 1px 3px rgba(0,0,0,0.04)',
                      fontSize: '0.88rem',
                      lineHeight: 1.6
                    }}>
                      {isUser ? (
                        <Typography sx={{ fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </Typography>
                      ) : (
                        <StructuredAIResponse text={m.content} />
                      )}
                    </Box>
                  </Box>

                  {/* Actions & Timestamp below Assistant Message */}
                  {!isUser && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 5.5, mt: 0.25 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {m.time || 'Just now'}
                      </Typography>
                      <Tooltip title={copiedIdx === idx ? 'Copied!' : 'Copy response'}>
                        <IconButton
                          size="small"
                          onClick={() => copyResponse(m.content, idx)}
                          sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}
                        >
                          {copiedIdx === idx ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                  {/* Follow-up suggestions */}
                  {!isUser && m.suggestions && m.suggestions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pl: 5.5, mt: 1 }}>
                      {m.suggestions.map((sug, sIdx) => (
                        <Chip
                          key={sIdx}
                          label={sug}
                          size="small"
                          onClick={() => executeSend(sug)}
                          sx={{
                            fontSize: '0.75rem',
                            bgcolor: '#f8fafc',
                            border: `1px solid ${COLORS.border}`,
                            color: '#334155',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: roleConfig.bgColor,
                              borderColor: roleConfig.borderColor,
                              color: roleConfig.color
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#0f172a', color: '#ffffff' }}>
                <AutoAwesome sx={{ fontSize: 16 }} />
              </Avatar>
              <Box sx={{
                bgcolor: '#f8fafc',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px 16px 16px 16px',
                p: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25
              }}>
                <CircularProgress size={16} sx={{ color: roleConfig.color }} />
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 500 }}>
                  Grok AI is analyzing {roleConfig.label.toLowerCase()} context...
                </Typography>
              </Box>
            </Box>
          )}

          <div ref={chatBottomRef} />
        </Box>

        {/* Input Bar Area (Matches ChatGPT styling) */}
        <Box sx={{
          p: { xs: 1.5, sm: 2 },
          pt: 1,
          borderTop: `1px solid ${COLORS.borderLight}`,
          bgcolor: '#ffffff',
          maxWidth: 960,
          width: '100%',
          mx: 'auto'
        }}>
          <Box
            component="form"
            onSubmit={handleSend}
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#ffffff',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: '24px',
              p: 0.5,
              pl: 2,
              pr: 0.75,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              '&:focus-within': {
                borderColor: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37,99,235,0.1)'
              }
            }}
          >
            <InputBase
              inputRef={textareaRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder={listening ? 'Listening to voice query...' : `Ask Grok AI (${roleConfig.label})...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                fontSize: '0.9rem',
                color: '#0f172a',
                py: 0.5
              }}
            />

            {/* Speech to text toggle */}
            <Tooltip title={listening ? 'Stop listening' : 'Voice search'}>
              <IconButton
                size="small"
                onClick={toggleSpeech}
                sx={{
                  color: listening ? '#dc2626' : '#64748b',
                  bgcolor: listening ? '#fee2e2' : 'transparent',
                  mr: 0.5,
                  '&:hover': { bgcolor: listening ? '#fecaca' : '#f1f5f9' }
                }}
              >
                {listening ? <MicOff sx={{ fontSize: 19 }} /> : <Mic sx={{ fontSize: 19 }} />}
              </IconButton>
            </Tooltip>

            {/* Send circular button */}
            <IconButton
              type="submit"
              disabled={!input.trim() || loading}
              sx={{
                width: 34,
                height: 34,
                bgcolor: input.trim() && !loading ? '#0f172a' : '#e2e8f0',
                color: input.trim() && !loading ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: input.trim() && !loading ? '#2563eb' : '#e2e8f0'
                },
                '&.Mui-disabled': {
                  bgcolor: '#f1f5f9',
                  color: '#cbd5e1'
                }
              }}
            >
              <ArrowUpward sx={{ fontSize: 18, fontWeight: 700 }} />
            </IconButton>
          </Box>

          <Typography
            variant="caption"
            align="center"
            display="block"
            sx={{ color: '#94a3b8', fontSize: '0.68rem', mt: 0.75 }}
          >
            Grok AI provides institutional academic insights and assistance. Verify critical grading or fee records with official administration.
          </Typography>
        </Box>
      </Box>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. RENAME DIALOG                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
          Rename Conversation
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Conversation Title"
            value={newTitleInput}
            onChange={(e) => setNewTitleInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button onClick={handleSaveRename} variant="contained" sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Session List Item (for Pinned & Recents)
// ─────────────────────────────────────────────────────────────────────────────
function SessionListItem({ session, active, onSelect, onTogglePin, onRename, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1.5,
        py: 0.8,
        borderRadius: '8px',
        bgcolor: active ? '#e2e8f0' : hovered ? '#f1f5f9' : 'transparent',
        color: active ? '#0f172a' : '#334155',
        cursor: 'pointer',
        fontSize: '0.825rem',
        fontWeight: active ? 600 : 500,
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden', flex: 1 }}>
        <ChatBubbleOutline sx={{ fontSize: 16, color: active ? '#2563eb' : '#64748b', flexShrink: 0 }} />
        <Typography
          variant="body2"
          noWrap
          sx={{
            fontSize: '0.82rem',
            color: active ? '#0f172a' : '#334155',
            fontWeight: active ? 600 : 500
          }}
        >
          {session.title || 'Untitled Chat'}
        </Typography>
      </Box>

      {/* Hover action icons */}
      {(hovered || active) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
          <Tooltip title={session.pinned ? 'Unpin' : 'Pin'}>
            <IconButton size="small" onClick={onTogglePin} sx={{ p: 0.25, color: session.pinned ? '#2563eb' : '#64748b' }}>
              {session.pinned ? <PushPin sx={{ fontSize: 14 }} /> : <PushPinOutlined sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Rename">
            <IconButton size="small" onClick={onRename} sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#0f172a' } }}>
              <DriveFileRenameOutline sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete} sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#dc2626' } }}>
              <DeleteOutline sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
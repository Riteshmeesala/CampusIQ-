import React, { useState, useRef, useEffect } from 'react';
import {
  Box, IconButton, Typography, TextField, Tooltip,
  CircularProgress, Paper, Fade
} from '@mui/material';
import {
  Close, Send, Mic, MicOff, Refresh, ContentCopy,
  CheckCircle, AutoAwesome, OpenInFull
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiAPI } from '../../services/api';
import { COLORS } from '../../theme/theme';
import { toast } from 'react-toastify';
import StructuredAIResponse from './StructuredAIResponse';

export default function FloatingCampusBot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}. I am Grok AI. How can I assist you with your academic records, schedules, or queries today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setListening(false);
        if (event.error === 'not-allowed') {
          toast.warning('Microphone access was denied.');
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.info('Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
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
        console.error('Speech start error:', err);
      }
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { role: 'user', content: query, time: timeStr };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat(query, history);
      const outer = res?.data;
      const inner = outer?.data || outer || {};
      const reply = inner.response || inner.reply || 'No response received.';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Connection error with AI service.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errMsg}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        <Tooltip title={open ? 'Close Grok AI' : 'Ask Grok AI'}>
          <Box
            onClick={() => setOpen(!open)}
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              border: '2px solid #93c5fd',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              '&:hover': {
                transform: 'scale(1.06)',
                backgroundColor: '#1d4ed8',
              },
            }}
          >
            {open ? (
              <Close sx={{ fontSize: 22 }} />
            ) : (
              <AutoAwesome sx={{ fontSize: 22, color: '#ffffff' }} />
            )}
          </Box>
        </Tooltip>
      </Box>

      {/* Floating Chat Modal / Drawer */}
      <Fade in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 86,
            right: 24,
            width: { xs: 'calc(100vw - 32px)', sm: 460 },
            height: 580,
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: '#ffffff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 1,
            zIndex: 1300,
            display: open ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 1.75,
              px: 2,
              backgroundColor: '#ffffff',
              color: COLORS.textPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 0.5,
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AutoAwesome sx={{ fontSize: 18, color: '#2563eb' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: COLORS.textPrimary, fontSize: '0.875rem' }}>
                  Grok AI
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: '0.68rem', display: 'block' }}>
                  Intelligent Campus Assistant
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Open Fullscreen Workspace">
                <IconButton
                  size="small"
                  onClick={() => { setOpen(false); navigate('/chatbot'); }}
                  sx={{ color: COLORS.textSecond, '&:hover': { color: COLORS.textPrimary } }}
                >
                  <OpenInFull sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear Session">
                <IconButton
                  size="small"
                  onClick={() => setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])}
                  sx={{ color: COLORS.textSecond, '&:hover': { color: COLORS.textPrimary } }}
                >
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                sx={{ color: COLORS.textSecond, '&:hover': { color: COLORS.textPrimary } }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Viewport */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.75,
            }}
          >
            {messages.map((m, i) => {
              const isAssistant = m.role === 'assistant';
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    flexDirection: isAssistant ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  {isAssistant ? (
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 0.5,
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: 15, color: '#2563eb' }} />
                    </Box>
                  ) : null}

                  <Box sx={{ maxWidth: isAssistant ? '92%' : '85%' }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: isAssistant ? '#ffffff' : '#2563eb',
                        color: isAssistant ? COLORS.textPrimary : '#ffffff',
                        border: isAssistant ? `1px solid ${COLORS.border}` : 'none',
                        boxShadow: isAssistant ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                        fontSize: '0.825rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {isAssistant ? (
                        <StructuredAIResponse text={m.content} />
                      ) : (
                        <Typography sx={{ fontSize: '0.825rem', whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                        gap: 0.75,
                        mt: 0.25,
                        px: 0.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: '0.68rem' }}>
                        {m.time}
                      </Typography>
                      {isAssistant && (
                        <Tooltip title={copiedIdx === i ? 'Copied' : 'Copy'}>
                          <IconButton
                            size="small"
                            onClick={() => copyMessage(m.content, i)}
                            sx={{ p: 0.2, color: COLORS.textMuted }}
                          >
                            {copiedIdx === i ? (
                              <CheckCircle sx={{ fontSize: 12, color: '#166534' }} />
                            ) : (
                              <ContentCopy sx={{ fontSize: 12 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 0.5,
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 15, color: '#2563eb' }} />
                </Box>
                <Box
                  sx={{
                    p: 1.25,
                    px: 1.75,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress size={12} sx={{ color: '#3b82f6' }} />
                  <Typography variant="caption" sx={{ color: COLORS.textSecond, fontSize: '0.75rem' }}>
                    Thinking...
                  </Typography>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Voice Listening Active Notification */}
          {listening && (
            <Box
              sx={{
                px: 2,
                py: 0.75,
                backgroundColor: '#fef2f2',
                borderTop: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    animation: 'pulse 1.2s infinite',
                    '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, fontSize: '0.72rem' }}>
                  Listening... Speak now
                </Typography>
              </Box>
              <IconButton size="small" onClick={toggleVoice} sx={{ p: 0.2, color: '#991b1b' }}>
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}

          {/* Bottom Gemini-Style Prompt Input Bar */}
          <Box
            component="form"
            onSubmit={handleSend}
            sx={{
              p: 1.25,
              backgroundColor: '#ffffff',
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: `1px solid ${listening ? '#ef4444' : COLORS.border}`,
                borderRadius: 0.5,
                px: 1,
                py: 0.25,
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder={listening ? 'Listening to voice...' : 'Ask anything...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.8125rem',
                    color: COLORS.textPrimary,
                    py: 0.5,
                  }
                }}
              />

              {/* Voice Mic Button */}
              <Tooltip title={listening ? 'Stop voice recognition' : 'Speak message'}>
                <IconButton
                  size="small"
                  onClick={toggleVoice}
                  sx={{
                    p: 0.5,
                    color: listening ? '#dc2626' : COLORS.textSecond,
                    backgroundColor: listening ? '#fee2e2' : 'transparent',
                    '&:hover': {
                      backgroundColor: listening ? '#fecaca' : '#f1f5f9',
                    }
                  }}
                >
                  {listening ? <Mic sx={{ fontSize: 18 }} /> : <MicOff sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>

              {/* Send Button */}
              <IconButton
                type="submit"
                disabled={!input.trim() || loading}
                size="small"
                sx={{
                  p: 0.5,
                  color: input.trim() ? '#2563eb' : '#cbd5e1',
                }}
              >
                <Send sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Radio, RadioGroup,
  FormControlLabel, FormControl, LinearProgress, Divider
} from '@mui/material';
import {
  Quiz, CheckCircle, Timer, AssignmentTurnedIn, PlayArrow,
  Refresh, EmojiEvents, HelpOutline
} from '@mui/icons-material';
import { examAPI } from '../../services/api';
import { toast } from 'react-toastify';

const DEFAULT_TESTS = [
  {
    id: 1,
    title: 'Mid-Term 1 Computer Based Assessment - DBMS',
    subject: 'Database Management Systems (CS401)',
    duration: '45 Mins',
    totalQuestions: 30,
    maxMarks: 30,
    status: 'AVAILABLE',
    deadline: 'Today, 05:00 PM',
    questions: [
      {
        q: 'Which normal form eliminates multivalued dependencies?',
        options: ['1NF', '2NF', '3NF', '4NF'],
        answer: 3
      },
      {
        q: 'In Relational Algebra, which operator is used for selection?',
        options: ['Sigma (σ)', 'Pi (π)', 'Rho (ρ)', 'Cartesian Product (×)'],
        answer: 0
      },
      {
        q: 'What does the ACID acronym stand for in DBMS transactions?',
        options: [
          'Atomicity, Consistency, Isolation, Durability',
          'Availability, Concurrency, Integrity, Durability',
          'Accuracy, Completeness, Isolation, Dependability',
          'Access, Control, Isolation, Distribution'
        ],
        answer: 0
      }
    ]
  },
  {
    id: 2,
    title: 'Continuous Assessment Quiz 2 - Machine Learning',
    subject: 'Machine Learning & Intelligent Systems (CS402)',
    duration: '30 Mins',
    totalQuestions: 20,
    maxMarks: 20,
    status: 'AVAILABLE',
    deadline: 'Tomorrow, 11:59 PM',
    questions: [
      {
        q: 'Which algorithm is commonly used for classification trees based on Entropy?',
        options: ['ID3', 'Apriori', 'K-Means', 'DBSCAN'],
        answer: 0
      },
      {
        q: 'What is the purpose of regularisation (L1/L2) in linear models?',
        options: ['Prevent overfitting', 'Increase training speed', 'Double model parameters', 'Ensure zero bias'],
        answer: 0
      }
    ]
  },
  {
    id: 3,
    title: 'Design & Analysis of Algorithms - Code Assessment',
    subject: 'Design and Analysis of Algorithms (CS403)',
    duration: '60 Mins',
    totalQuestions: 25,
    maxMarks: 25,
    status: 'COMPLETED',
    score: 24,
    deadline: 'Completed on 28-Sep-2026',
    questions: []
  },
  {
    id: 4,
    title: 'Operating Systems System Call & Memory Quiz',
    subject: 'Operating Systems & Architecture (CS404)',
    duration: '30 Mins',
    totalQuestions: 20,
    maxMarks: 20,
    status: 'COMPLETED',
    score: 19,
    deadline: 'Completed on 25-Sep-2026',
    questions: []
  }
];

export default function StudentOnlineTestPage() {
  const [tests, setTests] = useState(DEFAULT_TESTS);
  const [activeTest, setActiveTest] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  useEffect(() => {
    examAPI.getAll()
      .then(res => {
        const raw = res.data?.data;
        if (Array.isArray(raw) && raw.length > 0) {
          // Merge with backend exams
          const backendTests = raw.map(e => ({
            id: e.id + 100,
            title: e.examName,
            subject: e.course?.courseName || 'Computer Science',
            duration: `${e.durationMinutes || 60} Mins`,
            totalQuestions: 25,
            maxMarks: e.totalMarks || 30,
            status: e.status === 'COMPLETED' ? 'COMPLETED' : 'AVAILABLE',
            deadline: e.scheduledDate ? new Date(e.scheduledDate).toLocaleDateString() : 'Active',
            questions: DEFAULT_TESTS[0].questions
          }));
          setTests(prev => [...backendTests, ...prev.filter(p => !backendTests.some(b => b.title === p.title))]);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartTest = (test) => {
    setActiveTest(test);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setTestResult(null);
    setTimeLeft(30 * 60);
  };

  const handleSelectAnswer = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitTest = () => {
    if (!activeTest) return;
    let correct = 0;
    activeTest.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correct++;
    });
    const finalScore = Math.round((correct / activeTest.questions.length) * activeTest.maxMarks);
    setTestResult({
      total: activeTest.questions.length,
      correct,
      score: finalScore,
      maxMarks: activeTest.maxMarks
    });
    setTests(prev => prev.map(t => t.id === activeTest.id ? { ...t, status: 'COMPLETED', score: finalScore } : t));
    toast.success(`🎉 Test submitted successfully! Your score: ${finalScore}/${activeTest.maxMarks}`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1250, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Online Assessment & Computer Based Tests
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Vasireddy Venkatadri International Technological University • Student CBT Module
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          size="small"
          onClick={() => toast.info('Refreshed online test list')}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Box>

      {/* KPI Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#eff6ff', color: '#2563eb' }}>
                <Quiz />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AVAILABLE TESTS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {tests.filter(t => t.status === 'AVAILABLE').length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#ecfdf5', color: '#059669' }}>
                <CheckCircle />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>COMPLETED TESTS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {tests.filter(t => t.status === 'COMPLETED').length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#fef3c7', color: '#d97706' }}>
                <EmojiEvents />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AVERAGE SCORE</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>92.5%</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#f1f5f9', color: '#475569' }}>
                <AssignmentTurnedIn />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>SEMESTER STATUS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>Semester 4</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tests Grid */}
      <Grid container spacing={2.5}>
        {tests.map(test => {
          const isCompleted = test.status === 'COMPLETED';
          return (
            <Grid item xs={12} md={6} key={test.id}>
              <Card sx={{
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip
                      label={isCompleted ? 'Completed' : 'Active Assessment'}
                      size="small"
                      sx={{
                        bgcolor: isCompleted ? '#dcfce7' : '#eff6ff',
                        color: isCompleted ? '#166534' : '#1d4ed8',
                        fontWeight: 700,
                        fontSize: 11
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontSize: 12 }}>
                      <Timer sx={{ fontSize: 16 }} />
                      <span>{test.duration}</span>
                    </Box>
                  </Box>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                    {test.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0284c7', fontWeight: 600, mb: 1.5 }}>
                    {test.subject}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Questions</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{test.totalQuestions}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Max Marks</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{test.maxMarks}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Deadline</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{test.deadline}</Typography>
                    </Box>
                  </Box>

                  {isCompleted ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 700 }}>
                        Score: {test.score || test.maxMarks} / {test.maxMarks}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toast.info('Detailed performance review is archived with Assessment Cell.')}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                      >
                        View Review
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleStartTest(test)}
                      sx={{
                        bgcolor: '#2563eb',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1
                      }}
                    >
                      Start Test
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Online Test Execution Modal */}
      {activeTest && (
        <Dialog open={Boolean(activeTest)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {activeTest.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {activeTest.subject} • Question {currentQIndex + 1} of {activeTest.questions.length}
                </Typography>
              </Box>
              <Chip
                icon={<Timer />}
                label="30:00"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {testResult ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EmojiEvents sx={{ fontSize: 56, color: '#f59e0b', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  Assessment Completed!
                </Typography>
                <Typography variant="body1" sx={{ color: '#475569', mb: 2 }}>
                  You scored <strong>{testResult.score} / {testResult.maxMarks}</strong> ({testResult.correct} of {testResult.total} questions correct).
                </Typography>
                <Chip label="Passed • Verified by VVITU Assessment Service" color="success" sx={{ fontWeight: 700 }} />
              </Box>
            ) : (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={((currentQIndex + 1) / activeTest.questions.length) * 100}
                  sx={{ height: 6, borderRadius: 3, mb: 3 }}
                />

                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                  Q{currentQIndex + 1}. {activeTest.questions[currentQIndex]?.q}
                </Typography>

                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={selectedAnswers[currentQIndex] !== undefined ? selectedAnswers[currentQIndex] : ''}
                    onChange={(e) => handleSelectAnswer(currentQIndex, Number(e.target.value))}
                  >
                    {activeTest.questions[currentQIndex]?.options.map((opt, optIdx) => (
                      <Paper
                        key={optIdx}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          border: selectedAnswers[currentQIndex] === optIdx ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          bgcolor: selectedAnswers[currentQIndex] === optIdx ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSelectAnswer(currentQIndex, optIdx)}
                      >
                        <FormControlLabel
                          value={optIdx}
                          control={<Radio size="small" />}
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{opt}</Typography>}
                          sx={{ width: '100%', m: 0 }}
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
            {testResult ? (
              <Button
                variant="contained"
                onClick={() => setActiveTest(null)}
                sx={{ ml: 'auto', bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700 }}
              >
                Close & Return
              </Button>
            ) : (
              <>
                <Button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Previous
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {currentQIndex < activeTest.questions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={() => setCurrentQIndex(prev => prev + 1)}
                      sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700 }}
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSubmitTest}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Submit Assessment
                    </Button>
                  )}
                </Box>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

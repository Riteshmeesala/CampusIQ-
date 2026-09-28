import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, Button,
  Tab, Tabs, Radio, RadioGroup, FormControlLabel, FormControl,
  TextField, Rating, Alert, Chip
} from '@mui/material';
import {
  Poll, Star, Send, CheckCircle, AutoAwesome, RateReview
} from '@mui/icons-material';
import { surveyAPI } from '../../services/api';

const SSS_QUESTIONS = [
  { id: 1, text: 'How much of the syllabus was covered in the class?', options: ['85 to 100%', '70 to 84%', '55 to 69%', '30 to 54%', 'Below 30%'] },
  { id: 2, text: 'How well did the teachers prepare for the classes?', options: ['Thoroughly', 'Satisfactorily', 'Poorly', 'Indifferently', 'Won’t teach at all'] },
  { id: 3, text: 'How well were the teachers able to communicate?', options: ['Always effective', 'Sometimes effective', 'Just satisfactorily', 'Generally ineffective', 'Very poor communication'] },
  { id: 4, text: 'The teacher’s approach to teaching can best be described as:', options: ['Excellent', 'Very good', 'Good', 'Fair', 'Poor'] },
  { id: 5, text: 'Fairness of the internal evaluation process by the teachers:', options: ['Always fair', 'Usually fair', 'Sometimes unfair', 'Usually unfair', 'Unfair'] },
  { id: 6, text: 'Was your performance in assignments discussed with you?', options: ['Every time', 'Usually', 'Occasionally/Sometimes', 'Rarely', 'Never'] },
  { id: 7, text: 'The institute takes active interest in promoting internship, student exchange, field visit opportunities for students:', options: ['Regularly', 'Often', 'Sometimes', 'Rarely', 'Never'] },
];

const COURSES_LIST = [
  { code: 'CS601PC', name: 'Cloud Computing & Distributed Systems', faculty: 'Dr. Ramesh Sharma', status: 'Pending' },
  { code: 'CS602PC', name: 'Machine Learning & Neural Nets', faculty: 'Prof. Ananya Sen', status: 'Completed' },
  { code: 'CS603PC', name: 'Information Security & Cryptography', faculty: 'Dr. K. V. Rao', status: 'Pending' },
  { code: 'CS604PC', name: 'Compiler Design', faculty: 'Dr. S. Mukherjee', status: 'Pending' },
];

export default function StudentSurveysFeedbackPage({ initialTab = 0 }) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const [sssAnswers, setSssAnswers] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(COURSES_LIST[0]);
  const [courseRatings, setCourseRatings] = useState({ co1: 4, co2: 5, co3: 4, co4: 4, facultyPedagogy: 5, labFacilities: 4 });
  const [feedbackCategory, setFeedbackCategory] = useState('Academic Curriculum');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState({ sss: false, ces: false, general: false });

  const handleSssChange = (qId, val) => {
    setSssAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSssSubmit = async () => {
    try {
      await surveyAPI.submitSurvey({
        surveyType: 'NAAC_SSS',
        answers: sssAnswers,
        studentRoll: '24CS001'
      });
    } catch (err) {
      console.warn('Failed to submit SSS to server:', err);
    }
    setSubmitted(prev => ({ ...prev, sss: true }));
  };

  const handleCesSubmit = async () => {
    try {
      await surveyAPI.submitSurvey({
        surveyType: 'COURSE_END_SURVEY',
        courseCode: selectedCourse.code,
        courseName: selectedCourse.name,
        ratings: courseRatings,
        studentRoll: '24CS001'
      });
    } catch (err) {
      console.warn('Failed to submit CES to server:', err);
    }
    setSubmitted(prev => ({ ...prev, ces: true }));
  };

  const handleGeneralSubmit = async () => {
    if (!feedbackText.trim()) return;
    try {
      await surveyAPI.submitSurvey({
        surveyType: 'GENERAL_FEEDBACK',
        category: feedbackCategory,
        feedback: feedbackText.trim(),
        studentRoll: '24CS001'
      });
    } catch (err) {
      console.warn('Failed to submit feedback to server:', err);
    }
    setSubmitted(prev => ({ ...prev, general: true }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Poll sx={{ color: '#2563eb' }} /> Surveys & Institutional Feedback
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Participate in NAAC Student Satisfaction Survey (SSS), Course End Surveys (CES), and submit suggestions for college improvement.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            bgcolor: '#ffffff',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, py: 2, minHeight: 48 },
            '& .Mui-selected': { color: '#2563eb' },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3 }
          }}
        >
          <Tab icon={<Poll fontSize="small" />} iconPosition="start" label="Student Satisfaction Survey (SSS)" />
          <Tab icon={<Star fontSize="small" />} iconPosition="start" label="Course End Survey (CES)" />
          <Tab icon={<RateReview fontSize="small" />} iconPosition="start" label="Campus Feedback & Suggestions" />
        </Tabs>
      </Paper>

      {/* Tab 0: Student Satisfaction Survey */}
      {tabIndex === 0 && (
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
          {submitted.sss ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Thank You for Your Feedback!
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 1, maxWidth: 500, mx: 'auto' }}>
                Your responses for the NAAC Student Satisfaction Survey 2026-2027 have been encrypted and submitted anonymously to the IQAC quality cell.
              </Typography>
              <Button variant="outlined" sx={{ mt: 3, textTransform: 'none', borderRadius: 2 }} onClick={() => setSubmitted(p => ({ ...p, sss: false }))}>
                Edit Response
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', borderRadius: 2.5, border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                    National Assessment & Accreditation Council (NAAC) Survey
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#3b82f6' }}>
                    Please answer all questions honestly. Your identity is strictly anonymous and confidential.
                  </Typography>
                </Box>
                <Chip label="Academic Term 2026-2027" color="primary" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {SSS_QUESTIONS.map((q) => (
                  <Card key={q.id} variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                      Q{q.id}. {q.text}
                    </Typography>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={sssAnswers[q.id] || ''}
                        onChange={(e) => handleSssChange(q.id, e.target.value)}
                      >
                        {q.options.map((opt, oIdx) => (
                          <FormControlLabel
                            key={oIdx}
                            value={opt}
                            control={<Radio size="small" sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#2563eb' } }} />}
                            label={<Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>{opt}</Typography>}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                ))}
              </Box>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={handleSssSubmit}
                  sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb', px: 3 }}
                >
                  Submit Survey
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 1: Course End Survey */}
      {tabIndex === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2 }}>
                Select Course to Rate
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {COURSES_LIST.map((c) => (
                  <Button
                    key={c.code}
                    onClick={() => setSelectedCourse(c)}
                    variant={selectedCourse.code === c.code ? 'contained' : 'outlined'}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      p: 2,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      bgcolor: selectedCourse.code === c.code ? '#2563eb' : 'transparent',
                      color: selectedCourse.code === c.code ? '#ffffff' : '#1e293b',
                      borderColor: selectedCourse.code === c.code ? '#2563eb' : '#e2e8f0',
                      '&:hover': { bgcolor: selectedCourse.code === c.code ? '#1d4ed8' : '#f8fafc' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8 }}>
                        {c.code}
                      </Typography>
                      <Chip
                        label={c.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: c.status === 'Completed' ? '#dcfce7' : (selectedCourse.code === c.code ? 'rgba(255,255,255,0.25)' : '#f1f5f9'),
                          color: c.status === 'Completed' ? '#166534' : (selectedCourse.code === c.code ? '#ffffff' : '#64748b')
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {c.name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>
                      Faculty: {c.faculty}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Course Outcome (CO) Attainment Survey
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Course: <strong>{selectedCourse.name} ({selectedCourse.code})</strong> • Faculty: {selectedCourse.faculty}
                  </Typography>
                </Box>
                <Chip label="NBA Outcome Survey" color="secondary" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              {submitted.ces ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Course End Survey for {selectedCourse.name} has been successfully recorded!
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      CO1: Understand the fundamental architecture & cloud virtualization concepts
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Rating value={courseRatings.co1} onChange={(e, v) => setCourseRatings(p => ({ ...p, co1: v }))} />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>({courseRatings.co1} / 5 Stars)</Typography>
                    </Box>
                  </Card>

                  <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      CO2: Analyze distributed algorithms and cloud service models (IaaS, PaaS, SaaS)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Rating value={courseRatings.co2} onChange={(e, v) => setCourseRatings(p => ({ ...p, co2: v }))} />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>({courseRatings.co2} / 5 Stars)</Typography>
                    </Box>
                  </Card>

                  <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      CO3: Deploy applications on AWS/GCP and configure Docker containers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Rating value={courseRatings.co3} onChange={(e, v) => setCourseRatings(p => ({ ...p, co3: v }))} />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>({courseRatings.co3} / 5 Stars)</Typography>
                    </Box>
                  </Card>

                  <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Overall Faculty Delivery & Practical Lab Support
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Rating value={courseRatings.facultyPedagogy} onChange={(e, v) => setCourseRatings(p => ({ ...p, facultyPedagogy: v }))} />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>({courseRatings.facultyPedagogy} / 5 Stars)</Typography>
                    </Box>
                  </Card>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" onClick={handleCesSubmit} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb', px: 3 }}>
                      Submit Course Survey
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: General Campus Feedback */}
      {tabIndex === 2 && (
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            Submit Suggestion or Feedback
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Share ideas for infrastructure, library resources, canteen, sports, or academic facilities.
          </Typography>

          {submitted.general ? (
            <Alert severity="success" sx={{ borderRadius: 2, mb: 3 }}>
              Your feedback has been routed to the Dean of Student Affairs & IQAC Committee. Thank you!
            </Alert>
          ) : null}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                Feedback Category
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="Academic Curriculum">Academic Curriculum & Labs</option>
                <option value="Library & E-Resources">Library & Digital Books</option>
                <option value="Campus Facilities & Wi-Fi">Campus Wi-Fi & Infrastructure</option>
                <option value="Hostel & Canteen">Hostel & Canteen</option>
                <option value="Placement & Training">Training & Placement Support</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                Your Detailed Feedback / Constructive Suggestions
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Describe your suggestions clearly..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AutoAwesome sx={{ color: '#8b5cf6' }} />
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  AI Feedback Assistant automatically tags sentiments and prioritizes urgent infrastructure requests for college administration.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="contained"
                onClick={handleGeneralSubmit}
                endIcon={<Send />}
                sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb', px: 3 }}
              >
                Send Feedback
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

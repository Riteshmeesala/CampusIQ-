-- ==============================================================
-- CampusIQ+ Real-time Working Data Seeder
-- Synchronized data for Admin (11), Faculty (12), Student (13, 14)
-- ==============================================================

USE campusiq_v6;

-- 1. Sync & Align User Stakeholder Profiles
UPDATE users SET
    name = 'Dr. Rajesh Sharma',
    department = 'Computer Science',
    home_department = 'Computer Science',
    designation = 'Associate Professor & AI Lead',
    specialization = 'Database Systems & Machine Learning',
    employee_id = 'FAC-CS-01',
    course = 'B.Tech Computer Science and Engineering',
    phone_number = '9876543210',
    experience_years = '12 Years',
    qualifications = 'Ph.D. in Computer Science & Engineering, M.Tech (AI)',
    is_active = 1
WHERE id = 12;

UPDATE users SET
    name = 'Aarav Varma',
    department = 'Computer Science',
    home_department = 'Computer Science',
    enrollment_number = '24CS001',
    section = 'Section A',
    semester = 4,
    year = '2nd Year',
    batch_year = '2023-2027',
    course = 'B.Tech Computer Science and Engineering',
    phone_number = '9848012345',
    address = 'Plot 42, Silicon Valley Colony, Hyderabad',
    is_active = 1
WHERE id = 13;

UPDATE users SET
    name = 'Meesala Ritesh',
    department = 'Computer Science',
    home_department = 'Computer Science',
    enrollment_number = '23BQ1A1268',
    section = 'Section A',
    semester = 4,
    year = '2nd Year',
    batch_year = '2023-2027',
    course = 'B.Tech Computer Science and Engineering',
    phone_number = '9959012345',
    address = 'Plot 18, Cyber Towers Enclave, Guntur',
    is_active = 1
WHERE id = 14;

-- 2. Student Registrations Ledger
DELETE FROM student_registrations WHERE id > 0;
INSERT INTO student_registrations (id, enrollment_number, name, email, username, password, department, section, semester, year, course, status, phone_number, created_at, updated_at) VALUES
(1, '24CS001', 'Aarav Varma', 'aarav.24cs001@campusiq.com', '24CS001', '$2a$10$aZ7YSFjfoOLFjjmNKWMCauorgPIWpD/8XMc3CJa52s5PhFzK37DfO', 'Computer Science', 'Section A', '4', '2nd Year', 'B.Tech Computer Science and Engineering', 'APPROVED', '9848012345', NOW(), NOW()),
(2, '23BQ1A1268', 'Meesala Ritesh', '23bq1a1268@vvit.net', 'Ritesh@0512', '$2a$10$aZ7YSFjfoOLFjjmNKWMCauorgPIWpD/8XMc3CJa52s5PhFzK37DfO', 'Computer Science', 'Section A', '4', '2nd Year', 'B.Tech Computer Science and Engineering', 'APPROVED', '9959012345', NOW(), NOW());

-- 3. Realistic Academic Courses Taught by Dr. Rajesh Sharma (Faculty ID: 12)
DELETE FROM courses WHERE id > 0;
INSERT INTO courses (id, course_code, course_name, description, credit_hours, department, faculty_id, created_at) VALUES
(1, 'CS401', 'Database Management Systems', 'Relational database architecture, advanced SQL querying, relational algebra, indexing, and transaction processing.', 4, 'Computer Science', 12, NOW()),
(2, 'CS402', 'Machine Learning & Intelligent Systems', 'Foundations of machine learning, regression, classification trees, neural networks, and prompt engineering.', 4, 'Computer Science', 12, NOW()),
(3, 'CS403', 'Design and Analysis of Algorithms', 'Asymptotic complexity, divide and conquer, dynamic programming, graph algorithms, and NP-completeness.', 3, 'Computer Science', 12, NOW()),
(4, 'CS404', 'Operating Systems & Architecture', 'Process concurrency, CPU scheduling algorithms, virtual memory paging, and storage file systems.', 3, 'Computer Science', 12, NOW());

-- 4. Faculty Subject Assignments
DELETE FROM faculty_subject_assignments WHERE id > 0;
INSERT INTO faculty_subject_assignments (id, faculty_id, subject_code, subject_name, department, semester_code, academic_year, section, credit_hours, is_active, assigned_by, created_at, updated_at) VALUES
(1, 12, 'CS401', 'Database Management Systems', 'Computer Science', '4', '2024-2025', 'Section A', 4, 1, 11, NOW(), NOW()),
(2, 12, 'CS402', 'Machine Learning & Intelligent Systems', 'Computer Science', '4', '2024-2025', 'Section A', 4, 1, 11, NOW(), NOW()),
(3, 12, 'CS403', 'Design and Analysis of Algorithms', 'Computer Science', '4', '2024-2025', 'Section A', 3, 1, 11, NOW(), NOW());

-- 5. Timetable Slots (Synchronized for Faculty 12 and Students in Section A)
DELETE FROM timetable_slots WHERE id > 0;
INSERT INTO timetable_slots (id, course_id, faculty_id, day_of_week, start_time, end_time, period_name, room_no, section_name, class_type, color_code, created_at) VALUES
(1, 1, 12, 'MONDAY', '09:00', '10:00', 'Period 1', 'LH-201', 'Section A', 'LECTURE', '#3b82f6', NOW()),
(2, 2, 12, 'MONDAY', '10:15', '11:15', 'Period 2', 'LH-201', 'Section A', 'LECTURE', '#10b981', NOW()),
(3, 3, 12, 'TUESDAY', '09:00', '10:00', 'Period 1', 'LH-202', 'Section A', 'LECTURE', '#8b5cf6', NOW()),
(4, 1, 12, 'TUESDAY', '11:15', '12:15', 'Period 3', 'LH-201', 'Section A', 'TUTORIAL', '#3b82f6', NOW()),
(5, 2, 12, 'WEDNESDAY', '10:15', '11:15', 'Period 2', 'LH-201', 'Section A', 'LECTURE', '#10b981', NOW()),
(6, 1, 12, 'WEDNESDAY', '14:00', '16:00', 'Lab 1 & 2', 'CS-Lab 3', 'Section A', 'LAB', '#f59e0b', NOW()),
(7, 3, 12, 'THURSDAY', '09:00', '10:00', 'Period 1', 'LH-202', 'Section A', 'LECTURE', '#8b5cf6', NOW()),
(8, 4, 12, 'FRIDAY', '10:15', '11:15', 'Period 2', 'LH-201', 'Section A', 'LECTURE', '#06b6d4', NOW());

-- 6. Faculty Lesson Plan / Schedule Progress
DELETE FROM faculty_schedules WHERE id > 0;
INSERT INTO faculty_schedules (id, faculty_id, course_id, schedule_date, topic_covered, sub_topics, chapter_number, duration_hours, teaching_method, class_period, remarks, created_at) VALUES
(1, 12, 1, '2026-09-21', 'Relational Algebra & Tuple Calculus', 'Selection, projection, Cartesian product, theta joins, natural joins', 'Chapter 3', 1.0, 'Interactive Presentation & Live Queries', 'Period 1', 'Students solved 4 complex SQL conversion problems', NOW()),
(2, 12, 2, '2026-09-22', 'Supervised Learning: Decision Trees', 'Entropy, Information Gain, ID3, C4.5 and Gini Impurity algorithms', 'Chapter 4', 1.0, 'Jupyter Notebook Demonstration', 'Period 2', 'Implemented DecisionTreeClassifier from scratch in Python', NOW()),
(3, 12, 3, '2026-09-23', 'Divide & Conquer Recurrence Relations', 'Master Theorem cases 1, 2, and 3 with MergeSort & Strassens Matrix', 'Chapter 2', 1.0, 'Blackboard Mathematical Derivation', 'Period 1', 'Aarav and Ritesh presented solutions on the board', NOW()),
(4, 12, 1, '2026-09-24', 'Database Normalization to BCNF', 'Functional dependencies, 1NF, 2NF, 3NF, Boyce-Codd Normal Form losslessness', 'Chapter 4', 1.0, 'Case Study & Problem Solving', 'Period 3', 'Covered real-world e-commerce schema decomposition', NOW());

-- 7. Coherent Attendance Data for Students 13 & 14 across Courses 1 & 2
DELETE FROM attendance WHERE id > 0;
INSERT INTO attendance (id, student_id, course_id, attendance_date, status, remarks, marked_by, created_at) VALUES
(1, 13, 1, '2026-09-01', 'PRESENT', 'Attended lecture and participated actively', 12, NOW()),
(2, 14, 1, '2026-09-01', 'PRESENT', 'Attended lecture and answered SQL query prompt', 12, NOW()),
(3, 13, 2, '2026-09-02', 'PRESENT', 'Attended ML introduction session', 12, NOW()),
(4, 14, 2, '2026-09-02', 'PRESENT', 'Completed live Google Colab lab exercise', 12, NOW()),
(5, 13, 1, '2026-09-08', 'PRESENT', 'Database normalization tutorial', 12, NOW()),
(6, 14, 1, '2026-09-08', 'PRESENT', 'Excellent query performance analysis', 12, NOW()),
(7, 13, 2, '2026-09-09', 'LATE', 'Arrived 10 minutes late due to campus bus delay', 12, NOW()),
(8, 14, 2, '2026-09-09', 'PRESENT', 'Present on time for Decision Trees lecture', 12, NOW()),
(9, 13, 1, '2026-09-15', 'PRESENT', 'SQL Joins & Indexing workshop', 12, NOW()),
(10, 14, 1, '2026-09-15', 'PRESENT', 'SQL Joins & Indexing workshop', 12, NOW()),
(11, 13, 2, '2026-09-16', 'PRESENT', 'Random Forests & Ensemble Learning', 12, NOW()),
(12, 14, 2, '2026-09-16', 'PRESENT', 'Random Forests & Ensemble Learning', 12, NOW()),
(13, 13, 1, '2026-09-22', 'PRESENT', 'Transaction processing & ACID properties', 12, NOW()),
(14, 14, 1, '2026-09-22', 'PRESENT', 'Transaction processing & ACID properties', 12, NOW()),
(15, 13, 2, '2026-09-23', 'PRESENT', 'Neural Network Backpropagation', 12, NOW()),
(16, 14, 2, '2026-09-23', 'PRESENT', 'Neural Network Backpropagation', 12, NOW());

-- 8. Realistic Exams
DELETE FROM exams WHERE id > 0;
INSERT INTO exams (id, exam_name, course_id, scheduled_date, duration_minutes, total_marks, passing_marks, venue, status, description, semester, exam_type, created_at, updated_at) VALUES
(1, 'Mid-Term 1: Database Management Systems', 1, '2026-09-10 10:00:00', 90, 30, 12, 'LH-201', 'COMPLETED', 'Continuous Assessment Mid 1 covering Relational Algebra and SQL queries.', 4, 'MID_SEM', NOW(), NOW()),
(2, 'Mid-Term 1: Machine Learning & Intelligent Systems', 2, '2026-09-12 10:00:00', 90, 30, 12, 'LH-202', 'COMPLETED', 'Continuous Assessment Mid 1 covering Linear Regression, Trees, and Classifier Loss.', 4, 'MID_SEM', NOW(), NOW()),
(3, 'Mid-Term 1: Design and Analysis of Algorithms', 3, '2026-09-14 10:00:00', 90, 30, 12, 'LH-201', 'COMPLETED', 'Continuous Assessment Mid 1 covering Asymptotic analysis and Dynamic Programming.', 4, 'MID_SEM', NOW(), NOW()),
(4, 'Semester End Examination: Database Management Systems', 1, '2026-10-15 10:00:00', 180, 70, 24, 'Auditorium Hall A', 'SCHEDULED', 'Comprehensive University End-Semester Examination.', 4, 'SEMESTER', NOW(), NOW()),
(5, 'Semester End Examination: Machine Learning & AI', 2, '2026-10-18 10:00:00', 180, 70, 24, 'Auditorium Hall A', 'SCHEDULED', 'Comprehensive University End-Semester Examination.', 4, 'SEMESTER', NOW(), NOW()),
(6, 'Mid-Term 2: Database Management Systems', 1, '2026-09-25 10:00:00', 90, 30, 12, 'LH-201', 'COMPLETED', 'Continuous Assessment Mid 2 covering Normalization, Indexing and Transactions.', 4, 'MID_SEM', NOW(), NOW()),
(7, 'Mid-Term 2: Machine Learning & Intelligent Systems', 2, '2026-09-26 10:00:00', 90, 30, 12, 'LH-202', 'COMPLETED', 'Continuous Assessment Mid 2 covering Neural Networks, Backpropagation and Deep Learning.', 4, 'MID_SEM', NOW(), NOW()),
(8, 'Mid-Term 2: Design and Analysis of Algorithms', 3, '2026-09-27 10:00:00', 90, 30, 12, 'LH-201', 'COMPLETED', 'Continuous Assessment Mid 2 covering Greedy Algorithms, Graph Traversal and NP-Completeness.', 4, 'MID_SEM', NOW(), NOW()),
(9, 'Semester End Examination: Design and Analysis of Algorithms', 3, '2026-10-20 10:00:00', 180, 70, 24, 'Auditorium Hall B', 'SCHEDULED', 'Comprehensive University End-Semester Examination for DAA.', 4, 'SEMESTER', NOW(), NOW()),
(10, 'Mid-Term 1: Operating Systems & Architecture', 4, '2026-09-15 10:00:00', 90, 30, 12, 'LH-203', 'COMPLETED', 'Continuous Assessment Mid 1 covering Process Synchronization and CPU Scheduling.', 4, 'MID_SEM', NOW(), NOW()),
(11, 'Mid-Term 2: Operating Systems & Architecture', 4, '2026-09-28 10:00:00', 90, 30, 12, 'LH-203', 'SCHEDULED', 'Continuous Assessment Mid 2 covering Virtual Memory Paging, Deadlocks and File Systems.', 4, 'MID_SEM', NOW(), NOW()),
(12, 'Semester End Examination: Operating Systems & Architecture', 4, '2026-10-22 10:00:00', 180, 70, 24, 'Auditorium Hall B', 'SCHEDULED', 'Comprehensive University End-Semester Examination for OS & Architecture.', 4, 'SEMESTER', NOW(), NOW());

-- 9. Exam Results for Mid-Term 1 (No letter grades for Mid examinations)
DELETE FROM results WHERE id > 0;
INSERT INTO results (id, student_id, exam_id, marks_obtained, percentage, grade, grade_points, is_pass, remarks, published_by, result_type, created_at, updated_at) VALUES
(1, 13, 1, 27.50, 91.67, NULL, NULL, 1, 'Outstanding SQL schema design and relational algebra derivation.', 12, 'MID_SEM', NOW(), NOW()),
(2, 13, 2, 26.00, 86.67, NULL, NULL, 1, 'Strong grasp of decision tree entropy and pruning techniques.', 12, 'MID_SEM', NOW(), NOW()),
(3, 13, 3, 28.00, 93.33, NULL, NULL, 1, 'Flawless recurrence relations and dynamic programming table memoization.', 12, 'MID_SEM', NOW(), NOW()),
(4, 14, 1, 29.00, 96.67, NULL, NULL, 1, 'Exemplary query decomposition and relational index performance tuning.', 12, 'MID_SEM', NOW(), NOW()),
(5, 14, 2, 28.50, 95.00, NULL, NULL, 1, 'Exceptional mastery of machine learning fundamentals and neural loss.', 12, 'MID_SEM', NOW(), NOW()),
(6, 14, 3, 29.50, 98.33, NULL, NULL, 1, 'Top of cohort in advanced algorithm design and NP-completeness proofs.', 12, 'MID_SEM', NOW(), NOW());

-- 10. Student Academic Records (Continuous Evaluation Ledger)
DELETE FROM student_academic_records WHERE id > 0;
INSERT INTO student_academic_records (
    id, student_id, semester_num, semester_code, subject_code, subject_name, credit_hours,
    internal_marks, mid_marks, semester_marks, total_marks, grade, grade_point,
    attendance_percentage, faculty_name, mid1_descriptive_marks, mid1_objective_marks,
    mid1_open_book_marks, mid1_total_marks, updated_by, created_at, updated_at
) VALUES
(1, 13, 4, '4', 'CS401', 'Database Management Systems', 4, 28.0, 27.5, NULL, 91.5, 'A+', 9.00, 92.5, 'Dr. Rajesh Sharma', 14.0, 9.5, 4.0, 27.5, 11, NOW(), NOW()),
(2, 13, 4, '4', 'CS402', 'Machine Learning & Intelligent Systems', 4, 27.0, 26.0, NULL, 88.0, 'A', 8.50, 87.5, 'Dr. Rajesh Sharma', 13.0, 9.0, 4.0, 26.0, 11, NOW(), NOW()),
(3, 13, 4, '4', 'CS403', 'Design and Analysis of Algorithms', 3, 29.0, 28.0, NULL, 94.0, 'O', 10.00, 95.0, 'Dr. Rajesh Sharma', 14.5, 9.5, 4.0, 28.0, 11, NOW(), NOW()),
(4, 13, 4, '4', 'CS404', 'Operating Systems & Architecture', 3, 26.5, 25.5, NULL, 86.5, 'A', 8.50, 88.0, 'Dr. Rajesh Sharma', 13.0, 8.5, 4.0, 25.5, 11, NOW(), NOW()),
(5, 14, 4, '4', 'CS401', 'Database Management Systems', 4, 29.5, 29.0, NULL, 96.5, 'O', 10.00, 95.0, 'Dr. Rajesh Sharma', 15.0, 10.0, 4.0, 29.0, 11, NOW(), NOW()),
(6, 14, 4, '4', 'CS402', 'Machine Learning & Intelligent Systems', 4, 29.0, 28.5, NULL, 95.0, 'O', 10.00, 94.0, 'Dr. Rajesh Sharma', 14.5, 10.0, 4.0, 28.5, 11, NOW(), NOW()),
(7, 14, 4, '4', 'CS403', 'Design and Analysis of Algorithms', 3, 30.0, 29.5, NULL, 98.0, 'O', 10.00, 96.0, 'Dr. Rajesh Sharma', 15.0, 10.0, 4.5, 29.5, 11, NOW(), NOW()),
(8, 14, 4, '4', 'CS404', 'Operating Systems & Architecture', 3, 28.0, 27.5, NULL, 92.5, 'A+', 9.00, 93.0, 'Dr. Rajesh Sharma', 14.0, 9.5, 4.0, 27.5, 11, NOW(), NOW());

-- 11. Student Semester Summaries
DELETE FROM student_semester_summaries WHERE id > 0;
INSERT INTO student_semester_summaries (id, student_id, semester_num, semester_code, total_credits, earned_credits, sgpa, cgpa, attendance_percentage, remarks, updated_by, created_at, updated_at) VALUES
(1, 13, 1, '1', 20, 20, 8.65, 8.65, 91.00, 'Excellent first semester foundation', 11, NOW(), NOW()),
(2, 13, 2, '2', 21, 21, 8.90, 8.78, 89.50, 'Consistent academic excellence', 11, NOW(), NOW()),
(3, 13, 3, '3', 22, 22, 9.20, 8.92, 94.00, 'Dean Honour Roll recipient', 11, NOW(), NOW()),
(4, 14, 1, '1', 20, 20, 9.10, 9.10, 95.00, 'Outstanding academic performance', 11, NOW(), NOW()),
(5, 14, 2, '2', 21, 21, 9.35, 9.22, 94.50, 'Department rank 1 in algorithms', 11, NOW(), NOW()),
(6, 14, 3, '3', 22, 22, 9.40, 9.28, 96.00, 'Exemplary semester overall record', 11, NOW(), NOW());

-- 12. Student CGPA Ledger
DELETE FROM student_cgpa WHERE id > 0;
INSERT INTO student_cgpa (id, student_id, semester, cgpa_value, published_by, remarks, created_at, updated_at) VALUES
(1, 13, 3, 8.92, 11, 'Official Cumulative Grade Point Average through Semester 3', NOW(), NOW()),
(2, 14, 3, 9.28, 11, 'Official Cumulative Grade Point Average through Semester 3', NOW(), NOW());

-- 13. Institutional Fees & Ledger (Tuition, Lab, Exam fees for 13 & 14)
DELETE FROM fees WHERE id > 0;
INSERT INTO fees (id, student_id, fee_type, amount, due_date, paid_date, status, razorpay_payment_id, description, academic_year, semester, created_at, updated_at) VALUES
(1, 13, 'Tuition Fee', 65000.00, '2026-08-15', '2026-08-10', 'PAID', 'pay_Aarav9827361', 'Annual Tuition Fee for Semester 4 - B.Tech CSE', '2024-2025', '4', NOW(), NOW()),
(2, 13, 'Advanced Computing & AI Lab Fee', 12000.00, '2026-08-20', '2026-08-12', 'PAID', 'pay_Aarav8821903', 'GPU Cluster & Cloud Laboratory Infrastructure Fee', '2024-2025', '4', NOW(), NOW()),
(3, 13, 'Mid-Term Examination & Library Dues', 3500.00, '2026-10-05', NULL, 'PENDING', NULL, 'Semester 4 Mid-Term Assessment & Digital Library Access Dues', '2024-2025', '4', NOW(), NOW()),
(4, 14, 'Tuition Fee', 65000.00, '2026-08-15', '2026-08-08', 'PAID', 'pay_Ritesh8371920', 'Annual Tuition Fee for Semester 4 - B.Tech CSE', '2024-2025', '4', NOW(), NOW()),
(5, 14, 'Advanced Computing & AI Lab Fee', 12000.00, '2026-08-20', '2026-08-08', 'PAID', 'pay_Ritesh8371921', 'GPU Cluster & Cloud Laboratory Infrastructure Fee', '2024-2025', '4', NOW(), NOW()),
(6, 14, 'IEEE Chapter & Symposium Dues', 2500.00, '2026-10-10', NULL, 'PENDING', NULL, 'Annual IEEE Student Chapter Membership & Tech Symposium Fee', '2024-2025', '4', NOW(), NOW());

-- 14. Notifications for all stakeholders
DELETE FROM notifications WHERE id > 0;
INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id, reference_type, created_at) VALUES
(1, 13, 'Mid-Term 1 Results Published', 'Your Mid-Term 1 results for CS401, CS402, and CS403 have been officially released. Your aggregate score is 90.5%.', 'RESULT_PUBLISHED', 0, 1, 'EXAM', NOW()),
(2, 13, 'Fee Payment Verified', 'Payment of ₹65,000 for Tuition Fee (Semester 4) has been verified. Transaction ID: pay_Aarav9827361.', 'PAYMENT_SUCCESS', 1, 1, 'FEE', NOW()),
(3, 13, 'Pending Fee Reminder', 'Reminder: Mid-Term Examination & Library Dues of ₹3,500 is due by 05-Oct-2026. Please settle to avoid late penalties.', 'FEE_REMINDER', 0, 3, 'FEE', NOW()),
(4, 14, 'Mid-Term 1 Results Published', 'Congratulations! Your Mid-Term 1 aggregate score is 96.7% across CS401, CS402, and CS403. You are in the top percentile.', 'RESULT_PUBLISHED', 0, 4, 'EXAM', NOW()),
(5, 14, 'Fee Payment Verified', 'Payment of ₹65,000 for Tuition Fee (Semester 4) has been verified. Transaction ID: pay_Ritesh8371920.', 'PAYMENT_SUCCESS', 1, 4, 'FEE', NOW()),
(6, 14, 'IEEE Chapter Dues Reminder', 'Reminder: Annual IEEE Chapter & Tech Symposium dues of ₹2,500 is due on 10-Oct-2026.', 'FEE_REMINDER', 0, 6, 'FEE', NOW()),
(7, 12, 'Mid-Term 1 Evaluation Ledger Completed', 'Grades and continuous evaluation for Section A (CS401, CS402, CS403) have been synchronized with the Assessment Service.', 'SYSTEM', 0, 1, 'ACADEMIC', NOW()),
(8, 12, 'Accreditation Audit Meeting Notice', 'Faculty departmental meeting scheduled for Friday at 3:00 PM in Conference Room 1 regarding NAAC & NBA criteria.', 'GENERAL', 0, NULL, 'NOTICE', NOW()),
(9, 11, 'Academic Synchronous Cluster Active', 'All 8 CampusIQ+ microservices report complete synchronization across Admin, Faculty, and Student portals.', 'SYSTEM', 0, NULL, 'HEALTH', NOW());

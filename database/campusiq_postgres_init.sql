-- =====================================================================
-- CampusIQ+ PostgreSQL Production Database Initialization Script
-- Compatible with: Neon, Supabase, Render PostgreSQL, AWS RDS PostgreSQL
-- =====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'ADMIN')),
    phone_number VARCHAR(15),
    department VARCHAR(100),
    home_department VARCHAR(100),
    enrollment_number VARCHAR(50) UNIQUE,
    section VARCHAR(50),
    semester INT,
    year VARCHAR(30),
    batch_year VARCHAR(30),
    course VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    otp_code VARCHAR(10),
    otp_expiry TIMESTAMP,
    fcm_token VARCHAR(500),
    date_of_birth VARCHAR(30),
    gender VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(50),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(150),
    guardian_relation VARCHAR(50),
    admission_status VARCHAR(30) DEFAULT 'ADMITTED',
    admission_date VARCHAR(30),
    admission_quota VARCHAR(50),
    employee_id VARCHAR(50),
    designation VARCHAR(100),
    qualifications TEXT,
    experience_years VARCHAR(50),
    specialization TEXT,
    profile_image TEXT,
    research_publications TEXT,
    awards TEXT,
    achievements TEXT,
    extracurriculars TEXT,
    certificates TEXT,
    documents TEXT,
    leave_balances TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Student Registrations Table
CREATE TABLE IF NOT EXISTS student_registrations (
    id BIGSERIAL PRIMARY KEY,
    enrollment_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    section VARCHAR(50),
    semester VARCHAR(20),
    year VARCHAR(20),
    course VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    phone_number VARCHAR(20),
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    credit_hours INT,
    department VARCHAR(100),
    faculty_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    remarks VARCHAR(200),
    marked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_att_student_course_date UNIQUE (student_id, course_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_att_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_att_course ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(attendance_date);

-- 5. Faculty Biometric Attendance Table
CREATE TABLE IF NOT EXISTS faculty_biometric_attendance (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL,
    faculty_name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    designation VARCHAR(100),
    punch_date DATE NOT NULL,
    punch_in_time VARCHAR(20),
    punch_out_time VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    working_hours VARCHAR(20),
    device_id VARCHAR(50) DEFAULT 'BIO-GATE-01',
    location VARCHAR(100) DEFAULT 'Main Academic Block Gate',
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_faculty_punch_date UNIQUE (faculty_id, punch_date)
);

CREATE INDEX IF NOT EXISTS idx_fba_faculty ON faculty_biometric_attendance(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fba_date ON faculty_biometric_attendance(punch_date);

-- 6. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id BIGSERIAL PRIMARY KEY,
    exam_name VARCHAR(200) NOT NULL,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    total_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    venue VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Results Table
CREATE TABLE IF NOT EXISTS results (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL,
    percentage NUMERIC(5,2),
    grade VARCHAR(5),
    is_pass BOOLEAN,
    remarks VARCHAR(500),
    result_type VARCHAR(20) DEFAULT 'SEMESTER',
    published_by BIGINT,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_result_student_exam UNIQUE (student_id, exam_id)
);

-- 8. Student Academic Records Table
CREATE TABLE IF NOT EXISTS student_academic_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester_code VARCHAR(20) NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    credits INT DEFAULT 3,
    grade VARCHAR(5) DEFAULT 'A',
    grade_points NUMERIC(4,2) DEFAULT 8.0,
    status VARCHAR(20) DEFAULT 'PASS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sar_student_sem_sub UNIQUE (student_id, semester_code, subject_code)
);

-- 9. Student Semester Summaries Table
CREATE TABLE IF NOT EXISTS student_semester_summaries (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester_code VARCHAR(20) NOT NULL,
    total_credits INT DEFAULT 20,
    earned_credits INT DEFAULT 20,
    sgpa NUMERIC(4,2) DEFAULT 8.5,
    cgpa NUMERIC(4,2) DEFAULT 8.5,
    status VARCHAR(20) DEFAULT 'PASSED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sss_student_sem UNIQUE (student_id, semester_code)
);

-- 10. Student CGPA Table
CREATE TABLE IF NOT EXISTS student_cgpa (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester INT,
    sgpa NUMERIC(4,2),
    cgpa NUMERIC(4,2),
    total_credits INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Fees Table
CREATE TABLE IF NOT EXISTS fees (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('TUITION', 'HOSTEL', 'TRANSPORT', 'LIBRARY', 'EXAMINATION', 'LABORATORY', 'OTHER')),
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'CANCELLED')),
    semester INT,
    academic_year VARCHAR(20),
    description VARCHAR(200),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Chat Sessions & Messages (Campus Intelligence AI)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    db_context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(30) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. Academic Timetable & Scheduling Tables
CREATE TABLE IF NOT EXISTS timetable_slots (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room_number VARCHAR(50),
    section VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty_subject_assignments (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    section VARCHAR(50),
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty_schedules (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    slot_time VARCHAR(50),
    activity VARCHAR(150),
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- SEED DATA: STAKEHOLDER USERS & INITIAL CATALOG
-- =====================================================================

INSERT INTO users (id, username, name, email, password, role, department, employee_id, designation, is_active)
VALUES 
(11, 'admin', 'System Admin', 'admin@campusiq.com', '$2a$10$hQN6ZOrWu67zqYJIHSrwwuSszwC17.CDCVJwcRb4H4azHxrbyP.c.', 'ADMIN', 'Administration', 'EMP-ADM-01', 'System Administrator', TRUE),
(12, 'faculty_raj', 'Dr. Rajesh Sharma', 'rajesh.sharma@campusiq.com', '$2a$10$hQN6ZOrWu67zqYJIHSrwwuSszwC17.CDCVJwcRb4H4azHxrbyP.c.', 'FACULTY', 'Computer Science', 'FAC-CS-01', 'Associate Professor', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

INSERT INTO users (id, username, name, email, password, role, department, enrollment_number, semester, section, is_active)
VALUES
(13, '24CS001', 'Aarav Varma', 'aarav.varma@campusiq.edu', '$2a$10$aZ7YSFjfoOLFjjmNKWMCauorgPIWpD/8XMc3CJa52s5PhFzK37DfO', 'STUDENT', 'Computer Science', '24CS001', 5, 'Section A', TRUE),
(14, 'Ritesh@0512', 'Meesala Ritesh', '23bq1a1268@vvit.net', '$2a$10$aZ7YSFjfoOLFjjmNKWMCauorgPIWpD/8XMc3CJa52s5PhFzK37DfO', 'STUDENT', 'Computer Science', '23BQ1A1268', 5, 'Section A', TRUE),
(29, '23bqi1268', 'Ritesh Meesala', '23bqi1268@vvit.net', '$2a$10$xmTc3gwy8cTQKIxwpjfOCuQmQ.mKJHd8WZv9gdrtoZIZkVA6E9o8O', 'STUDENT', 'Information Technology', '23BQI1268', 1, 'B', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- Reset primary key sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Courses
INSERT INTO courses (id, course_code, course_name, description, credit_hours, department, faculty_id)
VALUES
(1, 'CS401', 'Database Management Systems', 'Core DBMS curriculum', 4, 'Computer Science', 12),
(2, 'CS402', 'Machine Learning & Intelligent Systems', 'Advanced ML & Neural Networks', 4, 'Computer Science', 12),
(3, 'CS403', 'Design and Analysis of Algorithms', 'Algorithm design and complexity', 4, 'Computer Science', 12),
(4, 'CS404', 'Operating Systems & Architecture', 'Process scheduling and memory', 3, 'Computer Science', 12),
(5, 'CS405', 'Web Application Development & Cloud', 'Full-stack engineering and cloud deployment', 3, 'Computer Science', 12)
ON CONFLICT (id) DO NOTHING;

SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- Faculty Biometric Attendance Seed
INSERT INTO faculty_biometric_attendance (faculty_id, faculty_name, department, employee_id, designation, punch_date, punch_in_time, punch_out_time, status, working_hours, device_id, location, remarks)
VALUES
(12, 'Dr. Rajesh Sharma', 'Computer Science', 'FAC-CS-01', 'Associate Professor', '2026-09-01', '08:48 AM', '05:18 PM', 'PRESENT', '8h 30m', 'BIO-GATE-01', 'Main Academic Block Gate', 'Biometric verified'),
(12, 'Dr. Rajesh Sharma', 'Computer Science', 'FAC-CS-01', 'Associate Professor', '2026-09-02', '08:50 AM', '05:15 PM', 'PRESENT', '8h 25m', 'BIO-GATE-01', 'Main Academic Block Gate', 'Biometric verified'),
(12, 'Dr. Rajesh Sharma', 'Computer Science', 'FAC-CS-01', 'Associate Professor', '2026-09-03', '08:42 AM', '05:22 PM', 'PRESENT', '8h 40m', 'BIO-GATE-01', 'Main Academic Block Gate', 'Biometric verified'),
(12, 'Dr. Rajesh Sharma', 'Computer Science', 'FAC-CS-01', 'Associate Professor', '2026-09-04', '08:55 AM', '05:10 PM', 'PRESENT', '8h 15m', 'BIO-GATE-01', 'Main Academic Block Gate', 'Biometric verified'),
(12, 'Dr. Rajesh Sharma', 'Computer Science', 'FAC-CS-01', 'Associate Professor', '2026-09-05', '09:05 AM', '01:30 PM', 'HALF_DAY', '4h 25m', 'BIO-GATE-01', 'Main Academic Block Gate', 'Half-day Saturday approved'),
(12, 'Dr. Rajesh Sharma', 'Computer Science', 'FAC-CS-01', 'Associate Professor', '2026-09-28', '08:42 AM', '05:20 PM', 'PRESENT', '8h 38m', 'BIO-GATE-01', 'Main Academic Block Gate', 'Biometric verified')
ON CONFLICT (faculty_id, punch_date) DO NOTHING;

-- Initial Student Attendance
INSERT INTO attendance (id, student_id, course_id, attendance_date, status, remarks, marked_by)
VALUES
(1, 13, 1, '2026-09-28', 'PRESENT', 'Morning Lecture 1', 12),
(2, 14, 1, '2026-09-28', 'PRESENT', 'Morning Lecture 1', 12)
ON CONFLICT (student_id, course_id, attendance_date) DO NOTHING;

SELECT setval('attendance_id_seq', (SELECT MAX(id) FROM attendance));

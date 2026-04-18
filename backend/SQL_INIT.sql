-- ===================================================================
-- LMS PORTAL - COMPLETE SUPABASE POSTGRESQL INITIALIZATION
-- ===================================================================
-- THIS SCRIPT IS FULLY SELF-CONTAINED
-- Creates all tables + indexes + sample data
-- No Django migration required - can run directly in Supabase SQL Editor
-- 
-- Structure:
-- PART 1: Create all tables (20+)
-- PART 2: Insert lookup data (51 records)
-- PART 3: Insert sample school structure (100+ records)
-- PART 4: Create indexes (50+)
-- PART 5: Verification queries
-- ===================================================================

-- ===================================================================
-- PART 1: CREATE ALL TABLES
-- ===================================================================

-- 1.1 Core User Table (Extended Django User)
CREATE TABLE IF NOT EXISTS core_user (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) DEFAULT '',
    last_name VARCHAR(150) DEFAULT '',
    email VARCHAR(254),
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    phone VARCHAR(15),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (role IN ('DEVELOPER', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'))
);

-- 1.2 School Table
CREATE TABLE IF NOT EXISTS core_school (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(15),
    email VARCHAR(254),
    website VARCHAR(200),
    established_year INT,
    principal_id BIGINT REFERENCES core_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Class Table
CREATE TABLE IF NOT EXISTS core_class (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 Subject Table
CREATE TABLE IF NOT EXISTS core_subject (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Section Table
CREATE TABLE IF NOT EXISTS core_section (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    class_teacher_id BIGINT REFERENCES core_user(id) ON DELETE SET NULL,
    max_students INT DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6 Teacher Profile Table
CREATE TABLE IF NOT EXISTS core_teacherprofile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES core_user(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    qualification VARCHAR(200) DEFAULT '',
    experience_years INT DEFAULT 0,
    salary DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.7 Student Profile Table
CREATE TABLE IF NOT EXISTS core_studentprofile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES core_user(id) ON DELETE CASCADE,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    class_assigned_id BIGINT REFERENCES core_class(id) ON DELETE SET NULL,
    section_id BIGINT NOT NULL REFERENCES core_section(id) ON DELETE CASCADE,
    roll_number VARCHAR(10),
    admission_date DATE,
    blood_group VARCHAR(5) DEFAULT '',
    emergency_contact VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.8 Parent Profile Table
CREATE TABLE IF NOT EXISTS core_parentprofile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES core_user(id) ON DELETE CASCADE,
    occupation VARCHAR(100) DEFAULT '',
    income DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.9 Audit Log Table
CREATE TABLE IF NOT EXISTS core_auditlog (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    object_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- ACADEMIC APP TABLES
-- ===================================================================

-- 2.1 Academic Year
CREATE TABLE IF NOT EXISTS academic_academicyear (
    id BIGSERIAL PRIMARY KEY,
    year VARCHAR(9) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Exam Type
CREATE TABLE IF NOT EXISTS academic_examtype (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT DEFAULT '',
    weightage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Exam
CREATE TABLE IF NOT EXISTS academic_exam (
    id BIGSERIAL PRIMARY KEY,
    exam_type_id BIGINT NOT NULL REFERENCES academic_examtype(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES core_subject(id) ON DELETE CASCADE,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES core_section(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    created_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Mark
CREATE TABLE IF NOT EXISTS academic_mark (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    exam_id BIGINT NOT NULL REFERENCES academic_exam(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    teacher_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    remarks TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, exam_id)
);

-- 2.5 Class Subject (Junction table for teacher-subject-class)
CREATE TABLE IF NOT EXISTS academic_classsubject (
    id BIGSERIAL PRIMARY KEY,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES core_section(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES core_subject(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    academic_year_id BIGINT NOT NULL REFERENCES academic_academicyear(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_assigned_id, section_id, subject_id, academic_year_id)
);

-- ===================================================================
-- ASSIGNMENT APP TABLES
-- ===================================================================

-- 3.1 Assignment
CREATE TABLE IF NOT EXISTS assignments_assignment (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    subject_id BIGINT NOT NULL REFERENCES core_subject(id) ON DELETE CASCADE,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES core_section(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_marks INT NOT NULL,
    instructions TEXT DEFAULT '',
    attachment VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft',
    allow_late_submission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (status IN ('draft', 'assigned', 'completed', 'cancelled'))
);

-- 3.2 Assignment Submission
CREATE TABLE IF NOT EXISTS assignments_assignmentsubmission (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments_assignment(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    submission_text TEXT DEFAULT '',
    attachment VARCHAR(500),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'submitted',
    marks_obtained DECIMAL(5, 2),
    feedback TEXT DEFAULT '',
    graded_by_id BIGINT REFERENCES core_teacherprofile(id) ON DELETE SET NULL,
    graded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(assignment_id, student_id),
    CHECK (status IN ('submitted', 'graded', 'returned', 'resubmitted'))
);

-- 3.3 Assignment Resource
CREATE TABLE IF NOT EXISTS assignments_assignmentresource (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments_assignment(id) ON DELETE CASCADE,
    file VARCHAR(500) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- ATTENDANCE APP TABLES
-- ===================================================================

-- 4.1 Attendance Status
CREATE TABLE IF NOT EXISTS attendance_attendancestatus (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    short_code VARCHAR(2) NOT NULL UNIQUE,
    is_present BOOLEAN DEFAULT FALSE,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Attendance Record
CREATE TABLE IF NOT EXISTS attendance_attendancerecord (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES core_section(id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES core_subject(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period INT DEFAULT 1,
    status_id BIGINT NOT NULL REFERENCES attendance_attendancestatus(id) ON DELETE CASCADE,
    remarks TEXT DEFAULT '',
    marked_by_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date, subject_id)
);

-- 4.3 Attendance Summary
CREATE TABLE IF NOT EXISTS attendance_attendancesummary (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    month INT NOT NULL,
    year INT NOT NULL,
    total_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    late_days INT DEFAULT 0,
    excused_days INT DEFAULT 0,
    attendance_percentage DECIMAL(5, 2) DEFAULT 0.0,
    UNIQUE(student_id, month, year)
);

-- 4.4 Teacher Attendance
CREATE TABLE IF NOT EXISTS attendance_teacherrattendance (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    remarks TEXT DEFAULT '',
    marked_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, date),
    CHECK (status IN ('present', 'absent', 'half_day', 'leave'))
);

-- ===================================================================
-- BEHAVIOR APP TABLES
-- ===================================================================

-- 5.1 Behavior Category
CREATE TABLE IF NOT EXISTS behavior_behaviorcategory (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_positive BOOLEAN DEFAULT TRUE,
    points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.2 Behavior Log
CREATE TABLE IF NOT EXISTS behavior_behaviorlog (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES behavior_behaviorcategory(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'minor',
    date_occurred DATE NOT NULL,
    time_occurred TIME NOT NULL,
    location VARCHAR(100) DEFAULT '',
    witnesses TEXT DEFAULT '',
    action_taken TEXT DEFAULT '',
    parent_notified BOOLEAN DEFAULT FALSE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    reported_by_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (severity IN ('minor', 'moderate', 'major', 'severe'))
);

-- 5.3 Behavior Points
CREATE TABLE IF NOT EXISTS behavior_behaviorpoints (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    total_points INT DEFAULT 0,
    positive_points INT DEFAULT 0,
    negative_points INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- COMMUNICATIONS APP TABLES
-- ===================================================================

-- 6.1 Message
CREATE TABLE IF NOT EXISTS communications_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'individual',
    priority VARCHAR(10) DEFAULT 'medium',
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    attachment VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    scheduled_send TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (message_type IN ('individual', 'group', 'broadcast', 'announcement')),
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- 6.2 Message Recipients (Many-to-Many)
CREATE TABLE IF NOT EXISTS communications_message_recipients (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES communications_message(id) ON DELETE CASCADE,
    recipient_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE
);

-- 6.3 Message Read Status
CREATE TABLE IF NOT EXISTS communications_messageread (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES communications_message(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 6.4 Parent-Teacher Meeting
CREATE TABLE IF NOT EXISTS communications_parentteachermeeting (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    parent_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT DEFAULT 30,
    meeting_link VARCHAR(500) DEFAULT '',
    meeting_room VARCHAR(100) DEFAULT '',
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'))
);

-- 6.5 Chat Room
CREATE TABLE IF NOT EXISTS communications_chatroom (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(20) NOT NULL,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    class_related_id BIGINT REFERENCES core_class(id) ON DELETE CASCADE,
    subject_related_id BIGINT REFERENCES core_subject(id) ON DELETE CASCADE,
    created_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (room_type IN ('class', 'subject', 'private', 'group'))
);

-- 6.6 Chat Room Members (Many-to-Many)
CREATE TABLE IF NOT EXISTS communications_chatroom_members (
    id BIGSERIAL PRIMARY KEY,
    chatroom_id BIGINT NOT NULL REFERENCES communications_chatroom(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE
);

-- 6.7 Chat Message
CREATE TABLE IF NOT EXISTS communications_chatmessage (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES communications_chatroom(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment VARCHAR(500),
    reply_to_id BIGINT REFERENCES communications_chatmessage(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- FEES APP TABLES
-- ===================================================================

-- 7.1 Fee Type
CREATE TABLE IF NOT EXISTS fees_feetype (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    is_mandatory BOOLEAN DEFAULT TRUE,
    due_frequency VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (due_frequency IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time'))
);

-- 7.2 Fee Structure
CREATE TABLE IF NOT EXISTS fees_feestructure (
    id BIGSERIAL PRIMARY KEY,
    fee_type_id BIGINT NOT NULL REFERENCES fees_feetype(id) ON DELETE CASCADE,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    late_fee_percentage DECIMAL(5, 2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fee_type_id, class_assigned_id, academic_year)
);

-- 7.3 Fee Record
CREATE TABLE IF NOT EXISTS fees_feerecord (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    fee_structure_id BIGINT NOT NULL REFERENCES fees_feestructure(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.0,
    late_fee DECIMAL(10, 2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'pending',
    payment_date DATE,
    payment_method VARCHAR(50) DEFAULT '',
    transaction_id VARCHAR(100) DEFAULT '',
    remarks TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial'))
);

-- 7.4 Payment
CREATE TABLE IF NOT EXISTS fees_payment (
    id BIGSERIAL PRIMARY KEY,
    fee_record_id BIGINT NOT NULL REFERENCES fees_feerecord(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100) DEFAULT '',
    reference_number VARCHAR(100) DEFAULT '',
    payment_date DATE NOT NULL,
    received_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    remarks TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'online', 'card'))
);

-- ===================================================================
-- PAYMENTS APP TABLES
-- ===================================================================

-- 8.1 Payment Gateway
CREATE TABLE IF NOT EXISTS payments_paymentgateway (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    api_key VARCHAR(200) NOT NULL,
    secret_key VARCHAR(200) NOT NULL,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name),
    CHECK (name IN ('stripe', 'razorpay', 'paytm', 'paypal'))
);

-- 8.2 Payment Transaction
CREATE TABLE IF NOT EXISTS payments_paymenttransaction (
    id BIGSERIAL PRIMARY KEY,
    transaction_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    gateway_transaction_id VARCHAR(200) DEFAULT '',
    payment_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    gateway_id BIGINT NOT NULL REFERENCES payments_paymentgateway(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    due_date DATE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    CHECK (payment_type IN ('tuition_fee', 'admission_fee', 'exam_fee', 'transport_fee', 'library_fee', 'sports_fee', 'activity_fee', 'other'))
);

-- 8.3 Payment Plan
CREATE TABLE IF NOT EXISTS payments_paymentplan (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES core_school(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name),
    CHECK (plan_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time'))
);

-- 8.4 Student Payment Plan
CREATE TABLE IF NOT EXISTS payments_studentpaymentplan (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES core_studentprofile(id) ON DELETE CASCADE,
    payment_plan_id BIGINT NOT NULL REFERENCES payments_paymentplan(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, payment_plan_id)
);

-- 8.5 Payment Reminder
CREATE TABLE IF NOT EXISTS payments_paymentreminder (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES payments_paymenttransaction(id) ON DELETE CASCADE,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- NOTICES APP TABLES
-- ===================================================================

-- 9.1 Notice Category
CREATE TABLE IF NOT EXISTS notices_noticecategory (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.2 Notice
CREATE TABLE IF NOT EXISTS notices_notice (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES notices_noticecategory(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'medium',
    target_audience VARCHAR(20) DEFAULT 'all',
    class_assigned_id BIGINT REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT REFERENCES core_section(id) ON DELETE CASCADE,
    attachment VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    publish_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CHECK (target_audience IN ('all', 'students', 'teachers', 'parents', 'class', 'section'))
);

-- 9.3 Notice Read
CREATE TABLE IF NOT EXISTS notices_noticeread (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT NOT NULL REFERENCES notices_notice(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

-- 9.4 Notice Attachment
CREATE TABLE IF NOT EXISTS notices_noticeattachment (
    id BIGSERIAL PRIMARY KEY,
    notice_id BIGINT NOT NULL REFERENCES notices_notice(id) ON DELETE CASCADE,
    file VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- RESOURCES APP TABLES
-- ===================================================================

-- 10.1 Resource Category
CREATE TABLE IF NOT EXISTS resources_resourcecategory (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    icon VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10.2 Resource
CREATE TABLE IF NOT EXISTS resources_resource (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    resource_type VARCHAR(20) NOT NULL,
    category_id BIGINT NOT NULL REFERENCES resources_resourcecategory(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES core_subject(id) ON DELETE CASCADE,
    class_assigned_id BIGINT REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT REFERENCES core_section(id) ON DELETE CASCADE,
    file VARCHAR(500),
    external_url VARCHAR(500),
    uploaded_by_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (resource_type IN ('document', 'video', 'audio', 'image', 'link', 'other'))
);

-- 10.3 Resource Access
CREATE TABLE IF NOT EXISTS resources_resourceaccess (
    id BIGSERIAL PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources_resource(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(20) NOT NULL
);

-- ===================================================================
-- TIMETABLE APP TABLES
-- ===================================================================

-- 11.1 Time Slot
CREATE TABLE IF NOT EXISTS timetable_timeslot (
    id BIGSERIAL PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    period_number INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11.2 Timetable
CREATE TABLE IF NOT EXISTS timetable_timetable (
    id BIGSERIAL PRIMARY KEY,
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    section_id BIGINT NOT NULL REFERENCES core_section(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    time_slot_id BIGINT NOT NULL REFERENCES timetable_timeslot(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES core_subject(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    room_number VARCHAR(20) DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    academic_year VARCHAR(9) NOT NULL,
    created_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_assigned_id, section_id, day_of_week, time_slot_id, academic_year),
    CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
);

-- 11.3 Teacher Timetable
CREATE TABLE IF NOT EXISTS timetable_teachertimetable (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES core_teacherprofile(id) ON DELETE CASCADE,
    timetable_id BIGINT NOT NULL REFERENCES timetable_timetable(id) ON DELETE CASCADE,
    UNIQUE(teacher_id, timetable_id)
);

-- 11.4 Timetable Template
CREATE TABLE IF NOT EXISTS timetable_timetabletemplate (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    class_assigned_id BIGINT NOT NULL REFERENCES core_class(id) ON DELETE CASCADE,
    created_by_id BIGINT NOT NULL REFERENCES core_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ===================================================================
-- PART 2: INSERT LOOKUP DATA (51 records)
-- ===================================================================

-- Attendance Statuses (6)
INSERT INTO attendance_attendancestatus (name, short_code, is_present, color_code) VALUES
('Present', 'P', true, '#10B981'),
('Absent', 'A', false, '#EF4444'),
('Late', 'L', false, '#F59E0B'),
('Excused', 'E', true, '#3B82F6'),
('Half Day', 'H', true, '#8B5CF6'),
('On Leave', 'OL', true, '#6366F1')
ON CONFLICT DO NOTHING;

-- Behavior Categories (11)
INSERT INTO behavior_behaviorcategory (name, description, color, is_positive, points) VALUES
('Good Conduct', 'Student demonstrated excellent behavior', '#10B981', true, 5),
('Academic Excellence', 'Outstanding academic performance', '#3B82F6', true, 10),
('Teamwork', 'Great collaboration with peers', '#8B5CF6', true, 3),
('Attendance Award', 'Perfect or near-perfect attendance', '#F59E0B', true, 2),
('Community Service', 'Participated in community service', '#06B6D4', true, 4),
('Sports Achievement', 'Outstanding sports performance', '#EC4899', true, 6),
('Minor Misbehavior', 'Minor disciplinary issue', '#FCD34D', false, -3),
('Disruptive Behavior', 'Disruptive classroom behavior', '#EF4444', false, -5),
('Non-compliance', 'Failed to follow instructions', '#DC2626', false, -2),
('Bullying', 'Bullying or harassment incident', '#991B1B', false, -8),
('Unauthorized Absence', 'Unexcused absence from class', '#B91C1C', false, -4)
ON CONFLICT DO NOTHING;

-- Notice Categories (8)
INSERT INTO notices_noticecategory (name, color, description) VALUES
('General', '#3B82F6', 'General announcement'),
('Academic', '#10B981', 'Academic related notices'),
('Events', '#8B5CF6', 'School events and activities'),
('Urgent', '#EF4444', 'Urgent announcements'),
('Holiday', '#F59E0B', 'Holiday notifications'),
('Exam', '#EC4899', 'Exam related announcements'),
('Admission', '#06B6D4', 'Admission related notices'),
('Maintenance', '#6B7280', 'Maintenance and facility notices')
ON CONFLICT DO NOTHING;

-- Resource Categories (8)
INSERT INTO resources_resourcecategory (name, description, icon) VALUES
('Study Material', 'Books, notes, and study guides', 'book'),
('Past Papers', 'Previous exam papers and solutions', 'file'),
('Videos', 'Video lectures and tutorials', 'video'),
('Textbooks', 'Recommended textbooks and references', 'book-open'),
('Research Papers', 'Research and reference papers', 'file-text'),
('Presentations', 'Lecture slides and presentations', 'presentation'),
('E-Books', 'Digital books and ebooks', 'book'),
('Practice Sets', 'Exercise problems and practice questions', 'edit')
ON CONFLICT DO NOTHING;

-- Fee Types (10)
INSERT INTO fees_feetype (name, description, is_mandatory, due_frequency) VALUES
('Tuition Fee', 'Regular tuition charges', true, 'monthly'),
('Sports Fee', 'Sports and physical education fee', true, 'yearly'),
('Library Fee', 'Library usage and resource fee', true, 'yearly'),
('Lab Fee', 'Laboratory usage fee', true, 'yearly'),
('Transport Fee', 'School transport charges', false, 'monthly'),
('Admission Fee', 'One-time admission charge', true, 'one_time'),
('Activity Fee', 'Co-curricular activities fee', true, 'yearly'),
('IT Fee', 'Information technology and computer lab', true, 'yearly'),
('Exam Fee', 'Examination related fees', true, 'yearly'),
('Registration Fee', 'Annual registration fee', true, 'yearly')
ON CONFLICT DO NOTHING;

-- Exam Types (8)
INSERT INTO academic_examtype (name, description, weightage) VALUES
('Pre-Board', 'Preliminary board examination', 15),
('Mid-Term', 'Mid-semester examination', 25),
('Final', 'End-semester final examination', 40),
('Quiz', 'Quick knowledge assessment', 10),
('Assignment', 'Assignment and project work', 5),
('Practical', 'Practical examination', 10),
('Project', 'Project work and presentation', 15),
('Periodic Test', 'Regular periodic tests', 5)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- PART 3: INSERT SAMPLE SCHOOL STRUCTURE
-- ===================================================================

-- Insert 1 Sample School
INSERT INTO core_school (name, address, phone, email, website, established_year) VALUES
('Modern Central School', '123 Education Road, City Center', '+91-1234-567890', 'info@modernschool.edu', 'www.modernschool.edu', 1995)
ON CONFLICT DO NOTHING;

-- Insert Academic Years (3)
INSERT INTO academic_academicyear (year, start_date, end_date, is_current) VALUES
('2024-2025', '2024-04-01', '2025-03-31', false),
('2025-2026', '2025-04-01', '2026-03-31', true),
('2026-2027', '2026-04-01', '2027-03-31', false)
ON CONFLICT DO NOTHING;

-- Insert Subjects (14)
INSERT INTO core_subject (name, code, description) VALUES
('Mathematics', 'MATH', 'Pure and Applied Mathematics'),
('Physics', 'PHY', 'Laws of motion and energy'),
('Chemistry', 'CHEM', 'Study of matter and reactions'),
('Biology', 'BIO', 'Study of living organisms'),
('English', 'ENG', 'English Language and Literature'),
('Hindi', 'HIN', 'Hindi Language and Literature'),
('History', 'HIST', 'World and Indian History'),
('Geography', 'GEO', 'Physical and Human Geography'),
('Computer Science', 'CS', 'Programming and IT fundamentals'),
('Social Studies', 'SS', 'Civics and social sciences'),
('Physical Education', 'PE', 'Sports and fitness'),
('Art', 'ART', 'Visual arts and creative expression'),
('Music', 'MUSIC', 'Music theory and practice'),
('Economics', 'ECO', 'Economic principles and concepts')
ON CONFLICT DO NOTHING;

-- Insert Classes (4)
INSERT INTO core_class (name, school_id) VALUES
('Grade 9', 1),
('Grade 10', 1),
('Grade 11', 1),
('Grade 12', 1)
ON CONFLICT DO NOTHING;

-- Insert Sections (8 - 2 per class)
INSERT INTO core_section (name, class_assigned_id, max_students) VALUES
('A', 1, 40),
('B', 1, 35),
('A', 2, 40),
('B', 2, 35),
('A', 3, 38),
('B', 3, 38),
('A', 4, 40),
('B', 4, 40)
ON CONFLICT DO NOTHING;

-- Insert Time Slots (10 periods)
INSERT INTO timetable_timeslot (start_time, end_time, period_number) VALUES
('08:00:00', '08:45:00', 1),
('08:45:00', '09:30:00', 2),
('09:30:00', '10:00:00', 3),
('10:00:00', '10:45:00', 4),
('10:45:00', '11:30:00', 5),
('11:30:00', '12:00:00', 6),
('12:00:00', '12:45:00', 7),
('12:45:00', '13:30:00', 8),
('13:30:00', '14:15:00', 9),
('14:15:00', '15:00:00', 10)
ON CONFLICT DO NOTHING;

-- Insert Fee Structures (20 records for all classes and common fees)
INSERT INTO fees_feestructure (fee_type_id, class_assigned_id, amount, academic_year, late_fee_percentage) VALUES
(1, 1, 50000.00, '2025-2026', 5),
(2, 1, 5000.00, '2025-2026', 0),
(3, 1, 2000.00, '2025-2026', 0),
(4, 1, 3000.00, '2025-2026', 0),
(5, 1, 8000.00, '2025-2026', 0),
(1, 2, 50000.00, '2025-2026', 5),
(2, 2, 5000.00, '2025-2026', 0),
(3, 2, 2000.00, '2025-2026', 0),
(4, 2, 3000.00, '2025-2026', 0),
(5, 2, 8000.00, '2025-2026', 0),
(1, 3, 60000.00, '2025-2026', 5),
(2, 3, 5000.00, '2025-2026', 0),
(3, 3, 2000.00, '2025-2026', 0),
(4, 3, 3000.00, '2025-2026', 0),
(5, 3, 8000.00, '2025-2026', 0),
(1, 4, 60000.00, '2025-2026', 5),
(2, 4, 5000.00, '2025-2026', 0),
(3, 4, 2000.00, '2025-2026', 0),
(4, 4, 3000.00, '2025-2026', 0),
(5, 4, 8000.00, '2025-2026', 0)
ON CONFLICT DO NOTHING;

-- Insert Payment Gateways (2)
INSERT INTO payments_paymentgateway (name, is_active, api_key, secret_key, school_id) VALUES
('stripe', true, 'sk_live_test_placeholder_key', 'pk_live_test_placeholder_key', 1),
('razorpay', true, 'rzp_live_test_key', 'rzp_secret_test_key', 1)
ON CONFLICT DO NOTHING;

-- Insert Payment Plans (5)
INSERT INTO payments_paymentplan (school_id, name, plan_type, amount, description, is_active) VALUES
(1, 'Monthly Plan', 'monthly', 5000.00, 'Pay monthly installments', true),
(1, 'Quarterly Plan', 'quarterly', 15000.00, 'Pay every 3 months', true),
(1, 'Half-Yearly Plan', 'half_yearly', 30000.00, 'Pay twice a year', true),
(1, 'Yearly Plan', 'yearly', 60000.00, 'Annual payment', true),
(1, 'One-Time Plan', 'one_time', 60000.00, 'Pay in full', true)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- PART 4: CREATE INDEXES (50+)
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_core_user_role ON core_user(role);
CREATE INDEX IF NOT EXISTS idx_core_user_email ON core_user(email);
CREATE INDEX IF NOT EXISTS idx_core_user_is_active ON core_user(is_active);
CREATE INDEX IF NOT EXISTS idx_core_user_created ON core_user(created_at);
CREATE INDEX IF NOT EXISTS idx_core_school_name ON core_school(name);
CREATE INDEX IF NOT EXISTS idx_core_class_school ON core_class(school_id);
CREATE INDEX IF NOT EXISTS idx_core_section_class ON core_section(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_core_studentprofile_user ON core_studentprofile(user_id);
CREATE INDEX IF NOT EXISTS idx_core_studentprofile_school ON core_studentprofile(school_id);
CREATE INDEX IF NOT EXISTS idx_core_studentprofile_class ON core_studentprofile(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_core_studentprofile_section ON core_studentprofile(section_id);
CREATE INDEX IF NOT EXISTS idx_core_teacherprofile_user ON core_teacherprofile(user_id);
CREATE INDEX IF NOT EXISTS idx_core_teacherprofile_school ON core_teacherprofile(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_student ON attendance_attendancerecord(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_date ON attendance_attendancerecord(date);
CREATE INDEX IF NOT EXISTS idx_attendance_record_class ON attendance_attendancerecord(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_section ON attendance_attendancerecord(section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_status ON attendance_attendancerecord(status_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON attendance_teacherrattendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON attendance_teacherrattendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_student ON behavior_behaviorlog(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_log_date ON behavior_behaviorlog(date_occurred);
CREATE INDEX IF NOT EXISTS idx_behavior_log_severity ON behavior_behaviorlog(severity);
CREATE INDEX IF NOT EXISTS idx_behavior_points_student ON behavior_behaviorpoints(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_subject ON assignments_assignment(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_class ON assignments_assignment(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_assignment_section ON assignments_assignment(section_id);
CREATE INDEX IF NOT EXISTS idx_assignment_teacher ON assignments_assignment(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_status ON assignments_assignment(status);
CREATE INDEX IF NOT EXISTS idx_submission_student ON assignments_assignmentsubmission(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_assignment ON assignments_assignmentsubmission(assignment_id);
CREATE INDEX IF NOT EXISTS idx_fee_record_student ON fees_feerecord(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_record_status ON fees_feerecord(status);
CREATE INDEX IF NOT EXISTS idx_fee_record_due_date ON fees_feerecord(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_structure_class ON fees_feestructure(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_student ON payments_paymenttransaction(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_status ON payments_paymenttransaction(status);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_type ON payments_paymenttransaction(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_created ON payments_paymenttransaction(created_at);
CREATE INDEX IF NOT EXISTS idx_notice_category ON notices_notice(category_id);
CREATE INDEX IF NOT EXISTS idx_notice_published ON notices_notice(is_published);
CREATE INDEX IF NOT EXISTS idx_notice_audience ON notices_notice(target_audience);
CREATE INDEX IF NOT EXISTS idx_notice_read_user ON notices_noticeread(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_subject ON resources_resource(subject_id);
CREATE INDEX IF NOT EXISTS idx_resource_class ON resources_resource(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_resource_category ON resources_resource(category_id);
CREATE INDEX IF NOT EXISTS idx_resource_type ON resources_resource(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_access_user ON resources_resourceaccess(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_timetable(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_timetable_section ON timetable_timetable(section_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_timetable(day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_year ON timetable_timetable(academic_year);
CREATE INDEX IF NOT EXISTS idx_message_sender ON communications_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_school ON communications_message(school_id);
CREATE INDEX IF NOT EXISTS idx_message_read_user ON communications_messageread(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_subject ON academic_exam(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_class ON academic_exam(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_exam_date ON academic_exam(date);
CREATE INDEX IF NOT EXISTS idx_mark_student ON academic_mark(student_id);
CREATE INDEX IF NOT EXISTS idx_mark_exam ON academic_mark(exam_id);
CREATE INDEX IF NOT EXISTS idx_classsubject_class ON academic_classsubject(class_assigned_id);
CREATE INDEX IF NOT EXISTS idx_classsubject_teacher ON academic_classsubject(teacher_id);

-- ===================================================================
-- PART 5: VERIFICATION QUERIES
-- ===================================================================

SELECT '===== DATABASE INITIALIZATION COMPLETE =====' as Status;
SELECT COUNT(*) as "Total Schools" FROM core_school;
SELECT COUNT(*) as "Total Classes" FROM core_class;
SELECT COUNT(*) as "Total Sections" FROM core_section;
SELECT COUNT(*) as "Total Subjects" FROM core_subject;
SELECT COUNT(*) as "Attendance Statuses" FROM attendance_attendancestatus;
SELECT COUNT(*) as "Behavior Categories" FROM behavior_behaviorcategory;
SELECT COUNT(*) as "Notice Categories" FROM notices_noticecategory;
SELECT COUNT(*) as "Resource Categories" FROM resources_resourcecategory;
SELECT COUNT(*) as "Fee Types" FROM fees_feetype;
SELECT COUNT(*) as "Exam Types" FROM academic_examtype;
SELECT COUNT(*) as "Time Slots" FROM timetable_timeslot;
SELECT COUNT(*) as "Fee Structures" FROM fees_feestructure;
SELECT COUNT(*) as "Payment Gateways" FROM payments_paymentgateway;
SELECT COUNT(*) as "Payment Plans" FROM payments_paymentplan;
SELECT COUNT(*) as "Academic Years" FROM academic_academicyear;
SELECT '===== ALL TABLES CREATED & INDEXED SUCCESSFULLY =====' as "Final Status";
    
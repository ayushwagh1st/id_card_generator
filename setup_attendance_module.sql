-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lecturers Table
CREATE TABLE IF NOT EXISTS lecturers (
    id UUID PRIMARY KEY, -- References auth.users(id)
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    venue TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER,
    status TEXT DEFAULT 'Scheduled', -- Scheduled, Ongoing, Completed, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer Sessions (Enrollment) Table
CREATE TABLE IF NOT EXISTS volunteer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id TEXT REFERENCES volunteers(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(volunteer_id, session_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id TEXT REFERENCES volunteers(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    lecturer_id UUID REFERENCES lecturers(id),
    attendance_status TEXT, -- Present, Late, Absent, Excused
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    attendance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(volunteer_id, session_id, attendance_date)
);

-- Note: In a production environment, Row Level Security (RLS) policies 
-- would be added here to restrict access based on user roles.
-- For this setup, we assume Admin and Lecturer APIs handle authorization.

-- View to get attendance dashboard stats (optional, for admin convenience)
CREATE OR REPLACE VIEW attendance_stats AS
SELECT 
    s.id as session_id,
    s.name as session_name,
    s.date as session_date,
    COUNT(vs.volunteer_id) as enrolled_count,
    COUNT(CASE WHEN a.attendance_status IN ('Present', 'Late') THEN 1 END) as present_count,
    COUNT(CASE WHEN a.attendance_status = 'Absent' THEN 1 END) as absent_count
FROM sessions s
LEFT JOIN volunteer_sessions vs ON s.id = vs.session_id
LEFT JOIN attendance a ON s.id = a.session_id
GROUP BY s.id, s.name, s.date;

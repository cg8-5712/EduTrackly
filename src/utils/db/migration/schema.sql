-- =================================
-- PostgreSQL schema for EduTrackly
-- =================================

-- Drop old tables if exist
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

-- ================= Admin Table =================
CREATE SEQUENCE IF NOT EXISTS admin_aid_seq START WITH 1;

CREATE TABLE admin (
                       aid INTEGER PRIMARY KEY DEFAULT nextval('admin_aid_seq'),
                       password VARCHAR(255) NOT NULL,
                       time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       ip VARCHAR(45)
);

-- ================= Homework Table =================
CREATE TABLE homework (
                          cid INT NOT NULL,
                          description TEXT NOT NULL,
                          due_date DATE NOT NULL,
                          CONSTRAINT uq_homework_cid_due_date UNIQUE (cid, due_date)
);

-- ================= Student Table =================
CREATE TABLE student (
                         sid SERIAL PRIMARY KEY,
                         cid INT NOT NULL,
                         student_name VARCHAR(50) NOT NULL
);

-- ================= Class Table =================
CREATE TABLE class (
                         cid SERIAL PRIMARY KEY,
                         class_name VARCHAR(50) NOT NULL
);

-- ================= Attendance Table =================
CREATE TYPE leave_type AS ENUM ('official', 'personal', 'sick');

CREATE TABLE attendance (
                            aid SERIAL PRIMARY KEY,
                            sid INT NOT NULL REFERENCES student(sid) ON DELETE CASCADE,
                            date DATE NOT NULL,
                            leave_type leave_type NOT NULL
);

-- ================= Indexes =================
CREATE INDEX IF NOT EXISTS idx_admin_aid ON admin(aid);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date);
CREATE INDEX IF NOT EXISTS idx_student_cid ON student(cid);
CREATE INDEX IF NOT EXISTS idx_student_name ON student(student_name);
CREATE INDEX IF NOT EXISTS idx_homework_cid ON homework(cid);
CREATE INDEX IF NOT EXISTS idx_homework_cid_due_date ON homework(cid, due_date);

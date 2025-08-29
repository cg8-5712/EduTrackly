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
                         student_name VARCHAR(50) NOT NULL,
                         attendance BOOLEAN NOT NULL DEFAULT true
);

-- ================= Class Table =================
CREATE TABLE class (
                         cid SERIAL PRIMARY KEY,
                         class_name VARCHAR(50) NOT NULL UNIQUE,
                         create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= Attendance Table =================
CREATE TYPE event_type AS ENUM ('official', 'personal', 'sick', 'temp');

CREATE TABLE attendance (
                            sid INT NOT NULL REFERENCES student(sid) ON DELETE CASCADE,
                            event_date DATE NOT NULL DEFAULT CURRENT_DATE,
                            event_type event_type NOT NULL,
                            CONSTRAINT uniq_attendance UNIQUE (sid, event_date)
);

-- 触发器函数
CREATE OR REPLACE FUNCTION check_temp_constraint()
RETURNS TRIGGER AS $$
DECLARE
student_attendance BOOLEAN;
BEGIN
    -- 查询该学生的 attendance 状态
SELECT attendance INTO student_attendance
FROM student WHERE sid = NEW.sid;

-- 如果学生是固定考勤 (attendance=true)，则不允许插入 temp
IF NEW.event_type = 'temp' AND student_attendance = true THEN
        RAISE EXCEPTION 'Student with sid % has attendance=true, cannot assign temp', NEW.sid;
END IF;

IF NEW.event_type = 'sick' OR NEW.event_type = 'personal' OR NEW.event_type = 'official' AND student_attendance = false THEN
        RAISE EXCEPTION 'Student with sid % has attendance=false, cannot assign official/personal/sick', NEW.sid;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在插入或更新 attendance 时触发
CREATE TRIGGER trg_check_temp_constraint
    BEFORE INSERT OR UPDATE ON attendance
                         FOR EACH ROW
                         EXECUTE FUNCTION check_temp_constraint();

-- ================= Indexes =================
CREATE INDEX IF NOT EXISTS idx_admin_aid ON admin(aid);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date);
CREATE INDEX IF NOT EXISTS idx_student_cid ON student(cid);
CREATE INDEX IF NOT EXISTS idx_student_name ON student(student_name);
CREATE INDEX IF NOT EXISTS idx_homework_cid ON homework(cid);
CREATE INDEX IF NOT EXISTS idx_homework_cid_due_date ON homework(cid, due_date);

-- =================================
-- Seed data for EduTrackly
-- =================================

-- Admin
INSERT INTO admin (password, ip) VALUES
                                     ('123456', '192.168.0.2'),
                                     ('admin888', '10.0.0.5');

-- Students
INSERT INTO student (class_name, student_name) VALUES
                                                   ('Class1', 'Alice'),
                                                   ('Class1', 'Bob'),
                                                   ('Class2', 'Charlie'),
                                                   ('Class2', 'Diana');

-- Homework
INSERT INTO homework (class_name, description, due_date) VALUES
                                                             ('Class1', 'Math exercises 1-10', '2025-08-23'),
                                                             ('Class2', 'English essay: My Summer', '2025-08-23');

-- Attendance (leave records)
INSERT INTO attendance (sid, date, leave_type) VALUES
                                                   (1, '2025-08-23', 'sick'),
                                                   (3, '2025-08-23', 'official');

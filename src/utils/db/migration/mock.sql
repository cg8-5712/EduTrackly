-- =================================
-- Seed data for EduTrackly
-- =================================

-- Admin
INSERT INTO admin (password, ip) VALUES
                                     ('test123456', '192.168.1.1'),
                                     ('admin_password2', '192.168.1.2');

-- Class
INSERT INTO class (class_name) VALUES
                                   ('Class1'),
                                   ('Class2');

-- Students
INSERT INTO student (cid, student_name) VALUES
                                            (1, 'Alice'),
                                            (1, 'Bob'),
                                            (2, 'Charlie'),
                                            (2, 'Diana');

-- Homework
INSERT INTO homework (cid, description, due_date) VALUES
                                                      (1, 'Math exercises 1-10', '2025-08-23'),
                                                      (1, 'Math exercises 11-20', '2025-08-30'),
                                                      (2, 'English essay: My Summer', '2025-08-23'),
                                                      (2, 'English reading: Chapter 5', '2025-08-25');

-- Attendance (leave records)
INSERT INTO attendance (sid, date, leave_type) VALUES
                                                   (1, '2025-08-23', 'sick'),
                                                   (3, '2025-08-23', 'official'),
                                                   (2, '2025-08-24', 'personal'),
                                                   (4, '2025-08-24', 'official'),
                                                   (1, '2025-08-25', 'sick'),
                                                   (3, '2025-08-25', 'personal');

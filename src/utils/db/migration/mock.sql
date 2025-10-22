-- =================================
-- Seed data for EduTrackly
-- =================================

-- Admin (passwords are hashed with bcrypt)
-- Password for admin 1: test123456
-- Password for admin 2: admin_password2
INSERT INTO admin (password, ip) VALUES
                                     ('$2b$10$JQCr.iYeaOLnSSp1JqElx.Afc0CjwnBwv9mVH5BFLbGp/ZHRtvcp2', '192.168.1.1'),
                                     ('$2b$10$mQ4MHQBO7EPifW4NBM6ay.H4JqBTUIlyw8oQQTCtyPR365QMqcsRC', '192.168.1.2');

-- Class
INSERT INTO class (class_name) VALUES
                                   ('Class1'),
                                   ('Class2');

-- Students
INSERT INTO student (cid, student_name, attendance) VALUES
                                            (1, 'Alice', true),
                                            (1, 'Bob', false),
                                            (2, 'Charlie', true),
                                            (2, 'Diana', true);

-- Homework
INSERT INTO homework (cid, chinese, math, english, physics, chemistry, biology, history, geography, politics, other, due_date)
VALUES
    (1, '语文作业：阅读《红楼梦》并写一篇读后感', '数学作业：完成第11章练习题', '英语作业：翻译第10课课文', '物理作业：实验报告2', '化学作业：元素周期表记忆', '生物作业：准备细胞结构展示', '历史作业：汉朝历史问答', '地理作业：亚洲地形图绘制', '政治作业：政府形式比较', '音乐作业：练习一首曲子', '2023-12-01'),
    (2, '阅读《围城》并写一篇读后感', '解方程和不等式', '写作一篇关于环保的文章', '运动学基本概念', '化学反应类型', '生态系统', '唐朝历史问答', '欧洲地形图绘制', '国际关系案例分析', '美术作业：绘画一幅风景画', '2023-12-05'),
    (1, '成语故事：《白日做梦》', '概率论和数理统计', '阅读《1984》并做笔记', '力学', '有机化学', '遗传学', '近代史问答', '非洲地形图绘制', '中国政治体制', '计算机编程练习', '2023-12-10');

-- Attendance (leave records)
INSERT INTO attendance (sid, event_date, event_type) VALUES
                                                   (1, '2025-08-23', 'sick'),
                                                   (3, '2025-08-23', 'official'),
                                                   (4, '2025-08-24', 'official'),
                                                   (1, '2025-08-25', 'sick'),
                                                   (3, '2025-08-25', 'personal'),
                                                   (2, '2025-08-25', 'temp');
-- =================================
-- Seed data for EduTrackly
-- =================================

-- Admin (passwords are hashed with bcrypt)
-- admin 1 (superadmin): password=superadmin123
-- admin 2 (admin): password=admin123
-- admin 3 (admin): password=admin456
INSERT INTO admin (password, role, ip) VALUES
    ('$2b$10$VWpOb4113snJvxPTFC/t8esHagugnLIe0vwSUK2ZXRaezEZFii6r2', 'superadmin', '192.168.1.1'),
    ('$2b$10$BERJ8htf0Puq3sgoBstXf.7kk80jL.ksd1t4EmIIV2vDYQ9dTE/Re', 'admin', '192.168.1.2'),
    ('$2b$10$/iKNb0/G4zGKbYO/pOHH4.52c.nv8i2J32D1RynQ8bboXGLGLcPIy', 'admin', '192.168.1.3');

-- Class (must be inserted before students and homework due to foreign key constraints)
INSERT INTO class (class_name) VALUES
    ('Class1'),
    ('Class2'),
    ('Class3');

-- Admin-Class assignments
-- admin 2 (aid=2) can manage Class1 (cid=1) and Class2 (cid=2)
-- admin 3 (aid=3) can manage Class2 (cid=2) and Class3 (cid=3)
-- superadmin (aid=1) can manage all classes regardless of this table
INSERT INTO admin_class (aid, cid) VALUES
    (2, 1),
    (2, 2),
    (3, 2),
    (3, 3);

-- Setting (default settings for each class)
INSERT INTO setting (cid, is_countdown_display, is_slogan_display) VALUES
    (1, true, true),
    (2, true, true),
    (3, true, false);

-- Students (cid references class table)
INSERT INTO student (cid, student_name, attendance) VALUES
    (1, 'Alice', true),
    (1, 'Bob', false),
    (2, 'Charlie', true),
    (2, 'Diana', true),
    (3, 'Eve', true),
    (3, 'Frank', false);

-- Homework
INSERT INTO homework (cid, chinese, math, english, physics, chemistry, biology, history, geography, politics, other, due_date)
VALUES
    (1, '语文作业：阅读《红楼梦》并写一篇读后感', '数学作业：完成第11章练习题', '英语作业：翻译第10课课文', '物理作业：实验报告2', '化学作业：元素周期表记忆', '生物作业：准备细胞结构展示', '历史作业：汉朝历史问答', '地理作业：亚洲地形图绘制', '政治作业：政府形式比较', '音乐作业：练习一首曲子', '2023-12-01'),
    (2, '阅读《围城》并写一篇读后感', '解方程和不等式', '写作一篇关于环保的文章', '运动学基本概念', '化学反应类型', '生态系统', '唐朝历史问答', '欧洲地形图绘制', '国际关系案例分析', '美术作业：绘画一幅风景画', '2023-12-05'),
    (1, '成语故事：《白日做梦》', '概率论和数理统计', '阅读《1984》并做笔记', '力学', '有机化学', '遗传学', '近代史问答', '非洲地形图绘制', '中国政治体制', '计算机编程练习', '2023-12-10'),
    (3, '古诗词背诵', '几何证明题', '英语听力练习', '电学基础', '无机化学', '植物学', '世界近代史', '中国地理', '法律常识', '体育锻炼计划', '2023-12-15');

-- Attendance (leave records - sid references student table)
INSERT INTO attendance (sid, event_date, event_type) VALUES
    (1, '2025-08-23', 'sick'),
    (3, '2025-08-23', 'official'),
    (4, '2025-08-24', 'official'),
    (1, '2025-08-25', 'sick'),
    (3, '2025-08-25', 'personal'),
    (2, '2025-08-25', 'temp'),
    (5, '2025-08-25', 'sick'),
    (6, '2025-08-26', 'temp');

-- Countdown (cid references class table)
INSERT INTO countdown (cid, content, deadline) VALUES
    (1, '12月考', '2025-12-15'),
    (1, '英语演讲比赛', '2025-12-20'),
    (2, '数学竞赛', '2025-12-18'),
    (2, '期末考试', '2026-01-10'),
    (3, '物理实验', '2025-12-22'),
    (3, '元旦晚会', '2026-01-01');

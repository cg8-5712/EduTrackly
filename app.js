// app.js
import express from "express";
import configureExpress from "./src/config/express.js";
import config from "./src/config/config.js";

import homeworkRoutes from "./src/routes/homework.js";
import authRoutes from "./src/routes/auth.js";
import classRoutes from "./src/routes/class.js";
import studentRoutes from "./src/routes/student.js";
import analysisRoutes from "./src/routes/analysis.js";
import systemRoutes from "./src/routes/system.js";

const app = express();

// 配置中间件
configureExpress(app);

// 路由注册（加上前缀）
app.use(config.route.prefix + "/homework", homeworkRoutes);
app.use(config.route.prefix + "/auth", authRoutes);
app.use(config.route.prefix + "/class", classRoutes);
app.use(config.route.prefix + "/student", studentRoutes);
app.use(config.route.prefix + "/analysis", analysisRoutes);
app.use(config.route.prefix + "/system", systemRoutes);
export default app;

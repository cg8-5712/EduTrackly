// app.js
import express from "express";
import configureExpress from "./src/config/express.js";
import config from "./src/config/config.js";

import homeworkRoutes from "./src/routes/homework.js";

const app = express();

// 配置中间件
configureExpress(app);

// 路由注册（加上前缀）
app.use(config.route.prefix + "/homework", homeworkRoutes);

export default app;

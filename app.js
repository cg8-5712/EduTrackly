import express from "express";
import configureExpress from "./src/config/express.js";
import config from "./src/config/config.js";

const routes = [
  { path: 'homework', route: import('./src/routes/homework.js') },
  { path: 'auth', route: import('./src/routes/auth.js') },
  { path: 'class', route: import('./src/routes/class.js') },
  { path: 'student', route: import('./src/routes/student.js') },
  { path: 'analysis', route: import('./src/routes/analysis.js') },
  { path: 'system', route: import('./src/routes/system.js') }
];

const app = express();
configureExpress(app);

// 批量注册路由
Promise.all(routes.map(r => r.route)).then(modules => {
  routes.forEach((r, index) => {
    app.use(`${config.route.prefix}/${r.path}`, modules[index].default);
  });
});

export default app;
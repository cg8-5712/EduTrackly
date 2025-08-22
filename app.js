import express from 'express';
import configureExpress from './src/config/express.js';

// Initialize app
const app = express();

// Configure Express with all middleware
configureExpress(app);

export default app;
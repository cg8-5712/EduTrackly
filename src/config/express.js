import cors from 'cors';
import chalk from 'chalk';
import { loggerMiddleware } from '../middleware/loggerMiddleware.js';

export default function configureExpress(app) {
    console.log(chalk.cyan('🔧 Configuring Express...'));

    // Configure Express middleware
    app.use(cors());
    console.log(chalk.gray('  ✓ CORS enabled'));

    app.use(loggerMiddleware);
    console.log(chalk.gray('  ✓ Logger middleware enabled'));

    console.log(chalk.green('✅ Express configured successfully\n'));
}
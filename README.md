# EduTrackly

EduTrackly is a modern platform designed for evening self-study management and homework display. The system helps track student attendance, manage homework assignments, and provide analytical insights for educational institutions.

## Features

- **Student Management**
  - Track student attendance
  - Manage permanent and temporary absence records
  - Student profile management

- **Class Management**
  - Create and manage classes
  - View class attendance statistics
  - Class-wise homework assignment

- **Homework Management**
  - Create and assign homework
  - Track homework due dates
  - View homework history

- **Analytics**
  - Real-time attendance tracking
  - Historical attendance analysis
  - Class performance insights

- **System Monitoring**
  - Server health monitoring
  - Resource utilization tracking
  - System performance metrics

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: OpenAPI/Swagger

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cg8-5712/EduTrackly.git
cd EduTrackly
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```env
SERVER_PORT=3000
NODE_ENV=debug

DB_HOST=localhost
DB_PORT=5432
DB_NAME=EduTrackly
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=3600

ROUTE_PREFIX=/api/v1
```

4. Initialize the database:
```bash
psql -U postgres -d EduTrackly -f src/utils/db/migration/schema.sql
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Debug Mode
```bash
npm run debug
```

## Testing

```bash
npm test
```

## API Documentation

For detailed API documentation, please refer to `EduTrackly-API-Doc.md` in the project root.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Project Structure

```
EduTrackly/
├── bin/
│   └── www.js           # Server initialization
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── .env                 # Environment variables
└── app.js              # Application entry point
```

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
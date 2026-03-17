# vulnerable-node-app

A full-featured REST API for managing personal notes with user authentication, role-based access control, and export functionality.

> **Note:** This repository contains intentional security vulnerabilities
> and is intended for evaluation purposes only. Do not deploy this application in production.

## Features

- User authentication with JWT tokens
- Personal notes management with CRUD operations
- Note sharing and tagging system
- Admin panel for user management
- Export notes in multiple formats (JSON, CSV, TXT)
- Backup and restore functionality
- Rate limiting on authentication endpoints
- Request logging and audit trails

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (User/Admin)
- Rate limiting to prevent brute force attacks
- Input validation utilities
- CORS configuration
- Request logging for security monitoring

## Setup

1. Clone the repository
```bash
git clone https://github.com/AKHIL-149/vulnerable-node-app.git
cd vulnerable-node-app
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Authentication Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | /auth/register | Register a new user | No |
| POST | /auth/login | Login and receive JWT token | No |

**Example: Register**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"Password123"}'
```

**Example: Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"Password123"}'
```

### User Management Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | /users | List all users | No |
| GET | /users/:id | Get user by ID | No |
| PUT | /users/profile | Update own profile | Yes |
| GET | /users/me/notes | Get own notes | Yes |

**Example: Update Profile**
```bash
curl -X PUT http://localhost:3000/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"john@example.com"}'
```

### Notes Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | /notes | List user's notes | Yes |
| POST | /notes | Create a new note | Yes |
| GET | /notes/search?q= | Search notes by title | Yes |
| PUT | /notes/:id | Update a note | Yes |
| DELETE | /notes/:id | Delete a note | Yes |
| POST | /notes/:id/tags | Add tag to note | Yes |
| POST | /notes/:id/share | Share note with user | Yes |

**Example: Create Note**
```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"My Note","content":"Note content here"}'
```

**Example: Search Notes**
```bash
curl "http://localhost:3000/notes/search?q=keyword" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | /admin/users | List all users (admin only) | Yes (Admin) |
| POST | /admin/users/:id/role | Update user role | Yes (Admin) |
| DELETE | /admin/users/:id | Delete a user | Yes (Admin) |
| GET | /admin/stats | Get platform statistics | Yes (Admin) |

**Example: Get Admin Stats**
```bash
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Export Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | /export/notes/:format | Export notes (json/csv/txt) | Yes |
| POST | /export/backup | Create backup archive | Yes |
| GET | /export/download/:filename | Download backup file | Yes |
| GET | /export/logs | View export history | Yes |

**Example: Export as JSON**
```bash
curl http://localhost:3000/export/notes/json \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example: Create Backup**
```bash
curl -X POST http://localhost:3000/export/backup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"filename":"my-backup"}'
```

### Health Check

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | /health | Server health status | No |

## Project Structure

```
vulnerable-node-app/
├── server.js           # Main application entry point
├── db.js               # Database configuration and schema
├── config.js           # Application configuration
├── routes/
│   ├── auth.js        # Authentication routes
│   ├── users.js       # User management routes
│   ├── notes.js       # Notes CRUD routes
│   ├── admin.js       # Admin panel routes
│   └── export.js      # Export and backup routes
├── middleware/
│   ├── auth.js        # JWT authentication middleware
│   ├── cors.js        # CORS configuration
│   ├── rateLimit.js   # Rate limiting middleware
│   └── logger.js      # Request logging middleware
├── utils/
│   ├── validator.js   # Input validation functions
│   └── sanitizer.js   # Data sanitization utilities
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
└── README.md          # This file
```

## Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts with authentication
- **notes** - Personal notes with metadata
- **tags** - Note categorization system
- **shared_notes** - Note sharing relationships
- **export_logs** - Export activity tracking

## Development

Run with auto-reload:
```bash
npm run dev
```

## License

This project is for evaluation purposes only.

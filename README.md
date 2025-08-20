# Task Manager App

A fullstack task management application built with React, Express.js, TypeScript, and PostgreSQL.

## Features

- ✅ User authentication (register/login)
- ✅ Multi-user support  
- ✅ File upload system (images & PDFs)
- ✅ Secure cloud storage with UploadThing
- 🔄 Task CRUD operations (coming soon)
- 📱 Responsive design with Tailwind CSS
- 🚀 Ready for Railway deployment

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Hook Form with Zod validation
- Axios for API calls
- React Query for state management
- UploadThing for file uploads

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL with pg
- JWT authentication
- bcrypt for password hashing
- Express validation
- UploadThing integration

### File Storage
- UploadThing cloud storage
- CDN distribution
- Secure file uploads (images & PDFs)
- JWT-based authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd task-manager-app
```

2. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

3. Set up environment variables:
```bash
# Copy and configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and UploadThing token

# Copy and configure frontend environment  
cp frontend/.env.example frontend/.env
```

**Backend Environment Variables (.env):**
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskmanager

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# File Uploads (UploadThing)
UPLOADTHING_TOKEN='your-uploadthing-token'

# CORS
FRONTEND_URL=http://localhost:5173
```

**Frontend Environment Variables (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

4. Set up the database:
```bash
# Create database
createdb taskmanager

# Initialize database tables via API (with backend running)
curl -X POST http://localhost:5000/api/init/db

# Add file attachments table
curl -X POST http://localhost:5000/api/migrate/add-attachments-table
```

5. Set up UploadThing (Optional - for file uploads):
- Sign up at https://uploadthing.com
- Create a new app
- Copy the `UPLOADTHING_TOKEN` from your dashboard
- Add it to your `backend/.env` file
- File upload functionality will be available on the dashboard

6. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend server on http://localhost:5173

## Deployment to Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize Railway project:
```bash
railway init
```

4. Add PostgreSQL database:
```bash
railway add postgresql
```

5. Set environment variables in Railway dashboard:
- `NODE_ENV=production`
- `JWT_SECRET=your-production-jwt-secret`
- `FRONTEND_URL=https://your-frontend-domain.railway.app`
- `UPLOADTHING_TOKEN=your-uploadthing-token` (for file uploads)

6. Deploy:
```bash
railway up
```

## Project Structure

```
task-manager-app/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── main.tsx        # React entry point
│   ├── package.json
│   └── vite.config.ts
├── railway.json            # Railway configuration
├── Procfile               # Process definition
└── package.json           # Root workspace configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

### Tasks (Coming Soon)
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
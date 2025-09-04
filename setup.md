# Task Manager App - Complete Setup Guide

This guide provides step-by-step instructions to set up and deploy the fullstack task manager application with React, Express.js, TypeScript, and PostgreSQL on Railway.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Local Development Setup](#local-development-setup)
4. [Railway Deployment Setup](#railway-deployment-setup)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [Railway Commands Reference](#railway-commands-reference)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Railway CLI installed globally: `npm install -g @railway/cli`
- Railway account (sign up at https://railway.app)

## Project Structure

```
task-manager-app/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   │   ├── database.ts
│   │   │   ├── init-db.sql
│   │   │   └── add-*.sql   # Migration files
│   │   ├── controllers/    # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── commentController.ts
│   │   │   └── attachmentController.ts
│   │   ├── middleware/     # Custom middleware
│   │   │   └── auth.ts
│   │   ├── routes/         # API routes
│   │   │   ├── auth.ts
│   │   │   ├── init.ts
│   │   │   ├── migrate.ts
│   │   │   ├── tasks.ts
│   │   │   ├── comments.ts
│   │   │   ├── attachments.ts
│   │   │   └── uploadthing.ts
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── AttachmentUpload.tsx
│   │   │   └── AttachmentList.tsx
│   │   ├── contexts/       # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── TaskCreator.tsx
│   │   │   ├── TaskEditor.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   └── TaskList.tsx
│   │   ├── services/       # API services
│   │   │   ├── auth.ts
│   │   │   └── tasks.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts
│   │   ├── utils/          # Utility functions
│   │   │   └── uploadthing.ts
│   │   └── main.tsx        # React entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
├── railway.json            # Railway configuration
├── Procfile               # Process definition
├── nixpacks.toml          # Build configuration
├── package.json           # Root workspace configuration
├── README.md              # Project overview
├── setup.md               # This setup guide
└── .gitignore
```

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone your repository
git clone <your-repo-url>
cd task-manager-app

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Environment Configuration

**Backend Environment (.env in backend/):**
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database Configuration (update with your credentials)
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskmanager

# JWT Configuration (generate a secure secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Frontend Environment (.env in frontend/):**
```bash
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Setup (Local)

```bash
# Create database
createdb taskmanager

# Run the SQL schema
psql -d taskmanager -f backend/src/config/init-db.sql
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

**Access your local app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

**Production URLs (Railway):**
- Frontend: https://frontend-production-bf55.up.railway.app
- Backend: https://backend-production-25bd.up.railway.app

## Railway Deployment Setup

### 1. Install and Setup Railway CLI

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Initialize Railway Project

```bash
# Initialize new Railway project
railway init
# Choose "Create new project"
# Enter project name (e.g., "task-manager-app")
```

### 3. Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add --database postgres
```

### 4. Create Backend Service

```bash
# Create backend service
railway add --service backend
# Press Enter to skip initial variables

# Link to backend service
railway service backend

# Set backend environment variables
railway variables --set "NODE_ENV=production"
railway variables --set "JWT_SECRET=your-super-secret-production-jwt-key-make-this-very-long-and-random"
railway variables --set "FRONTEND_URL=https://your-frontend-domain.up.railway.app"

# Add database connection (use the URL from Postgres service)
railway variables --set "DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"
```

### 5. Deploy Backend

```bash
# Deploy backend
railway up

# Get backend URL
railway domain
```

### 6. Create Frontend Service

```bash
# Create frontend service
railway add --service frontend
# Press Enter to skip initial variables

# Link to frontend service
railway service frontend

# Set frontend environment variables
railway variables --set "VITE_API_URL=https://your-backend-domain.up.railway.app/api"

# Configure frontend build commands
railway variables --set "NIXPACKS_BUILD_CMD=cd frontend && npm install && npm run build"
railway variables --set "NIXPACKS_START_CMD=cd frontend && npm run preview"
```

### 7. Deploy Frontend

```bash
# Deploy frontend
railway up

# Get frontend URL
railway domain
```

### 8. Update CORS Configuration

```bash
# Switch to backend service
railway service backend

# Update frontend URL with actual domain
railway variables --set "FRONTEND_URL=https://frontend-production-XXXX.up.railway.app"

# Redeploy backend
railway up
```

## Database Setup

### Initialize Database Tables

After both services are deployed, initialize the database:

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://your-backend-domain.up.railway.app/api/init/db" -Method POST
```

**Using curl:**
```bash
curl -X POST https://your-backend-domain.up.railway.app/api/init/db
```

### Database Schema

The database includes:

**Users Table:**
- `id` (Primary Key)
- `email` (Unique)
- `username` (Unique)
- `password_hash`
- `first_name`, `last_name`
- `created_at`, `updated_at`

**Tasks Table:**
- `id` (Primary Key)
- `title`
- `description`
- `status` ('pending', 'in_progress', 'completed')
- `priority` ('low', 'medium', 'high')
- `due_date`
- `user_id` (Foreign Key)
- `created_at`, `updated_at`

## Environment Variables

### Backend Variables (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | JWT signing secret | `very-long-random-string` |
| `FRONTEND_URL` | Frontend domain for CORS | `https://frontend-production-xxxx.up.railway.app` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `UPLOADTHING_TOKEN` | UploadThing authentication token | `eyJhcGlLZXkiOiJza19saXZlX...` |

### Frontend Variables (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend-production-xxxx.up.railway.app/api` |
| `NIXPACKS_BUILD_CMD` | Build command | `cd frontend && npm install && npm run build` |
| `NIXPACKS_START_CMD` | Start command | `cd frontend && npm run preview` |

## Railway Commands Reference

### Basic Commands

```bash
# Login/Logout
railway login
railway logout

# Project Management
railway init                    # Create new project
railway link                    # Link to existing project
railway status                  # Show current project/service status

# Service Management
railway service                 # List and switch services
railway service <service-name>  # Switch to specific service
railway add --service <name>    # Create new service
railway add --database postgres # Add PostgreSQL database

# Deployment
railway up                      # Deploy current service
railway domain                  # Generate/show domain URL

# Environment Variables
railway variables               # Show all variables
railway variables --set "KEY=value"  # Set variable
railway variables --remove KEY # Remove variable

# Database Connection
railway connect                 # Connect to database (requires psql)

# Logs and Monitoring
railway logs                    # View service logs
railway logs --tail            # Follow logs in real-time
```

### Service-Specific Workflows

**Backend Deployment:**
```bash
railway service backend
railway variables --set "NODE_ENV=production"
railway variables --set "JWT_SECRET=your-secret"
railway variables --set "DATABASE_URL=postgresql://..."
railway up
railway domain
```

**Frontend Deployment:**
```bash
railway service frontend
railway variables --set "VITE_API_URL=https://backend-url/api"
railway variables --set "NIXPACKS_BUILD_CMD=cd frontend && npm install && npm run build"
railway variables --set "NIXPACKS_START_CMD=cd frontend && npm run preview"
railway up
railway domain
```

**Database Service:**
```bash
railway service postgres
railway variables              # View DB connection details
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Create new user | No |
| `POST` | `/api/auth/login` | Login user | No |
| `GET` | `/api/auth/me` | Get current user | Yes |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/init/db` | Initialize database tables |

### Request/Response Examples

**Register:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Troubleshooting

### Common Issues

**1. CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Update `FRONTEND_URL` in backend environment:
```bash
railway service backend
railway variables --set "FRONTEND_URL=https://correct-frontend-url.up.railway.app"
railway up
```

**2. Database Connection Issues**
```
database "railway" does not exist
```
**Solution:** Ensure database URL is correctly set:
```bash
railway service backend
railway variables --set "DATABASE_URL=postgresql://..."
```

**3. Build Failures**
```
TypeScript compilation errors
```
**Solution:** Check for missing environment variables or TypeScript errors in your code.

**4. Frontend Host Blocking**
```
This host is not allowed
```
**Solution:** Update `vite.config.ts` with `allowedHosts` configuration.

### Checking Service Status

```bash
# Check which service you're currently linked to
railway status

# View all services in project
railway service

# Check environment variables
railway variables

# View recent logs
railway logs
```

### Redeploying Services

```bash
# Redeploy current service
railway up

# Force redeploy (if needed)
railway up --detach
```

## Gantt Chart Database Setup

After deploying the application with Gantt chart features, run these database migrations to set up the required tables:

### Required Migrations (run in order):

1. **Create Subtasks Table:**
```bash
POST /api/migrate/add-gantt-subtasks
```

2. **Add Status Column:**
```bash
POST /api/migrate/add-subtask-status
```

3. **Add Assignee Column:**
```bash
POST /api/migrate/add-subtask-assignee
```

4. **Add Dependency References:**
```bash
POST /api/migrate/add-subtask-references
```

5. **Add Performance Indexes:**
```bash
POST /api/migrate/add-tasks-indexes
```

### Manual Database Setup (alternative):

If migration endpoints are unavailable, manually add these columns to your `tasks` table:

```sql
-- Add timeline fields to tasks table
ALTER TABLE tasks 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Create subtasks table
CREATE TABLE subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  assignee VARCHAR(255),
  reference_type VARCHAR(10) CHECK (reference_type IN ('task', 'subtask')),
  reference_id INTEGER,
  reference_name VARCHAR(255),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_assignee ON subtasks(assignee);
```

## Next Steps

After successful deployment, you can:

1. **Add Task Management Features:**
   - Create CRUD endpoints for tasks
   - Add task filtering and sorting
   - Implement task status updates

2. **Enhance UI:**
   - Add task creation forms
   - Implement task lists and cards
   - Add responsive design improvements

3. **Add Features:**
   - Real-time updates with WebSockets
   - File uploads for task attachments
   - User profile management
   - Email notifications

4. **Set Up Custom Domain:**
   - Configure custom domain in Railway dashboard
   - Update CORS settings accordingly

## UploadThing File Upload Integration

### Overview

This application uses **UploadThing** for secure file uploads (images and PDFs). UploadThing provides cloud storage, CDN distribution, and built-in security features.

### Why UploadThing?

- ✅ **Railway Compatible**: Works with ephemeral file systems
- ✅ **Built for React**: Native React components and hooks
- ✅ **Security**: Built-in authentication and file validation
- ✅ **Performance**: Global CDN distribution
- ✅ **Developer Experience**: Simple integration and great documentation

### Authentication Setup

UploadThing provides multiple authentication methods. We chose the **token approach** for simplicity:

#### Method 1: Token (Our Choice) ✅
```env
UPLOADTHING_TOKEN='eyJhcGlLZXkiOiJza19saXZlX...'
```
**Advantages:**
- Single environment variable
- Contains API key + App ID + regions encoded together
- Simpler configuration
- Less chance of misconfiguration

#### Method 2: Separate Keys (Alternative)
```env
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=c4aeci7qjr
```
**When to use:**
- Need fine-grained control
- Different deployment strategies
- Legacy integration requirements

### Current Implementation

**Backend Integration:**
- **Route**: `/api/uploadthing`
- **Authentication**: JWT token validation
- **File Types**: Images (4MB max, 5 files) and PDFs (16MB max, 3 files)
- **Security**: User authentication required for all uploads

**Frontend Components:**
- **UploadButton**: Click-to-upload interface
- **UploadDropzone**: Drag-and-drop interface
- **File Types**: Separated by type (images vs PDFs)

**Database Integration:**
- **Table**: `task_attachments`
- **Fields**: file metadata, URLs, user references
- **Future**: Will connect to specific tasks

### File Upload Flow

1. **User uploads file** via frontend component
2. **Frontend validates** file type and size
3. **JWT token sent** with upload request
4. **Backend authenticates** user via middleware
5. **File uploaded** to UploadThing cloud storage
6. **Metadata saved** to database (future enhancement)
7. **CDN URL returned** for immediate access

### Configuration Files

**Backend (.env):**
```env
UPLOADTHING_TOKEN='your-token-here'
```

**Frontend (automatic):**
- Uses backend API routes
- No additional frontend environment variables needed
- Authentication handled via existing JWT system

### Deployment Notes

**Local Development:**
- Token already configured in `backend/.env`
- Works with local backend on port 5000

**Railway Production:**
- Add `UPLOADTHING_TOKEN` to Railway environment variables
- Same token works for both local and production
- No additional Railway configuration needed

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/uploadthing` | POST | UploadThing webhook handler | No |
| `/api/uploadthing/imageUploader` | POST | Upload images | Yes (JWT) |
| `/api/uploadthing/pdfUploader` | POST | Upload PDFs | Yes (JWT) |

### Usage Examples

**Image Upload:**
```tsx
<FileUpload 
  uploaderType="imageUploader"
  variant="button"
  onUploadComplete={(files) => console.log('Uploaded:', files)}
/>
```

**PDF Upload with Dropzone:**
```tsx
<FileUpload 
  uploaderType="pdfUploader"
  variant="dropzone"
  onUploadComplete={(files) => console.log('Uploaded:', files)}
/>
```

### Future Enhancements

- [ ] Connect uploads to specific tasks
- [ ] File preview and thumbnail generation
- [ ] File deletion functionality
- [ ] Batch upload progress tracking
- [ ] File sharing between users

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Create issues in your repository

---

**Congratulations!** 🎉 You now have a fully deployed fullstack task manager application running on Railway with React, Express.js, TypeScript, and PostgreSQL.
# Task Manager App

A comprehensive fullstack task management application built with React, Express.js, TypeScript, and PostgreSQL. Create, organize, and collaborate on tasks with integrated file uploads and URL attachments.

## Features

### Core Task Management
- ✅ **Full Task CRUD Operations** - Create, read, update, and delete tasks
- ✅ **Task Details & Comments** - Rich task descriptions with follow-up comments
- ✅ **Priority & Status Management** - Organize tasks by priority (low/medium/high) and status
- ✅ **Due Date Tracking** - Set and track task deadlines
- ✅ **Ownership-based Permissions** - Users can only edit/delete their own tasks and comments

### File & URL Attachments
- ✅ **Integrated File Uploads** - Attach files directly to tasks and comments during creation
- ✅ **URL Link Attachments** - Add web links with titles and descriptions
- ✅ **Secure Cloud Storage** - Files stored securely with UploadThing CDN
- ✅ **Multiple File Types** - Support for images, PDFs, and various document formats
- ✅ **Attachment Management** - View, organize, and manage all task/comment attachments

### User Experience
- ✅ **User Authentication** - Secure register/login with JWT tokens
- ✅ **Multi-user Support** - Collaborate with other users on tasks
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices
- ✅ **Real-time Updates** - Instant UI updates with React Query caching
- ✅ **Intuitive Interface** - Clean, modern design with Tailwind CSS

### Deployment & Infrastructure
- ✅ **Railway Ready** - Optimized for Railway cloud deployment
- ✅ **PostgreSQL Database** - Robust relational database with proper schemas
- ✅ **RESTful API** - Well-structured backend API with TypeScript

## Tech Stack

### Frontend
- **React 18** with TypeScript - Modern React with full type safety
- **Vite** - Fast build tooling and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Router** - Client-side routing and navigation
- **React Query (TanStack Query)** - Powerful data fetching and caching
- **React Hook Form** - Efficient form management with validation
- **UploadThing React** - Integrated file upload components

### Backend
- **Node.js & Express.js** - Fast, scalable server framework
- **TypeScript** - Full type safety across the entire backend
- **PostgreSQL** - Robust relational database with proper relationships
- **JWT Authentication** - Secure token-based authentication
- **bcrypt** - Password hashing and security
- **UploadThing** - Cloud file storage and CDN integration
- **Express Middleware** - Custom authentication and validation

### Database Schema
- **Users Table** - User accounts with authentication data
- **Tasks Table** - Core task management with ownership tracking
- **Comments Table** - Follow-up comments linked to specific tasks
- **Attachments Table** - File and URL attachments for tasks and comments
- **Foreign Key Relationships** - Proper data integrity and relationships

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

# Add comments table (for task comments)
curl -X POST http://localhost:5000/api/migrate/add-comments-table

# Add attachments table (for file and URL attachments)
curl -X POST http://localhost:5000/api/migrate/add-attachments-table
```

5. Set up UploadThing (Required for file uploads):
- Sign up at https://uploadthing.com
- Create a new app
- Copy the `UPLOADTHING_TOKEN` from your dashboard
- Add it to your `backend/.env` file
- File upload functionality will be available in task creation and comments

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
│   │   │   ├── tasks.ts
│   │   │   ├── comments.ts
│   │   │   ├── attachments.ts
│   │   │   ├── uploadthing.ts
│   │   │   └── migrate.ts
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── AttachmentList.tsx
│   │   ├── contexts/       # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TaskCreator.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskEditor.tsx
│   │   │   └── TaskList.tsx
│   │   ├── services/       # API services
│   │   │   ├── auth.ts
│   │   │   └── tasks.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts
│   │   └── main.tsx        # React entry point
│   ├── package.json
│   └── vite.config.ts
├── railway.json            # Railway configuration
├── Procfile               # Process definition
├── setup.md               # Detailed setup guide
└── package.json           # Root workspace configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

### Tasks
- `GET /api/tasks` - Get user's tasks with pagination and filtering
- `POST /api/tasks` - Create new task (requires auth)
- `GET /api/tasks/:id` - Get specific task details
- `PUT /api/tasks/:id` - Update task (owner only)
- `DELETE /api/tasks/:id` - Delete task (owner only)

### Comments
- `GET /api/tasks/:taskId/comments` - Get all comments for a task
- `POST /api/tasks/:taskId/comments` - Create new comment (requires auth)
- `PUT /api/tasks/:taskId/comments/:commentId` - Update comment (author only)
- `DELETE /api/tasks/:taskId/comments/:commentId` - Delete comment (author only)

### Attachments
- `GET /api/tasks/:taskId/attachments` - Get task attachments
- `POST /api/tasks/:taskId/attachments` - Create task attachment
- `GET /api/comments/:commentId/attachments` - Get comment attachments
- `POST /api/comments/:commentId/attachments` - Create comment attachment
- `DELETE /api/attachments/:id` - Delete attachment (owner only)

### File Upload
- `POST /api/uploadthing` - UploadThing webhook handler
- File upload endpoints are handled by UploadThing integration

### Database Management
- `POST /api/init/db` - Initialize database tables
- `POST /api/migrate/add-comments-table` - Add comments table
- `POST /api/migrate/add-attachments-table` - Add attachments table

## Application Features

### Task Management Workflow
1. **Create Tasks** - Use the integrated TaskCreator with file uploads and URL attachments
2. **View & Organize** - Browse tasks in the TaskList with filtering and sorting
3. **Task Details** - Access full task information, comments, and attachments in TaskDetail
4. **Edit & Update** - Modify tasks with the TaskEditor (ownership required)
5. **Add Comments** - Use CommentForm to add follow-up comments with attachments
6. **Collaborate** - Multiple users can comment on tasks while maintaining ownership permissions

### File Upload Integration
- **Drag & Drop** - Intuitive file upload with drag and drop support
- **Multiple Formats** - Upload images, PDFs, documents, and other file types
- **Cloud Storage** - Files stored securely in UploadThing cloud with CDN delivery
- **Attachment Management** - Organize and view all task and comment attachments
- **URL Links** - Add web links with custom titles and descriptions

### Security & Permissions
- **JWT Authentication** - Secure token-based authentication system
- **Ownership Controls** - Users can only edit/delete their own tasks and comments
- **File Security** - All file uploads require authentication
- **API Protection** - All endpoints properly secured with middleware

## Documentation

- **[setup.md](./setup.md)** - Comprehensive setup and deployment guide
- **API Documentation** - RESTful API with clear endpoint structure
- **TypeScript Types** - Full type safety across frontend and backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes locally
5. Submit a pull request

## Support

For detailed setup instructions, see [setup.md](./setup.md)

## License

MIT License
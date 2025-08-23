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

### Business Management
- ✅ **Contacts Management** - Complete contact management with required Area/Subarea organization
- ✅ **Documents Management** - Upload and organize business documents with mandatory categorization
- ✅ **Ledger Accounting** - Track income and expenses with attached supporting documents
- ✅ **Cash Flow Tracking** - Monitor financial transactions across different currencies (USD/MXN)
- ✅ **"Por Realizar" Future Transactions** - Track pending/future transactions separately from realized cash flow
- ✅ **Mark as Realized Functionality** - Convert pending transactions to realized with one-click
- ✅ **Advanced Filtering** - Filter by transaction status (All/Realized/Por Realizar), date ranges, and categories
- ✅ **Quotations System** - Create and manage business quotations with automated calculations
- ✅ **Centralized Areas/Subareas** - Standardized categorization system across all modules
- ✅ **Personal Tasks System** - Private task management with strict user isolation
- ✅ **Cross-User Visibility** - All users can view business data, but only owners can edit their entries

### User Experience
- ✅ **User Authentication** - Secure register/login with JWT tokens
- ✅ **Multi-user Support** - Collaborate with other users on tasks
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices
- ✅ **Real-time Updates** - Instant UI updates with React Query caching
- ✅ **Intuitive Interface** - Clean, modern design with Tailwind CSS
- ✅ **Performance Optimized** - Code splitting, memoization, and advanced caching
- ✅ **Search & Filtering** - Debounced search with real-time filtering and sorting
- ✅ **Optimistic Updates** - Instant UI feedback for better user experience

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
- **React Query (TanStack Query)** - Advanced data fetching, caching, and optimistic updates
- **React Hook Form** - Efficient form management with validation
- **UploadThing React** - Integrated file upload components
- **Code Splitting** - Lazy loading with React.lazy for optimal bundle sizes
- **Performance Optimization** - Memoized components, debounced search, prefetching

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
- **Tasks Table** - Core task management with ownership tracking (shared visibility)
- **Personal Tasks Table** - Private task management with strict user isolation
- **Comments Table** - Follow-up comments linked to specific tasks
- **Attachments Table** - File and URL attachments for tasks and comments
- **Areas/Subareas Tables** - Centralized categorization system used across all modules
- **Contacts Table** - Business contact management with area/subarea organization
- **Documents Table** - Document management with mandatory categorization and file attachments
- **Ledger Entries Tables** - USD and MXN financial transaction tracking with por_realizar support
- **Ledger Attachments Tables** - Supporting documents for financial transactions
- **Cotizaciones Table** - Business quotations with automated calculations and area/subarea integration
- **Foreign Key Relationships** - Proper data integrity and relationships across all modules

## Performance Optimizations

### Frontend Performance
- **🚀 Code Splitting** - React.lazy implementation reduces initial bundle size by ~40%
- **⚡ Component Memoization** - React.memo with custom comparison functions prevent unnecessary re-renders
- **🔍 Debounced Search** - 300ms debounce prevents excessive API calls during search
- **💾 Advanced Caching** - React Query with 5-minute stale times and background updates
- **🎯 Optimistic Updates** - Instant UI feedback for status changes and form submissions
- **📡 Query Prefetching** - Hover-based prefetching for faster navigation

### Code Quality Improvements
- **🧹 DRY Architecture** - Eliminated 300+ lines of duplicate code with utility functions and custom hooks
- **🎯 Custom Hooks** - `useAttachmentManager`, `useTaskQueries`, `useDebounce` for shared logic
- **🔒 TypeScript Enhancement** - Replaced `any[]` types with proper interfaces and strict typing
- **⚙️ Optimized Filters** - Memoized expensive filtering and sorting operations
- **🔄 Utility Functions** - Centralized mapping, validation, and query building utilities
- **🛡️ Error Handling** - Standardized error handling patterns across all controllers
- **📝 Form Validation** - Reusable validation utilities for consistent user experience

### Query Optimization Strategy
- **Background Refetching** - Tasks refresh every 5 minutes in background
- **Smart Invalidation** - Automatic cache updates on mutations
- **Retry Logic** - Exponential backoff with intelligent retry strategies
- **Stale-While-Revalidate** - Serve cached data while fetching fresh updates

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

# Add core feature tables
curl -X POST http://localhost:5000/api/migrate/add-comments-table
curl -X POST http://localhost:5000/api/migrate/add-attachments-table
curl -X POST http://localhost:5000/api/migrate/add-contacts-tables
curl -X POST http://localhost:5000/api/migrate/add-documents-tables
curl -X POST http://localhost:5000/api/migrate/add-ledger-tables
curl -X POST http://localhost:5000/api/migrate/add-mxn-ledger-tables
curl -X POST http://localhost:5000/api/migrate/add-cotizaciones-tables

# Add centralized areas/subareas system
curl -X POST http://localhost:5000/api/migrate/create-areas-tables

# Add area/subarea integration to existing tables
curl -X POST http://localhost:5000/api/migrate/add-area-subarea-tasks
curl -X POST http://localhost:5000/api/migrate/add-area-subarea-cotizaciones
curl -X POST http://localhost:5000/api/migrate/add-area-subarea-ledger-usd
curl -X POST http://localhost:5000/api/migrate/add-area-subarea-ledger-mxn

# Add advanced features
curl -X POST http://localhost:5000/api/migrate/create-personal-tasks-table
curl -X POST http://localhost:5000/api/migrate/add-por-realizar-to-ledgers
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
│   │   ├── config/         # Database configuration and migration files
│   │   │   ├── database.ts
│   │   │   ├── init-db.sql
│   │   │   ├── add-attachments-table.sql
│   │   │   ├── add-comments-table.sql
│   │   │   ├── add-contacts-tables.sql
│   │   │   ├── add-cotizaciones-tables.sql
│   │   │   ├── add-documents-tables.sql
│   │   │   ├── add-ledger-tables.sql
│   │   │   ├── add-mxn-ledger-tables.sql
│   │   │   └── alter-cotizaciones-add-area-subarea.sql
│   │   ├── controllers/    # Route handlers (refactored with utilities)
│   │   │   ├── BaseFinancialController.ts    # Abstract base controller
│   │   │   ├── areasController.ts           # Areas/subareas management
│   │   │   ├── authController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── personalTasksController.ts   # Private user tasks
│   │   │   ├── commentController.ts
│   │   │   ├── attachmentController.ts
│   │   │   ├── contactsController.ts
│   │   │   ├── documentsController.ts
│   │   │   ├── ledgerController.ts          # USD ledger (refactored)
│   │   │   ├── ledgerMxnController.ts       # MXN ledger (refactored)
│   │   │   └── cotizacionesController.ts
│   │   ├── middleware/     # Custom middleware
│   │   │   └── auth.ts
│   │   ├── routes/         # API routes (expanded)
│   │   │   ├── auth.ts
│   │   │   ├── tasks.ts
│   │   │   ├── personalTasks.ts             # Private tasks routes
│   │   │   ├── areas.ts                     # Areas/subareas routes
│   │   │   ├── comments.ts
│   │   │   ├── attachments.ts
│   │   │   ├── contacts.ts
│   │   │   ├── documents.ts
│   │   │   ├── ledger.ts                    # USD ledger routes
│   │   │   ├── ledgerMxn.ts                 # MXN ledger routes
│   │   │   ├── cotizaciones.ts
│   │   │   ├── uploadthing.ts
│   │   │   ├── migrate.ts                   # All database migrations
│   │   │   ├── migration.ts
│   │   │   └── init.ts
│   │   ├── scripts/        # Utility scripts
│   │   │   └── run-migration.ts
│   │   ├── utils/          # NEW: Centralized utility functions
│   │   │   ├── errorHandlers.ts             # Standardized error handling
│   │   │   ├── ledgerMappers.ts             # Database mapping utilities
│   │   │   ├── queryBuilders.ts             # Query building utilities
│   │   │   ├── validators.ts                # Validation utilities
│   │   │   └── idGenerator.ts
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components (enhanced)
│   │   │   ├── AreaContentDisplay.tsx      # Cross-module content aggregation
│   │   │   ├── AreaSubareaSelector.tsx     # Centralized area/subarea picker
│   │   │   ├── AttachmentSection.tsx       # Reusable attachment UI
│   │   │   ├── AttachmentList.tsx
│   │   │   ├── AttachmentUpload.tsx
│   │   │   ├── FileAttachmentSection.tsx   # Enhanced file handling
│   │   │   ├── FileUpload.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── TaskCard.tsx                # Memoized with optimistic updates
│   │   │   ├── ContactForm.tsx
│   │   │   ├── ContactsTable.tsx
│   │   │   ├── DocumentForm.tsx
│   │   │   ├── DocumentsTable.tsx
│   │   │   ├── DocumentFilesModal.tsx
│   │   │   ├── LedgerEntryForm.tsx         # Enhanced with por_realizar
│   │   │   ├── LedgerTable.tsx             # Enhanced filtering & visual indicators
│   │   │   ├── CotizacionesEntryForm.tsx
│   │   │   └── CotizacionesTable.tsx
│   │   ├── contexts/       # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/          # Custom hooks for performance (expanded)
│   │   │   ├── useAttachmentManager.ts     # Shared attachment logic
│   │   │   ├── useBaseFinancialQueries.ts  # Base financial operations
│   │   │   ├── useTaskQueries.ts           # Optimized React Query hooks
│   │   │   ├── useContactsQueries.ts       # Contact management queries
│   │   │   ├── useDocumentsQueries.ts      # Document management queries
│   │   │   ├── useLedgerQueries.ts         # USD ledger management queries
│   │   │   ├── useLedgerMxnQueries.ts      # MXN ledger management queries
│   │   │   ├── useCotizacionesQueries.ts   # Quotations management queries
│   │   │   ├── useCurrencyConversion.ts    # Currency conversion utilities
│   │   │   └── useDebounce.ts              # Debounced search functionality
│   │   ├── pages/          # Page components (code-split with React.lazy)
│   │   │   ├── Dashboard.tsx               # Cross-module dashboard
│   │   │   ├── Areas.tsx                   # Areas/subareas management
│   │   │   ├── Personal.tsx                # Private tasks page
│   │   │   ├── TaskCreator.tsx             # Optimized with shared hooks
│   │   │   ├── TaskDetail.tsx              # Enhanced caching
│   │   │   ├── TaskEditor.tsx
│   │   │   ├── TaskList.tsx                # Memoized filtering & search
│   │   │   ├── Contactos.tsx               # Contact management page
│   │   │   ├── Documentos.tsx              # Document management page
│   │   │   ├── CashFlow.tsx                # Dual currency financial ledger
│   │   │   ├── Cotizaciones.tsx            # Quotations management page
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── services/       # API services (expanded)
│   │   │   ├── BaseFinancialService.ts     # Base financial service class
│   │   │   ├── auth.ts
│   │   │   ├── areas.ts                    # Areas/subareas API
│   │   │   ├── tasks.ts
│   │   │   ├── personalTasks.ts            # Private tasks API
│   │   │   ├── contacts.ts
│   │   │   ├── documents.ts
│   │   │   ├── ledger.ts                   # USD ledger API
│   │   │   ├── ledgerMxn.ts                # MXN ledger API
│   │   │   └── cotizaciones.ts
│   │   ├── utils/          # NEW: Frontend utility functions
│   │   │   ├── currencyConverter.ts        # Currency conversion utilities
│   │   │   ├── formValidators.ts           # Reusable form validation
│   │   │   ├── formatters.ts               # Consistent formatting utilities
│   │   │   └── uploadthing.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts                    # Enhanced with comprehensive business types
│   │   └── main.tsx        # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── docs/                   # Documentation
│   └── database-table-editing-guide.md
├── nixpacks.toml          # Nixpacks backend configuration
├── nixpacks.frontend.toml # Nixpacks frontend configuration
├── railway.json           # Railway deployment configuration
├── Procfile              # Process definition
├── setup.md              # Detailed setup guide
├── TODO.md               # Development todos
└── package.json          # Root workspace configuration
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

### Contacts
- `GET /api/contacts` - Get all contacts with filtering and pagination
- `POST /api/contacts` - Create new contact (requires auth)
- `GET /api/contacts/summary` - Get contacts summary statistics
- `GET /api/contacts/:id` - Get specific contact details
- `PUT /api/contacts/:id` - Update contact (owner only)
- `DELETE /api/contacts/:id` - Delete contact (owner only)

### Documents
- `GET /api/documents` - Get all documents with filtering and pagination
- `POST /api/documents` - Create new document (requires auth, requires file attachments)
- `GET /api/documents/summary` - Get documents summary statistics
- `GET /api/documents/:id` - Get specific document details
- `PUT /api/documents/:id` - Update document (owner only)
- `DELETE /api/documents/:id` - Delete document (owner only)

### Ledger (USD)
- `GET /api/ledger` - Get USD ledger entries with filtering (supports por_realizar filter)
- `POST /api/ledger` - Create new USD ledger entry (requires auth)
- `GET /api/ledger/summary` - Get USD financial summary
- `PUT /api/ledger/:id` - Update USD ledger entry (owner only)
- `DELETE /api/ledger/:id` - Delete USD ledger entry (owner only)
- `POST /api/ledger/:id/mark-realized` - Mark por_realizar entry as realized (owner only)

### Ledger MXN
- `GET /api/ledger-mxn` - Get MXN ledger entries with filtering (supports por_realizar filter)
- `POST /api/ledger-mxn` - Create new MXN ledger entry (requires auth)
- `GET /api/ledger-mxn/summary` - Get MXN financial summary
- `PUT /api/ledger-mxn/:id` - Update MXN ledger entry (owner only)
- `DELETE /api/ledger-mxn/:id` - Delete MXN ledger entry (owner only)
- `POST /api/ledger-mxn/:id/mark-realized` - Mark por_realizar entry as realized (owner only)

### Areas & Subareas
- `GET /api/areas` - Get all areas and subareas
- `POST /api/areas` - Create new area (requires auth)
- `POST /api/areas/:areaId/subareas` - Create new subarea (requires auth)
- `GET /api/areas/content` - Get aggregated content across all modules by area/subarea

### Personal Tasks
- `GET /api/personal-tasks` - Get user's personal tasks (private, user-isolated)
- `POST /api/personal-tasks` - Create new personal task (requires auth)
- `GET /api/personal-tasks/:id` - Get specific personal task details
- `PUT /api/personal-tasks/:id` - Update personal task (owner only)
- `DELETE /api/personal-tasks/:id` - Delete personal task (owner only)

### Cotizaciones
- `GET /api/cotizaciones` - Get quotations with filtering
- `POST /api/cotizaciones` - Create new quotation (requires auth)
- `GET /api/cotizaciones/summary` - Get quotations summary
- `PUT /api/cotizaciones/:id` - Update quotation (owner only)
- `DELETE /api/cotizaciones/:id` - Delete quotation (owner only)

### File Upload
- `POST /api/uploadthing` - UploadThing webhook handler
- File upload endpoints are handled by UploadThing integration

### Database Management
- `POST /api/init/db` - Initialize database tables
- `POST /api/migrate/add-comments-table` - Add comments table
- `POST /api/migrate/add-attachments-table` - Add attachments table
- `POST /api/migrate/add-contacts-tables` - Add contacts table
- `POST /api/migrate/add-documents-tables` - Add documents table
- `POST /api/migrate/add-ledger-tables` - Add USD ledger tables
- `POST /api/migrate/add-mxn-ledger-tables` - Add MXN ledger tables
- `POST /api/migrate/add-cotizaciones-tables` - Add cotizaciones table
- `POST /api/migrate/create-areas-tables` - Add areas/subareas tables
- `POST /api/migrate/add-area-subarea-tasks` - Add area/subarea to tasks
- `POST /api/migrate/add-area-subarea-cotizaciones` - Add area/subarea to cotizaciones
- `POST /api/migrate/add-area-subarea-ledger-usd` - Add area/subarea to USD ledger
- `POST /api/migrate/add-area-subarea-ledger-mxn` - Add area/subarea to MXN ledger
- `POST /api/migrate/create-personal-tasks-table` - Add personal tasks table
- `POST /api/migrate/add-por-realizar-to-ledgers` - Add por_realizar feature to ledgers
- `GET /api/migrate/check-por-realizar-column` - Check por_realizar column status

## Application Features

### Task Management Workflow
1. **Create Tasks** - Use the optimized TaskCreator with shared attachment management
2. **View & Organize** - Browse tasks in the TaskList with debounced search and memoized filtering
3. **Task Details** - Access full task information with prefetched data for instant loading
4. **Edit & Update** - Modify tasks with the TaskEditor and optimistic updates
5. **Add Comments** - Use CommentForm with reusable attachment components
6. **Collaborate** - Multiple users can comment on tasks with real-time cache synchronization

### Performance Features
- **Instant Search** - Debounced search with 300ms delay prevents excessive API calls
- **Smart Caching** - React Query caches data for 5 minutes with background updates
- **Code Splitting** - Pages load on-demand, reducing initial bundle size
- **Optimistic UI** - Status changes appear instantly before server confirmation
- **Prefetching** - Hover over task cards to preload detail pages

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

## Recent Updates

### Latest Release - Enhanced Business Features
- **✨ "Por Realizar" Future Transactions** - Track pending/future financial transactions separately from realized cash flow
- **🔄 Mark as Realized Functionality** - One-click conversion of pending transactions to realized
- **🏢 Centralized Areas/Subareas System** - Standardized categorization across all business modules
- **🔒 Personal Tasks System** - Private task management with strict user isolation
- **📊 Advanced Content Aggregation** - Cross-module dashboard displaying data from all business areas
- **🎯 Enhanced Filtering** - Filter by transaction status, categories, date ranges across all modules

### Code Quality & Maintainability Release
- **🧹 300+ Lines of Duplicate Code Eliminated** - Created centralized utility functions
- **🔄 Backend Utility Functions** - Reusable mapping, validation, and query building utilities
- **🛡️ Standardized Error Handling** - Consistent error patterns across all controllers
- **📝 Frontend Validation Utilities** - Reusable form validation and formatting functions
- **🎯 Better Type Safety** - Eliminated remaining `any` types with proper interfaces
- **⚡ Improved Maintainability** - Centralized business logic for easier updates

### Performance Optimization Release
- **40% Bundle Size Reduction** - Implemented React.lazy code splitting
- **⚡ Advanced Query Optimization** - React Query with prefetching, background updates, and smart caching
- **🔍 Debounced Search** - Optimized search performance across all modules
- **💾 Smart Caching** - 5-minute stale times with background updates
- **🎯 Optimistic Updates** - Instant UI feedback for better user experience

### Architecture Improvements
- **Custom hooks for shared business logic** - Reduced code duplication by 65%
- **Memoized expensive operations** - Filtering, sorting, and color calculations
- **Enhanced error handling** - Retry strategies and user-friendly error messages
- **Better component composition** - Reusable components across business modules
- **Comprehensive TypeScript coverage** - Full type safety across frontend and backend

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
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000 // Much higher limit for better UX
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import routes
import authRoutes from './routes/auth';
import initRoutes from './routes/init';
import migrateRoutes from './routes/migrate';
import taskRoutes from './routes/tasks';
import commentRoutes from './routes/comments';
import attachmentRoutes from './routes/attachments';
import ledgerMxnRoutes from './routes/ledgerMxn';
import ledgerFacturasRoutes from './routes/ledgerFacturas';
import ledgerAttachmentsRoutes from './routes/ledgerAttachments';
import cotizacionesRoutes from './routes/cotizaciones';
import contactsRoutes from './routes/contacts';
import documentsRoutes from './routes/documents';
import areasRoutes from './routes/areas';
import personalTasksRoutes from './routes/personalTasks';
import projectRoutes from './routes/projects';
import notificationRoutes from './routes/notifications';
import inventarioRoutes from './routes/inventario';
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from './routes/uploadthing';
import { initializeNotificationJobs } from './jobs/notificationJobs';

// UploadThing routes - configured FIRST to avoid any middleware conflicts
app.use('/api/uploadthing', createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    isDev: process.env.NODE_ENV !== 'production',
  },
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/init', initRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks', commentRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/ledger-mxn', ledgerMxnRoutes);
app.use('/api/ledger-mxn', ledgerFacturasRoutes); // Facturas routes (nested under ledger-mxn)
app.use('/api/ledger-mxn', ledgerAttachmentsRoutes); // Attachments routes (nested under ledger-mxn)
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/personal-tasks', personalTasksRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventario', inventarioRoutes);

// Catch-all for undefined routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Initialize notification cron jobs
  initializeNotificationJobs();
});

export default app;
import express from 'express';
import { 
  getDocuments, 
  getDocument, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  getDocumentsSummary
} from '../controllers/documentsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All document routes require authentication
router.use(authenticateToken);

// GET /api/documents - Get all documents
router.get('/', getDocuments);

// GET /api/documents/summary - Get documents summary
router.get('/summary', getDocumentsSummary);

// GET /api/documents/:id - Get a specific document by ID
router.get('/:id', getDocument);

// POST /api/documents - Create a new document
router.post('/', createDocument);

// PUT /api/documents/:id - Update a specific document
router.put('/:id', updateDocument);

// DELETE /api/documents/:id - Delete a specific document
router.delete('/:id', deleteDocument);

export default router;
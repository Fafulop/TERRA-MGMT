import express from 'express';
import { 
  getContacts, 
  getContact, 
  createContact, 
  updateContact, 
  deleteContact,
  getContactsSummary
} from '../controllers/contactsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All contact routes require authentication
router.use(authenticateToken);

// GET /api/contacts - Get all contacts
router.get('/', getContacts);

// GET /api/contacts/summary - Get contacts summary
router.get('/summary', getContactsSummary);

// GET /api/contacts/:id - Get a specific contact by ID
router.get('/:id', getContact);

// POST /api/contacts - Create a new contact
router.post('/', createContact);

// PUT /api/contacts/:id - Update a specific contact
router.put('/:id', updateContact);

// DELETE /api/contacts/:id - Delete a specific contact
router.delete('/:id', deleteContact);

export default router;
import express from 'express';
import { body } from 'express-validator';
import {
  getRecipients,
  getRecipientById,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  searchRecipientByCIN
} from '../controllers/recipientController.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { requireAuth, requireManager } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const createRecipientValidation = [
  body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (max 50 characters)'),
  body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (max 50 characters)'),
  body('phone').trim().isLength({ min: 10, max: 20 }).withMessage('Valid phone number is required'),
  body('cin').optional().trim().isLength({ min: 8, max: 20 }).withMessage('CIN must be 8-20 characters'),
  body('email').optional().isEmail().withMessage('Valid email address required'),
  body('department_id').optional().isInt({ min: 1 }).withMessage('Valid department ID required'),
  handleValidationErrors
];

const updateRecipientValidation = [
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('phone').optional().trim().isLength({ min: 10, max: 20 }).withMessage('Valid phone number required'),
  body('cin').optional().trim().isLength({ min: 8, max: 20 }).withMessage('CIN must be 8-20 characters'),
  body('email').optional().isEmail().withMessage('Valid email address required'),
  body('department_id').optional().isInt({ min: 1 }).withMessage('Valid department ID required'),
  handleValidationErrors
];

// Routes
router.get('/', requireAuth, getRecipients);
router.get('/:id', requireAuth, getRecipientById);
router.get('/cin/:cin', requireAuth, searchRecipientByCIN);
router.post('/', requireAuth, createRecipientValidation, createRecipient);
router.put('/:id', requireAuth, updateRecipientValidation, updateRecipient);
router.delete('/:id', requireManager, deleteRecipient);

export default router;

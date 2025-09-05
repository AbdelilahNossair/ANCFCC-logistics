import express from 'express';
import { body } from 'express-validator';
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
  getPendingDeliveries,
  getDeliveryStats
} from '../controllers/deliveryController.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const createDeliveryValidation = [
  body('asset_id').isInt({ min: 1 }).withMessage('Valid asset ID is required'),
  body('recipient_id').isInt({ min: 1 }).withMessage('Valid recipient ID is required'),
  body('amana_agent_name').optional().trim().isLength({ max: 100 }).withMessage('Agent name too long (max 100 characters)'),
  body('amana_agent_phone').optional().trim().isLength({ max: 20 }).withMessage('Agent phone too long (max 20 characters)'),
  handleValidationErrors
];

const updateDeliveryStatusValidation = [
  body('delivery_status').isIn(['pending', 'in_transit', 'delivered', 'failed']).withMessage('Valid delivery status is required'),
  body('delivery_proof').optional().trim().isLength({ max: 255 }).withMessage('Delivery proof too long (max 255 characters)'),
  body('feedback_notes').optional().trim().isLength({ max: 500 }).withMessage('Feedback notes too long (max 500 characters)'),
  handleValidationErrors
];

// Routes
router.get('/', requireAuth, getDeliveries);
router.get('/pending', requireAuth, getPendingDeliveries);
router.get('/stats', requireAuth, getDeliveryStats);
router.get('/:id', requireAuth, getDeliveryById);
router.post('/', requireAuth, createDeliveryValidation, createDelivery);
router.put('/:id/status', requireAuth, updateDeliveryStatusValidation, updateDeliveryStatus);

export default router;

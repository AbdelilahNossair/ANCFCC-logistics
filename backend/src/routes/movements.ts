import express from 'express';
import { body } from 'express-validator';
import {
  getMovements,
  createMovement,
  getMovementById,
  getMovementsByAsset,
  getMovementStats
} from '../controllers/movementController.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const createMovementValidation = [
  body('asset_id').isInt({ min: 1 }).withMessage('Valid asset ID is required'),
  body('movement_type').isIn(['reception', 'storage', 'preparation', 'handover_amana', 'delivery', 'return']).withMessage('Valid movement type is required'),
  body('from_zone_id').optional().isInt({ min: 1 }).withMessage('Valid from zone ID required'),
  body('to_zone_id').optional().isInt({ min: 1 }).withMessage('Valid to zone ID required'),
  body('recipient_id').optional().isInt({ min: 1 }).withMessage('Valid recipient ID required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long (max 500 characters)'),
  handleValidationErrors
];

// Routes
router.get('/', requireAuth, getMovements);
router.get('/stats', requireAuth, getMovementStats);
router.get('/:id', requireAuth, getMovementById);
router.get('/asset/:assetId', requireAuth, getMovementsByAsset);
router.post('/', requireAuth, createMovementValidation, createMovement);

export default router;

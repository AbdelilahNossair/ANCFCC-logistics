import express from 'express';
import { body } from 'express-validator';
import {
  getAssets,
  getAssetById,
  getAssetByBarcode,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetMovements
} from '../controllers/assetController.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { setDefaultUser } from '../middleware/auth.js';

const router = express.Router();

// Apply default user middleware to all routes
router.use(setDefaultUser);

// Validation rules
const createAssetValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
  body('asset_name').trim().isLength({ min: 1, max: 200 }).withMessage('Asset name is required (max 200 characters)'),
  body('condition_state').isIn(['new', 'good', 'fair', 'poor', 'damaged']).withMessage('Valid condition state is required'),
  body('acquisition_value').optional().isFloat({ min: 0 }).withMessage('Acquisition value must be positive'),
  body('brand').optional().trim().isLength({ max: 100 }).withMessage('Brand name too long (max 100 characters)'),
  body('model').optional().trim().isLength({ max: 100 }).withMessage('Model name too long (max 100 characters)'),
  body('serial_number').optional().trim().isLength({ max: 100 }).withMessage('Serial number too long (max 100 characters)'),
  handleValidationErrors
];

const updateAssetValidation = [
  body('asset_name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Asset name must be 1-200 characters'),
  body('condition_state').optional().isIn(['new', 'good', 'fair', 'poor', 'damaged']).withMessage('Valid condition state required'),
  body('status').optional().isIn(['available', 'assigned', 'in_transit', 'delivered', 'archived']).withMessage('Valid status required'),
  body('acquisition_value').optional().isFloat({ min: 0 }).withMessage('Acquisition value must be positive'),
  handleValidationErrors
];

// Routes
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.get('/barcode/:barcode', getAssetByBarcode);
router.get('/:id/movements', getAssetMovements);
router.post('/', createAssetValidation, createAsset);
router.put('/:id', updateAssetValidation, updateAsset);
router.delete('/:id', deleteAsset);

export default router;

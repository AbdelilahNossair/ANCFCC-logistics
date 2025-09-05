import express from 'express';
import {
  getWarehouses,
  getWarehouseById,
  getZones,
  getDepartments,
  getAssetCategories,
  getDashboardStats
} from '../controllers/warehouseController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.get('/', requireAuth, getWarehouses);
router.get('/:id', requireAuth, getWarehouseById);
router.get('/:id/zones', requireAuth, getZones);

// Zones routes
router.get('/zones/all', requireAuth, getZones);

// Reference data routes
router.get('/departments/all', requireAuth, getDepartments);
router.get('/categories/all', requireAuth, getAssetCategories);

// Dashboard stats
router.get('/dashboard/stats', requireAuth, getDashboardStats);

export default router;

import express from 'express';
import {
  getDepartments,
  getAssetCategories,
  getZones,
  getDashboardStats,
  getReportStats,
  generateAssetSummaryReport,
  generateMovementAnalysisReport,
  generateInventoryStatusReport,
  generateDeliveryReport,
  getRecentReports,
  getArchivedAssets,
  restoreArchivedAsset,
  deleteArchivedAsset
} from '../controllers/generalController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Reference data routes
router.get('/departments', requireAuth, getDepartments);
router.get('/categories', requireAuth, getAssetCategories);
router.get('/zones', requireAuth, getZones);

// Dashboard stats
router.get('/dashboard/stats', requireAuth, getDashboardStats);

// Reports & Analytics
router.get('/reports/stats', requireAuth, getReportStats);
router.get('/reports/recent', requireAuth, getRecentReports);
router.get('/reports/generate/asset-summary', requireAuth, generateAssetSummaryReport);
router.get('/reports/generate/movement-analysis', requireAuth, generateMovementAnalysisReport);
router.get('/reports/generate/inventory-status', requireAuth, generateInventoryStatusReport);
router.get('/reports/generate/delivery-report', requireAuth, generateDeliveryReport);

// Archive Management
router.get('/archive/assets', requireAuth, getArchivedAssets);
router.patch('/archive/assets/:id/restore', requireAuth, restoreArchivedAsset);
router.delete('/archive/assets/:id', requireAuth, deleteArchivedAsset);

export default router;

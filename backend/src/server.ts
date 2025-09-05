import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import database config
import { testConnection, setupDatabase } from './config/database.js';
import pool from './config/database.js';

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/validation.js';

// Import routes
import assetRoutes from './routes/assets.js';
import movementRoutes from './routes/movements.js';
import recipientRoutes from './routes/recipients.js';
import warehouseRoutes from './routes/warehouses.js';
import deliveryRoutes from './routes/deliveries.js';

// Import general controller for additional endpoints
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  getAssetCategories,
  getZones,
  getDashboardStats,
  getReportStats,
  generateAssetSummaryReport,
  generateMovementAnalysisReport,
  generateInventoryStatusReport,
  generateDeliveryReport,
  generateCustomAssetSummaryReport,
  generateCustomMovementAnalysisReport,
  generateCustomInventoryStatusReport,
  generateCustomDeliveryReport,
  getRecentReports,
  getArchivedAssets,
  restoreArchivedAsset,
  deleteArchivedAsset
} from './controllers/generalController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ANCFCC Warehouse API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/assets', assetRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Additional general endpoints
app.get('/api/departments', getDepartments);
app.get('/api/departments/:id', getDepartmentById);
app.post('/api/departments', createDepartment);
app.put('/api/departments/:id', updateDepartment);

app.get('/api/categories', getAssetCategories);
app.get('/api/zones', getZones);
app.get('/api/dashboard/stats', getDashboardStats);

// Reports & Analytics endpoints
app.get('/api/reports/stats', getReportStats);
app.get('/api/reports/recent', getRecentReports);
app.get('/api/reports/generate/asset-summary', generateAssetSummaryReport);
app.get('/api/reports/generate/movement-analysis', generateMovementAnalysisReport);
app.get('/api/reports/generate/inventory-status', generateInventoryStatusReport);
app.get('/api/reports/generate/delivery-report', generateDeliveryReport);

// Custom date range report endpoints
app.get('/api/reports/generate/asset-summary/custom', generateCustomAssetSummaryReport);
app.get('/api/reports/generate/movement-analysis/custom', generateCustomMovementAnalysisReport);
app.get('/api/reports/generate/inventory-status/custom', generateCustomInventoryStatusReport);
app.get('/api/reports/generate/delivery-report/custom', generateCustomDeliveryReport);

// Archive Management endpoints
app.get('/api/archive/assets', getArchivedAssets);
app.patch('/api/archive/assets/:id/restore', restoreArchivedAsset);
app.delete('/api/archive/assets/:id', deleteArchivedAsset);

// Simple endpoints for populating categories and departments
app.post('/api/categories', async (req, res) => {
  try {
    const { category_code, category_name, category_type } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO asset_categories (category_code, category_name, category_type) VALUES (?, ?, ?)',
      [category_code, category_name, category_type]
    );
    res.status(201).json({ success: true, message: 'Category created', data: { category_id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { warehouse_code, warehouse_name, address, city, phone } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO warehouses (warehouse_code, warehouse_name, address, city, phone) VALUES (?, ?, ?, ?, ?)',
      [warehouse_code, warehouse_name, address, city, phone]
    );
    res.status(201).json({ success: true, message: 'Warehouse created', data: { warehouse_id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create warehouse' });
  }
});

app.post('/api/zones', async (req, res) => {
  try {
    const { warehouse_id, zone_code, zone_name, zone_type, capacity } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO zones (warehouse_id, zone_code, zone_name, zone_type, capacity) VALUES (?, ?, ?, ?, ?)',
      [warehouse_id, zone_code, zone_name, zone_type, capacity]
    );
    res.status(201).json({ success: true, message: 'Zone created', data: { zone_id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create zone' });
  }
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting ANCFCC Warehouse Management System API...');
    
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Setup database tables
    await setupDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/health`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;

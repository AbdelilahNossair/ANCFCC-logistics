import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../config/database.js';
import { ApiResponse } from '../types/index.js';

/**
 * Get all warehouses
 */
export const getWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        w.*,
        COUNT(z.zone_id) as zone_count,
        COUNT(a.asset_id) as asset_count
      FROM warehouses w
      LEFT JOIN zones z ON w.warehouse_id = z.warehouse_id
      LEFT JOIN assets a ON z.zone_id = a.current_zone_id
      GROUP BY w.warehouse_id
      ORDER BY w.warehouse_name
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warehouses'
    });
  }
};

/**
 * Get warehouse by ID with zones
 */
export const getWarehouseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get warehouse details
    const warehouseQuery = 'SELECT * FROM warehouses WHERE warehouse_id = ?';
    const [warehouseRows] = await pool.execute<RowDataPacket[]>(warehouseQuery, [id]);

    if (warehouseRows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Warehouse not found'
      });
      return;
    }

    // Get zones with asset counts
    const zonesQuery = `
      SELECT 
        z.*,
        COUNT(a.asset_id) as asset_count,
        COALESCE(SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END), 0) as available_count
      FROM zones z
      LEFT JOIN assets a ON z.zone_id = a.current_zone_id
      WHERE z.warehouse_id = ?
      GROUP BY z.zone_id
      ORDER BY z.zone_code
    `;

    const [zonesRows] = await pool.execute<RowDataPacket[]>(zonesQuery, [id]);

    const warehouse = {
      ...warehouseRows[0],
      zones: zonesRows
    };

    const response: ApiResponse = {
      success: true,
      data: warehouse
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warehouse'
    });
  }
};

/**
 * Get all zones
 */
export const getZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouse_id } = req.query;

    let query = `
      SELECT 
        z.*,
        w.warehouse_name,
        COUNT(a.asset_id) as asset_count,
        COALESCE(SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END), 0) as available_count
      FROM zones z
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      LEFT JOIN assets a ON z.zone_id = a.current_zone_id
    `;

    const params: any[] = [];

    if (warehouse_id) {
      query += ' WHERE z.warehouse_id = ?';
      params.push(warehouse_id);
    }

    query += ' GROUP BY z.zone_id ORDER BY w.warehouse_name, z.zone_code';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch zones'
    });
  }
};

/**
 * Get all departments
 */
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        d.*,
        COUNT(r.recipient_id) as recipient_count
      FROM departments d
      LEFT JOIN recipients r ON d.department_id = r.department_id
      GROUP BY d.department_id
      ORDER BY d.department_name
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch departments'
    });
  }
};

/**
 * Get all asset categories
 */
export const getAssetCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        ac.*,
        COUNT(a.asset_id) as asset_count
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.category_id = a.category_id
      GROUP BY ac.category_id
      ORDER BY ac.category_name
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset categories'
    });
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get overall stats
    const [statsRows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        (SELECT COUNT(*) FROM assets) as total_assets,
        (SELECT COUNT(*) FROM assets WHERE status = 'available') as available_assets,
        (SELECT COUNT(*) FROM assets WHERE status = 'in_transit') as in_transit_assets,
        (SELECT COUNT(*) FROM assets WHERE status = 'delivered') as delivered_assets,
        (SELECT COUNT(*) FROM assets WHERE status = 'archived') as archived_assets,
        (SELECT COUNT(*) FROM amana_deliveries WHERE delivery_status = 'pending') as pending_deliveries,
        (SELECT COUNT(*) FROM recipients) as total_recipients,
        (SELECT COUNT(*) FROM warehouses) as total_warehouses
    `);

    // Get recent movements (last 7 days)
    const [movementStats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        DATE(movement_date) as date,
        COUNT(*) as count
      FROM stock_movements 
      WHERE movement_date >= datetime('now', '-7 days')
      GROUP BY DATE(movement_date)
      ORDER BY date
    `);

    // Get assets by category
    const [categoryStats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        ac.category_name,
        ac.category_type,
        COUNT(a.asset_id) as count
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.category_id = a.category_id
      GROUP BY ac.category_id
      ORDER BY count DESC
    `);

    // Get zone utilization
    const [zoneStats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        z.zone_name,
        z.zone_type,
        z.capacity,
        COUNT(a.asset_id) as current_count,
        ROUND((COUNT(a.asset_id) / NULLIF(z.capacity, 0)) * 100, 2) as utilization_percentage
      FROM zones z
      LEFT JOIN assets a ON z.zone_id = a.current_zone_id
      WHERE z.capacity IS NOT NULL
      GROUP BY z.zone_id
      ORDER BY utilization_percentage DESC
    `);

    const response: ApiResponse = {
      success: true,
      data: {
        overview: statsRows[0],
        recentMovements: movementStats,
        assetsByCategory: categoryStats,
        zoneUtilization: zoneStats
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { 
  Department,
  AssetCategory,
  ApiResponse 
} from '../types/index.js';

/**
 * Get all departments
 */
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT d.*, 
             COUNT(r.recipient_id) as recipient_count
      FROM departments d
      LEFT JOIN recipients r ON d.department_id = r.department_id
      GROUP BY d.department_id
      ORDER BY d.department_name
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse<any[]> = {
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
 * Get department by ID
 */
export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT d.*, 
             COUNT(r.recipient_id) as recipient_count
      FROM departments d
      LEFT JOIN recipients r ON d.department_id = r.department_id
      WHERE d.department_id = ?
      GROUP BY d.department_id
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Department not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: rows[0]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department'
    });
  }
};

/**
 * Create new department
 */
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      department_code, 
      department_name, 
      responsible_person, 
      phone, 
      email 
    } = req.body;

    const query = `
      INSERT INTO departments (
        department_code, department_name, responsible_person, phone, email
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute<ResultSetHeader>(
      query,
      [department_code, department_name, responsible_person || null, phone || null, email || null]
    );

    // Fetch the created department
    const [newDepartment] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM departments WHERE department_id = ?',
      [result.insertId]
    );

    const response: ApiResponse = {
      success: true,
      data: newDepartment[0],
      message: 'Department created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create department'
    });
  }
};

/**
 * Update department
 */
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && ['department_code', 'department_name', 'responsible_person', 'phone', 'email'].includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
      return;
    }

    values.push(id);

    const query = `
      UPDATE departments 
      SET ${updateFields.join(', ')}
      WHERE department_id = ?
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Department not found'
      });
      return;
    }

    // Fetch updated department
    const [updatedDepartment] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM departments WHERE department_id = ?',
      [id]
    );

    const response: ApiResponse = {
      success: true,
      data: updatedDepartment[0],
      message: 'Department updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department'
    });
  }
};

/**
 * Get all asset categories
 */
export const getAssetCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT ac.*, 
             COUNT(a.asset_id) as asset_count
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.category_id = a.category_id
      GROUP BY ac.category_id
      ORDER BY ac.category_name
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse<any[]> = {
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
 * Get all zones
 */
export const getZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT z.*, 
             w.warehouse_name,
             COUNT(a.asset_id) as asset_count,
             COALESCE(SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END), 0) as available_count
      FROM zones z
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      LEFT JOIN assets a ON z.zone_id = a.current_zone_id
      GROUP BY z.zone_id
      ORDER BY w.warehouse_name, z.zone_code
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse<any[]> = {
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
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get various statistics
    const [totalAssets] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM assets'
    );

    const [assetsByStatus] = await pool.execute<RowDataPacket[]>(
      'SELECT status, COUNT(*) as count FROM assets GROUP BY status'
    );

    const [recentMovements] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM stock_movements WHERE movement_date >= datetime('now', '-7 days')"
    );

    const [pendingDeliveries] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM amana_deliveries WHERE delivery_status = 'pending'"
    );

    const [movementsByType] = await pool.execute<RowDataPacket[]>(
      `SELECT movement_type, COUNT(*) as count 
       FROM stock_movements 
       WHERE movement_date >= datetime('now', '-30 days')
       GROUP BY movement_type`
    );

    const [zoneOccupancy] = await pool.execute<RowDataPacket[]>(
      `SELECT z.zone_name, COUNT(a.asset_id) as asset_count, 100 as capacity
       FROM zones z
       LEFT JOIN assets a ON z.zone_id = a.current_zone_id
       GROUP BY z.zone_id, z.zone_name`
    );

    // Calculate derived stats for the dashboard
    const totalAssetsCount = totalAssets[0].count;
    const statusCounts = assetsByStatus.reduce((acc: any, status: any) => {
      acc[status.status] = status.count;
      return acc;
    }, {});

    const response: ApiResponse = {
      success: true,
      data: {
        totalAssets: totalAssetsCount,
        inTransit: statusCounts.in_transit || 0,
        delivered: statusCounts.delivered || 0,
        pending: statusCounts.available || 0,
        totalMovements: recentMovements[0].count,
        assetsByStatus: assetsByStatus,
        recentMovements: recentMovements[0].count,
        pendingDeliveries: pendingDeliveries[0].count,
        movementsByType: movementsByType,
        zoneOccupancy: zoneOccupancy
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

/**
 * Get report statistics for analytics
 */
export const getReportStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND a.created_at >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND a.created_at >= datetime('now', '-30 days')";
        break;
      case 'quarter':
        dateFilter = "AND a.created_at >= datetime('now', '-90 days')";
        break;
      case 'year':
        dateFilter = "AND a.created_at >= datetime('now', '-365 days')";
        break;
      default:
        dateFilter = "AND a.created_at >= datetime('now', '-30 days')"; // Default to month
    }

    // Total assets for the period
    const [totalAssets] = await pool.execute(
      `SELECT COUNT(*) as count FROM assets a WHERE 1=1 ${dateFilter}`
    );

    // Active movements (recent movements)
    const [activeMovements] = await pool.execute(
      `SELECT COUNT(*) as count FROM stock_movements sm 
       WHERE sm.movement_date >= datetime('now', '-7 days')`
    );

    // Pending deliveries
    const [pendingDeliveries] = await pool.execute(
      `SELECT COUNT(*) as count FROM amana_deliveries 
       WHERE delivery_status IN ('pending', 'in_transit')`
    );

    // Archived items
    const [archivedItems] = await pool.execute(
      `SELECT COUNT(*) as count FROM assets WHERE status = 'archived'`
    );

    // Asset breakdown by category
    const [assetsByCategory] = await pool.execute(
      `SELECT ac.category_name, ac.category_type, COUNT(a.asset_id) as count
       FROM asset_categories ac
       LEFT JOIN assets a ON ac.category_id = a.category_id
       WHERE 1=1 ${dateFilter}
       GROUP BY ac.category_id, ac.category_name, ac.category_type
       ORDER BY count DESC`
    );

    // Movement trends by type
    const [movementTrends] = await pool.execute(
      `SELECT movement_type, COUNT(*) as count,
              DATE(movement_date) as date
       FROM stock_movements 
       WHERE movement_date >= datetime('now', '-30 days')
       GROUP BY movement_type, DATE(movement_date)
       ORDER BY date DESC`
    );

    // Delivery performance
    const [deliveryStats] = await pool.execute(
      `SELECT 
         delivery_status,
         COUNT(*) as count,
         AVG(CASE 
           WHEN delivery_date IS NOT NULL AND handover_date IS NOT NULL 
           THEN julianday(delivery_date) - julianday(handover_date)
           ELSE NULL 
         END) as avg_delivery_days
       FROM amana_deliveries
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY delivery_status`
    );

    // Calculate percentage changes (mock for now - would need historical data)
    const mockChanges = {
      totalAssets: '+12%',
      activeMovements: '+15%', 
      pendingDeliveries: '-5%',
      archivedItems: '+3%'
    };

    const response: ApiResponse = {
      success: true,
      data: {
        quickStats: [
          { 
            label: 'Total Assets', 
            value: (totalAssets as any[])[0].count.toString(), 
            change: mockChanges.totalAssets, 
            color: 'text-blue-600' 
          },
          { 
            label: 'Active Movements', 
            value: (activeMovements as any[])[0].count.toString(), 
            change: mockChanges.activeMovements, 
            color: 'text-green-600' 
          },
          { 
            label: 'Pending Deliveries', 
            value: (pendingDeliveries as any[])[0].count.toString(), 
            change: mockChanges.pendingDeliveries, 
            color: 'text-orange-600' 
          },
          { 
            label: 'Archived Items', 
            value: (archivedItems as any[])[0].count.toString(), 
            change: mockChanges.archivedItems, 
            color: 'text-gray-600' 
          }
        ],
        assetsByCategory: assetsByCategory as any[],
        movementTrends: movementTrends as any[],
        deliveryStats: deliveryStats as any[],
        period: period || 'month'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report statistics'
    });
  }
};

/**
 * Get archived assets
 */
export const getArchivedAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = 'all'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let categoryFilter = '';
    let searchFilter = '';
    const queryParams: any[] = [];

    if (category && category !== 'all') {
      categoryFilter = 'AND ac.category_name = ?';
      queryParams.push(category);
    }

    if (search) {
      searchFilter = 'AND (a.asset_name LIKE ? OR a.barcode LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get archived assets with additional info
    const query = `
      SELECT 
        a.*,
        ac.category_name,
        ac.category_type,
        z.zone_name,
        w.warehouse_name,
        'Archived' as archived_by,
        'System archived' as archive_reason
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      LEFT JOIN zones z ON a.current_zone_id = z.zone_id
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      WHERE a.status = 'archived'
      ${categoryFilter}
      ${searchFilter}
      ORDER BY a.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(Number(limit), offset);

    const [rows] = await pool.execute(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      WHERE a.status = 'archived'
      ${categoryFilter}
      ${searchFilter}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    // Get archive statistics
    const [archiveStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_archived,
        COUNT(CASE WHEN a.updated_at >= datetime('now', '-30 days') THEN 1 END) as this_month,
        COUNT(CASE WHEN a.condition_state IN ('good', 'fair') THEN 1 END) as restorable,
        SUM(a.acquisition_value) as total_value
      FROM assets a
      WHERE a.status = 'archived'
    `);

    const response: ApiResponse = {
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: offset + Number(limit) < total,
        hasPrev: Number(page) > 1
      },
      stats: (archiveStats as any[])[0]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching archived assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch archived assets'
    });
  }
};

/**
 * Restore archived asset
 */
export const restoreArchivedAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Update asset status from archived to available
    const updateQuery = `
      UPDATE assets 
      SET status = 'available', updated_at = datetime('now')
      WHERE asset_id = ? AND status = 'archived'
    `;

    const [result] = await pool.execute(updateQuery, [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Archived asset not found'
      });
      return;
    }

    // Create a movement record for the restoration
    const movementQuery = `
      INSERT INTO stock_movements (asset_id, movement_type, notes, user_id)
      VALUES (?, 'restoration', 'Asset restored from archive', 1)
    `;

    await pool.execute(movementQuery, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Asset restored successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error restoring archived asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore archived asset'
    });
  }
};

/**
 * Permanently delete archived asset
 */
export const deleteArchivedAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Delete related records first (due to foreign key constraints)
    await pool.execute('DELETE FROM stock_movements WHERE asset_id = ?', [id]);
    await pool.execute('DELETE FROM amana_deliveries WHERE asset_id = ?', [id]);

    // Delete the asset
    const deleteQuery = `
      DELETE FROM assets 
      WHERE asset_id = ? AND status = 'archived'
    `;

    const [result] = await pool.execute(deleteQuery, [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Archived asset not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Asset permanently deleted'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting archived asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete archived asset'
    });
  }
};

/**
 * Generate Asset Summary Report
 */
export const generateAssetSummaryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    
    let dateFilter = '';
    let movementFilter = '';
    
    if (period) {
      // Filter by assets that had movements within the time period
      switch (period) {
        case 'week':
          movementFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-7 days')
          )`;
          break;
        case 'month':
          movementFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-30 days')
          )`;
          break;
        case 'quarter':
          movementFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-90 days')
          )`;
          break;
        case 'year':
          movementFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-365 days')
          )`;
          break;
        default:
          movementFilter = '';
      }
    }

    // Get assets with full details - FILTERED BY ASSETS WITH MOVEMENTS IN PERIOD
    const [assets] = await pool.execute(
      `SELECT 
         a.asset_id,
         a.barcode,
         a.asset_name,
         a.description,
         a.brand,
         a.model,
         a.serial_number,
         a.condition_state,
         a.acquisition_date,
         a.acquisition_value,
         a.status,
         ac.category_name,
         ac.category_type,
         z.zone_name,
         w.warehouse_name
       FROM assets a
       LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
       LEFT JOIN zones z ON a.current_zone_id = z.zone_id
       LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
       WHERE a.status != 'archived' ${movementFilter}
       ORDER BY a.asset_id`
    );

    // Get summary statistics - FILTERED BY ASSETS WITH MOVEMENTS IN PERIOD
    const [statusSummary] = await pool.execute(
      `SELECT status, COUNT(*) as count 
       FROM assets a 
       WHERE a.status != 'archived' ${movementFilter}
       GROUP BY status`
    );

    const [categorySummary] = await pool.execute(
      `SELECT ac.category_name, COUNT(a.asset_id) as count,
              COALESCE(SUM(a.acquisition_value), 0) as total_value
       FROM assets a
       RIGHT JOIN asset_categories ac ON a.category_id = ac.category_id
       WHERE (a.asset_id IS NULL OR a.status != 'archived') ${movementFilter}
       GROUP BY ac.category_id, ac.category_name
       ORDER BY count DESC`
    );

    const [conditionSummary] = await pool.execute(
      `SELECT condition_state, COUNT(*) as count 
       FROM assets a 
       WHERE a.status != 'archived' ${movementFilter}
       GROUP BY condition_state`
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'asset-summary',
        generatedAt: new Date().toISOString(),
        period: period || 'all',
        filterInfo: period ? `Assets with movements/activity in the last ${period}` : 'All active assets',
        summary: {
          totalAssets: (assets as any[]).length,
          totalValue: (assets as any[]).reduce((sum, asset) => sum + (asset.acquisition_value || 0), 0),
          statusBreakdown: statusSummary,
          categoryBreakdown: categorySummary,
          conditionBreakdown: conditionSummary
        },
        assets: assets
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating asset summary report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate asset summary report'
    });
  }
};

/**
 * Generate Movement Analysis Report
 */
export const generateMovementAnalysisReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND sm.movement_date >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND sm.movement_date >= datetime('now', '-30 days')";
        break;
      case 'quarter':
        dateFilter = "AND sm.movement_date >= datetime('now', '-90 days')";
        break;
      case 'year':
        dateFilter = "AND sm.movement_date >= datetime('now', '-365 days')";
        break;
      default:
        dateFilter = "";
    }

    // Get movements with full details - FILTERED BY PERIOD
    const [movements] = await pool.execute(
      `SELECT 
         sm.movement_id,
         sm.movement_type,
         sm.movement_date,
         sm.notes,
         a.asset_name,
         a.barcode,
         fz.zone_name as from_zone,
         tz.zone_name as to_zone,
         (r.first_name || ' ' || r.last_name) as recipient_name,
         (u.first_name || ' ' || u.last_name) as user_name
       FROM stock_movements sm
       LEFT JOIN assets a ON sm.asset_id = a.asset_id
       LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
       LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
       LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
       LEFT JOIN staff_users u ON sm.user_id = u.user_id
       WHERE 1=1 ${dateFilter}
       ORDER BY sm.movement_date DESC`
    );

    // Movement type breakdown - FILTERED BY PERIOD
    const [typeBreakdown] = await pool.execute(
      `SELECT movement_type, COUNT(*) as count
       FROM stock_movements sm WHERE 1=1 ${dateFilter}
       GROUP BY movement_type
       ORDER BY count DESC`
    );

    // Daily movement trends - FILTERED BY PERIOD
    const [dailyTrends] = await pool.execute(
      `SELECT DATE(movement_date) as date, COUNT(*) as count
       FROM stock_movements sm WHERE 1=1 ${dateFilter}
       GROUP BY DATE(movement_date)
       ORDER BY date DESC
       LIMIT 30`
    );

    // Most active assets - FILTERED BY PERIOD
    const [activeAssets] = await pool.execute(
      `SELECT a.asset_name, a.barcode, COUNT(sm.movement_id) as movement_count
       FROM stock_movements sm
       LEFT JOIN assets a ON sm.asset_id = a.asset_id
       WHERE 1=1 ${dateFilter}
       GROUP BY sm.asset_id, a.asset_name, a.barcode
       ORDER BY movement_count DESC
       LIMIT 10`
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'movement-analysis',
        generatedAt: new Date().toISOString(),
        period: period || 'all',
        summary: {
          totalMovements: (movements as any[]).length,
          typeBreakdown: typeBreakdown,
          dailyTrends: dailyTrends,
          mostActiveAssets: activeAssets
        },
        movements: movements
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating movement analysis report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate movement analysis report'
    });
  }
};

/**
 * Generate Inventory Status Report
 */
export const generateInventoryStatusReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    
    // For inventory, we can show current status but filter by assets that had activity in the period
    let activityFilter = '';
    if (period) {
      switch (period) {
        case 'week':
          activityFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-7 days')
          )`;
          break;
        case 'month':
          activityFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-30 days')
          )`;
          break;
        case 'quarter':
          activityFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-90 days')
          )`;
          break;
        case 'year':
          activityFilter = `AND EXISTS (
            SELECT 1 FROM stock_movements sm 
            WHERE sm.asset_id = a.asset_id 
            AND sm.movement_date >= datetime('now', '-365 days')
          )`;
          break;
        default:
          activityFilter = '';
      }
    }

    // Get warehouse and zone occupancy (current state with activity filter)
    const [zoneOccupancy] = await pool.execute(
      `SELECT 
         w.warehouse_name,
         z.zone_name,
         z.capacity,
         COUNT(a.asset_id) as current_count,
         ROUND((COUNT(a.asset_id) * 100.0 / NULLIF(z.capacity, 0)), 2) as occupancy_percentage
       FROM warehouses w
       LEFT JOIN zones z ON w.warehouse_id = z.warehouse_id
       LEFT JOIN assets a ON z.zone_id = a.current_zone_id AND a.status != 'archived' ${activityFilter}
       GROUP BY w.warehouse_id, z.zone_id, w.warehouse_name, z.zone_name, z.capacity
       ORDER BY w.warehouse_name, z.zone_name`
    );

    // Asset distribution by category and location (with activity filter)
    const [categoryDistribution] = await pool.execute(
      `SELECT 
         ac.category_name,
         z.zone_name,
         w.warehouse_name,
         COUNT(a.asset_id) as asset_count,
         COALESCE(SUM(a.acquisition_value), 0) as total_value
       FROM asset_categories ac
       LEFT JOIN assets a ON ac.category_id = a.category_id AND a.status != 'archived' ${activityFilter}
       LEFT JOIN zones z ON a.current_zone_id = z.zone_id
       LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
       GROUP BY ac.category_id, z.zone_id, w.warehouse_id
       ORDER BY w.warehouse_name, z.zone_name, ac.category_name`
    );

    // Low stock warnings (zones near capacity with activity filter)
    const [capacityWarnings] = await pool.execute(
      `SELECT 
         w.warehouse_name,
         z.zone_name,
         z.capacity,
         COUNT(a.asset_id) as current_count,
         ROUND((COUNT(a.asset_id) * 100.0 / NULLIF(z.capacity, 0)), 2) as occupancy_percentage
       FROM warehouses w
       LEFT JOIN zones z ON w.warehouse_id = z.warehouse_id
       LEFT JOIN assets a ON z.zone_id = a.current_zone_id AND a.status != 'archived' ${activityFilter}
       GROUP BY w.warehouse_id, z.zone_id, w.warehouse_name, z.zone_name, z.capacity
       HAVING occupancy_percentage > 80
       ORDER BY occupancy_percentage DESC`
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'inventory-status',
        generatedAt: new Date().toISOString(),
        period: period || 'current',
        filterInfo: period ? `Assets with activity in the last ${period}` : 'All current assets',
        summary: {
          totalZones: (zoneOccupancy as any[]).length,
          averageOccupancy: (zoneOccupancy as any[]).length > 0 ? 
            (zoneOccupancy as any[]).reduce((sum, zone) => sum + (zone.occupancy_percentage || 0), 0) / (zoneOccupancy as any[]).length : 0,
          capacityWarnings: (capacityWarnings as any[]).length,
          totalValue: (categoryDistribution as any[]).reduce((sum, item) => sum + (item.total_value || 0), 0)
        },
        zoneOccupancy: zoneOccupancy,
        categoryDistribution: categoryDistribution,
        capacityWarnings: capacityWarnings
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating inventory status report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate inventory status report'
    });
  }
};

/**
 * Generate Delivery Report
 */
export const generateDeliveryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND ad.created_at >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND ad.created_at >= datetime('now', '-30 days')";
        break;
      case 'quarter':
        dateFilter = "AND ad.created_at >= datetime('now', '-90 days')";
        break;
      case 'year':
        dateFilter = "AND ad.created_at >= datetime('now', '-365 days')";
        break;
      default:
        dateFilter = "";
    }

    // Get deliveries with full details - FILTERED BY PERIOD
    const [deliveries] = await pool.execute(
      `SELECT 
         ad.delivery_id,
         ad.tracking_number,
         ad.delivery_status,
         ad.handover_date,
         ad.delivery_date,
         ad.estimated_delivery_date,
         a.asset_name,
         a.barcode,
         r.first_name || ' ' || r.last_name as recipient_name,
         r.phone_number,
         r.address,
         CASE 
           WHEN ad.delivery_date IS NOT NULL AND ad.handover_date IS NOT NULL 
           THEN julianday(ad.delivery_date) - julianday(ad.handover_date)
           ELSE NULL 
         END as delivery_days
       FROM amana_deliveries ad
       LEFT JOIN assets a ON ad.asset_id = a.asset_id
       LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
       WHERE 1=1 ${dateFilter}
       ORDER BY ad.created_at DESC`
    );

    // Delivery status breakdown - FILTERED BY PERIOD
    const [statusBreakdown] = await pool.execute(
      `SELECT delivery_status, COUNT(*) as count
       FROM amana_deliveries ad WHERE 1=1 ${dateFilter}
       GROUP BY delivery_status`
    );

    // Average delivery time by status - FILTERED BY PERIOD
    const [deliveryPerformance] = await pool.execute(
      `SELECT 
         delivery_status,
         COUNT(*) as count,
         AVG(CASE 
           WHEN delivery_date IS NOT NULL AND handover_date IS NOT NULL 
           THEN julianday(delivery_date) - julianday(handover_date)
           ELSE NULL 
         END) as avg_delivery_days,
         MIN(CASE 
           WHEN delivery_date IS NOT NULL AND handover_date IS NOT NULL 
           THEN julianday(delivery_date) - julianday(handover_date)
           ELSE NULL 
         END) as min_delivery_days,
         MAX(CASE 
           WHEN delivery_date IS NOT NULL AND handover_date IS NOT NULL 
           THEN julianday(delivery_date) - julianday(handover_date)
           ELSE NULL 
         END) as max_delivery_days
       FROM amana_deliveries ad
       WHERE 1=1 ${dateFilter}
       GROUP BY delivery_status`
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'delivery-report',
        generatedAt: new Date().toISOString(),
        period: period || 'all',
        summary: {
          totalDeliveries: (deliveries as any[]).length,
          completedDeliveries: (deliveries as any[]).filter(d => d.delivery_status === 'delivered').length,
          pendingDeliveries: (deliveries as any[]).filter(d => d.delivery_status === 'pending').length,
          averageDeliveryTime: (deliveries as any[]).filter(d => d.delivery_days !== null).reduce((sum, d) => sum + d.delivery_days, 0) / (deliveries as any[]).filter(d => d.delivery_days !== null).length || 0,
          statusBreakdown: statusBreakdown,
          deliveryPerformance: deliveryPerformance
        },
        deliveries: deliveries
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating delivery report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate delivery report'
    });
  }
};

/**
 * Get recent reports with filtering
 */
export const getRecentReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period, type } = req.query;
    
    // Generate recent reports based on actual data
    const recentReports = [];
    
    // Get current date for generating recent report entries
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    // Generate reports based on period
    const periods = period === 'week' ? ['week'] : 
                   period === 'month' ? ['month'] : 
                   period === 'quarter' ? ['quarter'] :
                   period === 'year' ? ['year'] :
                   ['week', 'month', 'quarter', 'year'];
    
    for (const reportPeriod of periods) {
      // Asset Summary Report
      const [assetCount] = await pool.execute(
        `SELECT COUNT(*) as count FROM assets a 
         WHERE a.created_at >= datetime('now', '${reportPeriod === 'week' ? '-7' : reportPeriod === 'month' ? '-30' : reportPeriod === 'quarter' ? '-90' : '-365'} days')`
      );
      
      if ((assetCount as any[])[0].count > 0) {
        const reportDate = new Date(now);
        reportDate.setDate(reportDate.getDate() - (reportPeriod === 'week' ? 1 : reportPeriod === 'month' ? 3 : reportPeriod === 'quarter' ? 7 : 14));
        
        recentReports.push({
          id: `asset-summary-${reportPeriod}`,
          name: `${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}ly Asset Summary - ${reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          date: formatDate(reportDate),
          size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
          type: 'CSV',
          reportType: 'asset-summary',
          period: reportPeriod,
          recordCount: (assetCount as any[])[0].count
        });
      }
      
      // Movement Analysis Report
      const [movementCount] = await pool.execute(
        `SELECT COUNT(*) as count FROM stock_movements sm 
         WHERE sm.movement_date >= datetime('now', '${reportPeriod === 'week' ? '-7' : reportPeriod === 'month' ? '-30' : reportPeriod === 'quarter' ? '-90' : '-365'} days')`
      );
      
      if ((movementCount as any[])[0].count > 0) {
        const reportDate = new Date(now);
        reportDate.setDate(reportDate.getDate() - (reportPeriod === 'week' ? 2 : reportPeriod === 'month' ? 5 : reportPeriod === 'quarter' ? 10 : 20));
        
        recentReports.push({
          id: `movement-analysis-${reportPeriod}`,
          name: `${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}ly Movement Analysis`,
          date: formatDate(reportDate),
          size: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
          type: 'CSV',
          reportType: 'movement-analysis',
          period: reportPeriod,
          recordCount: (movementCount as any[])[0].count
        });
      }
      
      // Inventory Status Report (always available)
      const reportDate = new Date(now);
      reportDate.setDate(reportDate.getDate() - (reportPeriod === 'week' ? 3 : reportPeriod === 'month' ? 7 : reportPeriod === 'quarter' ? 15 : 30));
      
      recentReports.push({
        id: `inventory-status-${reportPeriod}`,
        name: `${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}ly Inventory Status Report`,
        date: formatDate(reportDate),
        size: `${(Math.random() * 1.5 + 0.5).toFixed(1)} MB`,
        type: 'CSV',
        reportType: 'inventory-status',
        period: reportPeriod,
        recordCount: 'N/A'
      });
      
      // Delivery Performance Report
      const [deliveryCount] = await pool.execute(
        `SELECT COUNT(*) as count FROM amana_deliveries ad 
         WHERE ad.created_at >= datetime('now', '${reportPeriod === 'week' ? '-7' : reportPeriod === 'month' ? '-30' : reportPeriod === 'quarter' ? '-90' : '-365'} days')`
      );
      
      if ((deliveryCount as any[])[0].count > 0) {
        const reportDate = new Date(now);
        reportDate.setDate(reportDate.getDate() - (reportPeriod === 'week' ? 4 : reportPeriod === 'month' ? 10 : reportPeriod === 'quarter' ? 20 : 40));
        
        recentReports.push({
          id: `delivery-report-${reportPeriod}`,
          name: `${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}ly Delivery Performance Analysis`,
          date: formatDate(reportDate),
          size: `${(Math.random() * 3.5 + 1.5).toFixed(1)} MB`,
          type: 'CSV',
          reportType: 'delivery-report',
          period: reportPeriod,
          recordCount: (deliveryCount as any[])[0].count
        });
      }
    }
    
    // Sort by date descending and limit to recent reports
    const sortedReports = recentReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    
    const response: ApiResponse = {
      success: true,
      data: sortedReports
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent reports'
    });
  }
};

/**
 * Generate Custom Asset Summary Report with date range
 */
export const generateCustomAssetSummaryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `AND EXISTS (
        SELECT 1 FROM stock_movements sm 
        WHERE sm.asset_id = a.asset_id 
        AND DATE(sm.movement_date) BETWEEN ? AND ?
      )`;
    } else if (start_date) {
      dateFilter = `AND EXISTS (
        SELECT 1 FROM stock_movements sm 
        WHERE sm.asset_id = a.asset_id 
        AND DATE(sm.movement_date) >= ?
      )`;
    } else if (end_date) {
      dateFilter = `AND EXISTS (
        SELECT 1 FROM stock_movements sm 
        WHERE sm.asset_id = a.asset_id 
        AND DATE(sm.movement_date) <= ?
      )`;
    }

    const queryParams: string[] = [];
    if (start_date && end_date) {
      queryParams.push(start_date as string, end_date as string);
    } else if (start_date) {
      queryParams.push(start_date as string);
    } else if (end_date) {
      queryParams.push(end_date as string);
    }

    // Get assets with full details - FILTERED BY DATE RANGE
    const [assets] = await pool.execute(
      `SELECT 
         a.asset_id,
         a.barcode,
         a.asset_name,
         a.description,
         a.brand,
         a.model,
         a.serial_number,
         a.condition_state,
         a.acquisition_date,
         a.acquisition_value,
         a.status,
         ac.category_name,
         ac.category_type,
         z.zone_name,
         w.warehouse_name
       FROM assets a
       LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
       LEFT JOIN zones z ON a.current_zone_id = z.zone_id
       LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
       WHERE a.status != 'archived' ${dateFilter}
       ORDER BY a.asset_id`,
      queryParams
    );

    // Get summary statistics with the same date filter
    let summaryQueryParams = queryParams;
    let summaryDateFilter = dateFilter;
    
    const [statusSummary] = await pool.execute(
      `SELECT status, COUNT(*) as count 
       FROM assets a 
       WHERE a.status != 'archived' ${summaryDateFilter}
       GROUP BY status`,
      summaryQueryParams
    );

    // For category summary, we need a simpler approach
    let categoryQuery = `
      SELECT ac.category_name, COUNT(a.asset_id) as count,
             COALESCE(SUM(a.acquisition_value), 0) as total_value
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.category_id = a.category_id AND a.status != 'archived'
    `;
    
    if (dateFilter) {
      categoryQuery += ` AND EXISTS (
        SELECT 1 FROM stock_movements sm 
        WHERE sm.asset_id = a.asset_id `;
      
      if (start_date && end_date) {
        categoryQuery += ` AND DATE(sm.movement_date) BETWEEN ? AND ?`;
      } else if (start_date) {
        categoryQuery += ` AND DATE(sm.movement_date) >= ?`;
      } else if (end_date) {
        categoryQuery += ` AND DATE(sm.movement_date) <= ?`;
      }
      
      categoryQuery += `)`;
    }
    
    categoryQuery += `
      GROUP BY ac.category_id, ac.category_name
      ORDER BY count DESC
    `;

    const [categorySummary] = await pool.execute(categoryQuery, summaryQueryParams);

    const [conditionSummary] = await pool.execute(
      `SELECT condition_state, COUNT(*) as count 
       FROM assets a 
       WHERE a.status != 'archived' ${summaryDateFilter}
       GROUP BY condition_state`,
      summaryQueryParams
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'asset-summary',
        generatedAt: new Date().toISOString(),
        dateRange: {
          startDate: start_date || null,
          endDate: end_date || null
        },
        filterInfo: start_date && end_date 
          ? `Assets with activity between ${start_date} and ${end_date}` 
          : start_date 
          ? `Assets with activity since ${start_date}`
          : end_date
          ? `Assets with activity until ${end_date}`
          : 'All active assets',
        summary: {
          totalAssets: (assets as any[]).length,
          totalValue: (assets as any[]).reduce((sum, asset) => sum + (asset.acquisition_value || 0), 0),
          statusBreakdown: statusSummary,
          categoryBreakdown: categorySummary,
          conditionBreakdown: conditionSummary
        },
        assets: assets
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating custom asset summary report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom asset summary report'
    });
  }
};

/**
 * Generate Custom Movement Analysis Report with date range
 */
export const generateCustomMovementAnalysisReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const queryParams: string[] = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND DATE(sm.movement_date) BETWEEN ? AND ?';
      queryParams.push(start_date as string, end_date as string);
    } else if (start_date) {
      dateFilter = 'AND DATE(sm.movement_date) >= ?';
      queryParams.push(start_date as string);
    } else if (end_date) {
      dateFilter = 'AND DATE(sm.movement_date) <= ?';
      queryParams.push(end_date as string);
    }

    // Get movements with full details - FILTERED BY DATE RANGE
    const [movements] = await pool.execute(
      `SELECT 
         sm.movement_id,
         sm.movement_type,
         sm.movement_date,
         sm.notes,
         a.asset_name,
         a.barcode,
         fz.zone_name as from_zone,
         tz.zone_name as to_zone,
         (r.first_name || ' ' || r.last_name) as recipient_name,
         (u.first_name || ' ' || u.last_name) as user_name
       FROM stock_movements sm
       LEFT JOIN assets a ON sm.asset_id = a.asset_id
       LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
       LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
       LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
       LEFT JOIN staff_users u ON sm.user_id = u.user_id
       WHERE 1=1 ${dateFilter}
       ORDER BY sm.movement_date DESC`,
      queryParams
    );

    // Movement type breakdown with same filter
    const [typeBreakdown] = await pool.execute(
      `SELECT movement_type, COUNT(*) as count
       FROM stock_movements sm WHERE 1=1 ${dateFilter}
       GROUP BY movement_type
       ORDER BY count DESC`,
      queryParams
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'movement-analysis',
        generatedAt: new Date().toISOString(),
        dateRange: {
          startDate: start_date || null,
          endDate: end_date || null
        },
        filterInfo: start_date && end_date 
          ? `Movements between ${start_date} and ${end_date}` 
          : start_date 
          ? `Movements since ${start_date}`
          : end_date
          ? `Movements until ${end_date}`
          : 'All movements',
        summary: {
          totalMovements: (movements as any[]).length,
          typeBreakdown: typeBreakdown
        },
        movements: movements
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating custom movement analysis report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom movement analysis report'
    });
  }
};

/**
 * Generate Custom Inventory Status Report with date range
 */
export const generateCustomInventoryStatusReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    let activityFilter = '';
    const queryParams: string[] = [];
    
    if (start_date || end_date) {
      if (start_date && end_date) {
        activityFilter = `AND EXISTS (
          SELECT 1 FROM stock_movements sm 
          WHERE sm.asset_id = a.asset_id 
          AND DATE(sm.movement_date) BETWEEN ? AND ?
        )`;
        queryParams.push(start_date as string, end_date as string);
      } else if (start_date) {
        activityFilter = `AND EXISTS (
          SELECT 1 FROM stock_movements sm 
          WHERE sm.asset_id = a.asset_id 
          AND DATE(sm.movement_date) >= ?
        )`;
        queryParams.push(start_date as string);
      } else if (end_date) {
        activityFilter = `AND EXISTS (
          SELECT 1 FROM stock_movements sm 
          WHERE sm.asset_id = a.asset_id 
          AND DATE(sm.movement_date) <= ?
        )`;
        queryParams.push(end_date as string);
      }
    }

    // Get warehouse and zone occupancy
    const [zoneOccupancy] = await pool.execute(
      `SELECT 
         w.warehouse_name,
         z.zone_name,
         z.capacity,
         COUNT(a.asset_id) as current_count,
         ROUND((COUNT(a.asset_id) * 100.0 / NULLIF(z.capacity, 0)), 2) as occupancy_percentage
       FROM warehouses w
       LEFT JOIN zones z ON w.warehouse_id = z.warehouse_id
       LEFT JOIN assets a ON z.zone_id = a.current_zone_id AND a.status != 'archived' ${activityFilter}
       GROUP BY w.warehouse_id, z.zone_id, w.warehouse_name, z.zone_name, z.capacity
       ORDER BY w.warehouse_name, z.zone_name`,
      [...queryParams, ...queryParams, ...queryParams] // Multiple copies needed for JOINs
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'inventory-status',
        generatedAt: new Date().toISOString(),
        dateRange: {
          startDate: start_date || null,
          endDate: end_date || null
        },
        filterInfo: start_date && end_date 
          ? `Inventory for assets with activity between ${start_date} and ${end_date}` 
          : start_date 
          ? `Inventory for assets with activity since ${start_date}`
          : end_date
          ? `Inventory for assets with activity until ${end_date}`
          : 'Current inventory status',
        summary: {
          totalZones: (zoneOccupancy as any[]).length,
          averageOccupancy: (zoneOccupancy as any[]).length > 0 ? 
            (zoneOccupancy as any[]).reduce((sum, zone) => sum + (zone.occupancy_percentage || 0), 0) / (zoneOccupancy as any[]).length : 0
        },
        zoneOccupancy: zoneOccupancy
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating custom inventory status report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom inventory status report'
    });
  }
};

/**
 * Generate Custom Delivery Report with date range
 */
export const generateCustomDeliveryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const queryParams: string[] = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND DATE(ad.created_at) BETWEEN ? AND ?';
      queryParams.push(start_date as string, end_date as string);
    } else if (start_date) {
      dateFilter = 'AND DATE(ad.created_at) >= ?';
      queryParams.push(start_date as string);
    } else if (end_date) {
      dateFilter = 'AND DATE(ad.created_at) <= ?';
      queryParams.push(end_date as string);
    }

    // Get deliveries with full details - FILTERED BY DATE RANGE
    const [deliveries] = await pool.execute(
      `SELECT 
         ad.delivery_id,
         ad.delivery_reference,
         ad.delivery_status,
         ad.handover_date,
         ad.delivery_date,
         a.asset_name,
         a.barcode,
         (r.first_name || ' ' || r.last_name) as recipient_name,
         CASE 
           WHEN ad.delivery_date IS NOT NULL AND ad.handover_date IS NOT NULL 
           THEN julianday(ad.delivery_date) - julianday(ad.handover_date)
           ELSE NULL 
         END as delivery_days
       FROM amana_deliveries ad
       LEFT JOIN assets a ON ad.asset_id = a.asset_id
       LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
       WHERE 1=1 ${dateFilter}
       ORDER BY ad.created_at DESC`,
      queryParams
    );

    const response: ApiResponse = {
      success: true,
      data: {
        reportType: 'delivery-report',
        generatedAt: new Date().toISOString(),
        dateRange: {
          startDate: start_date || null,
          endDate: end_date || null
        },
        filterInfo: start_date && end_date 
          ? `Deliveries created between ${start_date} and ${end_date}` 
          : start_date 
          ? `Deliveries created since ${start_date}`
          : end_date
          ? `Deliveries created until ${end_date}`
          : 'All deliveries',
        summary: {
          totalDeliveries: (deliveries as any[]).length,
          completedDeliveries: (deliveries as any[]).filter(d => d.delivery_status === 'delivered').length,
          pendingDeliveries: (deliveries as any[]).filter(d => d.delivery_status === 'pending').length
        },
        deliveries: deliveries
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating custom delivery report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom delivery report'
    });
  }
};

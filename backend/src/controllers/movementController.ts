import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { 
  StockMovement,
  MovementWithDetails,
  CreateMovementRequest,
  MovementQueryParams,
  ApiResponse,
  PaginatedResponse 
} from '../types/index.js';
import { generatePagination } from '../utils/helpers.js';

/**
 * Get all movements with filtering and pagination
 */
export const getMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      asset_id,
      movement_type,
      user_id,
      start_date,
      end_date
    } = req.query as MovementQueryParams;

    const offset = (Number(page) - 1) * Number(limit);
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (asset_id) {
      conditions.push('sm.asset_id = ?');
      params.push(asset_id);
    }

    if (movement_type) {
      conditions.push('sm.movement_type = ?');
      params.push(movement_type);
    }

    if (user_id) {
      conditions.push('sm.user_id = ?');
      params.push(user_id);
    }

    if (start_date) {
      conditions.push('DATE(sm.movement_date) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      conditions.push('DATE(sm.movement_date) <= ?');
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM stock_movements sm 
      ${whereClause}
    `;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Get movements with details
    const query = `
      SELECT 
        sm.*,
        a.asset_name,
        a.barcode as asset_barcode,
        fz.zone_name as from_zone_name,
        tz.zone_name as to_zone_name,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM stock_movements sm
      LEFT JOIN assets a ON sm.asset_id = a.asset_id
      LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
      LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
      LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
      LEFT JOIN staff_users u ON sm.user_id = u.user_id
      ${whereClause}
      ORDER BY sm.movement_date DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(
      query, 
      [...params, Number(limit), offset]
    );

    const pagination = generatePagination(Number(page), Number(limit), total);

    const response: PaginatedResponse<MovementWithDetails> = {
      success: true,
      data: rows as MovementWithDetails[],
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movements'
    });
  }
};

/**
 * Create new movement
 */
export const createMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const movementData: CreateMovementRequest = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create movement record
      const movementQuery = `
        INSERT INTO stock_movements (
          asset_id, movement_type, from_zone_id, to_zone_id, 
          recipient_id, user_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [movementResult] = await connection.execute<ResultSetHeader>(
        movementQuery,
        [
          movementData.asset_id,
          movementData.movement_type,
          movementData.from_zone_id || null,
          movementData.to_zone_id || null,
          movementData.recipient_id || null,
          userId,
          movementData.notes || null
        ]
      );

      // Update asset status and zone based on movement type
      let newStatus: string;
      let newZoneId: number | null = null;

      switch (movementData.movement_type) {
        case 'reception':
          newStatus = 'available';
          newZoneId = movementData.to_zone_id || null;
          break;
        case 'storage':
          newStatus = 'available';
          newZoneId = movementData.to_zone_id || null;
          break;
        case 'preparation':
          newStatus = 'in_transit';
          newZoneId = movementData.to_zone_id || null;
          break;
        case 'handover_amana':
          newStatus = 'in_transit';
          break;
        case 'delivery':
          newStatus = 'delivered';
          break;
        case 'return':
          newStatus = 'available';
          newZoneId = movementData.to_zone_id || null;
          break;
        default:
          newStatus = 'available';
      }

      // Update asset
      const updateAssetQuery = `
        UPDATE assets 
        SET status = ?, current_zone_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE asset_id = ?
      `;

      await connection.execute(
        updateAssetQuery,
        [newStatus, newZoneId, movementData.asset_id]
      );

      await connection.commit();

      // Fetch the created movement with details
      const [newMovement] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          sm.*,
          a.asset_name,
          a.barcode as asset_barcode,
          fz.zone_name as from_zone_name,
          tz.zone_name as to_zone_name,
          CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM stock_movements sm
        LEFT JOIN assets a ON sm.asset_id = a.asset_id
        LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
        LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
        LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
        LEFT JOIN staff_users u ON sm.user_id = u.user_id
        WHERE sm.movement_id = ?`,
        [movementResult.insertId]
      );

      const response: ApiResponse<MovementWithDetails> = {
        success: true,
        data: newMovement[0] as MovementWithDetails,
        message: 'Movement created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating movement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create movement'
    });
  }
};

/**
 * Get movement by ID
 */
export const getMovementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        sm.*,
        a.asset_name,
        a.barcode as asset_barcode,
        fz.zone_name as from_zone_name,
        tz.zone_name as to_zone_name,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM stock_movements sm
      LEFT JOIN assets a ON sm.asset_id = a.asset_id
      LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
      LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
      LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
      LEFT JOIN staff_users u ON sm.user_id = u.user_id
      WHERE sm.movement_id = ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
      return;
    }

    const response: ApiResponse<MovementWithDetails> = {
      success: true,
      data: rows[0] as MovementWithDetails
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching movement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement'
    });
  }
};

/**
 * Get movements for specific asset
 */
export const getMovementsByAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId } = req.params;

    const query = `
      SELECT 
        sm.*,
        fz.zone_name as from_zone_name,
        tz.zone_name as to_zone_name,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM stock_movements sm
      LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
      LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
      LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
      LEFT JOIN staff_users u ON sm.user_id = u.user_id
      WHERE sm.asset_id = ?
      ORDER BY sm.movement_date DESC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [assetId]);

    const response: ApiResponse<MovementWithDetails[]> = {
      success: true,
      data: rows as MovementWithDetails[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching asset movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset movements'
    });
  }
};

/**
 * Get movement statistics
 */
export const getMovementStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 7 } = req.query;

    const query = `
      SELECT 
        movement_type,
        COUNT(*) as count,
        DATE(movement_date) as date
      FROM stock_movements 
      WHERE movement_date >= datetime('now', '-' || ? || ' days')
      GROUP BY movement_type, DATE(movement_date)
      ORDER BY date DESC, movement_type
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [days]);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching movement stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movement statistics'
    });
  }
};

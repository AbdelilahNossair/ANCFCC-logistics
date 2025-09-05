import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration for SQLite
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'ancfcc_warehouse.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create SQLite database connection
let db: Database.Database;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('✅ SQLite Database connected successfully');
} catch (error) {
  console.error('❌ SQLite Database connection failed:', error);
  throw error;
}

// Mock pool interface for compatibility
export const pool = {
  execute: async (query: string, params: any[] = []): Promise<any> => {
    try {
      // Convert MySQL-style queries to SQLite
      const sqliteQuery = query
        .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
        .replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/g, 'CURRENT_TIMESTAMP')
        .replace(/`/g, '')
        .replace(/VARCHAR\((\d+)\)/g, 'TEXT')
        .replace(/TEXT\s+NOT\s+NULL/g, 'TEXT NOT NULL')
        .replace(/\bINT\b/g, 'INTEGER')
        .replace(/BOOLEAN/g, 'INTEGER')
        .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL')
        .replace(/\bTIMESTAMP\b/g, 'DATETIME')
        .replace(/CURRENT_DATETIME/g, 'CURRENT_TIMESTAMP')
        .replace(/ON DELETE CASCADE/g, '')
        .replace(/ON DELETE SET NULL/g, '')
        .replace(/ON DELETE RESTRICT/g, '');

      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT') || 
          sqliteQuery.trim().toUpperCase().startsWith('SHOW') ||
          sqliteQuery.trim().toUpperCase().includes('COUNT(')) {
        const stmt = db.prepare(sqliteQuery);
        const result = params.length > 0 ? stmt.all(...params) : stmt.all();
        return [result];
      } else {
        const stmt = db.prepare(sqliteQuery);
        const result = params.length > 0 ? stmt.run(...params) : stmt.run();
        return [{ 
          insertId: result.lastInsertRowid,
          affectedRows: result.changes,
          changedRows: result.changes
        }];
      }
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', query);
      console.error('Params:', params);
      throw error;
    }
  },
  
  getConnection: async () => {
    const connection = {
      execute: pool.execute,
      release: () => {},
      beginTransaction: async () => db.exec('BEGIN TRANSACTION'),
      commit: async () => db.exec('COMMIT'),
      rollback: async () => db.exec('ROLLBACK')
    };
    return connection;
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    db.prepare('SELECT 1').get();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Execute database setup and create tables
export const setupDatabase = async (): Promise<void> => {
  try {
    console.log('🔧 Setting up database...');
    
    // Create tables
    await createTables();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

// Create all database tables
const createTables = async (): Promise<void> => {
  const tableQueries = [
    // Warehouses table
    `CREATE TABLE IF NOT EXISTS warehouses (
      warehouse_id INTEGER PRIMARY KEY,
      warehouse_code TEXT UNIQUE NOT NULL,
      warehouse_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Zones table
    `CREATE TABLE IF NOT EXISTS zones (
      zone_id INTEGER PRIMARY KEY,
      warehouse_id INTEGER NOT NULL,
      zone_code TEXT UNIQUE NOT NULL,
      zone_name TEXT NOT NULL,
      zone_type TEXT,
      capacity INTEGER,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
    )`,

    // Departments table
    `CREATE TABLE IF NOT EXISTS departments (
      department_id INTEGER PRIMARY KEY,
      department_code TEXT UNIQUE NOT NULL,
      department_name TEXT NOT NULL,
      responsible_person TEXT,
      phone TEXT,
      email TEXT
    )`,

    // Recipients table
    `CREATE TABLE IF NOT EXISTS recipients (
      recipient_id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      cin TEXT UNIQUE,
      department_id INTEGER,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(department_id)
    )`,

    // Staff users table
    `CREATE TABLE IF NOT EXISTS staff_users (
      user_id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Asset categories table
    `CREATE TABLE IF NOT EXISTS asset_categories (
      category_id INTEGER PRIMARY KEY,
      category_code TEXT UNIQUE NOT NULL,
      category_name TEXT NOT NULL,
      category_type TEXT NOT NULL
    )`,

    // Assets table
    `CREATE TABLE IF NOT EXISTS assets (
      asset_id INTEGER PRIMARY KEY,
      barcode TEXT UNIQUE NOT NULL,
      category_id INTEGER NOT NULL,
      asset_name TEXT NOT NULL,
      description TEXT,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      marche_info TEXT,
      condition_state TEXT NOT NULL,
      acquisition_date DATE,
      acquisition_value REAL,
      current_zone_id INTEGER,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES asset_categories(category_id),
      FOREIGN KEY (current_zone_id) REFERENCES zones(zone_id)
    )`,

    // Stock movements table
    `CREATE TABLE IF NOT EXISTS stock_movements (
      movement_id INTEGER PRIMARY KEY,
      asset_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL,
      from_zone_id INTEGER,
      to_zone_id INTEGER,
      recipient_id INTEGER,
      user_id INTEGER NOT NULL,
      movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
      FOREIGN KEY (from_zone_id) REFERENCES zones(zone_id),
      FOREIGN KEY (to_zone_id) REFERENCES zones(zone_id),
      FOREIGN KEY (recipient_id) REFERENCES recipients(recipient_id),
      FOREIGN KEY (user_id) REFERENCES staff_users(user_id)
    )`,

    // Amana deliveries table
    `CREATE TABLE IF NOT EXISTS amana_deliveries (
      delivery_id INTEGER PRIMARY KEY,
      delivery_reference TEXT UNIQUE NOT NULL,
      asset_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      handover_date DATETIME NOT NULL,
      handover_user_id INTEGER NOT NULL,
      amana_agent_name TEXT,
      amana_agent_phone TEXT,
      delivery_status TEXT DEFAULT 'pending',
      delivery_date DATETIME,
      delivery_proof TEXT,
      feedback_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
      FOREIGN KEY (recipient_id) REFERENCES recipients(recipient_id),
      FOREIGN KEY (handover_user_id) REFERENCES staff_users(user_id)
    )`
  ];

  for (const query of tableQueries) {
    await pool.execute(query);
  }

  console.log('✅ All tables created successfully');
};

export default pool;

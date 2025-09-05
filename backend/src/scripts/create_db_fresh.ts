import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');

// Remove the old database file
try {
  const fs = await import('fs');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️ Removed old database file');
  }
} catch (error) {
  console.log('ℹ️ No existing database file to remove');
}

const db = new Database(dbPath);

console.log('🚀 Creating fresh database with correct schema...');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables with correct schema
  console.log('📋 Creating tables...');
  
  // Warehouses table
  db.exec(`
    CREATE TABLE warehouses (
      warehouse_id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_code TEXT UNIQUE NOT NULL,
      warehouse_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Zones table
  db.exec(`
    CREATE TABLE zones (
      zone_id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_id INTEGER NOT NULL,
      zone_code TEXT UNIQUE NOT NULL,
      zone_name TEXT NOT NULL,
      zone_type TEXT,
      capacity INTEGER,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
    )
  `);

  // Departments table
  db.exec(`
    CREATE TABLE departments (
      department_id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_code TEXT UNIQUE NOT NULL,
      department_name TEXT NOT NULL,
      responsible_person TEXT,
      phone TEXT,
      email TEXT
    )
  `);

  // Recipients table
  db.exec(`
    CREATE TABLE recipients (
      recipient_id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      cin TEXT UNIQUE,
      department_id INTEGER,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(department_id)
    )
  `);

  // Staff users table
  db.exec(`
    CREATE TABLE staff_users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Asset categories table
  db.exec(`
    CREATE TABLE asset_categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_code TEXT UNIQUE NOT NULL,
      category_name TEXT NOT NULL,
      category_type TEXT NOT NULL
    )
  `);

  // Assets table
  db.exec(`
    CREATE TABLE assets (
      asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    )
  `);

  // Stock movements table
  db.exec(`
    CREATE TABLE stock_movements (
      movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    )
  `);

  // Amana deliveries table
  db.exec(`
    CREATE TABLE amana_deliveries (
      delivery_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    )
  `);

  console.log('✅ All tables created successfully with proper schema');
  
  // Test that auto-increment works
  const testWarehouse = db.prepare('INSERT INTO warehouses (warehouse_code, warehouse_name, address, city) VALUES (?, ?, ?, ?)');
  const result = testWarehouse.run('TEST-01', 'Test Warehouse', 'Test Address', 'Test City');
  console.log('✅ Auto-increment test successful, generated ID:', result.lastInsertRowid);
  
  // Clean up test data
  db.exec('DELETE FROM warehouses WHERE warehouse_code = \'TEST-01\'');
  console.log('✅ Test data cleaned up');

} catch (error) {
  console.error('❌ Error creating database schema:', error);
} finally {
  db.close();
  console.log('✅ Database setup completed');
}

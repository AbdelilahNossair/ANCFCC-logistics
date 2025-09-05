import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');

const db = new Database(dbPath);

console.log('🔄 Adding report_history table...');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create report_history table to track generated reports
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_history (
      report_id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL,
      report_name TEXT NOT NULL,
      period TEXT,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      generated_by_user_id INTEGER,
      record_count INTEGER DEFAULT 0,
      file_size_kb INTEGER DEFAULT 0,
      parameters TEXT,
      FOREIGN KEY (generated_by_user_id) REFERENCES staff_users(user_id)
    )
  `);
  
  console.log('✅ report_history table created successfully');
  
  // Create index for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_report_history_generated_at 
    ON report_history(generated_at DESC)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_report_history_type 
    ON report_history(report_type)
  `);
  
  console.log('✅ Indexes created successfully');
  
} catch (error) {
  console.error('❌ Error creating report_history table:', error);
  throw error;
} finally {
  db.close();
}

console.log('🎉 Report history table setup completed!');

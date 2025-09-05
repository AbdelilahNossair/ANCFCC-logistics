import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');

console.log('🗄️ Populating archived assets...');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

try {
  // Helper function to format date for SQLite
  const formatDate = (date: Date): string => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Calculate dates for different archive dates
  const today = new Date('2025-07-22');
  const weekAgo = new Date('2025-07-15');
  const monthAgo = new Date('2025-06-22');
  const quarterAgo = new Date('2025-04-22');
  const halfYearAgo = new Date('2025-01-22');

  console.log('📦 Creating archived assets...');

  // First, let's check how many assets we have available
  const availableAssetsResult = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status != 'archived'").get() as { count: number };
  console.log(`Found ${availableAssetsResult.count} available assets`);

  if (availableAssetsResult.count === 0) {
    console.log('⚠️ No available assets found to archive. Please populate the database with assets first.');
    process.exit(1);
  }

  // Archive some specific assets with different archive dates and reasons
  const assetsToArchive = [
    {
      barcode: '403762090020', // Last asset in our range
      archiveReason: 'End of life - replaced with newer model',
      archiveDate: formatDate(weekAgo),
      archivedBy: 'System Administrator'
    },
    {
      barcode: '403762090016', // Bureau Standard
      archiveReason: 'Damaged beyond repair',
      archiveDate: formatDate(monthAgo),
      archivedBy: 'Maintenance Team'
    },
    {
      barcode: '403762090015', // Papeterie Complete
      archiveReason: 'Obsolete - no longer needed',
      archiveDate: formatDate(quarterAgo),
      archivedBy: 'Department Manager'
    }
  ];

  let archivedCount = 0;

  for (const asset of assetsToArchive) {
    // Check if the asset exists and is not already archived
    const existingAsset = db.prepare('SELECT asset_id, status FROM assets WHERE barcode = ?').get(asset.barcode) as { asset_id: number; status: string } | undefined;
    
    if (existingAsset && existingAsset.status !== 'archived') {
      // Archive the asset
      db.prepare(`
        UPDATE assets 
        SET status = 'archived',
            updated_at = ?
        WHERE barcode = ?
      `).run(asset.archiveDate, asset.barcode);
      
      console.log(`✅ Archived asset ${asset.barcode} - ${asset.archiveReason}`);
      archivedCount++;
    } else if (existingAsset && existingAsset.status === 'archived') {
      console.log(`ℹ️ Asset ${asset.barcode} is already archived`);
    } else {
      console.log(`⚠️ Asset ${asset.barcode} not found`);
    }
  }

  // Archive a few more random assets if we need more archived items
  const additionalArchiveTargets = [
    '403762090013', // Lot Fournitures Bureau
    '403762090014', // Classeurs Archivage
    '403762090010', // Scanner Canon
  ];

  const additionalReasons = [
    'Equipment upgrade - replaced',
    'Maintenance too costly',
    'Department restructuring'
  ];

  for (let i = 0; i < additionalArchiveTargets.length; i++) {
    const barcode = additionalArchiveTargets[i];
    const existingAsset = db.prepare('SELECT asset_id, status FROM assets WHERE barcode = ?').get(barcode) as { asset_id: number; status: string } | undefined;
    
    if (existingAsset && existingAsset.status !== 'archived') {
      // Use different archive dates
      const archiveDates = [halfYearAgo, quarterAgo, monthAgo];
      const archiveDate = formatDate(archiveDates[i % archiveDates.length]);
      
      db.prepare(`
        UPDATE assets 
        SET status = 'archived',
            updated_at = ?
        WHERE barcode = ?
      `).run(archiveDate, barcode);
      
      console.log(`✅ Archived asset ${barcode} - ${additionalReasons[i]}`);
      archivedCount++;
    }
  }

  console.log(`\n📊 Archive Summary:`);
  console.log(`✅ Successfully archived ${archivedCount} assets`);

  // Show current archive statistics
  const archiveStats = db.prepare(`
    SELECT 
      COUNT(*) as total_archived,
      COUNT(CASE WHEN DATE(updated_at) >= DATE('now', '-7 days') THEN 1 END) as archived_this_week,
      COUNT(CASE WHEN DATE(updated_at) >= DATE('now', '-30 days') THEN 1 END) as archived_this_month
    FROM assets 
    WHERE status = 'archived'
  `).get() as {
    total_archived: number;
    archived_this_week: number;
    archived_this_month: number;
  };

  console.log(`\n📈 Current Archive Statistics:`);
  console.log(`- Total archived assets: ${archiveStats.total_archived}`);
  console.log(`- Archived this week: ${archiveStats.archived_this_week}`);
  console.log(`- Archived this month: ${archiveStats.archived_this_month}`);

  // Show some example archived assets
  const archivedAssets = db.prepare(`
    SELECT 
      a.barcode,
      a.asset_name,
      a.status,
      a.updated_at,
      ac.category_name
    FROM assets a
    LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
    WHERE a.status = 'archived'
    ORDER BY a.updated_at DESC
    LIMIT 5
  `).all();

  console.log(`\n📋 Recently Archived Assets:`);
  archivedAssets.forEach((asset: any) => {
    console.log(`- ${asset.barcode}: ${asset.asset_name} (${asset.category_name}) - ${asset.updated_at}`);
  });

  console.log('\n✅ Archive population completed successfully!');
  console.log('🧪 You can now test the Archive page to see the archived assets.');

} catch (error) {
  console.error('❌ Error populating archives:', error);
} finally {
  db.close();
}

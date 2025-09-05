import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');

console.log('📊 Adding recent data to test time period filtering...');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

try {
  // Calculate dates for different periods from current date (July 22, 2025)
  const today = new Date('2025-07-22');
  const yesterday = new Date('2025-07-21');
  const weekAgo = new Date('2025-07-15'); // 7 days ago
  const twoWeeksAgo = new Date('2025-07-08'); // 14 days ago
  const monthAgo = new Date('2025-06-22'); // 30 days ago
  const twoMonthsAgo = new Date('2025-05-22'); // 60 days ago
  const quarterAgo = new Date('2025-04-22'); // 90 days ago
  const halfYearAgo = new Date('2025-01-22'); // 180 days ago

  // Helper function to format date for SQLite
  const formatDate = (date: Date): string => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  console.log('📝 Adding recent assets with creation dates...');
  
  // Add some recent assets with different creation dates
  const recentAssets = [
    { barcode: '403762090021', name: 'Monitor Dell 27"', categoryId: 2, date: formatDate(today), value: 450 },
    { barcode: '403762090022', name: 'Keyboard Logitech', categoryId: 8, date: formatDate(yesterday), value: 80 },
    { barcode: '403762090023', name: 'Mouse Wireless', categoryId: 8, date: formatDate(weekAgo), value: 45 },
    { barcode: '403762090024', name: 'Webcam HD', categoryId: 2, date: formatDate(twoWeeksAgo), value: 120 },
    { barcode: '403762090025', name: 'Headset Plantronics', categoryId: 2, date: formatDate(monthAgo), value: 200 },
    { barcode: '403762090026', name: 'Tablet Surface', categoryId: 2, date: formatDate(twoMonthsAgo), value: 800 },
    { barcode: '403762090027', name: 'Printer Canon', categoryId: 4, date: formatDate(quarterAgo), value: 350 },
    { barcode: '403762090028', name: 'Scanner Epson', categoryId: 5, date: formatDate(halfYearAgo), value: 280 }
  ];

  let addedAssets = 0;
  for (const asset of recentAssets) {
    // Check if asset already exists
    const existing = db.prepare('SELECT asset_id FROM assets WHERE barcode = ?').get(asset.barcode);
    if (!existing) {
      db.prepare(`
        INSERT INTO assets (
          barcode, category_id, asset_name, description, brand, model, 
          condition_state, acquisition_date, acquisition_value, current_zone_id, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        asset.barcode,
        asset.categoryId,
        asset.name,
        `${asset.name} for office use`,
        asset.name.split(' ')[0],
        asset.name.split(' ').slice(1).join(' '),
        'new',
        asset.date.split(' ')[0], // acquisition_date as DATE
        asset.value,
        1, // Zone 1
        'available',
        asset.date,
        asset.date
      );
      addedAssets++;
    }
  }

  console.log(`✅ Added ${addedAssets} new recent assets (${recentAssets.length - addedAssets} already existed)`);

  console.log('🔄 Adding stock movements for different time periods...');
  
  // Get the asset IDs of the newly created assets
  const getAssetId = (barcode: string): number | undefined => {
    const result = db.prepare('SELECT asset_id FROM assets WHERE barcode = ?').get(barcode) as { asset_id: number } | undefined;
    return result?.asset_id;
  };

  // Add movements for different time periods
  const recentMovements = [
    // This week movements
    { assetId: getAssetId('403762090021'), type: 'reception', date: formatDate(today), fromZone: null, toZone: 1 },
    { assetId: getAssetId('403762090022'), type: 'storage', date: formatDate(yesterday), fromZone: 1, toZone: 2 },
    { assetId: getAssetId('403762090023'), type: 'preparation', date: formatDate(weekAgo), fromZone: 2, toZone: 3 },
    
    // This month movements (but not this week)
    { assetId: getAssetId('403762090024'), type: 'handover_amana', date: formatDate(twoWeeksAgo), fromZone: 3, toZone: null },
    { assetId: getAssetId('403762090025'), type: 'reception', date: formatDate(monthAgo), fromZone: null, toZone: 1 },
    
    // This quarter movements (but not this month)
    { assetId: getAssetId('403762090026'), type: 'storage', date: formatDate(twoMonthsAgo), fromZone: 1, toZone: 2 },
    { assetId: getAssetId('403762090027'), type: 'preparation', date: formatDate(quarterAgo), fromZone: 2, toZone: 3 },
    
    // This year movements (but not this quarter)
    { assetId: getAssetId('403762090028'), type: 'reception', date: formatDate(halfYearAgo), fromZone: null, toZone: 1 },
    
    // Add some movements for existing assets too
    { assetId: 1, type: 'storage', date: formatDate(today), fromZone: 1, toZone: 2 },
    { assetId: 2, type: 'preparation', date: formatDate(yesterday), fromZone: 2, toZone: 3 },
    { assetId: 3, type: 'handover_amana', date: formatDate(weekAgo), fromZone: 3, toZone: null },
    { assetId: 4, type: 'storage', date: formatDate(twoWeeksAgo), fromZone: 1, toZone: 2 },
    { assetId: 5, type: 'preparation', date: formatDate(monthAgo), fromZone: 2, toZone: 3 },
    { assetId: 6, type: 'storage', date: formatDate(twoMonthsAgo), fromZone: 1, toZone: 2 },
    { assetId: 7, type: 'preparation', date: formatDate(quarterAgo), fromZone: 2, toZone: 3 }
  ];

  for (const movement of recentMovements) {
    if (movement.assetId) {
      db.prepare(`
        INSERT INTO stock_movements (
          asset_id, movement_type, from_zone_id, to_zone_id, 
          user_id, movement_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        movement.assetId,
        movement.type,
        movement.fromZone,
        movement.toZone,
        1, // User ID 1
        movement.date,
        `${movement.type} movement for testing time periods`
      );
    }
  }

  console.log(`✅ Added ${recentMovements.length} recent movements`);

  console.log('📦 Adding recent deliveries...');
  
  // Add some recent deliveries
  const recentDeliveries = [
    { assetId: getAssetId('403762090021'), recipientId: 1, status: 'pending', handoverDate: formatDate(today), createdAt: formatDate(today) },
    { assetId: getAssetId('403762090022'), recipientId: 2, status: 'in_transit', handoverDate: formatDate(yesterday), createdAt: formatDate(yesterday) },
    { assetId: getAssetId('403762090023'), recipientId: 3, status: 'delivered', handoverDate: formatDate(weekAgo), deliveryDate: formatDate(new Date('2025-07-16')), createdAt: formatDate(weekAgo) },
    { assetId: getAssetId('403762090024'), recipientId: 1, status: 'delivered', handoverDate: formatDate(twoWeeksAgo), deliveryDate: formatDate(new Date('2025-07-10')), createdAt: formatDate(twoWeeksAgo) },
    { assetId: getAssetId('403762090025'), recipientId: 2, status: 'pending', handoverDate: formatDate(monthAgo), createdAt: formatDate(monthAgo) }
  ];

  for (const delivery of recentDeliveries) {
    if (delivery.assetId) {
      const deliveryReference = `DEL${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      db.prepare(`
        INSERT INTO amana_deliveries (
          delivery_reference, asset_id, recipient_id, delivery_status,
          handover_date, delivery_date, handover_user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        deliveryReference,
        delivery.assetId,
        delivery.recipientId,
        delivery.status,
        delivery.handoverDate,
        delivery.deliveryDate || null,
        1, // handover_user_id
        delivery.createdAt
      );
    }
  }

  console.log(`✅ Added ${recentDeliveries.length} recent deliveries`);

  console.log('📊 Summary of data distribution:');
  console.log('- Today (July 22, 2025): 1 asset, 2 movements, 1 delivery');
  console.log('- This Week (last 7 days): 3 assets, 5 movements, 3 deliveries');
  console.log('- This Month (last 30 days): 5 assets, 7 movements, 5 deliveries');
  console.log('- This Quarter (last 90 days): 7 assets, 9 movements, 5 deliveries');
  console.log('- This Year (last 365 days): 8 assets, 10 movements, 5 deliveries');

  console.log('✅ Recent data added successfully!');
  console.log('🧪 You can now test the different time period filters in the Reports section.');

} catch (error) {
  console.error('❌ Error adding recent data:', error);
} finally {
  db.close();
}

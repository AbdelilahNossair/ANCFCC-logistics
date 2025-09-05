import { setupDatabase } from '../config/database.js';

const main = async () => {
  try {
    console.log('🚀 Setting up database schema...');
    await setupDatabase();
    console.log('✅ Database schema setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

main();

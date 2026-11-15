import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.ts';
import { seedDatabase } from './seedData.ts';

async function run() {
  try {
    await connectDB();
    await seedDatabase(true);
    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();

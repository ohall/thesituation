import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL;

// Create postgres.js client - will be undefined during build time
const client = connectionString 
  ? postgres(connectionString, { prepare: false }) 
  : null;

// Create drizzle instance
export const db = client ? drizzle(client, { schema }) : null;

// Helper to ensure db is available
export function getDb() {
  if (!db) {
    throw new Error('Database not configured. Set DATABASE_URL environment variable.');
  }
  return db;
}


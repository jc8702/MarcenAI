// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Para o Neon, geralmente usamos o driver postgres.js que o Drizzle suporta bem
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

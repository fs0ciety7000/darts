import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Fallback placeholder allows the build to complete without DATABASE_URL.
// Pages with `force-dynamic` never execute queries at build time — only at runtime.
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://build:placeholder@localhost/db');
export const db = drizzle(sql, { schema });

export * from './schema';

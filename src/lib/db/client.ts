import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '@/lib/logger';

function validateConnectionString(raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    const msg = 'DATABASE_URL is not set or empty';
    logger.error(msg);
    throw new Error(msg);
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    logger.error('DATABASE_URL is not a valid URL', {
      // Log only the scheme + host so credentials stay out of logs
      hint: raw.slice(0, raw.indexOf('://') + 3) + '***',
    });
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    const msg = `DATABASE_URL has unsupported protocol: ${parsed.protocol}`;
    logger.error(msg);
    throw new Error(msg);
  }

  if (!parsed.hostname) {
    const msg = 'DATABASE_URL is missing a hostname';
    logger.error(msg);
    throw new Error(msg);
  }

  return raw;
}

const connectionString = validateConnectionString(process.env.DATABASE_URL);

// Reuse connection across warm invocations (works in both dev and serverless warm starts)
const globalForDb = globalThis as unknown as { pgClient: ReturnType<typeof postgres> | undefined };

const client = globalForDb.pgClient ?? postgres(connectionString, {
  prepare: false,
  // Serverless: max:1 (connections are not shared across invocations)
  // Development: max:10 for concurrent dev requests
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 5,
});

// Cache on globalThis — persists across warm invocations in all environments
globalForDb.pgClient = client;

export const db = drizzle(client, { schema });

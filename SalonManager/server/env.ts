import fs from 'fs';
import path from 'path';

function loadEnv(file: string) {
  try {
    const data = fs.readFileSync(file, 'utf-8');
    for (const line of data.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // ignore missing file
  }
}

loadEnv(path.resolve(process.cwd(), '.env'));
loadEnv(path.resolve(process.cwd(), `.env.${process.env.NODE_ENV ?? 'development'}`));

function bool(v: string | undefined) {
  return v === 'true' || v === '1';
}

const PORT = parseInt(process.env.PORT || '5000', 10);
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL || '';
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@salonmanager.app';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT,10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ENABLE_DEV_SEED = bool(process.env.ENABLE_DEV_SEED);

if (!DATABASE_URL) {
  console.warn('[env] DATABASE_URL is not set');
}

export const env = {
  PORT,
  APP_PUBLIC_URL,
  ALLOWED_ORIGINS,
  DATABASE_URL,
  MAIL_FROM,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  ENABLE_DEV_SEED,
};

import fs from 'fs';
import path from 'path';
import { Student, AbsenceRecord, SystemNotification } from '@/types';
import { INITIAL_STUDENTS, INITIAL_RECORDS } from '@/lib/storage';

export interface ServerDatabase {
  students: Student[];
  records: AbsenceRecord[];
  notifications: SystemNotification[];
  teacherPin: string;
  lastUpdated: number;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// In-memory cache for fast access and fallback in serverless
let memoryCache: ServerDatabase | null = null;

// Dynamic loader for Netlify Blobs to prevent build-time crashes if not on Netlify
async function getNetlifyBlobStore() {
  try {
    if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
      const { getStore } = await import('@netlify/blobs');
      return getStore('student-absence-db');
    }
  } catch {
    // Not running on Netlify or blobs not available
  }
  return null;
}

export async function readServerDb(): Promise<ServerDatabase> {
  // 1. Check Netlify Blobs if in Netlify environment
  const blobStore = await getNetlifyBlobStore();
  if (blobStore) {
    try {
      const data = (await blobStore.get('db', { type: 'json' })) as ServerDatabase | null;
      if (data && Array.isArray(data.students)) {
        memoryCache = data;
        return data;
      }
    } catch (e) {
      console.warn('Netlify blobs read error, falling back:', e);
    }
  }

  // 2. Try reading from local file system (Node environment / dev server)
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const db: ServerDatabase = {
        students: Array.isArray(parsed.students) ? parsed.students : INITIAL_STUDENTS,
        records: Array.isArray(parsed.records) ? parsed.records : INITIAL_RECORDS,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        teacherPin: parsed.teacherPin || '1234',
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
      memoryCache = db;
      return db;
    }
  } catch (e) {
    console.warn('Local fs read error:', e);
  }

  // 3. Fallback to memoryCache or initial state
  if (!memoryCache) {
    memoryCache = {
      students: INITIAL_STUDENTS,
      records: INITIAL_RECORDS,
      notifications: [],
      teacherPin: '1234',
      lastUpdated: Date.now(),
    };
  }
  return memoryCache;
}

export async function writeServerDb(updates: Partial<ServerDatabase>): Promise<ServerDatabase> {
  const current = await readServerDb();
  const updated: ServerDatabase = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };

  memoryCache = updated;

  // 1. Try Netlify Blobs
  const blobStore = await getNetlifyBlobStore();
  if (blobStore) {
    try {
      await blobStore.setJSON('db', updated);
      return updated;
    } catch (e) {
      console.warn('Netlify blobs write error:', e);
    }
  }

  // 2. Try writing to local file system
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    // If running in a read-only serverless filesystem without blobs, memoryCache keeps state
    console.warn('Local fs write skipped or failed (safe in serverless):', e);
  }

  return updated;
}

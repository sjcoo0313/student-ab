import fs from 'fs';
import path from 'path';
import os from 'os';
import { Student, AbsenceRecord, SystemNotification, ReminderSettings } from '@/types';
import { INITIAL_STUDENTS, INITIAL_RECORDS } from '@/lib/storage';

export interface ServerDatabase {
  students: Student[];
  records: AbsenceRecord[];
  notifications: SystemNotification[];
  teacherPin: string;
  reminderSettings?: ReminderSettings;
  lastUpdated: number;
}

export type StorageBackendType = 'upstash_redis' | 'vercel_kv' | 'netlify_blobs' | 'local_fs' | 'tmp_fs' | 'memory';

export interface StorageInfo {
  type: StorageBackendType;
  isCloud: boolean;
  name: string;
}

// Global in-memory cache to retain state across warm invocations in serverless containers
declare global {
  // eslint-disable-next-line no-var
  var _studentServerDbCache: ServerDatabase | undefined;
}

const LOCAL_DB_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'db.json');

// Serverless writable /tmp directory
const TMP_DB_DIR = path.join(os.tmpdir(), 'student_absence');
const TMP_DB_FILE = path.join(TMP_DB_DIR, 'db.json');

// Upstash Redis / Vercel KV REST Client
function getUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

async function readFromUpstash(): Promise<ServerDatabase | null> {
  const creds = getUpstashCredentials();
  if (!creds) return null;

  try {
    const res = await fetch(`${creds.url}/get/student_absence_db`, {
      headers: {
        Authorization: `Bearer ${creds.token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || json.result === null || json.result === undefined) {
      return null;
    }
    const parsed: ServerDatabase = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
    if (parsed && Array.isArray(parsed.students)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('[Upstash] Read error:', err);
    return null;
  }
}

async function writeToUpstash(db: ServerDatabase): Promise<boolean> {
  const creds = getUpstashCredentials();
  if (!creds) return false;

  try {
    const serialized = JSON.stringify(db);
    const res = await fetch(`${creds.url}/set/student_absence_db`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([serialized]),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn('[Upstash] Set response not ok:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Upstash] Write error:', err);
    return false;
  }
}

// Netlify Blobs support
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

export function getStorageInfo(): StorageInfo {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return { type: 'upstash_redis', isCloud: true, name: 'Upstash Redis (클라우드 실시간 동기화)' };
  }
  if (process.env.KV_REST_API_URL) {
    return { type: 'vercel_kv', isCloud: true, name: 'Vercel KV (클라우드 실시간 동기화)' };
  }
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
    return { type: 'netlify_blobs', isCloud: true, name: 'Netlify Blobs (클라우드 동기화)' };
  }
  if (process.env.NODE_ENV !== 'production') {
    return { type: 'local_fs', isCloud: false, name: '로컬 파일 시스템 (개발 모드)' };
  }
  return { type: 'tmp_fs', isCloud: false, name: '서버리스 임시 스토리지 (클라우드 DB 권장)' };
}

export async function readServerDb(): Promise<ServerDatabase> {
  // 1. Try Upstash Redis / Vercel KV (Highest priority cloud persistence)
  const upstashData = await readFromUpstash();
  if (upstashData) {
    globalThis._studentServerDbCache = upstashData;
    return upstashData;
  }

  // 2. Try Netlify Blobs (if on Netlify)
  const blobStore = await getNetlifyBlobStore();
  if (blobStore) {
    try {
      const data = (await blobStore.get('db', { type: 'json' })) as ServerDatabase | null;
      if (data && Array.isArray(data.students)) {
        globalThis._studentServerDbCache = data;
        return data;
      }
    } catch (e) {
      console.warn('Netlify blobs read error, falling back:', e);
    }
  }

  // 3. Try reading from writable serverless /tmp
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.students)) {
        globalThis._studentServerDbCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // 4. Try reading from local file system (Node environment / dev server)
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const db: ServerDatabase = {
        students: Array.isArray(parsed.students) ? parsed.students : INITIAL_STUDENTS,
        records: Array.isArray(parsed.records) ? parsed.records : INITIAL_RECORDS,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        teacherPin: parsed.teacherPin || '1234',
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
      globalThis._studentServerDbCache = db;
      return db;
    }
  } catch (e) {
    console.warn('Local fs read error:', e);
  }

  // 5. Fallback to global cache or initial state
  if (!globalThis._studentServerDbCache) {
    globalThis._studentServerDbCache = {
      students: INITIAL_STUDENTS,
      records: INITIAL_RECORDS,
      notifications: [],
      teacherPin: '1234',
      lastUpdated: Date.now(),
    };
  }
  return globalThis._studentServerDbCache;
}

export async function writeServerDb(updates: Partial<ServerDatabase>): Promise<ServerDatabase> {
  const current = await readServerDb();
  const updated: ServerDatabase = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
  };

  globalThis._studentServerDbCache = updated;

  // 1. Try Upstash Redis / Vercel KV
  const upstashOk = await writeToUpstash(updated);
  if (upstashOk) {
    return updated;
  }

  // 2. Try Netlify Blobs
  const blobStore = await getNetlifyBlobStore();
  if (blobStore) {
    try {
      await blobStore.setJSON('db', updated);
      return updated;
    } catch (e) {
      console.warn('Netlify blobs write error:', e);
    }
  }

  // 3. Write to /tmp (Safe in AWS Lambda / Vercel serverless)
  try {
    if (!fs.existsSync(TMP_DB_DIR)) {
      fs.mkdirSync(TMP_DB_DIR, { recursive: true });
    }
    const tempTmpFile = `${TMP_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempTmpFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempTmpFile, TMP_DB_FILE);
  } catch (e) {
    // ignore
  }

  // 4. Try writing to local project directory
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    const tempFile = `${LOCAL_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, LOCAL_DB_FILE);
  } catch (e) {
    // In read-only serverless filesystem, /tmp and in-memory cache maintain state
  }

  return updated;
}

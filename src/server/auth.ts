import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db, DbUserRow, seedDemoWorkspaceIfEmpty } from './db';
import { UserProfile } from '../types/screening';

// Use env JWT_SECRET when set, otherwise an ephemeral cryptographically secure in-memory key
const JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16
  ? process.env.JWT_SECRET.trim()
  : crypto.randomBytes(32).toString('hex');

const JWT_EXPIRES_IN = '12h';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

export function signAuthToken(user: UserProfile): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function toUserProfile(row: DbUserRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    organization: row.organization,
    role: row.role,
  };
}

export function findUserByEmail(email: string): DbUserRow | undefined {
  return db
    .prepare(`SELECT * FROM users WHERE lower(email) = lower(?)`)
    .get(email.trim()) as DbUserRow | undefined;
}

export function findUserById(id: string): DbUserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as DbUserRow | undefined;
}

export function createUserAccount(input: {
  name: string;
  email: string;
  organization: string;
  password: string;
}): UserProfile {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = hashPassword(input.password);

  db.prepare(
    `INSERT INTO users (id, name, email, organization, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, 'recruiter', ?)`
  ).run(id, input.name.trim(), input.email.trim().toLowerCase(), input.organization.trim(), passwordHash, now);

  seedDemoWorkspaceIfEmpty(id);

  return {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    organization: input.organization.trim(),
    role: 'recruiter',
  };
}

const DEMO_EMAIL = 'recruiter@talentlens.ai';

export function getOrCreateDemoRecruiter(): UserProfile {
  const existing = findUserByEmail(DEMO_EMAIL);
  if (existing) {
    seedDemoWorkspaceIfEmpty(existing.id);
    return toUserProfile(existing);
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  // Demo user is accessed strictly via /api/auth/demo (never logs in via hardcoded password)
  const unusableHash = hashPassword(crypto.randomBytes(32).toString('hex'));

  db.prepare(
    `INSERT INTO users (id, name, email, organization, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, 'recruiter', ?)`
  ).run(id, 'Claire Bennett', DEMO_EMAIL, 'TalentLens Talent Ops', unusableHash, now);

  seedDemoWorkspaceIfEmpty(id);

  return {
    id,
    name: 'Claire Bennett',
    email: DEMO_EMAIL,
    organization: 'TalentLens Talent Ops',
    role: 'recruiter',
  };
}

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    if (!payload.sub) {
      res.status(401).json({ error: 'Invalid authentication token.' });
      return;
    }
    const userRow = findUserById(payload.sub);
    if (!userRow) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }
    req.user = toUserProfile(userRow);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
  }
}

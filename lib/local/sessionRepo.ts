import { getDB } from './db'
import type { LocalSession } from './types'
import { generateUUID, nowISO } from './utils'

/**
 * Get the active (non-closed) session for today, or null if none exists.
 */
export async function getTodaySession(userId: string): Promise<LocalSession | undefined> {
  const db = getDB()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const allSessions = await db.sessions
    .where('userId')
    .equals(userId)
    .toArray()

  return allSessions.find((s) => {
    const d = new Date(s.date)
    return d >= todayStart && d <= todayEnd
  })
}

/**
 * Open a new session for today.
 * Returns the existing session if one already exists for today.
 */
export async function openSession(userId: string): Promise<LocalSession> {
  const existing = await getTodaySession(userId)
  if (existing) return existing

  const now = nowISO()
  const session: LocalSession = {
    uuid: generateUUID(),
    userId,
    date: now,
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  await getDB().sessions.add(session)
  return session
}

/**
 * Close a session by setting its closedAt timestamp.
 */
export async function closeSession(uuid: string): Promise<void> {
  await getDB().sessions.update(uuid, {
    closedAt: nowISO(),
    syncStatus: 'pending',
    updatedAt: nowISO(),
  })
}

/**
 * Get all sessions for a user, ordered newest first.
 */
export async function getAllSessions(userId: string): Promise<LocalSession[]> {
  const db = getDB()
  const sessions = await db.sessions
    .where('userId')
    .equals(userId)
    .toArray()
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get a single session by its local uuid.
 */
export async function getSessionByUuid(uuid: string): Promise<LocalSession | undefined> {
  return getDB().sessions.get(uuid)
}

/**
 * Called by sync engine after a session has been successfully synced.
 */
export async function markSessionSynced(uuid: string, serverId: string): Promise<void> {
  await getDB().sessions.update(uuid, {
    serverId,
    syncStatus: 'synced',
    updatedAt: nowISO(),
  })
}

/**
 * Called by sync engine when a session sync has failed.
 */
export async function markSessionFailed(uuid: string, error: string): Promise<void> {
  const session = await getDB().sessions.get(uuid)
  await getDB().sessions.update(uuid, {
    syncStatus: 'failed',
    syncError: error,
    retryCount: (session?.retryCount ?? 0) + 1,
    updatedAt: nowISO(),
  })
}

/**
 * Upsert a session from a server response (used during pull-down refresh).
 * Matches by serverId; if not found locally, inserts with synced status.
 */
export async function upsertSessionFromServer(serverSession: {
  id: string
  date: string
  userId: string
  closedAt?: string | null
}): Promise<void> {
  const db = getDB()
  const existing = await db.sessions.where('serverId').equals(serverSession.id).first()
  const now = nowISO()

  if (existing) {
    await db.sessions.update(existing.uuid, {
      serverId: serverSession.id,
      date: serverSession.date,
      closedAt: serverSession.closedAt ?? undefined,
      syncStatus: 'synced',
      updatedAt: now,
    })
  } else {
    await db.sessions.add({
      uuid: generateUUID(),
      serverId: serverSession.id,
      userId: serverSession.userId,
      date: serverSession.date,
      closedAt: serverSession.closedAt ?? undefined,
      syncStatus: 'synced',
      retryCount: 0,
      createdAt: serverSession.date,
      updatedAt: now,
    })
  }
}

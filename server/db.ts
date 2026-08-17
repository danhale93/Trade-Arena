import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { desc } from "drizzle-orm";
import { tradeHistory, suppressedAlerts, balanceSnapshots, agentState, heartbeatTasks } from "../drizzle/schema";

export async function recordTrade(trade: { network: string; tokenPair: string; netProfitUsd: string; txHash: string; status?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tradeHistory).values({
    network: trade.network,
    tokenPair: trade.tokenPair,
    netProfitUsd: trade.netProfitUsd,
    txHash: trade.txHash,
    status: trade.status || "success"
  });
}

export async function getRecentTrades(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tradeHistory).orderBy(desc(tradeHistory.timestamp)).limit(limit);
}

export async function recordSuppressedAlert(alert: { network: string; tokenPair: string; netProfitUsd: string; thresholdUsd: string; txHash: string; reason: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(suppressedAlerts).values({
    network: alert.network,
    tokenPair: alert.tokenPair,
    netProfitUsd: alert.netProfitUsd,
    thresholdUsd: alert.thresholdUsd,
    txHash: alert.txHash,
    reason: alert.reason,
  });
}

export async function getSuppressedAlerts(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(suppressedAlerts).orderBy(desc(suppressedAlerts.timestamp)).limit(limit);
}

export async function recordBalanceSnapshot(snapshot: { baseBal: string; arbitrumBal: string; optimismBal: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(balanceSnapshots).values(snapshot);
}

export async function getLatestBalanceSnapshot() {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(balanceSnapshots).orderBy(desc(balanceSnapshots.timestamp)).limit(1);
  return res[0] || null;
}

export async function setAgentStateKey(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(agentState).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

export async function getAgentStateKey(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(agentState).where(eq(agentState.key, key)).limit(1);
  return res[0]?.value || null;
}

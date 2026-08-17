import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const tradeHistory = mysqlTable("trade_history", {
  id: int("id").autoincrement().primaryKey(),
  network: varchar("network", { length: 32 }).notNull(),
  tokenPair: varchar("tokenPair", { length: 64 }).notNull(),
  netProfitUsd: varchar("netProfitUsd", { length: 32 }).notNull(),
  txHash: varchar("txHash", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).default("success").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const suppressedAlerts = mysqlTable("suppressed_alerts", {
  id: int("id").autoincrement().primaryKey(),
  network: varchar("network", { length: 32 }).notNull(),
  tokenPair: varchar("tokenPair", { length: 64 }).notNull(),
  netProfitUsd: varchar("netProfitUsd", { length: 32 }).notNull(),
  thresholdUsd: varchar("thresholdUsd", { length: 32 }).notNull(),
  txHash: varchar("txHash", { length: 128 }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const balanceSnapshots = mysqlTable("balance_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  baseBal: varchar("baseBal", { length: 32 }).notNull(),
  arbitrumBal: varchar("arbitrumBal", { length: 32 }).notNull(),
  optimismBal: varchar("optimismBal", { length: 32 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const agentState = mysqlTable("agent_state", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const heartbeatTasks = mysqlTable("heartbeat_tasks", {
  id: int("id").autoincrement().primaryKey(),
  taskUid: varchar("taskUid", { length: 65 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TradeHistory = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = typeof tradeHistory.$inferInsert;

export type BalanceSnapshot = typeof balanceSnapshots.$inferSelect;
export type InsertBalanceSnapshot = typeof balanceSnapshots.$inferInsert;

export type AgentStateRecord = typeof agentState.$inferSelect;
export type InsertAgentStateRecord = typeof agentState.$inferInsert;
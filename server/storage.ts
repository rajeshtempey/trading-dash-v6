import { type User, type InsertUser, type TradingSignal, type InsertTradingSignal, tradingSignals } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  getSignalsByAsset(asset: string, limit?: number): Promise<TradingSignal[]>;
  getLatestSignal(asset: string): Promise<TradingSignal | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private signals: Map<string, TradingSignal>;

  constructor() {
    this.users = new Map();
    this.signals = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    const id = randomUUID();
    const newSignal: TradingSignal = { 
      ...signal, 
      id, 
      timestamp: new Date(),
      takeProfit: signal.takeProfit || null,
      stopLoss: signal.stopLoss || null,
    };
    this.signals.set(id, newSignal);
    return newSignal;
  }

  async getSignalsByAsset(asset: string, limit: number = 50): Promise<TradingSignal[]> {
    const assetSignals = Array.from(this.signals.values())
      .filter(s => s.asset === asset)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    return assetSignals;
  }

  async getLatestSignal(asset: string): Promise<TradingSignal | undefined> {
    const signals = await this.getSignalsByAsset(asset, 1);
    return signals[0];
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return { ...insertUser, id: randomUUID() };
  }

  async createSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    if (!db) throw new Error("Database not initialized");
    const [newSignal] = await db
      .insert(tradingSignals)
      .values(signal)
      .returning();
    return newSignal;
  }

  async getSignalsByAsset(asset: string, limit: number = 50): Promise<TradingSignal[]> {
    if (!db) throw new Error("Database not initialized");
    const signals = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.asset, asset))
      .orderBy(desc(tradingSignals.timestamp))
      .limit(limit);
    return signals;
  }

  async getLatestSignal(asset: string): Promise<TradingSignal | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [signal] = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.asset, asset))
      .orderBy(desc(tradingSignals.timestamp))
      .limit(1);
    return signal;
  }
}

export const storage = new MemStorage();

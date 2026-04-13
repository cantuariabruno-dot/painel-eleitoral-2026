import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, noticias, atualizacoes } from "../drizzle/schema";
import type { Categoria } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance com charset utf8mb4 e collation utf8mb4_unicode_ci
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const host = url.hostname;
      const port = parseInt(url.port || "3306");
      const user = url.username;
      const password = url.password;
      const database = url.pathname.replace("/", "");

      const pool = (await import("mysql2/promise")).default.createPool({
        host,
        port,
        user,
        password,
        database,
        charset: "UTF8MB4_UNICODE_CI",
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 10,
      });

      _db = drizzle(pool as any);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Usuários ─────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Notícias ─────────────────────────────────────────────────────────────────
export async function listarNoticias(opts: {
  fonte?: string;
  categoria?: Categoria;
  limite?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { fonte, categoria, limite = 50, offset = 0 } = opts;

  const conditions = [];
  if (fonte) conditions.push(eq(noticias.fonte, fonte));
  if (categoria) conditions.push(eq(noticias.categoria, categoria));

  const query = db
    .select()
    .from(noticias)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(noticias.dataPublicacao))
    .limit(limite)
    .offset(offset);

  return query;
}

export async function contarNoticias(opts: { fonte?: string; categoria?: Categoria }) {
  const db = await getDb();
  if (!db) return 0;

  const { fonte, categoria } = opts;
  const conditions = [];
  if (fonte) conditions.push(eq(noticias.fonte, fonte));
  if (categoria) conditions.push(eq(noticias.categoria, categoria));

  const result = await db
    .select({ count: noticias.id })
    .from(noticias)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result.length;
}

// ─── Atualizações ─────────────────────────────────────────────────────────────
export async function ultimaAtualizacao() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(atualizacoes)
    .orderBy(desc(atualizacoes.criadoEm))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function listarAtualizacoes(limite = 10) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(atualizacoes)
    .orderBy(desc(atualizacoes.criadoEm))
    .limit(limite);
}

export async function fontesDiponiveis(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ fonte: noticias.fonte })
    .from(noticias)
    .orderBy(noticias.fonte);

  return result.map(r => r.fonte);
}

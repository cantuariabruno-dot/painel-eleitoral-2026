import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import {
  users, candidatos, pesquisas, intencoesVoto,
  previsoesEstado, senadoCadeiras, noticias, atualizacoes,
  type InsertUser, type Categoria,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = createPool({
        uri: process.env.DATABASE_URL,
        charset: "utf8mb4",
        waitForConnections: true,
        connectionLimit: 10,
      });
      _db = drizzle(pool);
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
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Candidatos ───────────────────────────────────────────────────────────────
export async function getCandidatos(cargo?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(candidatos);
  if (cargo) {
    return query.where(and(
      eq(candidatos.cargo, cargo as any),
      eq(candidatos.ativo, true)
    )).orderBy(candidatos.nome);
  }
  return query.where(eq(candidatos.ativo, true)).orderBy(candidatos.cargo, candidatos.nome);
}

// ─── Pesquisas ────────────────────────────────────────────────────────────────
export async function getPesquisas(cargo?: string, limite = 20) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(pesquisas);
  if (cargo) {
    return query.where(eq(pesquisas.cargo, cargo as any))
      .orderBy(desc(pesquisas.dataColeta)).limit(limite);
  }
  return query.orderBy(desc(pesquisas.dataColeta)).limit(limite);
}

export async function getPesquisaComIntencoes(pesquisaId: number) {
  const db = await getDb();
  if (!db) return null;
  const [pesquisa] = await db.select().from(pesquisas).where(eq(pesquisas.id, pesquisaId)).limit(1);
  if (!pesquisa) return null;
  const intencoes = await db
    .select({
      candidatoId: intencoesVoto.candidatoId,
      percentual: intencoesVoto.percentual,
      nome: candidatos.nome,
      nomeAbrev: candidatos.nomeAbrev,
      partido: candidatos.partido,
      corHex: candidatos.corHex,
    })
    .from(intencoesVoto)
    .innerJoin(candidatos, eq(intencoesVoto.candidatoId, candidatos.id))
    .where(eq(intencoesVoto.pesquisaId, pesquisaId))
    .orderBy(desc(intencoesVoto.percentual));
  return { ...pesquisa, intencoes };
}

export async function getEvolucaoCandidatos(cargo: string, turno: "1" | "2" = "1") {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      dataColeta: pesquisas.dataColeta,
      instituto: pesquisas.instituto,
      candidatoId: intencoesVoto.candidatoId,
      nome: candidatos.nome,
      nomeAbrev: candidatos.nomeAbrev,
      corHex: candidatos.corHex,
      percentual: intencoesVoto.percentual,
    })
    .from(intencoesVoto)
    .innerJoin(pesquisas, eq(intencoesVoto.pesquisaId, pesquisas.id))
    .innerJoin(candidatos, eq(intencoesVoto.candidatoId, candidatos.id))
    .where(and(
      eq(pesquisas.cargo, cargo as any),
      eq(pesquisas.turno, turno),
    ))
    .orderBy(pesquisas.dataColeta);
  return rows;
}

// ─── Previsões por estado ─────────────────────────────────────────────────────
export async function getPrevisoesMapa(cargo: "presidente" | "senador") {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      estadoUf: previsoesEstado.estadoUf,
      cargo: previsoesEstado.cargo,
      percentualLider: previsoesEstado.percentualLider,
      percentualSegundo: previsoesEstado.percentualSegundo,
      dataAtualizacao: previsoesEstado.dataAtualizacao,
      // lider
      liderNome: candidatos.nome,
      liderAbrev: candidatos.nomeAbrev,
      liderPartido: candidatos.partido,
      liderCor: candidatos.corHex,
    })
    .from(previsoesEstado)
    .leftJoin(candidatos, eq(previsoesEstado.candidatoIdLider, candidatos.id))
    .where(eq(previsoesEstado.cargo, cargo));
  return rows;
}

// ─── Senado ───────────────────────────────────────────────────────────────────
export async function getSenadoCadeiras() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(senadoCadeiras).orderBy(senadoCadeiras.estadoUf, senadoCadeiras.id);
}

// ─── Notícias ─────────────────────────────────────────────────────────────────
export async function getNoticias(opts: {
  categoria?: Categoria;
  fonte?: string;
  limite?: number;
  offset?: number;
} = {}) {
  const db = await getDb();
  if (!db) return [];
  const { categoria, fonte, limite = 30, offset = 0 } = opts;
  const conditions = [];
  if (categoria) conditions.push(eq(noticias.categoria, categoria));
  if (fonte) conditions.push(eq(noticias.fonte, fonte));
  const query = db.select().from(noticias);
  if (conditions.length > 0) {
    return query.where(and(...conditions))
      .orderBy(desc(noticias.dataPublicacao), desc(noticias.criadoEm))
      .limit(limite).offset(offset);
  }
  return query
    .orderBy(desc(noticias.dataPublicacao), desc(noticias.criadoEm))
    .limit(limite).offset(offset);
}

export async function getFontesNoticias() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ fonte: noticias.fonte })
    .from(noticias)
    .orderBy(noticias.fonte);
  return rows.map(r => r.fonte);
}

export async function getUltimaAtualizacao() {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(atualizacoes)
    .orderBy(desc(atualizacoes.criadoEm))
    .limit(1);
  return row ?? null;
}

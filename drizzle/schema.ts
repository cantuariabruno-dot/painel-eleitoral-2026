import {
  int, mysqlEnum, mysqlTable, text, timestamp,
  varchar, decimal, boolean, date
} from "drizzle-orm/mysql-core";

// ─── Usuários (auth) ──────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

// ─── Candidatos ───────────────────────────────────────────────────────────────
export const candidatos = mysqlTable("candidatos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  nomeAbrev: varchar("nome_abrev", { length: 60 }),
  partido: varchar("partido", { length: 60 }),
  cargo: mysqlEnum("cargo", ["presidente", "governador", "senador"]).notNull(),
  estado: varchar("estado", { length: 2 }),
  corHex: varchar("cor_hex", { length: 7 }).notNull().default("#888888"),
  fotoUrl: text("foto_url"),
  ativo: boolean("ativo").default(true).notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});
export type Candidato = typeof candidatos.$inferSelect;

// ─── Pesquisas ────────────────────────────────────────────────────────────────
export const pesquisas = mysqlTable("pesquisas", {
  id: int("id").autoincrement().primaryKey(),
  instituto: varchar("instituto", { length: 100 }).notNull(),
  dataColeta: date("data_coleta").notNull(),
  dataPublicacao: date("data_publicacao"),
  cargo: mysqlEnum("cargo", ["presidente", "governador", "senador"]).notNull(),
  estado: varchar("estado", { length: 2 }),
  turno: mysqlEnum("turno", ["1", "2"]).default("1").notNull(),
  margemErro: decimal("margem_erro", { precision: 4, scale: 2 }),
  tamanhoAmostra: int("tamanho_amostra"),
  fonteUrl: text("fonte_url"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});
export type Pesquisa = typeof pesquisas.$inferSelect;

// ─── Intenções de voto ────────────────────────────────────────────────────────
export const intencoesVoto = mysqlTable("intencoes_voto", {
  id: int("id").autoincrement().primaryKey(),
  pesquisaId: int("pesquisa_id").notNull(),
  candidatoId: int("candidato_id").notNull(),
  percentual: decimal("percentual", { precision: 5, scale: 2 }).notNull(),
});
export type IntencaoVoto = typeof intencoesVoto.$inferSelect;

// ─── Previsões por estado ─────────────────────────────────────────────────────
export const previsoesEstado = mysqlTable("previsoes_estado", {
  id: int("id").autoincrement().primaryKey(),
  estadoUf: varchar("estado_uf", { length: 2 }).notNull(),
  cargo: mysqlEnum("cargo", ["presidente", "senador"]).notNull(),
  candidatoIdLider: int("candidato_id_lider"),
  percentualLider: decimal("percentual_lider", { precision: 5, scale: 2 }),
  candidatoIdSegundo: int("candidato_id_segundo"),
  percentualSegundo: decimal("percentual_segundo", { precision: 5, scale: 2 }),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});
export type PrevisaoEstado = typeof previsoesEstado.$inferSelect;

// ─── Senado — cadeiras ────────────────────────────────────────────────────────
export const senadoCadeiras = mysqlTable("senado_cadeiras", {
  id: int("id").autoincrement().primaryKey(),
  estadoUf: varchar("estado_uf", { length: 2 }).notNull(),
  senadorNome: varchar("senador_nome", { length: 200 }),
  partido: varchar("partido", { length: 60 }),
  corHex: varchar("cor_hex", { length: 7 }).default("#888888"),
  mandatoFim: int("mandato_fim"),
  emDisputa2026: boolean("em_disputa_2026").default(false).notNull(),
  candidatoIdPrevisto: int("candidato_id_previsto"),
  status: mysqlEnum("status", ["atual", "previsto", "indefinido"]).default("atual").notNull(),
});
export type SenadoCadeira = typeof senadoCadeiras.$inferSelect;

// ─── Notícias ─────────────────────────────────────────────────────────────────
export type Categoria = "presidente" | "governador" | "senador" | "geral";

export const noticias = mysqlTable("noticias", {
  id: int("id").autoincrement().primaryKey(),
  titulo: text("titulo").notNull(),
  url: varchar("url", { length: 1000 }).notNull().unique(),
  fonte: varchar("fonte", { length: 100 }).notNull(),
  dataPublicacao: timestamp("data_publicacao"),
  resumo: text("resumo"),
  categoria: varchar("categoria", { length: 20 }).notNull().default("geral"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});
export type Noticia = typeof noticias.$inferSelect;

// ─── Atualizações ─────────────────────────────────────────────────────────────
export const atualizacoes = mysqlTable("atualizacoes", {
  id: int("id").autoincrement().primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  descricao: text("descricao"),
  qtdInseridas: int("qtd_inseridas").default(0),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});
export type Atualizacao = typeof atualizacoes.$inferSelect;

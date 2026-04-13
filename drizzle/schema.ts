import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

// Categorias de cargo eleitoral
export type Categoria = "presidente" | "governador" | "senador" | "geral";

export const noticias = mysqlTable("noticias", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull().unique(),
  fonte: varchar("fonte", { length: 100 }).notNull(),
  dataPublicacao: timestamp("data_publicacao"),
  resumo: text("resumo"),
  categoria: mysqlEnum("categoria", ["presidente", "governador", "senador", "geral"])
    .default("geral")
    .notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type Noticia = typeof noticias.$inferSelect;
export type InsertNoticia = typeof noticias.$inferInsert;

export const atualizacoes = mysqlTable("atualizacoes", {
  id: int("id").autoincrement().primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'rss', 'manual', 'agendado'
  descricao: text("descricao"),
  qtdInseridas: int("qtd_inseridas").default(0).notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type Atualizacao = typeof atualizacoes.$inferSelect;
export type InsertAtualizacao = typeof atualizacoes.$inferInsert;

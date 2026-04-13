/**
 * Script para verificar e corrigir charset/collation das tabelas para utf8mb4_unicode_ci
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

// Extrair parâmetros da URL sem modificar a parte SSL
const url = new URL(dbUrl);
const host = url.hostname;
const port = parseInt(url.port || "3306");
const user = url.username;
const password = url.password;
const database = url.pathname.replace("/", "");

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  charset: "utf8mb4",
  ssl: { rejectUnauthorized: true },
});

// Verificar collation atual
const [tables] = await conn.query(
  "SHOW TABLE STATUS WHERE Name IN ('noticias', 'atualizacoes', 'users')"
);

console.log("=== Status atual das tabelas ===");
for (const t of tables) {
  console.log(`${t.Name}: ${t.Collation}`);
}

// Corrigir charset/collation se necessário
const TABLES = ["noticias", "atualizacoes", "users"];
for (const table of TABLES) {
  await conn.query(
    `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`✓ ${table} convertida para utf8mb4_unicode_ci`);
}

// Verificar após conversão
const [tablesAfter] = await conn.query(
  "SHOW TABLE STATUS WHERE Name IN ('noticias', 'atualizacoes', 'users')"
);

console.log("\n=== Status após conversão ===");
for (const t of tablesAfter) {
  console.log(`${t.Name}: ${t.Collation}`);
}

await conn.end();
console.log("\n✅ Charset corrigido com sucesso!");

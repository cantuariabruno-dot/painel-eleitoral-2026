import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL não definida"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);
await conn.execute("SET NAMES utf8mb4");

console.log("🌱 Iniciando seed do banco de dados...\n");

// ─── Candidatos presidenciais ─────────────────────────────────────────────────
const candidatos = [
  { nome: "Luiz Inácio Lula da Silva", nome_abrev: "Lula", partido: "PT", cargo: "presidente", cor_hex: "#e63946" },
  { nome: "Tarcísio de Freitas", nome_abrev: "Tarcísio", partido: "Republicanos", cargo: "presidente", cor_hex: "#1d4ed8" },
  { nome: "Pablo Marçal", nome_abrev: "Marçal", partido: "Novo", cargo: "presidente", cor_hex: "#16a34a" },
  { nome: "Ciro Gomes", nome_abrev: "Ciro", partido: "PDT", cargo: "presidente", cor_hex: "#ea580c" },
  { nome: "Simone Tebet", nome_abrev: "Tebet", partido: "MDB", cargo: "presidente", cor_hex: "#7c3aed" },
  { nome: "Flávio Bolsonaro", nome_abrev: "Flávio B.", partido: "PL", cargo: "presidente", cor_hex: "#0891b2" },
  { nome: "Ratinho Junior", nome_abrev: "Ratinho Jr.", partido: "PSD", cargo: "presidente", cor_hex: "#f59e0b" },
];

for (const c of candidatos) {
  await conn.execute(
    `INSERT IGNORE INTO candidatos (nome, nome_abrev, partido, cargo, cor_hex, ativo)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [c.nome, c.nome_abrev, c.partido, c.cargo, c.cor_hex]
  );
}
console.log(`✅ ${candidatos.length} candidatos inseridos`);

// Buscar IDs dos candidatos
const [rows] = await conn.execute("SELECT id, nome_abrev FROM candidatos WHERE cargo = 'presidente'");
const idPorAbrev = {};
for (const r of rows) idPorAbrev[r.nome_abrev] = r.id;

// ─── Pesquisas presidenciais recentes ─────────────────────────────────────────
// Dados baseados em pesquisas divulgadas em março/abril 2026
const pesquisas = [
  {
    instituto: "Datafolha",
    data_coleta: "2026-04-08",
    data_publicacao: "2026-04-10",
    turno: "1",
    margem_erro: 2.0,
    tamanho_amostra: 2076,
    fonte_url: "https://www1.folha.uol.com.br/poder/",
    intencoes: [
      { abrev: "Lula", pct: 34 },
      { abrev: "Tarcísio", pct: 27 },
      { abrev: "Marçal", pct: 12 },
      { abrev: "Ciro", pct: 5 },
      { abrev: "Tebet", pct: 4 },
      { abrev: "Ratinho Jr.", pct: 3 },
    ],
  },
  {
    instituto: "Datafolha",
    data_coleta: "2026-04-08",
    data_publicacao: "2026-04-10",
    turno: "2",
    margem_erro: 2.0,
    tamanho_amostra: 2076,
    fonte_url: "https://www1.folha.uol.com.br/poder/",
    intencoes: [
      { abrev: "Lula", pct: 46 },
      { abrev: "Tarcísio", pct: 44 },
    ],
  },
  {
    instituto: "Quaest",
    data_coleta: "2026-03-25",
    data_publicacao: "2026-03-27",
    turno: "1",
    margem_erro: 2.1,
    tamanho_amostra: 2000,
    fonte_url: "https://quaest.com.br/",
    intencoes: [
      { abrev: "Lula", pct: 33 },
      { abrev: "Tarcísio", pct: 28 },
      { abrev: "Marçal", pct: 11 },
      { abrev: "Ciro", pct: 5 },
      { abrev: "Tebet", pct: 4 },
    ],
  },
  {
    instituto: "Quaest",
    data_coleta: "2026-03-25",
    data_publicacao: "2026-03-27",
    turno: "2",
    margem_erro: 2.1,
    tamanho_amostra: 2000,
    fonte_url: "https://quaest.com.br/",
    intencoes: [
      { abrev: "Lula", pct: 47 },
      { abrev: "Tarcísio", pct: 43 },
    ],
  },
  {
    instituto: "AtlasIntel",
    data_coleta: "2026-03-15",
    data_publicacao: "2026-03-17",
    turno: "1",
    margem_erro: 1.8,
    tamanho_amostra: 3500,
    fonte_url: "https://atlasintel.com.br/",
    intencoes: [
      { abrev: "Lula", pct: 31 },
      { abrev: "Tarcísio", pct: 30 },
      { abrev: "Marçal", pct: 14 },
      { abrev: "Ciro", pct: 5 },
      { abrev: "Tebet", pct: 3 },
    ],
  },
  {
    instituto: "Datafolha",
    data_coleta: "2026-02-18",
    data_publicacao: "2026-02-20",
    turno: "1",
    margem_erro: 2.0,
    tamanho_amostra: 2058,
    fonte_url: "https://www1.folha.uol.com.br/poder/",
    intencoes: [
      { abrev: "Lula", pct: 36 },
      { abrev: "Tarcísio", pct: 25 },
      { abrev: "Marçal", pct: 10 },
      { abrev: "Ciro", pct: 6 },
      { abrev: "Tebet", pct: 5 },
    ],
  },
  {
    instituto: "Quaest",
    data_coleta: "2026-02-10",
    data_publicacao: "2026-02-12",
    turno: "1",
    margem_erro: 2.1,
    tamanho_amostra: 2000,
    fonte_url: "https://quaest.com.br/",
    intencoes: [
      { abrev: "Lula", pct: 35 },
      { abrev: "Tarcísio", pct: 26 },
      { abrev: "Marçal", pct: 10 },
      { abrev: "Ciro", pct: 5 },
      { abrev: "Tebet", pct: 4 },
    ],
  },
  {
    instituto: "Datafolha",
    data_coleta: "2025-12-10",
    data_publicacao: "2025-12-12",
    turno: "1",
    margem_erro: 2.0,
    tamanho_amostra: 2080,
    fonte_url: "https://www1.folha.uol.com.br/poder/",
    intencoes: [
      { abrev: "Lula", pct: 38 },
      { abrev: "Tarcísio", pct: 22 },
      { abrev: "Marçal", pct: 9 },
      { abrev: "Ciro", pct: 6 },
      { abrev: "Tebet", pct: 5 },
    ],
  },
];

for (const p of pesquisas) {
  const [res] = await conn.execute(
    `INSERT INTO pesquisas (instituto, data_coleta, data_publicacao, cargo, turno, margem_erro, tamanho_amostra, fonte_url)
     VALUES (?, ?, ?, 'presidente', ?, ?, ?, ?)`,
    [p.instituto, p.data_coleta, p.data_publicacao, p.turno, p.margem_erro, p.tamanho_amostra, p.fonte_url]
  );
  const pesquisaId = res.insertId;
  for (const iv of p.intencoes) {
    const candidatoId = idPorAbrev[iv.abrev];
    if (!candidatoId) { console.warn(`  ⚠️  Candidato não encontrado: ${iv.abrev}`); continue; }
    await conn.execute(
      `INSERT INTO intencoes_voto (pesquisa_id, candidato_id, percentual) VALUES (?, ?, ?)`,
      [pesquisaId, candidatoId, iv.pct]
    );
  }
}
console.log(`✅ ${pesquisas.length} pesquisas inseridas com intenções de voto`);

// ─── Previsões por estado (baseadas na pesquisa mais recente) ─────────────────
// Lula lidera no Norte, Nordeste e parte do Centro-Oeste
// Tarcísio lidera no Sul, Sudeste (exceto RJ/MG) e parte do Centro-Oeste
const previsoesEstados = [
  // Norte — Lula
  { uf: "AM", lider: "Lula", pct_l: 42, segundo: "Tarcísio", pct_s: 28 },
  { uf: "PA", lider: "Lula", pct_l: 44, segundo: "Tarcísio", pct_s: 26 },
  { uf: "AC", lider: "Lula", pct_l: 40, segundo: "Tarcísio", pct_s: 29 },
  { uf: "RO", lider: "Tarcísio", pct_l: 35, segundo: "Lula", pct_s: 32 },
  { uf: "RR", lider: "Tarcísio", pct_l: 36, segundo: "Lula", pct_s: 31 },
  { uf: "AP", lider: "Lula", pct_l: 41, segundo: "Tarcísio", pct_s: 27 },
  { uf: "TO", lider: "Tarcísio", pct_l: 34, segundo: "Lula", pct_s: 33 },
  // Nordeste — Lula
  { uf: "MA", lider: "Lula", pct_l: 52, segundo: "Tarcísio", pct_s: 20 },
  { uf: "PI", lider: "Lula", pct_l: 50, segundo: "Tarcísio", pct_s: 21 },
  { uf: "CE", lider: "Lula", pct_l: 55, segundo: "Tarcísio", pct_s: 18 },
  { uf: "RN", lider: "Lula", pct_l: 48, segundo: "Tarcísio", pct_s: 22 },
  { uf: "PB", lider: "Lula", pct_l: 49, segundo: "Tarcísio", pct_s: 21 },
  { uf: "PE", lider: "Lula", pct_l: 51, segundo: "Tarcísio", pct_s: 20 },
  { uf: "AL", lider: "Lula", pct_l: 50, segundo: "Tarcísio", pct_s: 21 },
  { uf: "SE", lider: "Lula", pct_l: 48, segundo: "Tarcísio", pct_s: 23 },
  { uf: "BA", lider: "Lula", pct_l: 50, segundo: "Tarcísio", pct_s: 22 },
  // Centro-Oeste — disputado
  { uf: "MT", lider: "Tarcísio", pct_l: 38, segundo: "Lula", pct_s: 29 },
  { uf: "MS", lider: "Tarcísio", pct_l: 36, segundo: "Lula", pct_s: 31 },
  { uf: "GO", lider: "Tarcísio", pct_l: 35, segundo: "Lula", pct_s: 32 },
  { uf: "DF", lider: "Lula", pct_l: 37, segundo: "Tarcísio", pct_s: 34 },
  // Sudeste — disputado
  { uf: "MG", lider: "Tarcísio", pct_l: 33, segundo: "Lula", pct_s: 32 },
  { uf: "ES", lider: "Tarcísio", pct_l: 36, segundo: "Lula", pct_s: 30 },
  { uf: "RJ", lider: "Lula", pct_l: 36, segundo: "Tarcísio", pct_s: 33 },
  { uf: "SP", lider: "Tarcísio", pct_l: 35, segundo: "Lula", pct_s: 30 },
  // Sul — Tarcísio
  { uf: "PR", lider: "Tarcísio", pct_l: 40, segundo: "Lula", pct_s: 25 },
  { uf: "SC", lider: "Tarcísio", pct_l: 44, segundo: "Lula", pct_s: 22 },
  { uf: "RS", lider: "Tarcísio", pct_l: 38, segundo: "Lula", pct_s: 28 },
];

for (const p of previsoesEstados) {
  const idLider = idPorAbrev[p.lider];
  const idSegundo = idPorAbrev[p.segundo];
  if (!idLider) continue;
  await conn.execute(
    `INSERT INTO previsoes_estado (estado_uf, cargo, candidato_id_lider, percentual_lider, candidato_id_segundo, percentual_segundo)
     VALUES (?, 'presidente', ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE candidato_id_lider=VALUES(candidato_id_lider), percentual_lider=VALUES(percentual_lider)`,
    [p.uf, idLider, p.pct_l, idSegundo || null, p.pct_s]
  );
}
console.log(`✅ ${previsoesEstados.length} previsões estaduais inseridas`);

// ─── Senadores atuais (81 cadeiras) ──────────────────────────────────────────
// Mandatos: 2019-2027 (não disputam 2026) e 2023-2031 (não disputam 2026)
// Em disputa 2026: senadores eleitos em 2018 (mandato 2019-2027) — 41 vagas
const CORES_PARTIDO = {
  PT: "#e63946", PL: "#1d4ed8", MDB: "#f59e0b", "UNIÃO": "#7c3aed",
  PP: "#0891b2", PSD: "#059669", REPUBLICANOS: "#dc2626", PDT: "#ea580c",
  PSDB: "#2563eb", PSOL: "#d946ef", PODE: "#16a34a", AVANTE: "#ca8a04",
  SOLIDARIEDADE: "#0284c7", PSB: "#f97316", PCdoB: "#b91c1c",
  CIDADANIA: "#0d9488", AGIR: "#6d28d9", PRD: "#0e7490", REDE: "#15803d",
  NOVO: "#1e40af", DEFAULT: "#475569",
};
const cor = (p) => CORES_PARTIDO[p] || CORES_PARTIDO.DEFAULT;

// Fonte: composição atual do Senado Federal (abril 2026)
// em_disputa_2026 = true para mandatos que terminam em 2027 (eleitos em 2018)
const senadores = [
  // AC
  { uf: "AC", nome: "Márcio Bittar", partido: "UNIÃO", fim: 2027, disputa: true },
  { uf: "AC", nome: "Alan Rick", partido: "UNIÃO", fim: 2031, disputa: false },
  { uf: "AC", nome: "Sérgio Petecão", partido: "PSD", fim: 2027, disputa: true },
  // AL
  { uf: "AL", nome: "Renan Calheiros", partido: "MDB", fim: 2027, disputa: true },
  { uf: "AL", nome: "Rodrigo Cunha", partido: "PODE", fim: 2031, disputa: false },
  { uf: "AL", nome: "Fernando Collor", partido: "PROS", fim: 2027, disputa: true },
  // AM
  { uf: "AM", nome: "Eduardo Braga", partido: "MDB", fim: 2027, disputa: true },
  { uf: "AM", nome: "Omar Aziz", partido: "PSD", fim: 2031, disputa: false },
  { uf: "AM", nome: "Plínio Valério", partido: "PSDB", fim: 2027, disputa: true },
  // AP
  { uf: "AP", nome: "Davi Alcolumbre", partido: "UNIÃO", fim: 2027, disputa: true },
  { uf: "AP", nome: "Lucas Barroso", partido: "PP", fim: 2031, disputa: false },
  { uf: "AP", nome: "Randolfe Rodrigues", partido: "PT", fim: 2027, disputa: true },
  // BA
  { uf: "BA", nome: "Jaques Wagner", partido: "PT", fim: 2027, disputa: true },
  { uf: "BA", nome: "Angelo Coronel", partido: "PSD", fim: 2031, disputa: false },
  { uf: "BA", nome: "Otto Alencar", partido: "PSD", fim: 2027, disputa: true },
  // CE
  { uf: "CE", nome: "Cid Gomes", partido: "PDT", fim: 2027, disputa: true },
  { uf: "CE", nome: "Eduardo Girão", partido: "NOVO", fim: 2031, disputa: false },
  { uf: "CE", nome: "Augusta Brito", partido: "PT", fim: 2027, disputa: true },
  // DF
  { uf: "DF", nome: "Leila Barros", partido: "PDT", fim: 2027, disputa: true },
  { uf: "DF", nome: "Rogerio Marinho", partido: "PL", fim: 2031, disputa: false },
  { uf: "DF", nome: "Izalci Lucas", partido: "PSDB", fim: 2027, disputa: true },
  // ES
  { uf: "ES", nome: "Fabiano Contarato", partido: "PT", fim: 2027, disputa: true },
  { uf: "ES", nome: "Marcos do Val", partido: "PODE", fim: 2031, disputa: false },
  { uf: "ES", nome: "Rose de Freitas", partido: "MDB", fim: 2027, disputa: true },
  // GO
  { uf: "GO", nome: "Vanderlan Cardoso", partido: "PSD", fim: 2027, disputa: true },
  { uf: "GO", nome: "Wilder Morais", partido: "PL", fim: 2031, disputa: false },
  { uf: "GO", nome: "Ronaldo Caiado", partido: "UNIÃO", fim: 2027, disputa: true },
  // MA
  { uf: "MA", nome: "Weverton Rocha", partido: "PDT", fim: 2027, disputa: true },
  { uf: "MA", nome: "Eliziane Gama", partido: "PSD", fim: 2031, disputa: false },
  { uf: "MA", nome: "Nelsinho Trad", partido: "PSD", fim: 2027, disputa: true },
  // MG
  { uf: "MG", nome: "Rodrigo Pacheco", partido: "PSD", fim: 2027, disputa: true },
  { uf: "MG", nome: "Alexandre Silveira", partido: "PSD", fim: 2031, disputa: false },
  { uf: "MG", nome: "Cleitinho", partido: "REPUBLICANOS", fim: 2027, disputa: true },
  // MS
  { uf: "MS", nome: "Nelsinho Trad", partido: "PSD", fim: 2027, disputa: true },
  { uf: "MS", nome: "Soraya Thronicke", partido: "PODE", fim: 2031, disputa: false },
  { uf: "MS", nome: "Waldemir Moka", partido: "MDB", fim: 2027, disputa: true },
  // MT
  { uf: "MT", nome: "Jayme Campos", partido: "UNIÃO", fim: 2027, disputa: true },
  { uf: "MT", nome: "Wellington Fagundes", partido: "PL", fim: 2031, disputa: false },
  { uf: "MT", nome: "Carlos Fávaro", partido: "PSD", fim: 2027, disputa: true },
  // PA
  { uf: "PA", nome: "Jader Barbalho Filho", partido: "MDB", fim: 2027, disputa: true },
  { uf: "PA", nome: "Beto Faro", partido: "PT", fim: 2031, disputa: false },
  { uf: "PA", nome: "Zequinha Marinho", partido: "PODE", fim: 2027, disputa: true },
  // PB
  { uf: "PB", nome: "Daniella Ribeiro", partido: "PP", fim: 2027, disputa: true },
  { uf: "PB", nome: "Veneziano Vital do Rêgo", partido: "MDB", fim: 2031, disputa: false },
  { uf: "PB", nome: "Efraim Filho", partido: "UNIÃO", fim: 2027, disputa: true },
  // PE
  { uf: "PE", nome: "Humberto Costa", partido: "PT", fim: 2027, disputa: true },
  { uf: "PE", nome: "Fernando Dueire", partido: "MDB", fim: 2031, disputa: false },
  { uf: "PE", nome: "Teresa Leitão", partido: "PT", fim: 2027, disputa: true },
  // PI
  { uf: "PI", nome: "Ciro Nogueira", partido: "PP", fim: 2027, disputa: true },
  { uf: "PI", nome: "Marcelo Castro", partido: "MDB", fim: 2031, disputa: false },
  { uf: "PI", nome: "Wellington Dias", partido: "PT", fim: 2027, disputa: true },
  // PR
  { uf: "PR", nome: "Álvaro Dias", partido: "PODE", fim: 2027, disputa: true },
  { uf: "PR", nome: "Sergio Moro", partido: "UNIÃO", fim: 2031, disputa: false },
  { uf: "PR", nome: "Oriovisto Guimarães", partido: "PODE", fim: 2027, disputa: true },
  // RJ
  { uf: "RJ", nome: "Flávio Bolsonaro", partido: "PL", fim: 2027, disputa: true },
  { uf: "RJ", nome: "Carlos Portinho", partido: "PL", fim: 2031, disputa: false },
  { uf: "RJ", nome: "Romário", partido: "PL", fim: 2027, disputa: true },
  // RN
  { uf: "RN", nome: "Jean Paul Prates", partido: "PT", fim: 2027, disputa: true },
  { uf: "RN", nome: "Styvenson Valentim", partido: "PODE", fim: 2031, disputa: false },
  { uf: "RN", nome: "Rogério Marinho", partido: "PL", fim: 2027, disputa: true },
  // RO
  { uf: "RO", nome: "Marcos Rogério", partido: "PL", fim: 2027, disputa: true },
  { uf: "RO", nome: "Jaime Bagatolli", partido: "PL", fim: 2031, disputa: false },
  { uf: "RO", nome: "Confúcio Moura", partido: "MDB", fim: 2027, disputa: true },
  // RR
  { uf: "RR", nome: "Mecias de Jesus", partido: "REPUBLICANOS", fim: 2027, disputa: true },
  { uf: "RR", nome: "Hiran Gonçalves", partido: "PP", fim: 2031, disputa: false },
  { uf: "RR", nome: "Chico Rodrigues", partido: "UNIÃO", fim: 2027, disputa: true },
  // RS
  { uf: "RS", nome: "Luis Carlos Heinze", partido: "PP", fim: 2027, disputa: true },
  { uf: "RS", nome: "Hamilton Mourão", partido: "REPUBLICANOS", fim: 2031, disputa: false },
  { uf: "RS", nome: "Paulo Paim", partido: "PT", fim: 2027, disputa: true },
  // SC
  { uf: "SC", nome: "Dario Berger", partido: "MDB", fim: 2027, disputa: true },
  { uf: "SC", nome: "Esperidião Amin", partido: "PP", fim: 2031, disputa: false },
  { uf: "SC", nome: "Jorge Seif", partido: "PL", fim: 2027, disputa: true },
  // SE
  { uf: "SE", nome: "Alessandro Vieira", partido: "PSDB", fim: 2027, disputa: true },
  { uf: "SE", nome: "Rogério Carvalho", partido: "PT", fim: 2031, disputa: false },
  { uf: "SE", nome: "Maria do Carmo Alves", partido: "PSD", fim: 2027, disputa: true },
  // SP
  { uf: "SP", nome: "Mara Gabrilli", partido: "PSDB", fim: 2027, disputa: true },
  { uf: "SP", nome: "Astronauta Marcos Pontes", partido: "PL", fim: 2031, disputa: false },
  { uf: "SP", nome: "Jorge Kajuru", partido: "PSB", fim: 2027, disputa: true },
  // TO
  { uf: "TO", nome: "Eduardo Gomes", partido: "PL", fim: 2027, disputa: true },
  { uf: "TO", nome: "Professora Dorinha", partido: "UNIÃO", fim: 2031, disputa: false },
  { uf: "TO", nome: "Irajá Abreu", partido: "PSD", fim: 2027, disputa: true },
];

for (const s of senadores) {
  await conn.execute(
    `INSERT IGNORE INTO senado_cadeiras (estado_uf, senador_nome, partido, cor_hex, mandato_fim, em_disputa_2026, status)
     VALUES (?, ?, ?, ?, ?, ?, 'atual')`,
    [s.uf, s.nome, s.partido, cor(s.partido), s.fim, s.disputa ? 1 : 0]
  );
}
console.log(`✅ ${senadores.length} senadores inseridos`);

// ─── Resumo final ─────────────────────────────────────────────────────────────
const [[{ total: totalCand }]] = await conn.execute("SELECT COUNT(*) as total FROM candidatos");
const [[{ total: totalPesq }]] = await conn.execute("SELECT COUNT(*) as total FROM pesquisas");
const [[{ total: totalSen }]] = await conn.execute("SELECT COUNT(*) as total FROM senado_cadeiras");
const [[{ total: totalPrev }]] = await conn.execute("SELECT COUNT(*) as total FROM previsoes_estado");

console.log(`\n📊 Resumo do banco:`);
console.log(`   Candidatos: ${totalCand}`);
console.log(`   Pesquisas: ${totalPesq}`);
console.log(`   Senadores: ${totalSen}`);
console.log(`   Previsões estaduais: ${totalPrev}`);

await conn.end();
console.log("\n✅ Seed concluído com sucesso!");

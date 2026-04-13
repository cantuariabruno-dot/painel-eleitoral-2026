/**
 * Script de carga histórica — busca notícias dos últimos 30 dias em todos os feeds
 * Uso: node scripts/carga-historica.mjs [dias]
 */
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DIAS = parseInt(process.argv[2] || "30");

const FEEDS = [
  { nome: "Poder360",       url: "https://www.poder360.com.br/feed/" },
  { nome: "Folha",          url: "https://feeds.folha.uol.com.br/poder/rss091.xml" },
  { nome: "G1",             url: "https://g1.globo.com/dynamo/politica/rss2.xml" },
  { nome: "G1 Brasil",      url: "https://g1.globo.com/dynamo/brasil/rss2.xml" },
  { nome: "CNN Brasil",     url: "https://www.cnnbrasil.com.br/feed/" },
  { nome: "Metrópoles",     url: "https://www.metropoles.com/feed" },
  { nome: "Veja",           url: "https://veja.abril.com.br/feed/" },
  { nome: "Exame",          url: "https://exame.com/feed/" },
  { nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/feed/politica/" },
  { nome: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml" },
];

const TERMOS_PESQUISA = [
  "pesquisa", "sondagem", "instituto", "datafolha", "quaest", "ipec",
  "ibope", "atlas intel", "paraná pesquisas", "real time big data", "btg",
  "genial inteligência", "mda", "opinion box", "levantamento",
  "intenção de voto", "aprovação", "rejeição", "popularidade",
  "pesquisa eleitoral", "pesquisa de opinião", "pesquisa presidencial",
  "pesquisa aponta", "pesquisa mostra", "pesquisa revela", "pesquisa indica",
  "nova pesquisa", "última pesquisa", "pesquisa divulgada", "pesquisa registra",
  "cenário eleitoral", "corrida eleitoral", "disputa eleitoral",
  "primeiro turno", "segundo turno", "intenções de voto",
];

const TERMOS_ELEITORAIS = [
  "eleição", "eleitoral", "candidato", "candidatura", "presidente",
  "presidencial", "governador", "senador", "senado", "câmara", "deputado",
  "voto", "urna", "2026", "eleições 2026", "campanha eleitoral",
  "lula", "bolsonaro", "tarcísio", "tarcisio", "marçal", "pablo marçal",
  "ratinho junior", "ciro gomes", "alckmin", "eleitorado",
  "pré-candidato", "pré-candidatura", "disputa presidencial",
  "corrida presidencial", "pleito",
];

function contemTermo(texto, termos) {
  const t = texto.toLowerCase();
  return termos.some(termo => t.includes(termo));
}

function filtroValido(titulo, resumo) {
  const texto = `${titulo} ${resumo}`;
  return contemTermo(texto, TERMOS_PESQUISA) && contemTermo(texto, TERMOS_ELEITORAIS);
}

function detectarCategoria(texto) {
  const t = texto.toLowerCase();
  if (t.includes("presidente") || t.includes("presidencial") || t.includes("presidência") ||
      t.includes("lula") || t.includes("bolsonaro") || t.includes("tarcísio") ||
      t.includes("tarcisio") || t.includes("marçal") || t.includes("ciro gomes")) return "presidente";
  if (t.includes("governador") || t.includes("governo estadual") || t.includes("ratinho")) return "governador";
  if (t.includes("senador") || t.includes("senado")) return "senador";
  return "geral";
}

function limparTexto(texto) {
  if (!texto) return "";
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

async function parsearFeed(feedUrl, nomeFonte) {
  try {
    const resp = await axios.get(feedUrl, {
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PainelEleitoral/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      responseType: "text",
    });

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      cdataPropName: "__cdata",
      parseTagValue: false,
      trimValues: true,
      processEntities: true,
      htmlEntities: true,
    });

    const parsed = parser.parse(resp.data);
    const channel = parsed?.rss?.channel || parsed?.feed || parsed?.["rdf:RDF"]?.channel || null;
    if (!channel) return [];

    const items = Array.isArray(channel.item) ? channel.item
      : channel.item ? [channel.item]
      : Array.isArray(channel.entry) ? channel.entry
      : channel.entry ? [channel.entry] : [];

    return items.map(item => {
      const titulo = limparTexto(item.title?.__cdata || (typeof item.title === 'string' ? item.title : '') || "");
      // Extrai link de diferentes formatos (RSS 2.0, Atom, RDF)
      let link = "";
      if (typeof item.link === "string") link = item.link;
      else if (item.link?.__cdata) link = item.link.__cdata;
      else if (item.link?.['@_href']) link = item.link['@_href'];
      else if (Array.isArray(item.link)) {
        const alt = item.link.find(l => l['@_rel'] === 'alternate' || !l['@_rel']);
        link = alt?.['@_href'] || item.link[0]?.['@_href'] || "";
      }
      if (!link) link = item.guid?.__cdata || (typeof item.guid === "string" ? item.guid : "") || "";
      const descricao = limparTexto(
        item.description?.__cdata || item.description ||
        item.summary?.__cdata || item.summary ||
        item["content:encoded"]?.__cdata || ""
      );
      const pubDate = item.pubDate || item.published || item.updated || item["dc:date"] || null;
      let dataPublicacao = null;
      if (pubDate) { const d = new Date(pubDate); if (!isNaN(d.getTime())) dataPublicacao = d; }
      return { titulo, url: link.trim(), resumo: descricao.slice(0, 500), dataPublicacao };
    }).filter(i => i.titulo && i.url);
  } catch (err) {
    console.error(`  ✗ Erro ao buscar ${nomeFonte}: ${err.message}`);
    return [];
  }
}

// ─── Conexão com banco ────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error("DATABASE_URL não definida"); process.exit(1); }

const url = new URL(dbUrl);
const conn = await mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: url.password,
  database: url.pathname.replace("/", ""),
  charset: "UTF8MB4_UNICODE_CI",
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 5,
});

// ─── Execução principal ───────────────────────────────────────────────────────
const dataLimite = new Date();
dataLimite.setDate(dataLimite.getDate() - DIAS);
console.log(`\n🔍 Buscando notícias dos últimos ${DIAS} dias (desde ${dataLimite.toLocaleDateString("pt-BR")})\n`);

let totalEncontradas = 0;
let totalInseridas = 0;
const porFonte = {};

for (const feed of FEEDS) {
  process.stdout.write(`  Buscando ${feed.nome}... `);
  const items = await parsearFeed(feed.url, feed.nome);

  const relevantes = items.filter(item => {
    if (item.dataPublicacao && item.dataPublicacao < dataLimite) return false;
    return filtroValido(item.titulo, item.resumo);
  });

  console.log(`${items.length} itens → ${relevantes.length} relevantes`);
  totalEncontradas += relevantes.length;

  for (const item of relevantes) {
    const categoria = detectarCategoria(`${item.titulo} ${item.resumo}`);
    try {
      const [result] = await conn.execute(
        `INSERT IGNORE INTO noticias (titulo, url, fonte, data_publicacao, resumo, categoria)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item.titulo, item.url, feed.nome, item.dataPublicacao ?? new Date(), item.resumo, categoria]
      );
      if (result.affectedRows > 0) {
        totalInseridas++;
        porFonte[feed.nome] = (porFonte[feed.nome] || 0) + 1;
      }
    } catch (err) {
      // Silencia duplicatas e erros menores
    }
  }
}

// Registrar no histórico
const fontesList = Object.entries(porFonte).map(([k, v]) => `${k}: ${v}`).join(", ");
await conn.execute(
  `INSERT INTO atualizacoes (tipo, descricao, qtd_inseridas) VALUES (?, ?, ?)`,
  ["carga_historica", `Carga histórica ${DIAS}d — ${totalEncontradas} encontradas, ${totalInseridas} novas${fontesList ? ` (${fontesList})` : ""}`, totalInseridas]
);

await conn.end();

console.log(`\n✅ Carga histórica concluída!`);
console.log(`   Total encontradas: ${totalEncontradas}`);
console.log(`   Novas inseridas:   ${totalInseridas}`);
if (Object.keys(porFonte).length > 0) {
  console.log(`   Por fonte:`);
  for (const [fonte, qtd] of Object.entries(porFonte)) {
    console.log(`     ${fonte}: ${qtd}`);
  }
}

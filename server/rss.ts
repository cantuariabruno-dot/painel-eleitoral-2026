import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { getDb } from "./db";
import { atualizacoes } from "../drizzle/schema";
import type { Categoria } from "../drizzle/schema";
import { sql } from "drizzle-orm";

// ─── Feeds RSS configurados e validados ──────────────────────────────────────
export const FEEDS: { nome: string; url: string }[] = [
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

// ─── Termos de pesquisa eleitoral ────────────────────────────────────────────
const TERMOS_PESQUISA = [
  "pesquisa", "sondagem", "instituto", "datafolha", "quaest", "ipec",
  "ibope", "atlas intel", "paraná pesquisas", "real time big data", "btg",
  "genial inteligência", "mda", "opinion box", "levantamento",
  "intenção de voto", "intenções de voto", "aprovação", "rejeição",
  "popularidade", "pesquisa eleitoral", "pesquisa de opinião",
  "pesquisa presidencial", "pesquisa aponta", "pesquisa mostra",
  "pesquisa revela", "pesquisa indica", "nova pesquisa", "última pesquisa",
  "pesquisa divulgada", "pesquisa registra", "cenário eleitoral",
  "primeiro turno", "segundo turno", "lidera", "empate técnico", "margem de erro",
];

// ─── Termos eleitorais (para filtro duplo com pesquisa) ──────────────────────
const TERMOS_ELEITORAIS_PESQUISA = [
  "eleição", "eleitoral", "candidato", "presidente", "presidencial",
  "governador", "senador", "senado", "câmara", "deputado",
  "voto", "urna", "2026", "eleições 2026", "lula", "bolsonaro",
  "tarcísio", "tarcisio", "marçal", "pablo marçal", "ratinho",
  "ciro gomes", "alckmin", "eleitorado", "corrida presidencial",
  "disputa presidencial", "pleito",
];

// ─── Termos eleitorais amplos (notícias de contexto eleitoral) ────────────────────────────────────────────
const TERMOS_ELEITORAIS_AMPLOS = [
  "eleições 2026", "eleição 2026", "campanha eleitoral", "campanha de 2026",
  "pré-candidato à presidência", "pré-candidatura à presidência",
  "candidatura à presidência", "candidatura ao governo", "candidatura ao senado",
  "corrida presidencial", "disputa presidencial 2026", "disputa ao governo 2026",
  "corrida ao governo 2026", "chapa eleitoral", "coligação eleitoral",
  "filiação partidária 2026", "convenção partidária", "janela partidária",
  "reforma eleitoral", "calendário eleitoral", "tribunal superior eleitoral",
  "urna eletrônica", "debate presidencial", "debate eleitoral 2026",
  "pré-candidato ao governo", "pré-candidato ao senado",
];

// ─── Termos de candidatos 2026 ────────────────────────────────────────────────
const TERMOS_CANDIDATOS = [
  "lula 2026", "bolsonaro 2026", "tarcísio de freitas", "tarcisio de freitas",
  "pablo marçal", "ratinho junior 2026", "ciro gomes 2026",
  "simone tebet 2026", "flávio bolsonaro 2026",
  "pt 2026", "pl 2026", "novo 2026", "psol 2026", "mdb 2026",
];

// ─── Detectar categoria ───────────────────────────────────────────────────────
function detectarCategoria(texto: string): Categoria {
  const t = texto.toLowerCase();
  if (
    t.includes("presidente") || t.includes("presidencial") || t.includes("presidência") ||
    t.includes("lula") || t.includes("bolsonaro") || t.includes("tarcísio") ||
    t.includes("tarcisio") || t.includes("marçal") || t.includes("ciro gomes") ||
    t.includes("disputa presidencial") || t.includes("corrida presidencial") ||
    t.includes("candidatura à presidência")
  ) return "presidente";
  if (
    t.includes("governador") || t.includes("governo estadual") || t.includes("governo do estado") ||
    t.includes("ratinho") || t.includes("candidatura ao governo") || t.includes("disputa ao governo")
  ) return "governador";
  if (
    t.includes("senador") || t.includes("senado") || t.includes("vaga no senado") ||
    t.includes("candidatura ao senado")
  ) return "senador";
  return "geral";
}

function contemTermo(texto: string, termos: string[]): boolean {
  const t = texto.toLowerCase();
  return termos.some(termo => t.includes(termo));
}

// ─── Filtro em duas camadas ───────────────────────────────────────────────────
function filtroValido(titulo: string, resumo: string): boolean {
  const texto = `${titulo} ${resumo}`;
  // Camada 1: pesquisa + eleitoral (filtro principal)
  if (contemTermo(texto, TERMOS_PESQUISA) && contemTermo(texto, TERMOS_ELEITORAIS_PESQUISA)) return true;
  // Camada 2: contexto eleitoral amplo
  if (contemTermo(texto, TERMOS_ELEITORAIS_AMPLOS)) return true;
  // Camada 3: candidatos 2026
  if (contemTermo(texto, TERMOS_CANDIDATOS)) return true;
  return false;
}

// ─── Limpeza de HTML e entidades ─────────────────────────────────────────────
function limparTexto(texto: unknown): string {
  if (!texto) return "";
  const str = typeof texto === "string" ? texto : JSON.stringify(texto);
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

interface RssItem {
  titulo: string;
  url: string;
  resumo: string;
  dataPublicacao: Date | null;
}

// ─── Extrai link de diferentes formatos RSS/Atom ──────────────────────────────
function extrairLink(item: any): string {
  if (typeof item.link === "string") return item.link;
  if (item.link?.__cdata) return item.link.__cdata;
  if (item.link?.["@_href"]) return item.link["@_href"];
  if (Array.isArray(item.link)) {
    const alt = item.link.find((l: any) => l["@_rel"] === "alternate" || !l["@_rel"]);
    return alt?.["@_href"] || item.link[0]?.["@_href"] || "";
  }
  if (item.guid?.__cdata) return item.guid.__cdata;
  if (typeof item.guid === "string") return item.guid;
  return "";
}

// ─── Parser de feed RSS ───────────────────────────────────────────────────────
async function parsearFeed(feedUrl: string, nomeFonte: string): Promise<RssItem[]> {
  try {
    const resp = await axios.get(feedUrl, {
      timeout: 15000,
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

    const parsed = parser.parse(resp.data as string);
    const channel =
      parsed?.rss?.channel ||
      parsed?.feed ||
      parsed?.["rdf:RDF"]?.channel ||
      null;

    if (!channel) {
      console.warn(`[RSS] ${nomeFonte}: estrutura de feed não reconhecida`);
      return [];
    }

    const items: any[] = Array.isArray(channel.item)
      ? channel.item
      : channel.item ? [channel.item]
      : Array.isArray(channel.entry) ? channel.entry
      : channel.entry ? [channel.entry] : [];

    return items.map((item): RssItem => {
      const titulo = limparTexto(item.title?.__cdata || item.title || "");
      const link = extrairLink(item);
      const descricao = limparTexto(
        item.description?.__cdata || item.description ||
        item.summary?.__cdata || item.summary ||
        item["content:encoded"]?.__cdata || ""
      );
      const pubDate = item.pubDate || item.published || item.updated || item["dc:date"] || null;
      let dataPublicacao: Date | null = null;
      if (pubDate) {
        const d = new Date(typeof pubDate === "string" ? pubDate : String(pubDate));
        if (!isNaN(d.getTime())) dataPublicacao = d;
      }
      return { titulo, url: link.trim(), resumo: descricao.slice(0, 500), dataPublicacao };
    }).filter(i => i.titulo && i.url);
  } catch (err: any) {
    console.error(`[RSS] Erro ao buscar ${nomeFonte} (${feedUrl}): ${err.message}`);
    return [];
  }
}

// ─── Buscar e persistir notícias ──────────────────────────────────────────────
export async function buscarEPersistirNoticias(diasAtras = 1): Promise<{
  total: number;
  inseridas: number;
  fontes: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasAtras);

  let totalEncontradas = 0;
  let totalInseridas = 0;
  const porFonte: Record<string, number> = {};

  for (const feed of FEEDS) {
    const items = await parsearFeed(feed.url, feed.nome);
    const relevantes = items.filter((item) => {
      if (item.dataPublicacao && item.dataPublicacao < dataLimite) return false;
      return filtroValido(item.titulo, item.resumo);
    });

    totalEncontradas += relevantes.length;

    for (const item of relevantes) {
      const categoria = detectarCategoria(`${item.titulo} ${item.resumo}`);
      try {
        const result = await db.execute(sql`
          INSERT IGNORE INTO noticias (titulo, url, fonte, data_publicacao, resumo, categoria)
          VALUES (
            ${item.titulo},
            ${item.url},
            ${feed.nome},
            ${item.dataPublicacao ?? new Date()},
            ${item.resumo},
            ${categoria}
          )
        `);
        const affected = (result as any)[0]?.affectedRows ?? 0;
        if (affected > 0) {
          totalInseridas++;
          porFonte[feed.nome] = (porFonte[feed.nome] || 0) + 1;
        }
      } catch (err: any) {
        // Silencia duplicatas
      }
    }
  }

  // Registrar atualização
  try {
    const fontesList = Object.entries(porFonte)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    await db.insert(atualizacoes).values({
      tipo: "rss",
      descricao: `Busca RSS (${diasAtras}d) — ${totalEncontradas} encontradas, ${totalInseridas} novas${fontesList ? ` (${fontesList})` : ""}`,
      qtdInseridas: totalInseridas,
    });
  } catch (err: any) {
    console.error(`[RSS] Erro ao registrar atualização: ${err.message}`);
  }

  return { total: totalEncontradas, inseridas: totalInseridas, fontes: porFonte };
}

// ─── Carga histórica: últimos N dias ─────────────────────────────────────────
export async function cargaHistorica(dias = 30): Promise<{
  total: number;
  inseridas: number;
  fontes: Record<string, number>;
}> {
  return buscarEPersistirNoticias(dias);
}

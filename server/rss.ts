import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { getDb } from "./db";
import { noticias, atualizacoes } from "../drizzle/schema";
import type { Categoria } from "../drizzle/schema";
import { sql } from "drizzle-orm";

// ─── Feeds RSS configurados ───────────────────────────────────────────────────
export const FEEDS: { nome: string; url: string }[] = [
  { nome: "Poder360", url: "https://www.poder360.com.br/feed/" },
  { nome: "Folha",    url: "https://feeds.folha.uol.com.br/poder/rss091.xml" },
  { nome: "G1",       url: "https://g1.globo.com/rss/g1/politica/feed.xml" },
  { nome: "CNN",      url: "https://www.cnnbrasil.com.br/politica/feed/" },
  { nome: "Metrópoles", url: "https://www.metropoles.com/feed" },
  { nome: "Veja",     url: "https://veja.abril.com.br/feed/" },
  { nome: "Exame",    url: "https://exame.com/feed/" },
  { nome: "Gazeta do Povo", url: "https://www.gazetadopovo.com.br/feed/politica/" },
];

// ─── Termos de filtro duplo ───────────────────────────────────────────────────
const TERMOS_PESQUISA = [
  "pesquisa", "sondagem", "instituto", "datafolha", "quaest", "ipec",
  "ibope", "atlas", "paraná pesquisas", "real time big data", "btg",
  "genial", "mda", "opinion box", "levantamento", "intenção de voto",
  "aprovação", "rejeição", "popularidade",
];

const TERMOS_ELEITORAIS = [
  "eleição", "eleitoral", "candidato", "presidente", "presidencial",
  "governador", "senador", "senado", "câmara", "deputado", "voto",
  "urna", "2026", "lula", "bolsonaro", "tarcísio", "marçal",
  "ratinho", "ciro", "alckmin", "eleitorado",
];

// ─── Mapeamento de categoria por termos ──────────────────────────────────────
function detectarCategoria(texto: string): Categoria {
  const t = texto.toLowerCase();
  if (t.includes("presidente") || t.includes("presidencial") || t.includes("presidência")) return "presidente";
  if (t.includes("governador") || t.includes("governo estadual")) return "governador";
  if (t.includes("senador") || t.includes("senado")) return "senador";
  return "geral";
}

function contemTermo(texto: string, termos: string[]): boolean {
  const t = texto.toLowerCase();
  return termos.some(termo => t.includes(termo));
}

function filtroValido(titulo: string, resumo: string): boolean {
  const texto = `${titulo} ${resumo}`;
  return contemTermo(texto, TERMOS_PESQUISA) && contemTermo(texto, TERMOS_ELEITORAIS);
}

// ─── Limpeza de HTML e entidades ─────────────────────────────────────────────
function limparTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .trim();
}

interface RssItem {
  titulo: string;
  url: string;
  resumo: string;
  dataPublicacao: Date | null;
}

// ─── Parser de feed RSS ───────────────────────────────────────────────────────
async function parsearFeed(feedUrl: string): Promise<RssItem[]> {
  try {
    const resp = await axios.get(feedUrl, {
      timeout: 12000,
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
      parseTagValue: true,
      trimValues: true,
    });

    const result = parser.parse(resp.data);
    const channel = result?.rss?.channel || result?.feed;
    if (!channel) return [];

    const items: RssItem[] = [];
    const rawItems = channel.item || channel.entry || [];
    const lista = Array.isArray(rawItems) ? rawItems : [rawItems];

    for (const item of lista) {
      const titulo = limparTexto(
        item.title?.__cdata || item.title || ""
      );
      const url =
        item.link?.__cdata ||
        (typeof item.link === "string" ? item.link : "") ||
        item.id ||
        "";
      const resumo = limparTexto(
        item.description?.__cdata ||
        item.description ||
        item.summary?.__cdata ||
        item.summary ||
        item["content:encoded"]?.__cdata ||
        ""
      ).slice(0, 500);

      const pubDateStr =
        item.pubDate || item.published || item.updated || item["dc:date"] || "";
      let dataPublicacao: Date | null = null;
      if (pubDateStr) {
        const d = new Date(pubDateStr);
        if (!isNaN(d.getTime())) dataPublicacao = d;
      }

      if (titulo && url) {
        items.push({ titulo, url, resumo, dataPublicacao });
      }
    }

    return items;
  } catch {
    return [];
  }
}

// ─── Busca principal nos feeds ────────────────────────────────────────────────
export async function buscarEPersistirNoticias(): Promise<{
  total: number;
  inseridas: number;
  fontes: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados não disponível");

  let totalEncontradas = 0;
  let totalInseridas = 0;
  const fontes: Record<string, number> = {};

  for (const feed of FEEDS) {
    const items = await parsearFeed(feed.url);

    for (const item of items) {
      if (!filtroValido(item.titulo, item.resumo)) continue;

      totalEncontradas++;
      const categoria = detectarCategoria(`${item.titulo} ${item.resumo}`);

      try {
        // INSERT IGNORE via onDuplicateKeyUpdate sem alterar nada
        const result = await db.execute(
          sql`INSERT IGNORE INTO noticias (titulo, url, fonte, data_publicacao, resumo, categoria)
              VALUES (${item.titulo}, ${item.url}, ${feed.nome},
                      ${item.dataPublicacao}, ${item.resumo}, ${categoria})`
        );

        // affectedRows === 1 significa que foi inserido (não era duplicata)
        const affected = (result as any)[0]?.affectedRows ?? 0;
        if (affected > 0) {
          totalInseridas++;
          fontes[feed.nome] = (fontes[feed.nome] || 0) + 1;
        }
      } catch {
        // ignora erros individuais de inserção
      }
    }
  }

  // Registrar atualização
  await db.insert(atualizacoes).values({
    tipo: "rss",
    descricao: `Busca RSS automática — ${totalEncontradas} encontradas, ${totalInseridas} novas`,
    qtdInseridas: totalInseridas,
  });

  return { total: totalEncontradas, inseridas: totalInseridas, fontes };
}

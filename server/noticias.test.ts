import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock do módulo db ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
  getNoticias: vi.fn().mockResolvedValue([
    {
      id: 1,
      titulo: "Datafolha: Lula lidera com 34% das intenções de voto",
      url: "https://folha.uol.com.br/noticias/1",
      fonte: "Folha",
      dataPublicacao: new Date("2026-04-10T10:00:00Z"),
      resumo: "Pesquisa Datafolha divulgada hoje mostra Lula à frente.",
      categoria: "presidente",
      criadoEm: new Date(),
    },
    {
      id: 2,
      titulo: "Quaest: Tarcísio lidera em SP com 55%",
      url: "https://g1.globo.com/noticias/2",
      fonte: "G1",
      dataPublicacao: new Date("2026-04-09T14:00:00Z"),
      resumo: "Instituto Quaest aponta Tarcísio com ampla vantagem.",
      categoria: "governador",
      criadoEm: new Date(),
    },
  ]),
  getFontesNoticias: vi.fn().mockResolvedValue(["Folha", "G1", "Veja"]),
  getUltimaAtualizacao: vi.fn().mockResolvedValue({
    id: 1,
    tipo: "rss",
    descricao: "Busca RSS automática — 10 encontradas, 2 novas",
    qtdInseridas: 2,
    criadoEm: new Date(),
  }),
  getPesquisas: vi.fn().mockResolvedValue([]),
  getPesquisaDetalhe: vi.fn().mockResolvedValue(null),
  getCandidatos: vi.fn().mockResolvedValue([]),
  getPrevisoesMapa: vi.fn().mockResolvedValue([]),
  getSenadores: vi.fn().mockResolvedValue([]),
  getPrevisoesSenado: vi.fn().mockResolvedValue([]),
  getEvolucaoPesquisas: vi.fn().mockResolvedValue([]),
}));

vi.mock("./rss", () => ({
  buscarEPersistirNoticias: vi.fn().mockResolvedValue({
    total: 10,
    inseridas: 3,
    fontes: { Folha: 2, G1: 1 },
  }),
  FEEDS: [
    { nome: "Folha", url: "https://feeds.folha.uol.com.br/poder/rss091.xml" },
    { nome: "G1", url: "https://g1.globo.com/dynamo/politica/rss2.xml" },
    { nome: "CNN Brasil", url: "https://www.cnnbrasil.com.br/feed/" },
  ],
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────
describe("noticias.listar", () => {
  it("retorna lista de notícias sem filtros", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.listar({});
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].titulo).toContain("Datafolha");
  });

  it("aceita filtro por categoria", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.listar({ categoria: "presidente" });
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("aceita filtro por fonte", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.listar({ fonte: "Folha" });
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe("noticias.buscarRSS", () => {
  it("dispara busca nos feeds e retorna resultado", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.buscarRSS();
    expect(result.total).toBe(10);
    expect(result.inseridas).toBe(3);
    expect(result.fontes).toEqual({ Folha: 2, G1: 1 });
  });
});

describe("noticias.ultimaAtualizacao", () => {
  it("retorna a última atualização registrada", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.ultimaAtualizacao();
    expect(result).not.toBeNull();
    expect(result?.tipo).toBe("rss");
    expect(result?.qtdInseridas).toBe(2);
  });
});

describe("noticias.fontes", () => {
  it("retorna lista de fontes disponíveis", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.fontes();
    expect(result).toContain("Folha");
    expect(result).toContain("G1");
  });
});

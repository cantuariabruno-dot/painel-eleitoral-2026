import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do banco de dados
vi.mock("./db", () => ({
  listarNoticias: vi.fn().mockResolvedValue([
    {
      id: 1,
      titulo: "Datafolha: Lula lidera com 40% das intenções de voto",
      url: "https://folha.uol.com.br/noticias/1",
      fonte: "Folha",
      dataPublicacao: new Date("2026-04-10T10:00:00Z"),
      resumo: "Pesquisa Datafolha divulgada hoje mostra Lula à frente na corrida presidencial.",
      categoria: "presidente",
      criadoEm: new Date(),
    },
    {
      id: 2,
      titulo: "Quaest: Tarcísio lidera em São Paulo com 55%",
      url: "https://g1.globo.com/noticias/2",
      fonte: "G1",
      dataPublicacao: new Date("2026-04-09T14:00:00Z"),
      resumo: "Instituto Quaest aponta Tarcísio de Freitas com ampla vantagem para governador.",
      categoria: "governador",
      criadoEm: new Date(),
    },
  ]),
  contarNoticias: vi.fn().mockResolvedValue(2),
  ultimaAtualizacao: vi.fn().mockResolvedValue({
    id: 1,
    tipo: "rss",
    descricao: "Busca RSS automática — 10 encontradas, 2 novas",
    qtdInseridas: 2,
    criadoEm: new Date(),
  }),
  listarAtualizacoes: vi.fn().mockResolvedValue([]),
  fontesDiponiveis: vi.fn().mockResolvedValue(["Folha", "G1"]),
}));

vi.mock("./rss", () => ({
  buscarEPersistirNoticias: vi.fn().mockResolvedValue({
    total: 10,
    inseridas: 3,
    fontes: { Folha: 2, G1: 1 },
  }),
  FEEDS: [
    { nome: "Folha", url: "https://feeds.folha.uol.com.br/poder/rss091.xml" },
    { nome: "G1", url: "https://g1.globo.com/rss/g1/politica/feed.xml" },
  ],
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("noticias.listar", () => {
  it("retorna lista de notícias sem filtros", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.listar({ limite: 50, offset: 0 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items[0].titulo).toContain("Datafolha");
  });

  it("aceita filtro por categoria", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.listar({
      categoria: "presidente",
      limite: 50,
      offset: 0,
    });

    expect(result.items).toBeDefined();
  });

  it("aceita filtro por fonte", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.listar({
      fonte: "Folha",
      limite: 50,
      offset: 0,
    });

    expect(result.items).toBeDefined();
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

describe("noticias.feedsConfigurados", () => {
  it("retorna os feeds RSS configurados", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.noticias.feedsConfigurados();

    expect(result).toContain("Folha");
    expect(result).toContain("G1");
  });
});

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Newspaper,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Clock,
  BarChart2,
  Globe,
  TrendingUp,
  Users,
  Building2,
  Landmark,
  ListFilter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Categoria = "presidente" | "governador" | "senador" | "geral" | undefined;

const CATEGORIAS: { value: Categoria; label: string; icon: React.ReactNode; color: string }[] = [
  { value: undefined, label: "Todas", icon: <ListFilter className="w-4 h-4" />, color: "text-foreground" },
  { value: "presidente", label: "Presidente", icon: <TrendingUp className="w-4 h-4" />, color: "text-blue-400" },
  { value: "governador", label: "Governador", icon: <Building2 className="w-4 h-4" />, color: "text-purple-400" },
  { value: "senador", label: "Senado", icon: <Landmark className="w-4 h-4" />, color: "text-amber-400" },
  { value: "geral", label: "Geral", icon: <BarChart2 className="w-4 h-4" />, color: "text-zinc-400" },
];

const FONTES_LOGOS: Record<string, { sigla: string; bg: string }> = {
  "Poder360":      { sigla: "P360", bg: "bg-red-700" },
  "Folha":         { sigla: "FSP", bg: "bg-rose-700" },
  "G1":            { sigla: "G1",  bg: "bg-red-600" },
  "CNN":           { sigla: "CNN", bg: "bg-red-800" },
  "Metrópoles":    { sigla: "MET", bg: "bg-indigo-700" },
  "Veja":          { sigla: "VEJ", bg: "bg-blue-700" },
  "Exame":         { sigla: "EXM", bg: "bg-emerald-700" },
  "Gazeta do Povo":{ sigla: "GZP", bg: "bg-slate-600" },
};

function categoriaLabel(cat: string) {
  const map: Record<string, string> = {
    presidente: "Presidente",
    governador: "Governador",
    senador: "Senado",
    geral: "Geral",
  };
  return map[cat] || cat;
}

function categoriaBadgeClass(cat: string) {
  const map: Record<string, string> = {
    presidente: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    governador: "bg-purple-500/15 text-purple-400 border border-purple-500/25",
    senador: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    geral: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/25",
  };
  return map[cat] || map.geral;
}

function tempoRelativo(data: Date | string | null): string {
  if (!data) return "Data desconhecida";
  const d = new Date(data);
  const agora = new Date();
  const diff = agora.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const dias = Math.floor(h / 24);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `${min}min atrás`;
  if (h < 24) return `${h}h atrás`;
  if (dias === 1) return "ontem";
  if (dias < 7) return `${dias}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Home() {
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria>(undefined);
  const [fonteFiltro, setFonteFiltro] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Queries
  const { data: noticiasData, isLoading, refetch } = trpc.noticias.listar.useQuery({
    categoria: categoriaFiltro,
    fonte: fonteFiltro,
    limite: 60,
    offset: 0,
  });

  const { data: ultimaAtualizacao, refetch: refetchAtualizacao } =
    trpc.noticias.ultimaAtualizacao.useQuery();

  const { data: fontes = [] } = trpc.noticias.fontes.useQuery();

  // Mutation: buscar RSS
  const buscarRSS = trpc.noticias.buscarRSS.useMutation({
    onSuccess: (resultado) => {
      toast.success(
        `Atualização concluída — ${resultado.inseridas} nova${resultado.inseridas !== 1 ? "s" : ""} notícia${resultado.inseridas !== 1 ? "s" : ""}`,
        { description: `${resultado.total} encontradas nos feeds RSS` }
      );
      refetch();
      refetchAtualizacao();
    },
    onError: () => {
      toast.error("Erro ao buscar notícias", {
        description: "Verifique a conexão e tente novamente.",
      });
    },
  });

  const handleBuscarRSS = useCallback(() => {
    buscarRSS.mutate();
  }, [buscarRSS]);

  const noticias = noticiasData?.items ?? [];
  const total = noticiasData?.total ?? 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0
          ${sidebarOpen ? "w-64" : "w-16"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">🇧🇷</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
                Painel Eleitoral
              </p>
              <p className="text-xs text-muted-foreground">Brasil 2026</p>
            </div>
          )}
        </div>

        {/* Navegação por categoria */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {sidebarOpen && (
              <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cargo
              </p>
            )}
            {CATEGORIAS.map((cat) => (
              <button
                key={String(cat.value)}
                onClick={() => setCategoriaFiltro(cat.value)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${categoriaFiltro === cat.value
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }
                `}
              >
                <span className={cat.color}>{cat.icon}</span>
                {sidebarOpen && <span>{cat.label}</span>}
                {sidebarOpen && categoriaFiltro === cat.value && (
                  <ChevronRight className="w-3 h-3 ml-auto text-primary" />
                )}
              </button>
            ))}

            {sidebarOpen && fontes.length > 0 && (
              <>
                <Separator className="my-3 bg-sidebar-border" />
                <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fonte
                </p>
                <button
                  onClick={() => setFonteFiltro(undefined)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${!fonteFiltro
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>Todas</span>
                </button>
                {fontes.map((fonte) => {
                  const meta = FONTES_LOGOS[fonte];
                  return (
                    <button
                      key={fonte}
                      onClick={() => setFonteFiltro(fonte)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${fonteFiltro === fonte
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }
                      `}
                    >
                      {meta ? (
                        <span className={`w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center shrink-0 text-white ${meta.bg}`}>
                          {meta.sigla.slice(0, 3)}
                        </span>
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span className="truncate">{fonte}</span>
                    </button>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Toggle sidebar */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* ── Conteúdo principal ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              {categoriaFiltro
                ? CATEGORIAS.find(c => c.value === categoriaFiltro)?.label
                : "Todas as Pesquisas"}
              {fonteFiltro && (
                <span className="ml-2 text-muted-foreground font-normal text-base">
                  · {fonteFiltro}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Carregando..." : `${total} notícia${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de última atualização */}
            {ultimaAtualizacao && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  Atualizado {tempoRelativo(ultimaAtualizacao.criadoEm)}
                </span>
                {ultimaAtualizacao.qtdInseridas > 0 && (
                  <span className="text-xs text-primary font-medium">
                    · {ultimaAtualizacao.qtdInseridas} nova{ultimaAtualizacao.qtdInseridas !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}

            <Button
              onClick={handleBuscarRSS}
              disabled={buscarRSS.isPending}
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${buscarRSS.isPending ? "animate-spin" : ""}`} />
              {buscarRSS.isPending ? "Buscando..." : "Atualizar feeds"}
            </Button>
          </div>
        </header>

        {/* Grid de notícias */}
        <ScrollArea className="flex-1">
          <main className="p-6">
            {isLoading ? (
              <LoadingSkeleton />
            ) : noticias.length === 0 ? (
              <EmptyState onBuscar={handleBuscarRSS} isPending={buscarRSS.isPending} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {noticias.map((noticia) => (
                  <NoticiaCard key={noticia.id} noticia={noticia} />
                ))}
              </div>
            )}
          </main>
        </ScrollArea>

        {/* Footer com stats */}
        <footer className="px-6 py-3 border-t border-border bg-card/30 shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                {total} notícias
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {fontes.length} fontes ativas
              </span>
            </div>
            <span>Painel Eleitoral Brasil 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Card de notícia ──────────────────────────────────────────────────────────
function NoticiaCard({ noticia }: { noticia: any }) {
  const meta = FONTES_LOGOS[noticia.fonte] || { sigla: noticia.fonte.slice(0, 3).toUpperCase(), bg: "bg-zinc-600" };

  return (
    <a
      href={noticia.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Header do card */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 text-white ${meta.bg}`}>
            {meta.sigla.slice(0, 3)}
          </span>
          <div>
            <span className="text-xs font-semibold text-foreground">{noticia.fonte}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{tempoRelativo(noticia.dataPublicacao)}</span>
            </div>
          </div>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>

      {/* Título */}
      <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-3 group-hover:text-primary/90 transition-colors">
        {noticia.titulo}
      </h3>

      {/* Resumo */}
      {noticia.resumo && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
          {noticia.resumo}
        </p>
      )}

      {/* Badge de categoria */}
      <div className="mt-auto">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${categoriaBadgeClass(noticia.categoria)}`}>
          {categoriaLabel(noticia.categoria)}
        </span>
      </div>
    </a>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-2.5 w-14 bg-muted rounded" />
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-3.5 bg-muted rounded w-full" />
            <div className="h-3.5 bg-muted rounded w-5/6" />
            <div className="h-3.5 bg-muted rounded w-4/6" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 bg-muted rounded w-full" />
            <div className="h-2.5 bg-muted rounded w-3/4" />
          </div>
          <div className="mt-3 h-5 w-20 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────
function EmptyState({ onBuscar, isPending }: { onBuscar: () => void; isPending: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Newspaper className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Nenhuma notícia encontrada
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Clique em "Atualizar feeds" para buscar as últimas pesquisas eleitorais nos portais configurados.
      </p>
      <Button
        onClick={onBuscar}
        disabled={isPending}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Buscando..." : "Buscar agora"}
      </Button>
    </div>
  );
}

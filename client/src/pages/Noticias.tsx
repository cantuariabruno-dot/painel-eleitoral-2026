import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Newspaper, RefreshCw, ExternalLink, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Categoria = "presidente" | "governador" | "senador" | "geral";

const CATEGORIAS: { value: Categoria | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "presidente", label: "Presidente" },
  { value: "governador", label: "Governador" },
  { value: "senador", label: "Senado" },
  { value: "geral", label: "Geral" },
];

const BADGE_CORES: Record<string, string> = {
  presidente: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  governador: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  senador: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  geral: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function tempoRelativo(data: Date | string | null): string {
  if (!data) return "";
  const d = new Date(data);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const SIGLAS: Record<string, string> = {
  "Folha": "FSP",
  "G1": "G1",
  "CNN Brasil": "CNN",
  "Poder360": "P36",
  "Veja": "VEJ",
  "Exame": "EXM",
  "Metrópoles": "MET",
  "Gazeta do Povo": "GPV",
  "Agência Brasil": "ABR",
};

const CORES_FONTE: Record<string, string> = {
  "Folha": "bg-red-700",
  "G1": "bg-red-600",
  "CNN Brasil": "bg-slate-700",
  "Poder360": "bg-blue-700",
  "Veja": "bg-blue-800",
  "Exame": "bg-blue-600",
  "Metrópoles": "bg-violet-700",
  "Gazeta do Povo": "bg-green-700",
  "Agência Brasil": "bg-teal-700",
};

export default function Noticias() {
  const [categoria, setCategoria] = useState<Categoria | "todas">("todas");
  const [fonte, setFonte] = useState<string>("todas");

  const { data: fontesData } = trpc.noticias.fontes.useQuery();
  const { data: ultimaAtualizacao } = trpc.noticias.ultimaAtualizacao.useQuery();
  const { data, isLoading, refetch } = trpc.noticias.listar.useQuery({
    categoria: categoria === "todas" ? undefined : categoria,
    fonte: fonte === "todas" ? undefined : fonte,
    limite: 50,
    offset: 0,
  });

  const utils = trpc.useUtils();
  const buscarRSS = trpc.noticias.buscarRSS.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.inseridas} novas notícias adicionadas`);
      utils.noticias.invalidate();
    },
    onError: () => toast.error("Erro ao buscar notícias"),
  });

  const noticias = data?.items ?? [];
  const fontes = fontesData ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Notícias Eleitorais</h2>
          </div>
          <p className="text-white/50 text-sm">
            {ultimaAtualizacao
              ? `Atualizado ${tempoRelativo(ultimaAtualizacao.criadoEm)}`
              : "Feed de notícias eleitorais"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => buscarRSS.mutate()}
          disabled={buscarRSS.isPending}
          className="text-white/50 hover:text-white flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${buscarRSS.isPending ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros por categoria — chips horizontais */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 w-max">
          {CATEGORIAS.map(c => (
            <button
              key={c.value}
              onClick={() => setCategoria(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                categoria === c.value
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:bg-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros por fonte — chips horizontais */}
      {fontes.length > 0 && (
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setFonte("todas")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                fonte === "todas"
                  ? "bg-white/20 text-white border-white/20"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white/70"
              }`}
            >
              Todas
            </button>
            {fontes.map(f => (
              <button
                key={f}
                onClick={() => setFonte(f)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  fonte === f
                    ? "bg-white/20 text-white border-white/20"
                    : "bg-white/5 text-white/40 border-white/10 hover:text-white/70"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0 ${
                    CORES_FONTE[f] || "bg-slate-600"
                  }`}
                >
                  {(SIGLAS[f] || f.slice(0, 3)).slice(0, 3)}
                </span>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de notícias */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : noticias.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
          <div className="text-5xl mb-4">📰</div>
          <h3 className="text-white/70 font-semibold mb-2">Nenhuma notícia encontrada</h3>
          <p className="text-white/40 text-sm mb-4">
            Clique em "Atualizar" para buscar as últimas notícias nos feeds RSS.
          </p>
          <Button
            onClick={() => buscarRSS.mutate()}
            disabled={buscarRSS.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${buscarRSS.isPending ? "animate-spin" : ""}`} />
            Buscar notícias agora
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {noticias.map(n => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Avatar da fonte */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    CORES_FONTE[n.fonte] || "bg-slate-600"
                  }`}
                >
                  {(SIGLAS[n.fonte] || n.fonte.slice(0, 3)).slice(0, 3)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-xs text-white/40 flex items-center gap-2">
                      <span className="font-medium text-white/60">{n.fonte}</span>
                      {n.dataPublicacao && (
                        <>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          {tempoRelativo(n.dataPublicacao)}
                        </>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-colors" />
                  </div>

                  <h4 className="text-white text-sm font-medium leading-snug mb-2 group-hover:text-white/90">
                    {n.titulo}
                  </h4>

                  {n.resumo && (
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                      {n.resumo}
                    </p>
                  )}

                  <div className="mt-2">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                        BADGE_CORES[n.categoria] || BADGE_CORES.geral
                      }`}
                    >
                      {n.categoria.charAt(0).toUpperCase() + n.categoria.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

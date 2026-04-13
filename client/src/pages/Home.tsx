import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import { MapaPresidencial } from "@/components/MapaPresidencial";
import { GraficoEvolucao } from "@/components/GraficoEvolucao";
import { CardPesquisa } from "@/components/CardPesquisa";
import { Loader2, RefreshCw, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Home() {
  const { data: candidatos, isLoading: loadingCand } = trpc.candidatos.listar.useQuery(
    { cargo: "presidente" }
  );
  const { data: pesquisas, isLoading: loadingPesq } = trpc.pesquisas.listar.useQuery(
    { cargo: "presidente", limite: 6 }
  );
  const { data: evolucao } = trpc.pesquisas.evolucao.useQuery(
    { cargo: "presidente", turno: "1" }
  );
  const { data: previsoes } = trpc.previsoes.mapa.useQuery({ cargo: "presidente" });
  const { data: ultimaAtualizacao } = trpc.noticias.ultimaAtualizacao.useQuery();

  // Buscar detalhes (com intenções de voto) da pesquisa mais recente de 1º turno
  const pesquisaMaisRecenteId = useMemo(() => {
    if (!pesquisas) return undefined;
    const primeiroTurno = pesquisas.filter(p => p.turno === "1");
    return primeiroTurno.length > 0 ? primeiroTurno[0].id : undefined;
  }, [pesquisas]);

  const { data: pesquisaDetalhada } = trpc.pesquisas.detalhe.useQuery(
    { id: pesquisaMaisRecenteId! },
    { enabled: !!pesquisaMaisRecenteId }
  );

  const utils = trpc.useUtils();
  const buscarRSS = trpc.noticias.buscarRSS.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.inseridas} novas notícias adicionadas`);
      utils.noticias.invalidate();
    },
    onError: () => toast.error("Erro ao buscar notícias"),
  });

  // Montar ranking com percentuais da pesquisa mais recente
  const ranking = useMemo(() => {
    if (!candidatos) return [];
    const intencoes = pesquisaDetalhada?.intencoes ?? [];
    const mapa = new Map(intencoes.map(iv => [iv.candidatoId, Number(iv.percentual)]));
    const comPct = candidatos.map(c => ({
      ...c,
      pct: mapa.get(c.id) ?? null,
    }));
    // Ordenar: com percentual primeiro (desc), depois sem
    return comPct.sort((a, b) => {
      if (a.pct !== null && b.pct !== null) return b.pct - a.pct;
      if (a.pct !== null) return -1;
      if (b.pct !== null) return 1;
      return 0;
    });
  }, [candidatos, pesquisaDetalhada]);

  const loading = loadingCand || loadingPesq;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Corrida Presidencial</h2>
          </div>
          <p className="text-white/50 text-sm">
            Previsão baseada nas últimas pesquisas eleitorais
          </p>
        </div>
        {ultimaAtualizacao && (
          <div className="text-right text-xs text-white/40 flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Atualizado
            </div>
            <div>{new Date(ultimaAtualizacao.criadoEm).toLocaleDateString("pt-BR")}</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : (
        <>
          {/* Mapa + Candidatos */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Mapa */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">
                  Mapa de Previsão — 1º Turno
                </h3>
                <MapaPresidencial
                  previsoes={previsoes ?? []}
                  candidatos={candidatos ?? []}
                />
              </div>
            </div>

            {/* Ranking de candidatos */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                  Intenções de Voto
                </h3>
                {pesquisaDetalhada && (
                  <div className="text-xs text-white/30 text-right">
                    <div>{pesquisaDetalhada.instituto}</div>
                    <div>
                      {new Date(pesquisaDetalhada.dataColeta).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {ranking.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10"
                  >
                    <span className="text-white/30 text-xs font-mono w-4 text-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.corHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {c.nomeAbrev || c.nome}
                      </div>
                      <div className="text-white/40 text-xs">{c.partido}</div>
                    </div>
                    {c.pct !== null ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(c.pct, 60) / 60 * 100}%`, backgroundColor: c.corHex }}
                          />
                        </div>
                        <span className="text-white font-semibold text-sm w-9 text-right">
                          {c.pct}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-white/20 text-xs flex-shrink-0">—</span>
                    )}
                  </div>
                ))}
                {pesquisaDetalhada?.fonteUrl && (
                  <a
                    href={pesquisaDetalhada.fonteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-white/25 text-xs hover:text-white/50 transition-colors pt-1 justify-end"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver pesquisa original
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico de evolução */}
          {evolucao && evolucao.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">
                Evolução nas Pesquisas — 1º Turno
              </h3>
              <GraficoEvolucao dados={evolucao} />
            </div>
          )}

          {/* Últimas pesquisas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Últimas Pesquisas Divulgadas
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => buscarRSS.mutate()}
                disabled={buscarRSS.isPending}
                className="text-white/50 hover:text-white text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${buscarRSS.isPending ? "animate-spin" : ""}`} />
                Atualizar feeds
              </Button>
            </div>
            {pesquisas && pesquisas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pesquisas.map(p => (
                  <CardPesquisa key={p.id} pesquisa={p} />
                ))}
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                <div className="text-white/20 text-4xl mb-3">📊</div>
                <p className="text-white/40 text-sm">Nenhuma pesquisa cadastrada ainda.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { BarChart2, Loader2, Calendar, Users, ExternalLink } from "lucide-react";
import { GraficoEvolucao } from "@/components/GraficoEvolucao";

type Cargo = "presidente" | "governador" | "senador";
type Turno = "1" | "2";

const CARGOS: { value: Cargo; label: string }[] = [
  { value: "presidente", label: "Presidente" },
  { value: "governador", label: "Governador" },
  { value: "senador", label: "Senado" },
];

export default function Pesquisas() {
  const [cargo, setCargo] = useState<Cargo>("presidente");
  const [turno, setTurno] = useState<Turno>("1");

  const { data: pesquisas, isLoading } = trpc.pesquisas.listar.useQuery({
    cargo,
    limite: 30,
  });

  const { data: evolucao, isLoading: loadingEvolucao } = trpc.pesquisas.evolucao.useQuery({
    cargo,
    turno,
  });

  const cargoLabel: Record<Cargo, string> = {
    presidente: "Presidência",
    governador: "Governadores",
    senador: "Senado",
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Histórico de Pesquisas</h2>
        </div>
        <p className="text-white/50 text-sm">
          Evolução das intenções de voto ao longo do tempo
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {CARGOS.map(c => (
            <button
              key={c.value}
              onClick={() => setCargo(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                cargo === c.value
                  ? "bg-violet-500 text-white border-violet-500"
                  : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["1", "2"] as Turno[]).map(t => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                turno === t
                  ? "bg-white/20 text-white border-white/20"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white/70"
              }`}
            >
              {t}º Turno
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : (
        <>
          {/* Gráfico de evolução */}
          {evolucao && evolucao.length > 0 ? (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
                Evolução — {cargoLabel[cargo]} · {turno}º Turno
              </h3>
              <GraficoEvolucao dados={evolucao} />
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
              <div className="text-4xl mb-3">📈</div>
              <p className="text-white/40 text-sm">
                O gráfico será exibido após o cadastro de pesquisas com intenções de voto.
              </p>
            </div>
          )}

          {/* Tabela de pesquisas */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Pesquisas Cadastradas ({pesquisas?.length ?? 0})
              </h3>
            </div>

            {pesquisas && pesquisas.length > 0 ? (
              <div className="divide-y divide-white/5">
                {pesquisas.map(p => {
                  const data = typeof p.dataColeta === "string"
                    ? new Date(p.dataColeta + "T12:00:00")
                    : new Date(p.dataColeta);
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{p.instituto}</div>
                        <div className="text-white/40 text-xs mt-0.5 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {p.tamanhoAmostra && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {p.tamanhoAmostra.toLocaleString("pt-BR")}
                            </span>
                          )}
                          {p.margemErro && (
                            <span>±{p.margemErro}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          {p.turno}º turno
                        </span>
                        {p.fonteUrl && (
                          <a
                            href={p.fonteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-white/70 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-white/40 text-sm">
                  Nenhuma pesquisa cadastrada para {cargoLabel[cargo]} ainda.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

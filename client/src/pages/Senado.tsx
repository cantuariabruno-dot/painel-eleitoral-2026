import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import MapaSenado from "@/components/MapaSenado";

// Cores por partido
const CORES_PARTIDO: Record<string, string> = {
  PT: "#e63946",
  PL: "#1d4ed8",
  MDB: "#f59e0b",
  UNIÃO: "#7c3aed",
  PP: "#0891b2",
  PSD: "#059669",
  REPUBLICANOS: "#dc2626",
  PDT: "#ea580c",
  PSDB: "#2563eb",
  PSOL: "#d946ef",
  PODE: "#16a34a",
  AVANTE: "#ca8a04",
  SOLIDARIEDADE: "#0284c7",
  PROS: "#9333ea",
  PSB: "#f97316",
  PCdoB: "#b91c1c",
  CIDADANIA: "#0d9488",
  AGIR: "#6d28d9",
  PMN: "#be185d",
  DC: "#065f46",
  PRTB: "#92400e",
  NOVO: "#1e40af",
  PATRIOTA: "#166534",
  PMB: "#7e22ce",
  PRD: "#0e7490",
  PSDC: "#9f1239",
  REDE: "#15803d",
  SOLIDAR: "#c2410c",
  DEFAULT: "#475569",
};

function getCorPartido(partido?: string | null): string {
  if (!partido) return CORES_PARTIDO.DEFAULT;
  const key = partido.toUpperCase().split("/")[0].trim();
  return CORES_PARTIDO[key] || CORES_PARTIDO.DEFAULT;
}

// Gera posições em semicírculo para N cadeiras
function gerarPosicoesSemicirculo(total: number, raioMin = 80, raioMax = 170, cx = 250, cy = 230) {
  const posicoes: { x: number; y: number; raio: number }[] = [];
  const fileiras = 4;
  const porFileira = Math.ceil(total / fileiras);

  let idx = 0;
  for (let f = 0; f < fileiras; f++) {
    const raio = raioMin + (f * (raioMax - raioMin)) / (fileiras - 1);
    const nesta = Math.min(porFileira, total - idx);
    for (let i = 0; i < nesta; i++) {
      const angulo = Math.PI + (i / (nesta - 1 || 1)) * Math.PI;
      posicoes.push({
        x: cx + raio * Math.cos(angulo),
        y: cy + raio * Math.sin(angulo),
        raio: 5.5,
      });
      idx++;
    }
  }
  return posicoes;
}

interface Cadeira {
  id: number;
  estadoUf: string;
  senadorNome?: string | null;
  partido?: string | null;
  corHex?: string | null;
  mandatoFim?: number | null;
  emDisputa2026: boolean;
  status: "atual" | "previsto" | "indefinido";
}

function SemicirculoSenado({ cadeiras }: { cadeiras: Cadeira[] }) {
  const [hover, setHover] = useState<Cadeira | null>(null);
  const posicoes = useMemo(() => gerarPosicoesSemicirculo(cadeiras.length), [cadeiras.length]);

  return (
    <div className="relative">
      <svg viewBox="60 50 380 200" className="w-full max-h-72">
        {/* Linha base */}
        <line x1="60" y1="230" x2="440" y2="230" stroke="#1e293b" strokeWidth="1" />

        {cadeiras.map((c, i) => {
          const pos = posicoes[i];
          if (!pos) return null;
          const cor = c.corHex || getCorPartido(c.partido);
          const destaque = c.emDisputa2026;
          return (
            <circle
              key={c.id}
              cx={pos.x}
              cy={pos.y}
              r={pos.raio}
              fill={cor}
              stroke={destaque ? "#fbbf24" : "transparent"}
              strokeWidth={destaque ? 1.5 : 0}
              opacity={c.status === "indefinido" ? 0.35 : 0.9}
              className="cursor-pointer transition-all hover:opacity-100"
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {/* Contadores */}
        <text x="250" y="210" textAnchor="middle" fontSize="22" fontWeight="800" fill="white">
          {cadeiras.length}
        </text>
        <text x="250" y="224" textAnchor="middle" fontSize="8" fill="#64748b">
          SENADORES
        </text>
      </svg>

      {/* Tooltip */}
      {hover && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-xs pointer-events-none z-10 whitespace-nowrap shadow-xl">
          <div className="font-semibold text-white">{hover.senadorNome || "Vaga"}</div>
          <div className="text-white/50 mt-0.5">
            {hover.partido || "—"} · {hover.estadoUf}
            {hover.mandatoFim && ` · até ${hover.mandatoFim}`}
          </div>
          {hover.emDisputa2026 && (
            <div className="text-yellow-400 mt-0.5">Em disputa em 2026</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Senado() {
  const { data: cadeiras, isLoading } = trpc.senado.cadeiras.useQuery();

  const { emDisputa, mandatoAtual, porPartido } = useMemo(() => {
    if (!cadeiras) return { emDisputa: [], mandatoAtual: [], porPartido: [] };
    const emDisputa = cadeiras.filter(c => c.emDisputa2026);
    const mandatoAtual = cadeiras.filter(c => !c.emDisputa2026);
    const contagem = new Map<string, { partido: string; cor: string; total: number; disputa: number }>();
    cadeiras.forEach(c => {
      const p = c.partido || "Indefinido";
      const cor = c.corHex || getCorPartido(c.partido);
      if (!contagem.has(p)) contagem.set(p, { partido: p, cor, total: 0, disputa: 0 });
      const entry = contagem.get(p)!;
      entry.total++;
      if (c.emDisputa2026) entry.disputa++;
    });
    const porPartido = Array.from(contagem.values()).sort((a, b) => b.total - a.total);
    return { emDisputa, mandatoAtual, porPartido };
  }, [cadeiras]);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Senado Federal 2026</h2>
        </div>
        <p className="text-white/50 text-sm">
          Composição atual e 54 vagas em disputa nas eleições de 2026
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : cadeiras && cadeiras.length > 0 ? (
        <>
          {/* Semicírculo parlamentar */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Composição do Senado
              </h3>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 border border-yellow-400" />
                  Em disputa 2026 ({emDisputa.length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  Mandato atual ({mandatoAtual.length})
                </span>
              </div>
            </div>
            <SemicirculoSenado cadeiras={cadeiras as Cadeira[]} />
          </div>

          {/* Mapa do Brasil — vagas em disputa por partido */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Mapa das Vagas em Disputa — 2026
              </h3>
              <span className="text-xs text-white/30">Cor = partido do senador atual</span>
            </div>
            <MapaSenado cadeiras={emDisputa} />
          </div>

          {/* Distribuição por partido */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
              Distribuição por Partido
            </h3>
            <div className="space-y-2">
              {porPartido.slice(0, 15).map(p => (
                <div key={p.partido} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.cor }}
                  />
                  <div className="text-white/70 text-sm w-28 truncate">{p.partido}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(p.total / 81) * 100}%`,
                        backgroundColor: p.cor,
                      }}
                    />
                  </div>
                  <div className="text-white/50 text-sm w-8 text-right">{p.total}</div>
                  {p.disputa > 0 && (
                    <div className="text-yellow-400/70 text-xs w-16">({p.disputa} vagas)</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vagas em disputa */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
              Vagas em Disputa em 2026 ({emDisputa.length} vagas)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {emDisputa.map(c => (
                <div
                  key={c.id}
                  className="bg-white/5 rounded-lg p-2.5 border border-yellow-400/20"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.corHex || getCorPartido(c.partido) }}
                    />
                    <span className="text-yellow-400 text-xs font-bold">{c.estadoUf}</span>
                  </div>
                  <div className="text-white/70 text-xs truncate">
                    {c.senadorNome || "Vaga aberta"}
                  </div>
                  <div className="text-white/30 text-xs">{c.partido || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
          <div className="text-5xl mb-4">🏛️</div>
          <h3 className="text-white/70 font-semibold mb-2">Dados do Senado em preparação</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Os dados dos 81 senadores serão carregados automaticamente após a execução do script de seed.
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

// Paths SVG simplificados dos estados brasileiros
// ViewBox: 0 0 1000 1100
const ESTADOS_SVG: Record<string, { path: string; label: [number, number] }> = {
  AC: {
    path: "M 95 580 L 185 555 L 215 575 L 220 600 L 175 625 L 110 615 Z",
    label: [155, 590],
  },
  AM: {
    path: "M 185 390 L 290 365 L 340 385 L 360 430 L 340 490 L 290 520 L 220 530 L 185 555 L 155 520 L 140 460 L 165 420 Z",
    label: [255, 455],
  },
  RR: {
    path: "M 245 270 L 310 250 L 345 280 L 340 340 L 295 360 L 255 345 L 230 310 Z",
    label: [290, 305],
  },
  PA: {
    path: "M 340 340 L 420 310 L 510 320 L 560 360 L 555 420 L 510 450 L 455 460 L 395 450 L 360 430 L 340 385 Z",
    label: [450, 390],
  },
  AP: {
    path: "M 510 250 L 560 240 L 580 280 L 565 320 L 520 330 L 500 300 Z",
    label: [540, 285],
  },
  TO: {
    path: "M 510 450 L 560 440 L 580 480 L 575 550 L 545 590 L 505 595 L 480 555 L 475 500 Z",
    label: [530, 520],
  },
  MA: {
    path: "M 555 360 L 620 340 L 660 365 L 665 410 L 635 445 L 580 450 L 560 420 Z",
    label: [615, 400],
  },
  PI: {
    path: "M 660 365 L 710 355 L 740 385 L 735 440 L 700 465 L 660 460 L 635 445 Z",
    label: [690, 415],
  },
  CE: {
    path: "M 740 330 L 800 320 L 830 350 L 820 395 L 775 410 L 740 390 L 730 360 Z",
    label: [780, 365],
  },
  RN: {
    path: "M 830 310 L 875 305 L 890 335 L 870 360 L 835 355 L 825 335 Z",
    label: [855, 335],
  },
  PB: {
    path: "M 820 360 L 870 355 L 885 380 L 860 400 L 820 395 Z",
    label: [850, 378],
  },
  PE: {
    path: "M 740 390 L 820 380 L 860 395 L 855 425 L 800 435 L 740 430 L 720 415 Z",
    label: [795, 412],
  },
  AL: {
    path: "M 855 420 L 885 415 L 890 440 L 865 450 L 845 440 Z",
    label: [867, 433],
  },
  SE: {
    path: "M 845 445 L 875 440 L 880 465 L 855 475 L 835 465 Z",
    label: [858, 458],
  },
  BA: {
    path: "M 660 460 L 720 445 L 800 440 L 840 465 L 845 520 L 820 580 L 770 620 L 700 635 L 640 610 L 600 570 L 595 510 L 620 475 Z",
    label: [720, 540],
  },
  MG: {
    path: "M 595 590 L 640 575 L 700 590 L 760 580 L 800 610 L 790 670 L 750 710 L 680 720 L 620 700 L 575 660 L 570 620 Z",
    label: [685, 650],
  },
  ES: {
    path: "M 800 610 L 840 605 L 850 645 L 830 675 L 795 670 L 790 640 Z",
    label: [820, 642],
  },
  RJ: {
    path: "M 750 710 L 800 695 L 830 720 L 815 750 L 770 755 L 745 735 Z",
    label: [787, 728],
  },
  SP: {
    path: "M 575 660 L 620 700 L 680 720 L 690 760 L 660 790 L 605 800 L 555 775 L 540 730 L 555 690 Z",
    label: [615, 740],
  },
  PR: {
    path: "M 540 790 L 605 800 L 655 820 L 645 860 L 600 875 L 545 860 L 510 830 Z",
    label: [580, 838],
  },
  SC: {
    path: "M 545 865 L 600 875 L 645 895 L 635 925 L 590 935 L 545 920 L 530 895 Z",
    label: [585, 900],
  },
  RS: {
    path: "M 500 920 L 545 925 L 590 940 L 600 985 L 570 1020 L 520 1030 L 475 1005 L 460 965 L 475 935 Z",
    label: [535, 975],
  },
  MS: {
    path: "M 480 700 L 540 690 L 575 720 L 570 780 L 540 820 L 490 820 L 455 790 L 450 745 Z",
    label: [513, 758],
  },
  MT: {
    path: "M 360 490 L 455 460 L 510 480 L 545 530 L 540 600 L 510 640 L 455 650 L 395 630 L 365 580 L 355 530 Z",
    label: [455, 560],
  },
  GO: {
    path: "M 510 590 L 575 580 L 600 610 L 595 670 L 555 700 L 500 700 L 475 665 L 480 620 Z",
    label: [538, 645],
  },
  DF: {
    path: "M 555 640 L 575 635 L 580 655 L 560 660 Z",
    label: [567, 648],
  },
  RO: {
    path: "M 290 520 L 360 490 L 390 520 L 385 570 L 350 595 L 295 585 L 275 555 Z",
    label: [335, 550],
  },
};

interface PrevisaoEstado {
  estadoUf: string;
  liderCor?: string | null;
  liderAbrev?: string | null;
  liderNome?: string | null;
  percentualLider?: string | null;
}

interface Candidato {
  id: number;
  nome: string;
  nomeAbrev?: string | null;
  partido?: string | null;
  corHex: string;
}

interface Props {
  previsoes: PrevisaoEstado[];
  candidatos: Candidato[];
}

export function MapaPresidencial({ previsoes, candidatos }: Props) {
  const [tooltip, setTooltip] = useState<{
    uf: string;
    x: number;
    y: number;
    prev?: PrevisaoEstado;
  } | null>(null);

  const previsoesPorEstado = new Map(previsoes.map(p => [p.estadoUf, p]));
  const corPadrao = "#1e293b";
  const corBorda = "#334155";

  const getCorEstado = (uf: string) => {
    const prev = previsoesPorEstado.get(uf);
    return prev?.liderCor || corPadrao;
  };

  const candidatosNoMapa = candidatos.filter(c =>
    previsoes.some(p => p.liderCor === c.corHex)
  );

  return (
    <div className="w-full">
      <svg
        viewBox="80 230 870 820"
        className="w-full"
        style={{ filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.5))" }}
      >
        {Object.entries(ESTADOS_SVG).map(([uf, { path, label }]) => {
          const cor = getCorEstado(uf);
          const prev = previsoesPorEstado.get(uf);
          const isDF = uf === "DF";
          return (
            <g key={uf}>
              <path
                d={path}
                fill={cor}
                stroke={corBorda}
                strokeWidth={isDF ? 0.5 : 1.5}
                opacity={cor === corPadrao ? 0.55 : 0.88}
                className="cursor-pointer transition-opacity hover:opacity-100"
                onMouseEnter={(e) => {
                  const svgEl = (e.target as SVGPathElement).closest("svg");
                  const rect = svgEl?.getBoundingClientRect();
                  setTooltip({ uf, x: label[0], y: label[1], prev });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {!isDF && (
                <text
                  x={label[0]}
                  y={label[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={uf === "RN" || uf === "AL" || uf === "SE" || uf === "PB" ? "9" : "11"}
                  fill={cor === corPadrao ? "#64748b" : "rgba(255,255,255,0.9)"}
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                  className="pointer-events-none select-none"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {uf}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 130), 870);
          const ty = Math.max(tooltip.y - 50, 240);
          const w = 110;
          const h = tooltip.prev ? 44 : 28;
          return (
            <g>
              <rect
                x={tx - w / 2}
                y={ty}
                width={w}
                height={h}
                rx={5}
                fill="#0f172a"
                stroke="#334155"
                strokeWidth={1}
                opacity={0.95}
              />
              <text
                x={tx}
                y={ty + 13}
                textAnchor="middle"
                fontSize="11"
                fill="white"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {tooltip.uf}
              </text>
              {tooltip.prev ? (
                <text
                  x={tx}
                  y={ty + 29}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="system-ui, sans-serif"
                >
                  {tooltip.prev.liderAbrev || tooltip.prev.liderNome || "—"}
                  {tooltip.prev.percentualLider ? ` · ${tooltip.prev.percentualLider}%` : ""}
                </text>
              ) : (
                <text
                  x={tx}
                  y={ty + 29}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#475569"
                  fontFamily="system-ui, sans-serif"
                >
                  Sem dados
                </text>
              )}
            </g>
          );
        })()}
      </svg>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {candidatosNoMapa.length > 0 ? (
          candidatosNoMapa.map(c => (
            <div key={c.id} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.corHex }} />
              <span className="text-white/60 text-xs">{c.nomeAbrev || c.nome}</span>
            </div>
          ))
        ) : (
          <p className="text-white/25 text-xs">
            O mapa será colorido conforme as pesquisas estaduais forem cadastradas
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: corPadrao, border: "1px solid #334155" }} />
          <span className="text-white/40 text-xs">Sem dados</span>
        </div>
      </div>
    </div>
  );
}

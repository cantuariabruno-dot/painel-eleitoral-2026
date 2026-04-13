/**
 * MapaSenado — Mapa do Brasil colorido pelo partido do senador em disputa em 2026
 * Cada estado é colorido pela cor do partido do senador cujo mandato vence em 2027
 * (eleito em 2018 — vagas em disputa em 2026).
 */
import { useState } from "react";

interface CadeiraInfo {
  estadoUf: string;
  senadorNome?: string | null;
  partido?: string | null;
  corHex?: string | null;
}

interface Props {
  cadeiras: CadeiraInfo[];
}

// Paths SVG simplificados dos 27 estados do Brasil (coordenadas normalizadas)
const ESTADOS_SVG: Record<string, { d: string; label: { x: number; y: number } }> = {
  AC: { d: "M 60 310 L 95 295 L 110 310 L 105 330 L 75 335 Z", label: { x: 82, y: 318 } },
  AM: { d: "M 95 200 L 175 185 L 195 210 L 200 255 L 175 275 L 140 280 L 110 310 L 95 295 Z", label: { x: 148, y: 238 } },
  RR: { d: "M 155 130 L 195 120 L 210 145 L 200 175 L 175 185 L 155 165 Z", label: { x: 180, y: 153 } },
  PA: { d: "M 195 120 L 270 110 L 310 130 L 320 175 L 295 195 L 265 200 L 240 215 L 200 210 L 195 175 Z", label: { x: 255, y: 160 } },
  AP: { d: "M 270 110 L 300 95 L 315 115 L 310 130 Z", label: { x: 293, y: 113 } },
  MA: { d: "M 310 130 L 360 125 L 375 150 L 360 175 L 330 185 L 320 175 L 295 195 Z", label: { x: 338, y: 158 } },
  PI: { d: "M 360 125 L 400 130 L 410 160 L 390 185 L 360 175 L 375 150 Z", label: { x: 383, y: 155 } },
  CE: { d: "M 400 130 L 440 125 L 450 150 L 430 170 L 410 160 Z", label: { x: 425, y: 148 } },
  RN: { d: "M 440 125 L 470 130 L 465 155 L 450 150 Z", label: { x: 456, y: 140 } },
  PB: { d: "M 450 150 L 470 148 L 468 165 L 445 168 Z", label: { x: 458, y: 158 } },
  PE: { d: "M 390 185 L 445 168 L 450 185 L 415 200 L 390 195 Z", label: { x: 420, y: 185 } },
  AL: { d: "M 445 168 L 460 170 L 455 190 L 440 188 Z", label: { x: 450, y: 180 } },
  SE: { d: "M 440 188 L 455 190 L 450 205 L 435 203 Z", label: { x: 445, y: 197 } },
  BA: { d: "M 330 185 L 415 200 L 435 203 L 430 260 L 400 290 L 360 295 L 330 270 L 315 240 L 320 210 Z", label: { x: 375, y: 240 } },
  TO: { d: "M 295 195 L 330 185 L 320 210 L 315 240 L 290 245 L 275 225 L 265 200 Z", label: { x: 298, y: 220 } },
  GO: { d: "M 290 245 L 315 240 L 330 270 L 315 305 L 285 310 L 270 285 Z", label: { x: 298, y: 278 } },
  DF: { d: "M 305 275 L 315 272 L 316 282 L 306 283 Z", label: { x: 311, y: 278 } },
  MG: { d: "M 330 270 L 360 295 L 400 290 L 420 315 L 405 345 L 370 360 L 330 350 L 305 325 L 315 305 Z", label: { x: 363, y: 320 } },
  ES: { d: "M 420 315 L 440 310 L 435 345 L 415 348 L 405 345 Z", label: { x: 425, y: 330 } },
  RJ: { d: "M 405 345 L 435 345 L 430 370 L 400 372 Z", label: { x: 415, y: 358 } },
  SP: { d: "M 305 325 L 330 350 L 370 360 L 365 395 L 330 405 L 295 390 L 285 360 Z", label: { x: 328, y: 370 } },
  PR: { d: "M 285 360 L 295 390 L 330 405 L 325 430 L 285 425 L 265 400 Z", label: { x: 295, y: 400 } },
  SC: { d: "M 285 425 L 325 430 L 320 455 L 282 450 Z", label: { x: 302, y: 440 } },
  RS: { d: "M 282 450 L 320 455 L 310 490 L 270 495 L 255 470 Z", label: { x: 288, y: 470 } },
  MS: { d: "M 265 310 L 285 310 L 305 325 L 285 360 L 265 400 L 240 380 L 235 340 L 245 315 Z", label: { x: 265, y: 350 } },
  MT: { d: "M 200 255 L 265 200 L 275 225 L 290 245 L 270 285 L 245 315 L 235 340 L 200 320 L 185 285 Z", label: { x: 235, y: 280 } },
  RO: { d: "M 140 280 L 175 275 L 200 255 L 185 285 L 175 310 L 150 315 L 130 300 Z", label: { x: 162, y: 295 } },
};

export default function MapaSenado({ cadeiras }: Props) {
  const [hover, setHover] = useState<(CadeiraInfo & { uf: string }) | null>(null);

  // Mapeia UF → cadeira em disputa (mandato_fim = 2027, em_disputa_2026 = true)
  const mapaUf = new Map<string, CadeiraInfo>();
  cadeiras.forEach(c => {
    if (c.estadoUf) mapaUf.set(c.estadoUf, c);
  });

  return (
    <div className="relative w-full">
      <svg
        viewBox="50 85 440 430"
        className="w-full max-h-[420px]"
        style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.4))" }}
      >
        {Object.entries(ESTADOS_SVG).map(([uf, { d, label }]) => {
          const cadeira = mapaUf.get(uf);
          const cor = cadeira?.corHex || "#1e293b";
          const isHover = hover?.uf === uf;
          return (
            <g key={uf}>
              <path
                d={d}
                fill={cor}
                stroke="#0f172a"
                strokeWidth="1.5"
                opacity={cadeira ? (isHover ? 1 : 0.85) : 0.25}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => cadeira && setHover({ ...cadeira, uf })}
                onMouseLeave={() => setHover(null)}
                style={{ filter: isHover ? "brightness(1.3)" : undefined }}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill={cadeira ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {uf}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-xs pointer-events-none z-10 whitespace-nowrap shadow-xl">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: hover.corHex || "#475569" }}
            />
            <span className="font-semibold text-white">{hover.uf}</span>
          </div>
          <div className="text-white/70">{hover.senadorNome || "Vaga aberta"}</div>
          <div className="text-white/40">{hover.partido || "—"} · Em disputa 2026</div>
        </div>
      )}
    </div>
  );
}

import { ExternalLink, Calendar, Users } from "lucide-react";

interface Pesquisa {
  id: number;
  instituto: string;
  dataColeta: string | Date;
  cargo: string;
  turno: string;
  margemErro?: string | null;
  tamanhoAmostra?: number | null;
  fonteUrl?: string | null;
}

interface Props {
  pesquisa: Pesquisa;
}

export function CardPesquisa({ pesquisa }: Props) {
  const data = typeof pesquisa.dataColeta === "string"
    ? new Date(pesquisa.dataColeta + "T12:00:00")
    : new Date(pesquisa.dataColeta);

  const cargoLabel: Record<string, string> = {
    presidente: "Presidência",
    governador: "Governador",
    senador: "Senado",
  };

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-white font-semibold text-sm">{pesquisa.instituto}</div>
          <div className="text-white/40 text-xs mt-0.5">
            {cargoLabel[pesquisa.cargo] || pesquisa.cargo} · {pesquisa.turno}º Turno
          </div>
        </div>
        {pesquisa.fonteUrl && (
          <a
            href={pesquisa.fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
        {pesquisa.tamanhoAmostra && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {pesquisa.tamanhoAmostra.toLocaleString("pt-BR")} entrevistados
          </div>
        )}
      </div>

      {pesquisa.margemErro && (
        <div className="mt-2 text-xs text-white/30">
          Margem de erro: ±{pesquisa.margemErro}%
        </div>
      )}
    </div>
  );
}

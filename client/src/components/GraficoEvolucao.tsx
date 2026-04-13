import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { useMemo } from "react";

interface PontoEvolucao {
  dataColeta: string | Date;
  instituto: string;
  candidatoId: number;
  nome: string;
  nomeAbrev?: string | null;
  corHex: string;
  percentual: string | number;
}

interface Props {
  dados: PontoEvolucao[];
}

export function GraficoEvolucao({ dados }: Props) {
  const { chartData, candidatosUnicos } = useMemo(() => {
    // Agrupar por data
    const porData = new Map<string, Record<string, number>>();
    const candidatosMap = new Map<number, { nome: string; nomeAbrev?: string | null; cor: string }>();

    dados.forEach(d => {
      const data = typeof d.dataColeta === "string"
        ? d.dataColeta.slice(0, 10)
        : new Date(d.dataColeta).toISOString().slice(0, 10);

      if (!porData.has(data)) porData.set(data, { data: data as any });
      const entry = porData.get(data)!;
      entry[`c_${d.candidatoId}`] = Number(d.percentual);

      if (!candidatosMap.has(d.candidatoId)) {
        candidatosMap.set(d.candidatoId, {
          nome: d.nome,
          nomeAbrev: d.nomeAbrev,
          cor: d.corHex,
        });
      }
    });

    const chartData = Array.from(porData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        ...v,
        dataLabel: new Date(v.data + "T12:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit", month: "short"
        }),
      }));

    const candidatosUnicos = Array.from(candidatosMap.entries()).map(([id, c]) => ({
      id,
      ...c,
    }));

    return { chartData, candidatosUnicos };
  }, [dados]);

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="dataLabel"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={{ stroke: "#1e293b" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 60]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
          formatter={(value: any, name: string) => {
            const id = parseInt(name.replace("c_", ""));
            const cand = candidatosUnicos.find(c => c.id === id);
            return [`${value}%`, cand?.nomeAbrev || cand?.nome || name];
          }}
        />
        {candidatosUnicos.map(c => (
          <Line
            key={c.id}
            type="monotone"
            dataKey={`c_${c.id}`}
            stroke={c.cor}
            strokeWidth={2.5}
            dot={{ r: 3, fill: c.cor }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

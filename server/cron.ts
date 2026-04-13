/**
 * Agendamento de tarefas automáticas do Painel Eleitoral Brasil 2026
 *
 * Renovação diária dos feeds RSS às 7h (horário de Brasília, UTC-3 → 10:00 UTC)
 */
import cron from "node-cron";
import { buscarEPersistirNoticias } from "./rss";

let jobAtivo = false;

export function iniciarCronJobs(): void {
  if (jobAtivo) return;
  jobAtivo = true;

  // Executa todos os dias às 10:00 UTC (= 07:00 BRT)
  cron.schedule("0 10 * * *", async () => {
    console.log("[Cron] Iniciando renovação diária dos feeds RSS...");
    try {
      const resultado = await buscarEPersistirNoticias(30);
      console.log(
        `[Cron] Renovação concluída: ${resultado.total} notícias encontradas, ` +
        `${resultado.inseridas} novas inseridas. Fontes: ${JSON.stringify(resultado.fontes)}`
      );
    } catch (err) {
      console.error("[Cron] Erro na renovação diária:", err);
    }
  }, {
    timezone: "America/Sao_Paulo",
  });

  console.log("[Cron] Agendamento diário configurado: 07:00 BRT (10:00 UTC)");
}

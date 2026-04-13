import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getCandidatos,
  getPesquisas,
  getPesquisaComIntencoes,
  getEvolucaoCandidatos,
  getPrevisoesMapa,
  getSenadoCadeiras,
  getNoticias,
  getFontesNoticias,
  getUltimaAtualizacao,
} from "./db";
import { buscarEPersistirNoticias } from "./rss";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Candidatos ─────────────────────────────────────────────────────────────
  candidatos: router({
    listar: publicProcedure
      .input(z.object({ cargo: z.enum(["presidente", "governador", "senador"]).optional() }).optional())
      .query(async ({ input }) => {
        return getCandidatos(input?.cargo);
      }),
  }),

  // ─── Pesquisas ───────────────────────────────────────────────────────────────
  pesquisas: router({
    listar: publicProcedure
      .input(z.object({
        cargo: z.enum(["presidente", "governador", "senador"]).optional(),
        limite: z.number().min(1).max(100).default(20),
      }).optional())
      .query(async ({ input }) => {
        return getPesquisas(input?.cargo, input?.limite ?? 20);
      }),

    detalhe: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getPesquisaComIntencoes(input.id);
      }),

    evolucao: publicProcedure
      .input(z.object({
        cargo: z.enum(["presidente", "governador", "senador"]).default("presidente"),
        turno: z.enum(["1", "2"]).default("1"),
      }))
      .query(async ({ input }) => {
        return getEvolucaoCandidatos(input.cargo, input.turno);
      }),
  }),

  // ─── Mapa de previsões ───────────────────────────────────────────────────────
  previsoes: router({
    mapa: publicProcedure
      .input(z.object({ cargo: z.enum(["presidente", "senador"]).default("presidente") }))
      .query(async ({ input }) => {
        return getPrevisoesMapa(input.cargo);
      }),
  }),

  // ─── Senado ──────────────────────────────────────────────────────────────────
  senado: router({
    cadeiras: publicProcedure.query(async () => {
      return getSenadoCadeiras();
    }),
  }),

  // ─── Notícias ────────────────────────────────────────────────────────────────
  noticias: router({
    listar: publicProcedure
      .input(z.object({
        categoria: z.enum(["presidente", "governador", "senador", "geral"]).optional(),
        fonte: z.string().optional(),
        limite: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const items = await getNoticias({
          categoria: input?.categoria,
          fonte: input?.fonte,
          limite: input?.limite ?? 30,
          offset: input?.offset ?? 0,
        });
        return { items };
      }),

    fontes: publicProcedure.query(async () => {
      return getFontesNoticias();
    }),

    ultimaAtualizacao: publicProcedure.query(async () => {
      return getUltimaAtualizacao();
    }),

    buscarRSS: publicProcedure.mutation(async () => {
      const resultado = await buscarEPersistirNoticias(1);
      return resultado;
    }),
  }),
});

export type AppRouter = typeof appRouter;

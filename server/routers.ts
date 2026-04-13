import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  listarNoticias,
  contarNoticias,
  ultimaAtualizacao,
  listarAtualizacoes,
  fontesDiponiveis,
} from "./db";
import { buscarEPersistirNoticias, cargaHistorica, FEEDS } from "./rss";
import type { Categoria } from "../drizzle/schema";

const categoriaEnum = z.enum(["presidente", "governador", "senador", "geral"]).optional();

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

  noticias: router({
    // Listar notícias com filtros opcionais
    listar: publicProcedure
      .input(
        z.object({
          fonte: z.string().optional(),
          categoria: categoriaEnum,
          limite: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const items = await listarNoticias({
          fonte: input.fonte,
          categoria: input.categoria as Categoria | undefined,
          limite: input.limite,
          offset: input.offset,
        });
        const total = await contarNoticias({
          fonte: input.fonte,
          categoria: input.categoria as Categoria | undefined,
        });
        return { items, total };
      }),

    // Buscar e persistir notícias dos feeds RSS (renovação diária)
    buscarRSS: publicProcedure.mutation(async () => {
      const resultado = await buscarEPersistirNoticias(1);
      return resultado;
    }),

    // Carga histórica dos últimos N dias
    cargaHistorica: publicProcedure
      .input(z.object({ dias: z.number().min(1).max(90).default(30) }))
      .mutation(async ({ input }) => {
        const resultado = await cargaHistorica(input.dias);
        return resultado;
      }),

    // Última atualização registrada
    ultimaAtualizacao: publicProcedure.query(async () => {
      return ultimaAtualizacao();
    }),

    // Histórico de atualizações
    historicoAtualizacoes: publicProcedure
      .input(z.object({ limite: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        return listarAtualizacoes(input.limite);
      }),

    // Fontes disponíveis no banco
    fontes: publicProcedure.query(async () => {
      return fontesDiponiveis();
    }),

    // Lista de feeds configurados
    feedsConfigurados: publicProcedure.query(() => {
      return FEEDS.map(f => f.nome);
    }),
  }),
});

export type AppRouter = typeof appRouter;

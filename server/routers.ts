import { z } from "zod";
import { analyzeLosslessJoin } from "./checker";
import { createAnalysis, listAnalyses } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const checkerInput = z.object({
  relationSchema: z.string().min(1).max(1000),
  decompositions: z.string().min(1).max(5000),
  functionalDependencies: z.string().max(5000),
});

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
  checker: router({
    analyze: publicProcedure.input(checkerInput).query(({ input }) => analyzeLosslessJoin(input)),
  }),
  history: router({
    list: publicProcedure.query(async () => {
      const rows = await listAnalyses();
      return rows.map(row => ({
        id: row.id,
        relationSchema: row.relationSchema,
        decompositions: row.decompositions,
        functionalDependencies: row.functionalDependencies,
        verdict: row.verdict,
        summary: row.summary,
        result: JSON.parse(row.resultJson),
        createdAt: row.createdAt.toISOString(),
      }));
    }),
    create: publicProcedure.input(checkerInput.extend({
      verdict: z.string().max(64),
      summary: z.string().max(4000),
      result: z.unknown(),
    })).mutation(async ({ input }) => {
      const id = await createAnalysis({
        relationSchema: input.relationSchema,
        decompositions: input.decompositions,
        functionalDependencies: input.functionalDependencies,
        verdict: input.verdict,
        summary: input.summary,
        resultJson: JSON.stringify(input.result),
      });
      return { id, saved: id !== null };
    }),
  }),
});

export type AppRouter = typeof appRouter;

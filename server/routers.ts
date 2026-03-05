import { z } from "zod/v4";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { COOKIE_NAME, DEFAULT_AVATAR_EMOJI, normalizeAvatarEmoji } from "@shared/const";
import { compare, hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addBucketItem,
  createUser,
  deleteUserAccount,
  deleteBucketItem,
  getBucketItems,
  getBucketStats,
  getCommunityGoalsPage,
  getLeaderboard,
  getUserByEmail,
  getUserSettings,
  reorderBucketItems,
  seedGlobalGoals,
  toggleBucketItemAchieved,
  updateUserLastSignedIn,
  updateBucketItem,
  upsertUserSettings,
  getTopGoals,
  getTopGoalsByYear,
  getTopUsersByYear,
  getPublicUsersCount,
  getUserYearlySummary,
  getPublicShareProfile,
  getLeaderboardAvailableYears,
} from "./db";
import { attachSessionCookie, createSessionToken } from "./_core/auth";

const LOCAL_AVATAR_DIR = path.join(os.tmpdir(), "bucket-list-app-avatars");

async function saveAvatarLocally(userId: number, buffer: Buffer, extension: string) {
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "webp";
  const userDir = path.join(LOCAL_AVATAR_DIR, String(userId));
  await fs.mkdir(userDir, { recursive: true });
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;
  const absolutePath = path.join(userDir, fileName);
  await fs.writeFile(absolutePath, buffer);
  return `/api/uploads/avatars/${userId}/${fileName}`;
}

function toClientUser(user: {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignedIn: user.lastSignedIn,
  };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => (opts.ctx.user ? toClientUser(opts.ctx.user) : null)),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(8).max(128),
          name: z.string().trim().max(120).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Account with this email already exists",
          });
        }

        const passwordHash = await hash(input.password, 12);
        const user = await createUser({
          email,
          passwordHash,
          name: input.name?.trim() || null,
        });
        await upsertUserSettings(user.id, { avatarEmoji: DEFAULT_AVATAR_EMOJI });

        const token = await createSessionToken(user);
        attachSessionCookie(ctx.req, ctx.res, token);
        return toClientUser(user);
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(1).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const passwordMatches = await compare(input.password, user.passwordHash);
        if (!passwordMatches) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        await updateUserLastSignedIn(user.id);
        const token = await createSessionToken(user);
        attachSessionCookie(ctx.req, ctx.res, token);
        return toClientUser(user);
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteUserAccount(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Bucket List ─────────────────────────────────────────────────
  bucketList: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getBucketItems(ctx.user.id);
    }),

    add: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(3).max(120),
          description: z.string().max(1000).optional(),
          category: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return addBucketItem(ctx.user.id, input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().trim().min(3).max(120).optional(),
          description: z.string().max(1000).optional(),
          category: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateBucketItem(ctx.user.id, id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteBucketItem(ctx.user.id, input.id);
        return { success: true };
      }),

    toggleAchieved: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return toggleBucketItemAchieved(ctx.user.id, input.id);
      }),

    reorder: protectedProcedure
      .input(z.object({ orderedIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await reorderBucketItems(ctx.user.id, input.orderedIds);
        return { success: true };
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      return getBucketStats(ctx.user.id);
    }),

    yearlySummary: protectedProcedure
      .input(
        z.object({
          year: z.number().int().min(1900).max(3000).nullable().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return getUserYearlySummary(ctx.user.id, input?.year ?? null);
      }),
  }),

  // ─── Leaderboard ─────────────────────────────────────────────────
  leaderboard: router({
    top100: publicProcedure.query(async () => {
      return getLeaderboard(100);
    }),

    topGoals: publicProcedure
      .input(
        z.object({
          year: z.number().int().min(1900).max(3000).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getTopGoalsByYear(100, input?.year);
      }),

    topUsers: publicProcedure
      .input(
        z.object({
          year: z.number().int().min(1900).max(3000).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return getTopUsersByYear(100, input?.year);
      }),

    usersCount: publicProcedure.query(async () => {
      const count = await getPublicUsersCount();
      return { count };
    }),

    availableYears: publicProcedure.query(async () => {
      return getLeaderboardAvailableYears();
    }),
  }),

  // ─── Global Goals ─────────────────────────────────────────────────
  globalGoals: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
          category: z.string().max(64).optional(),
          excludeMine: z.boolean().default(false),
          sort: z.enum(["popular", "newest"]).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        await seedGlobalGoals();
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 10;
        const category = input?.category;
        const excludeUserId = input?.excludeMine && ctx.user ? ctx.user.id : undefined;
        const sort = input?.sort ?? "popular";

        const result = await getCommunityGoalsPage({
          page,
          pageSize,
          category,
          excludeUserId,
          publicOnly: true,
          sort,
        });

        return {
          items: result.items,
          total: result.total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
        };
      }),
  }),

  // ─── User Settings ────────────────────────────────────────────────
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const existing = await getUserSettings(ctx.user.id);
      if (!existing || !existing.avatarEmoji) {
        return upsertUserSettings(ctx.user.id, {
          avatarEmoji: normalizeAvatarEmoji(existing?.avatarEmoji),
        });
      }
      return existing;
    }),

    update: protectedProcedure
      .input(
        z.object({
          displayName: z.string().max(128).optional(),
          bio: z.string().max(500).nullable().optional(),
          avatarEmoji: z.string().max(32).optional(),
          avatarImageUrl: z.string().max(2048).nullable().optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return upsertUserSettings(ctx.user.id, {
          ...input,
          bio: input.bio ?? undefined,
          avatarEmoji:
            input.avatarEmoji === undefined
              ? undefined
              : normalizeAvatarEmoji(input.avatarEmoji),
        });
      }),

    uploadAvatar: protectedProcedure
      .input(
        z.object({
          dataUrl: z.string().max(20_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const matches = input.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
        if (!matches) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported image format" });
        }

        const mimeType = matches[1];
        const base64Payload = matches[2];
        const buffer = Buffer.from(base64Payload, "base64");
        const maxBytes = 4 * 1024 * 1024;
        if (!buffer.length || buffer.length > maxBytes) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 4MB" });
        }

        const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
        let url: string;
        try {
          const key = `avatars/${ctx.user.id}/${Date.now()}.${extension}`;
          const uploaded = await storagePut(key, buffer, mimeType);
          url = uploaded.url;
        } catch (error) {
          console.warn("[settings.uploadAvatar] Remote storage unavailable, falling back to local file storage", error);
          url = await saveAvatarLocally(ctx.user.id, buffer, extension);
        }
        return { url };
      }),
  }),

  share: router({
    profile: publicProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
        })
      )
      .query(async ({ input }) => {
        return getPublicShareProfile(input.userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

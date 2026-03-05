import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  bucketItems,
  globalGoals,
  InsertBucketItem,
  InsertUserSettings,
  userSettings,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  return result[0];
}

export async function createUser(input: { email: string; passwordHash: string; name?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const normalizedEmail = input.email.trim().toLowerCase();
  const result = await db.insert(users).values({
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    name: input.name ?? null,
    lastSignedIn: new Date(),
  });

  const insertedId = Number((result as any)[0]?.insertId ?? 0);
  const rows = await db.select().from(users).where(eq(users.id, insertedId)).limit(1);
  return rows[0];
}

export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  await db.delete(bucketItems).where(eq(bucketItems.userId, userId));
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

// ─── Bucket Items ─────────────────────────────────────────────────
export async function getBucketItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bucketItems)
    .where(eq(bucketItems.userId, userId))
    .orderBy(asc(bucketItems.sortOrder), asc(bucketItems.createdAt));
}

export async function addBucketItem(
  userId: number,
  data: { title: string; description?: string; category?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Get max sortOrder
  const existing = await db
    .select({ sortOrder: bucketItems.sortOrder })
    .from(bucketItems)
    .where(eq(bucketItems.userId, userId))
    .orderBy(desc(bucketItems.sortOrder))
    .limit(1);

  const nextOrder = (existing[0]?.sortOrder ?? -1) + 1;

  const result = await db.insert(bucketItems).values({
    userId,
    title: data.title,
    description: data.description ?? null,
    category: data.category ?? null,
    sortOrder: nextOrder,
    achieved: false,
  });

  const id = Number((result as any)[0]?.insertId ?? 0);
  const rows = await db.select().from(bucketItems).where(eq(bucketItems.id, id)).limit(1);
  return rows[0];
}

export async function updateBucketItem(
  userId: number,
  itemId: number,
  data: { title?: string; description?: string; category?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(bucketItems)
    .set({ ...data })
    .where(and(eq(bucketItems.id, itemId), eq(bucketItems.userId, userId)));
  const rows = await db.select().from(bucketItems).where(eq(bucketItems.id, itemId)).limit(1);
  return rows[0];
}

export async function deleteBucketItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(bucketItems)
    .where(and(eq(bucketItems.id, itemId), eq(bucketItems.userId, userId)));
}

export async function toggleBucketItemAchieved(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const rows = await db
    .select()
    .from(bucketItems)
    .where(and(eq(bucketItems.id, itemId), eq(bucketItems.userId, userId)))
    .limit(1);

  if (!rows[0]) throw new Error("Item not found");
  const newAchieved = !rows[0].achieved;

  await db
    .update(bucketItems)
    .set({
      achieved: newAchieved,
      achievedAt: newAchieved ? new Date() : null,
    })
    .where(and(eq(bucketItems.id, itemId), eq(bucketItems.userId, userId)));

  const updated = await db.select().from(bucketItems).where(eq(bucketItems.id, itemId)).limit(1);
  return updated[0];
}

export async function reorderBucketItems(userId: number, orderedIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Update sortOrder for each item
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(bucketItems)
        .set({ sortOrder: index })
        .where(and(eq(bucketItems.id, id), eq(bucketItems.userId, userId)))
    )
  );
}

export async function getBucketStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, achieved: 0, rank: null };

  const items = await db
    .select({ achieved: bucketItems.achieved })
    .from(bucketItems)
    .where(eq(bucketItems.userId, userId));

  const total = items.length;
  const achieved = items.filter((i) => i.achieved).length;

  // Get rank: count users with more achieved items
  const rankResult = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM (
      SELECT userId, SUM(achieved) as cnt
      FROM bucket_items
      GROUP BY userId
      HAVING cnt > ${achieved}
    ) sub`
  );
  const rank = Number((rankResult as any)[0]?.[0]?.cnt ?? 0) + 1;

  return { total, achieved, rank };
}

// ─── Leaderboard ──────────────────────────────────────────────────
export async function getLeaderboard(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT u.id, u.name, u.email,
        COUNT(CASE WHEN b.achieved = 1 THEN 1 END) as achievedCount,
        COUNT(b.id) as totalCount,
        us.displayName, us.avatarEmoji, us.isPublic
      FROM users u
      LEFT JOIN bucket_items b ON b.userId = u.id
      LEFT JOIN user_settings us ON us.userId = u.id
      WHERE (us.isPublic IS NULL OR us.isPublic = 1)
      GROUP BY u.id, u.name, u.email, us.displayName, us.avatarEmoji, us.isPublic
      HAVING achievedCount > 0
      ORDER BY achievedCount DESC, totalCount ASC
      LIMIT ${limit}`
  );

  return (result as any)[0] as Array<{
    id: number;
    name: string | null;
    email: string;
    achievedCount: number;
    totalCount: number;
    displayName: string | null;
    avatarEmoji: string | null;
    isPublic: boolean;
  }>;
}

// ─── Global Goals ─────────────────────────────────────────────────
export async function getGlobalGoals(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(globalGoals)
    .orderBy(desc(globalGoals.addedCount), desc(globalGoals.createdAt))
    .limit(limit);
}

export async function getCommunityGoalsPage(options: {
  page: number;
  pageSize: number;
  category?: string;
  excludeUserId?: number;
  publicOnly?: boolean;
  sort?: "popular" | "newest";
}) {
  const db = await getDb();
  if (!db) {
    return { items: [], total: 0 };
  }

  const page = Math.max(1, options.page);
  const pageSize = Math.min(50, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;

  const conditions = [sql`b.title IS NOT NULL`, sql`TRIM(b.title) <> ''`];

  if (options.publicOnly !== false) {
    conditions.push(sql`(us.isPublic IS NULL OR us.isPublic = 1)`);
  }
  if (options.excludeUserId != null) {
    conditions.push(sql`b.userId <> ${options.excludeUserId}`);
  }
  if (options.category) {
    conditions.push(sql`b.category = ${options.category}`);
  }

  const whereSql = sql`WHERE ${sql.join(conditions, sql` AND `)}`;
  const orderSql =
    options.sort === "newest"
      ? sql`ORDER BY latestAt DESC, addedCount DESC`
      : sql`ORDER BY addedCount DESC, latestAt DESC`;

  const itemsResult = await db.execute(sql`
    SELECT
      b.title,
      b.category,
      COUNT(DISTINCT b.userId) AS addedCount,
      MAX(b.createdAt) AS latestAt
    FROM bucket_items b
    LEFT JOIN user_settings us ON us.userId = b.userId
    ${whereSql}
    GROUP BY b.title, b.category
    ${orderSql}
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const totalResult = await db.execute(sql`
    SELECT COUNT(*) AS total
    FROM (
      SELECT b.title, b.category
      FROM bucket_items b
      LEFT JOIN user_settings us ON us.userId = b.userId
      ${whereSql}
      GROUP BY b.title, b.category
    ) grouped_goals
  `);

  const rows = ((itemsResult as any)[0] ?? []) as Array<{
    title: string;
    category: string | null;
    addedCount: number | string;
  }>;
  const total = Number((totalResult as any)[0]?.[0]?.total ?? 0);

  if (total === 0) {
    const fallbackConditions = options.category
      ? sql`WHERE g.category = ${options.category}`
      : sql``;
    const fallbackOrderSql =
      options.sort === "newest"
        ? sql`ORDER BY g.createdAt DESC, g.addedCount DESC`
        : sql`ORDER BY g.addedCount DESC, g.createdAt DESC`;

    const fallbackItemsResult = await db.execute(sql`
      SELECT g.title, g.category, g.addedCount
      FROM global_goals g
      ${fallbackConditions}
      ${fallbackOrderSql}
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const fallbackTotalResult = await db.execute(sql`
      SELECT COUNT(*) AS total
      FROM global_goals g
      ${fallbackConditions}
    `);

    const fallbackRows = ((fallbackItemsResult as any)[0] ?? []) as Array<{
      title: string;
      category: string | null;
      addedCount: number | string;
    }>;
    const fallbackTotal = Number((fallbackTotalResult as any)[0]?.[0]?.total ?? 0);

    return {
      items: fallbackRows.map((row, index) => ({
        id: offset + index + 1,
        title: row.title,
        category: row.category,
        addedCount: Number(row.addedCount ?? 0),
      })),
      total: fallbackTotal,
    };
  }

  return {
    items: rows.map((row, index) => ({
      id: offset + index + 1,
      title: row.title,
      category: row.category,
      addedCount: Number(row.addedCount ?? 0),
    })),
    total,
  };
}

export async function seedGlobalGoals() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: globalGoals.id }).from(globalGoals).limit(1);
  if (existing.length > 0) return; // Already seeded

  const goals = [
    { title: "See the Northern Lights", category: "Travel", addedCount: 1240 },
    { title: "Climb a mountain", category: "Adventure", addedCount: 987 },
    { title: "Learn to play guitar", category: "Skills", addedCount: 876 },
    { title: "Visit Japan", category: "Travel", addedCount: 1102 },
    { title: "Write a novel", category: "Creative", addedCount: 654 },
    { title: "Go skydiving", category: "Adventure", addedCount: 789 },
    { title: "Learn a new language", category: "Skills", addedCount: 932 },
    { title: "See the Grand Canyon", category: "Travel", addedCount: 543 },
    { title: "Run a marathon", category: "Fitness", addedCount: 712 },
    { title: "Learn to cook 10 cuisines", category: "Food", addedCount: 421 },
    { title: "Go on a road trip across the country", category: "Travel", addedCount: 634 },
    { title: "Start a business", category: "Career", addedCount: 567 },
    { title: "Learn to surf", category: "Adventure", addedCount: 489 },
    { title: "Visit the Eiffel Tower", category: "Travel", addedCount: 823 },
    { title: "Read 100 books", category: "Learning", addedCount: 398 },
    { title: "Volunteer abroad", category: "Service", addedCount: 312 },
    { title: "Learn to paint", category: "Creative", addedCount: 445 },
    { title: "Go on a safari", category: "Travel", addedCount: 567 },
    { title: "Swim with dolphins", category: "Adventure", addedCount: 678 },
    { title: "See the Great Wall of China", category: "Travel", addedCount: 534 },
  ];

  await db.insert(globalGoals).values(goals);
}

// ─── User Settings ────────────────────────────────────────────────
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertUserSettings(userId: number, data: Partial<InsertUserSettings>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, ...data });
  }

  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return rows[0];
}

// ─── Top Goals Leaderboard ────────────────────────────────────────
export async function getTopGoals(limit = 100) {
  return getTopGoalsByYear(limit);
}

export async function getTopGoalsByYear(limit = 100, year?: number) {
  const db = await getDb();
  if (!db) return [];

  const yearFilterSql = year
    ? sql`AND YEAR(b.achievedAt) = ${year}`
    : sql``;

  const result = await db.execute(
    sql`SELECT
        MIN(b.id) as id,
        MIN(TRIM(b.title)) as title,
        MAX(b.category) as category,
        COUNT(DISTINCT b.userId) as userCount
      FROM bucket_items b
      LEFT JOIN user_settings us ON us.userId = b.userId
      WHERE b.achieved = 1
        AND b.achievedAt IS NOT NULL
        ${yearFilterSql}
        AND b.title IS NOT NULL
        AND TRIM(b.title) <> ''
        AND (us.isPublic IS NULL OR us.isPublic = 1)
      GROUP BY LOWER(TRIM(b.title))
      ORDER BY userCount DESC, title ASC
      LIMIT ${limit}`
  );

  return (result as any)[0] as Array<{
    id: number;
    title: string;
    category: string | null;
    userCount: number;
  }>;
}

// ─── Top Users Leaderboard ────────────────────────────────────────
export async function getTopUsers(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT u.id, u.name, u.email,
        COUNT(CASE WHEN b.achieved = 1 THEN 1 END) as achievedCount,
        COUNT(b.id) as totalCount,
        COUNT(b.id) as addedCountInYear,
        COUNT(CASE WHEN b.achieved = 1 THEN 1 END) as achievedCountInYear,
        us.displayName, us.avatarEmoji, us.isPublic
      FROM users u
      LEFT JOIN bucket_items b ON b.userId = u.id
      LEFT JOIN user_settings us ON us.userId = u.id
      WHERE (us.isPublic IS NULL OR us.isPublic = 1)
      GROUP BY u.id, u.name, u.email, us.displayName, us.avatarEmoji, us.isPublic
      HAVING achievedCount > 0
      ORDER BY achievedCount DESC, totalCount ASC
      LIMIT ${limit}`
  );

  return (result as any)[0] as Array<{
    id: number;
    name: string | null;
    email: string;
    achievedCount: number;
    totalCount: number;
    addedCountInYear: number;
    achievedCountInYear: number;
    displayName: string | null;
    avatarEmoji: string | null;
    isPublic: boolean;
  }>;
}

export async function getTopUsersByYear(limit = 100, year?: number) {
  if (!year) return getTopUsers(limit);

  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT u.id, u.name, u.email,
        COUNT(CASE WHEN b.achieved = 1 THEN 1 END) as achievedCount,
        COUNT(b.id) as totalCount,
        COUNT(CASE WHEN YEAR(b.createdAt) = ${year} THEN 1 END) as addedCountInYear,
        COUNT(CASE WHEN b.achieved = 1 AND YEAR(b.achievedAt) = ${year} THEN 1 END) as achievedCountInYear,
        us.displayName, us.avatarEmoji, us.isPublic
      FROM users u
      LEFT JOIN bucket_items b ON b.userId = u.id
      LEFT JOIN user_settings us ON us.userId = u.id
      WHERE (us.isPublic IS NULL OR us.isPublic = 1)
      GROUP BY u.id, u.name, u.email, us.displayName, us.avatarEmoji, us.isPublic
      HAVING (addedCountInYear > 0 OR achievedCountInYear > 0)
      ORDER BY achievedCountInYear DESC, addedCountInYear DESC, achievedCount DESC, totalCount ASC
      LIMIT ${limit}`
  );

  return (result as any)[0] as Array<{
    id: number;
    name: string | null;
    email: string;
    achievedCount: number;
    totalCount: number;
    addedCountInYear: number;
    achievedCountInYear: number;
    displayName: string | null;
    avatarEmoji: string | null;
    isPublic: boolean;
  }>;
}

export async function getLeaderboardAvailableYears() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(
    sql`SELECT DISTINCT yr.year
      FROM (
        SELECT YEAR(b.createdAt) AS year
        FROM bucket_items b
        LEFT JOIN user_settings us ON us.userId = b.userId
        WHERE (us.isPublic IS NULL OR us.isPublic = 1)
        UNION
        SELECT YEAR(b.achievedAt) AS year
        FROM bucket_items b
        LEFT JOIN user_settings us ON us.userId = b.userId
        WHERE b.achieved = 1
          AND b.achievedAt IS NOT NULL
          AND (us.isPublic IS NULL OR us.isPublic = 1)
      ) yr
      WHERE yr.year IS NOT NULL
      ORDER BY yr.year DESC`
  );

  const rows = ((result as any)[0] ?? []) as Array<{ year: number | string | null }>;
  return rows
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year) && year > 1900 && year < 3000);
}

export async function getUserYearlySummary(userId: number, year?: number | null) {
  const db = await getDb();
  if (!db) {
    return {
      availableYears: [] as number[],
      totalsByYear: [] as Array<{ year: number; addedCount: number; achievedCount: number }>,
      selectedYearStats: { addedCount: 0, achievedCount: 0, completionRate: 0 },
      selectedYear: null as number | null,
    };
  }

  const rows = await db
    .select({
      createdAt: bucketItems.createdAt,
      achievedAt: bucketItems.achievedAt,
      achieved: bucketItems.achieved,
    })
    .from(bucketItems)
    .where(eq(bucketItems.userId, userId));

  const byYear = new Map<number, { addedCount: number; achievedCount: number }>();
  const yearsSet = new Set<number>();

  for (const row of rows) {
    const createdYear = new Date(row.createdAt).getFullYear();
    yearsSet.add(createdYear);
    const createdEntry = byYear.get(createdYear) ?? { addedCount: 0, achievedCount: 0 };
    createdEntry.addedCount += 1;
    byYear.set(createdYear, createdEntry);

    if (row.achieved && row.achievedAt) {
      const achievedYear = new Date(row.achievedAt).getFullYear();
      yearsSet.add(achievedYear);
      const achievedEntry = byYear.get(achievedYear) ?? { addedCount: 0, achievedCount: 0 };
      achievedEntry.achievedCount += 1;
      byYear.set(achievedYear, achievedEntry);
    }
  }

  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
  const totalsByYear = availableYears.map((yr) => ({
    year: yr,
    addedCount: byYear.get(yr)?.addedCount ?? 0,
    achievedCount: byYear.get(yr)?.achievedCount ?? 0,
  }));

  const selectedYear = year ?? null;
  const selectedTotals = selectedYear != null
    ? totalsByYear.find((entry) => entry.year === selectedYear)
    : null;
  const addedCount = selectedYear == null
    ? rows.length
    : selectedTotals?.addedCount ?? 0;
  const achievedCount = selectedYear == null
    ? rows.filter((row) => row.achieved).length
    : selectedTotals?.achievedCount ?? 0;
  const completionRate = addedCount > 0 ? Math.round((achievedCount / addedCount) * 100) : 0;

  return {
    availableYears,
    totalsByYear,
    selectedYearStats: {
      addedCount,
      achievedCount,
      completionRate,
    },
    selectedYear,
  };
}

export async function getPublicShareProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userResult = await db.execute(
    sql`SELECT u.id, u.name, us.displayName, us.avatarEmoji, us.isPublic
      FROM users u
      LEFT JOIN user_settings us ON us.userId = u.id
      WHERE u.id = ${userId}
      LIMIT 1`
  );

  const profile = (userResult as any)[0]?.[0] as
    | {
        id: number;
        name: string | null;
        displayName: string | null;
        avatarEmoji: string | null;
        isPublic: boolean | null;
      }
    | undefined;

  if (!profile) return null;
  if (profile.isPublic === false) return null;

  const goals = await db
    .select({
      id: bucketItems.id,
      title: bucketItems.title,
      category: bucketItems.category,
      achieved: bucketItems.achieved,
      achievedAt: bucketItems.achievedAt,
      createdAt: bucketItems.createdAt,
    })
    .from(bucketItems)
    .where(eq(bucketItems.userId, userId))
    .orderBy(asc(bucketItems.sortOrder), asc(bucketItems.createdAt));

  const achievedCount = goals.filter((goal) => goal.achieved).length;

  return {
    userId: profile.id,
    displayName: profile.displayName ?? profile.name ?? "Explorer",
    avatarEmoji: profile.avatarEmoji,
    totalCount: goals.length,
    achievedCount,
    goals,
  };
}

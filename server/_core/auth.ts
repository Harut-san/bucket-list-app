import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

type SessionPayload = {
  userId: number;
};

const SESSION_ALGORITHM = "HS256";

function getSessionSecret() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is required");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

function getSessionCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const parsed = parseCookieHeader(cookieHeader);
  return parsed[COOKIE_NAME];
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [SESSION_ALGORITHM],
    });

    const userId = payload.userId;
    if (typeof userId !== "number") {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

export async function createSessionToken(user: Pick<User, "id">): Promise<string> {
  const secretKey = getSessionSecret();
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);

  return new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: SESSION_ALGORITHM, typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export function attachSessionCookie(req: Request, res: Response, token: string) {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const sessionToken = getSessionCookie(req);
  if (!sessionToken) {
    return null;
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);
  return user ?? null;
}

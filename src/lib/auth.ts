import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import type {
  ClientTokenPayload,
  AdminTokenPayload,
  TokenPayload,
} from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "fallback-dev-refresh-secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "1h") as SignOptions["expiresIn"];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as SignOptions["expiresIn"];

export function signClientToken(
  payload: Omit<ClientTokenPayload, "type">,
): string {
  return jwt.sign({ ...payload, type: "client" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function signAdminToken(
  payload: Omit<AdminTokenPayload, "type">,
): string {
  return jwt.sign({ ...payload, type: "admin" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function signRefreshToken(payload: {
  id: string;
  type: "client" | "admin";
}): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(
  token: string,
): { id: string; type: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as {
      id: string;
      type: string;
    };
  } catch {
    return null;
  }
}

export async function getClientSession(): Promise<ClientTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("client_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== "client") return null;
  return payload as ClientTokenPayload;
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== "admin") return null;
  return payload as AdminTokenPayload;
}

export function setClientCookies(token: string, refreshToken: string): void {
  // These are set via response headers in API routes
  // This is a helper to generate the Set-Cookie header values
}

export function createCookieHeader(
  name: string,
  value: string,
  maxAge: number,
): string {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function clearCookieHeader(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

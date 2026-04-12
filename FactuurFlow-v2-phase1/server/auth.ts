import crypto from "crypto";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { type Express } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const SessionStore = MemoryStore(session);

// ── Password hashing (Node built-in crypto) ───────────────────────────────────
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function comparePassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(plain, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

// ── Passport + Session setup ──────────────────────────────────────────────────
export function setupAuth(app: Express): void {
  // Session
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? "factuurflow-dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86_400_000 }), // prune elke 24u
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dagen
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy: login met email + wachtwoord
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()));

        if (!user) return done(null, false, { message: "E-mailadres niet gevonden." });
        if (!comparePassword(password, user.password))
          return done(null, false, { message: "Onjuist wachtwoord." });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });
}

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { pool } from "./db";
import { db } from "./db";
import { users, userProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null | undefined) {
    if (!stored || !stored.includes(".")) {
        console.warn(`[AUTH] Malformed password hash detected (missing dot).`);
        return false;
    }
    const [hashed, salt] = stored.split(".");
    try {
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (err) {
        console.error(`[AUTH] Error during password comparison:`, err);
        return false;
    }
}

export function setupAuth(app: Express) {
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "aara-secret-key",
        resave: false,
        saveUninitialized: false,
        store: new PostgresSessionStore({
            pool,
            createTableIfMissing: true,
            tableName: "sessions",
        }),
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(
            { usernameField: "email" },
            async (email, password, done) => {
                const cleanEmail = email.toLowerCase().trim();
                console.log(`[AUTH] Attempting login for email: "${cleanEmail}" (original: "${email}")`);
                try {
                    const user = await storage.getUserByEmail(cleanEmail);
                    if (!user) {
                        console.log(`[AUTH] User not found for email: ${cleanEmail}`);
                        return done(null, false, { message: "Invalid email or password" });
                    }

                    console.log(`[AUTH] User found, comparing passwords...`);
                    const isValid = await comparePasswords(password, user.password);
                    if (!isValid) {
                        console.log(`[AUTH] Invalid password for user: ${cleanEmail}`);
                        return done(null, false, { message: "Invalid email or password" });
                    }

                    console.log(`[AUTH] Login successful for user: ${user.id} (${user.email})`);
                    return done(null, user);
                } catch (err) {
                    console.error(`[AUTH] Error during login strategy:`, err);
                    return done(err);
                }
            }
        )
    );

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "/api/auth/google/callback",
                },
                async (_accessToken, _refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0]?.value?.toLowerCase().trim();
                        const name = profile.displayName;
                        const avatar = profile.photos?.[0]?.value;
                        const googleId = profile.id;

                        if (!email) {
                            return done(new Error("No email from Google"));
                        }

                        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

                        if (existingUser) {
                            if (!existingUser.googleId || existingUser.googleId !== googleId || existingUser.avatar !== avatar) {
                                const [updatedUser] = await db
                                    .update(users)
                                    .set({
                                        googleId,
                                        avatar: avatar || existingUser.avatar,
                                        name: name || existingUser.name,
                                        profileImageUrl: avatar || existingUser.profileImageUrl,
                                        updatedAt: new Date(),
                                    })
                                    .where(eq(users.id, existingUser.id))
                                    .returning();
                                return done(null, updatedUser);
                            }
                            return done(null, existingUser);
                        }

                        const usernameBase = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40) || "google_user";
                        const [newUser] = await db
                            .insert(users)
                            .values({
                                email,
                                password: null,
                                googleId,
                                avatar: avatar || null,
                                name: name || usernameBase,
                                firstName: name?.split(" ")?.[0] || usernameBase,
                                lastName: name?.split(" ")?.slice(1).join(" ") || null,
                                profileImageUrl: avatar || null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            })
                            .returning();

                        return done(null, newUser);
                    } catch (err) {
                        return done(err as any);
                    }
                }
            )
        );
    }

    passport.serializeUser((user: any, done) => {
        console.log(`[AUTH] Serializing user: ${user.id}`);
        done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
        console.log(`[AUTH] Deserializing user: ${id}`);
        try {
            const user = await storage.getUser(id);
            if (!user) {
                console.warn(`[AUTH] Failed to deserialize user: ${id} (not found)`);
            }
            done(null, user);
        } catch (err) {
            console.error(`[AUTH] Error deserializing user: ${id}`, err);
            done(err);
        }
    });

    app.post("/api/register", async (req, res, next) => {
        console.log(`[AUTH] Register request received for: ${req.body.email}`);
        try {
            const { email, password, firstName, lastName } = req.body;
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                console.log(`[AUTH] Registration failed: Email already exists (${email})`);
                return res.status(400).send("Email already registered");
            }

            const hashedBuffer = await hashPassword(password);
            const user = await storage.createUser({
                email,
                password: hashedBuffer,
                firstName,
                lastName,
                profileImageUrl: null,
            });
            console.log(`[AUTH] User created: ${user.id}`);

            req.login(user, (err) => {
                if (err) {
                    console.error(`[AUTH] Login after registration failed:`, err);
                    return next(err);
                }
                console.log(`[AUTH] User logged in after registration: ${user.id}`);
                res.status(201).json(user);
            });
        } catch (err) {
            console.error(`[AUTH] Registration error:`, err);
            next(err);
        }
    });

    app.post("/api/login", (req, res, next) => {
        console.log(`[AUTH] Login API hit. Body keys: ${Object.keys(req.body).join(", ")}`);
        passport.authenticate("local", (err: any, user: any, info: any) => {
            if (err) {
                console.error(`[AUTH] Passport authenticate error:`, err);
                return next(err);
            }
            if (!user) {
                console.log(`[AUTH] Passport authenticate failed: ${info?.message || "No user found"}`);
                return res.status(401).send(info?.message || "Invalid credentials");
            }
            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error(`[AUTH] req.login error:`, loginErr);
                    return next(loginErr);
                }
                console.log(`[AUTH] Session established for user: ${user.id}, SessionID: ${req.sessionID}`);
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.error(`[AUTH] Session save error:`, saveErr);
                        return next(saveErr);
                    }
                    console.log(`[AUTH] Session saved successfully. Cookie:`, req.session.cookie);
                    return res.status(200).json(user);
                });
            });
        })(req, res, next);
    });

    app.post("/api/logout", (req, res, next) => {
        console.log(`[AUTH] Logout request for user: ${(req.user as any)?.id}`);
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy((destroyErr) => {
                if (destroyErr) console.error("Session destroy error:", destroyErr);
                res.sendStatus(200);
            });
        });
    });

    app.get("/api/auth/user", (req, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(req.user);
    });

    app.get(
        "/api/auth/google",
        passport.authenticate("google", {
            scope: ["profile", "email"],
        }),
    );

    app.get(
        "/api/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/auth?error=google_failed",
            session: true,
        }),
        async (req, res) => {
            try {
                const user = req.user as any;
                const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);

                if (!profile) {
                    return res.redirect("/onboarding");
                }

                return res.redirect("/dashboard");
            } catch (err) {
                return res.redirect("/auth?error=server_error");
            }
        },
    );
}

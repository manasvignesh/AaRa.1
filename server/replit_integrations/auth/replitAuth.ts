import { type Express, type RequestHandler } from "express";
import session from "express-session";
import { authStorage } from "./storage";

// Mock Authentication for Local Preview
// Bypasses Replit OIDC and acts as a single dummy user.

const DUMMY_USER_ID = "dummy-user-id";
const DUMMY_USER = {
  id: DUMMY_USER_ID,
  email: "preview@example.com",
  firstName: "Preview",
  lastName: "User",
  profileImageUrl: "",
};

export const getSession = () => {
  return session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Allow http for localhost
  });
};

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Ensure dummy user exists
  try {
    const existing = await authStorage.getUser(DUMMY_USER_ID);
    if (!existing) {
      await authStorage.upsertUser(DUMMY_USER);
      console.log("Created dummy preview user");
    }
  } catch (err) {
    console.error("Failed to setup dummy user:", err);
  }

  // Mock Login Route
  app.get("/api/login", (req, res) => {
    // In a real app we'd set the session here, but our middleware forces it anyway.
    // We just redirect to home.
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // In this mock, we are ALWAYS authenticated as the dummy user.
  // We inject the structure expected by the app.

  // The app expects req.user.claims.sub
  (req as any).user = {
    claims: {
      sub: DUMMY_USER_ID,
      email: DUMMY_USER.email,
      first_name: DUMMY_USER.firstName,
      last_name: DUMMY_USER.lastName,
      profile_image_url: DUMMY_USER.profileImageUrl
    },
    id: DUMMY_USER_ID,
    ...DUMMY_USER
  };

  // Ensure the user exists in DB on every request (or at least check)
  // We did it in setupAuth, so we assume it exists.
  // If middleware order is correct, access is granted.

  next();
};

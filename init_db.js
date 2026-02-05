import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const sql = `
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" text NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");
`;

async function initDb() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Creating missing tables...");
        await pool.query(sql);
        console.log("Tables 'users' and 'sessions' created successfully.");
    } catch (err) {
        console.error("Initialization Error:", err);
    } finally {
        await pool.end();
    }
}

initDb();

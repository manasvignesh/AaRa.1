import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const sql = `
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
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

CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire");
`;

async function hardReset() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Dropping and recreating auth tables...");
        await pool.query(sql);
        console.log("Auth tables reset successfully.");
    } catch (err) {
        console.error("Hard Reset Error:", err);
    } finally {
        await pool.end();
    }
}

hardReset();

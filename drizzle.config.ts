import { defineConfig } from "drizzle-kit";

// Database URL is optional for local development
const databaseUrl = process.env.DATABASE_URL || "";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

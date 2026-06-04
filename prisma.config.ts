import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const DB_URL = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: DB_URL,
    adapter: () => new PrismaLibSql({ url: DB_URL }),
  },
});

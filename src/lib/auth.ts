import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  // better-auth@1.7.3 added a schema-check-on-every-request feature (merged 2026-09-05,
  // released 2026-09-06) whose DB introspection doesn't yet handle Prisma 7's required
  // driver-adapter pattern (@prisma/adapter-pg) — false positive SCHEMA_MISMATCH on every
  // request. Tables are verified to exist and match; disable until upstream fixes this.
  advanced: {
    database: {
      validateSchema: false,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});

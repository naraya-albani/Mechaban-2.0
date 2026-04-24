import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";
import { PrismaClient } from "./generated/prisma/client";

export const sql = neon(process.env.DATABASE_URL!);

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

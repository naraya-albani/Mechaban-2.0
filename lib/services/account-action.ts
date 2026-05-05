"use server";

import { NeonAccount } from "@/types";
import { sql } from "../db";

const LIMIT = 10;

export async function readAccount({
  search,
  offset,
}: {
  search?: string;
  offset: number;
}) {
  const [data, countResult] = await Promise.all([
    sql`
      SELECT id, email, name, "image", "createdAt", role
      FROM neon_auth.user
      WHERE role != 'admin'
        AND ${
          search
            ? sql`(
                to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(email, ''))
                @@ to_tsquery('simple', ${search
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((w) => w + ":*")
                  .join(" & ")})
              )`
            : sql`TRUE`
        }
      ORDER BY "createdAt" DESC
      LIMIT ${LIMIT} OFFSET ${offset};
    ` as unknown as Promise<NeonAccount[]>,
    sql`
      SELECT COUNT(*) as total
      FROM neon_auth.user
      WHERE role != 'admin'
        AND ${
          search
            ? sql`(
                to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(email, ''))
                @@ to_tsquery('simple', ${search
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((w) => w + ":*")
                  .join(" & ")})
              )`
            : sql`TRUE`
        }
    `,
  ]);

  return { data, total: Number(countResult[0].total) };
}

export async function updateRoleAccount({
  accountId,
  role,
}: {
  accountId: string;
  role: string;
}) {
  try {
    await sql`
      UPDATE neon_auth.user
      SET role = ${role}
      WHERE id = ${accountId}
    `;

    return {
      success: true,
      message: "Peran akun berhasil diperbarui",
    };
  } catch (error) {
    console.error("Error updating account role:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal memperbarui peran akun",
    };
  }
}

"use server";

import { NeonAccount } from "@/types";
import { prisma, sql } from "../db";
import { createClient } from "../supabase/client";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type Role = "admin" | "mechanic" | "user";

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

    const [updatedAccount] = await sql`
      SELECT id, email, name, "image", role
      FROM neon_auth.user
      WHERE id = ${accountId}
    `;

    const isMechanic = await prisma.mechanic.findUnique({
      where: { idAccount: accountId },
    });

    if (!isMechanic && role === "mechanic") {
      await prisma.mechanic.create({
        data: {
          idAccount: updatedAccount.id,
          email: updatedAccount.email,
          name: updatedAccount.name,
          image: updatedAccount.image,
        },
      });
    } else if (isMechanic) {
      await prisma.mechanic.update({
        where: { idAccount: accountId },
        data: {
          deletedAt: role === "mechanic" ? null : new Date(),
        },
      });
    }

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

export async function updateUserRole(targetUserId: string, newRole: Role) {
  const supabase = await createClient();

  // Verifikasi yang request adalah admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = user.app_metadata?.role;
  if (role !== "admin") throw new Error("Forbidden");

  // Gunakan service_role untuk update app_metadata
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
    app_metadata: { role: newRole },
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/accounts");
}

import { sql } from "@/lib/db";
import AccountsClient from "./_components/accounts-client";
import MainLayout from "@/layout/main-layout";
import { NeonAccount } from "@/types";

const LIMIT = 10;

export default async function Accounts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search: searchParam } = await searchParams;

  const page = Number(pageParam ?? "1");
  const search = searchParam ?? "";
  const offset = (page - 1) * LIMIT;

  const [accounts, countResult] = await Promise.all([
    sql`
    SELECT id, email, name, "image", "createdAt", role
    FROM neon_auth.user
    WHERE
      ${
        search
          ? sql`(name ILIKE ${"%" + search + "%"} OR email ILIKE ${"%" + search + "%"})`
          : sql`TRUE`
      }
    ORDER BY "createdAt" DESC
    LIMIT ${LIMIT} OFFSET ${offset};
  ` as unknown as Promise<NeonAccount[]>,
    sql`
    SELECT COUNT(*) as total
    FROM neon_auth.user
    WHERE
      ${
        search
          ? sql`(name ILIKE ${"%" + search + "%"} OR email ILIKE ${"%" + search + "%"})`
          : sql`TRUE`
      }
  `,
  ]);

  const total = Number(countResult[0].total);

  return (
    <MainLayout breadcrumbs={[{ label: "Akun" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <AccountsClient
          data={accounts}
          page={page}
          search={search}
          totalPages={Math.ceil(total / LIMIT)}
          total={total}
        />
      </main>
    </MainLayout>
  );
}

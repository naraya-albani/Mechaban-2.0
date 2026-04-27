import MainLayout from "@/layout/main-layout";
import { readService } from "@/lib/services/service-action";
import { ServicesClient } from "./_components/services-client";

const LIMIT = 10;

export default async function Services({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search: searchParam } = await searchParams;
  const page = Number(pageParam ?? "1");
  const search = searchParam ?? "";

  const { data, total } = await readService({ search, page, limit: LIMIT });

  return (
    <MainLayout breadcrumbs={[{ label: "Layanan" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <ServicesClient
          data={data}
          page={page}
          search={search}
          totalPages={Math.ceil(total / LIMIT)}
          total={total}
        />
      </main>
    </MainLayout>
  );
}

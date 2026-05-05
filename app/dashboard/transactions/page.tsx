import MainLayout from "@/layout/main-layout";
import TransactionsClient from "./_components/transactions-client";
import { readTransaction } from "@/lib/services/transaction-action";

export default async function Transactions() {
  const { data, total } = await readTransaction({ page: 1, limit: 10 });

  return (
    <MainLayout breadcrumbs={[{ label: "Transaksi" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <h1 className="text-3xl font-semibold tracking-tight pb-8 md:text-4xl">
          Daftar Transaksi
        </h1>
        <TransactionsClient data={data} total={total} />
      </main>
    </MainLayout>
  );
}

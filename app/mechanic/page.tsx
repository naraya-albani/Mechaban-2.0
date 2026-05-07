import MainLayout from "@/layout/main-layout";
import MechanicClient from "./_components/mechanic-client";
import { readOrders } from "@/lib/services/mechanic-action";

export default async function Mechanic() {
  const orders = await readOrders();

  return (
    <MainLayout breadcrumbs={[{ label: "Mekanik" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dasbor
          </h1>
        </div>

        <MechanicClient orders={orders} />
      </main>
    </MainLayout>
  );
}

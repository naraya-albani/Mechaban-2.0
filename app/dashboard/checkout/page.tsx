import { getServicesCheckout } from "@/lib/services/service-action";
import CheckoutClient from "./_components/checkout-client";
import MainLayout from "@/layout/main-layout";
import { auth } from "@/lib/auth/server";
import { readCar } from "@/lib/services/car-action";

export default async function Checkout() {
  const { data: session } = await auth.getSession();
  const services = await getServicesCheckout();
  const cars = session?.user.id ? await readCar(session.user.id) : [];

  return (
    <MainLayout breadcrumbs={[{ label: "Checkout" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <div className="container">
          <div className="flex flex-col gap-6 pb-8 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Pesan
                </h1>
                <p className="text-sm text-muted-foreground md:text-base">
                  Apa yang bisa kami bantu?
                </p>
              </div>
            </div>
          </div>
          <CheckoutClient services={services} cars={cars} />
        </div>
      </main>
    </MainLayout>
  );
}

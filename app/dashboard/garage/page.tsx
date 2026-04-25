import { Separator } from "@/components/ui/separator";
import MainLayout from "@/layout/main-layout";
import React from "react";
import { auth } from "@/lib/auth/server";
import { readCar } from "@/lib/services/car-action";
import CarDialog from "./_components/garage-client";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Car } from "lucide-react";

export default async function Garage() {
  const { data: session } = await auth.getSession();
  const cars = session?.user.id ? await readCar(session.user.id) : [];

  return (
    <MainLayout breadcrumbs={[{ label: "Garasi" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <div className="container">
          <div className="flex justify-between">
            <h1 className="mb-10 px-4 text-3xl font-semibold md:mb-14 md:text-4xl">
              Sayangi Mobil Anda
            </h1>
            {cars.length > 0 && <CarDialog />}
          </div>
          {cars.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="default">
                  <Car />
                </EmptyMedia>
                <EmptyTitle className="text-xl">Tidak ada mobil</EmptyTitle>
                <EmptyDescription className="text-md">
                  Tambahkan mobil agar kami bisa bantu.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CarDialog />
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col">
              <Separator />
              {cars.map((car) => (
                <React.Fragment key={car.id}>
                  <div className="grid items-center gap-4 px-4 py-5 md:grid-cols-4">
                    <div className="order-2 flex items-center gap-2 md:order-0">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-semibold">{car.licensePlate}</h3>
                        <p className="text-sm text-muted-foreground">
                          {car.status}
                        </p>
                      </div>
                    </div>
                    <p className="order-1 text-2xl font-semibold md:order-0 md:col-span-2">
                      {car.merk} {car.type}
                    </p>
                    <CarDialog car={car} />
                  </div>
                  <Separator />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}

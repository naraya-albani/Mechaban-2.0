import MainLayout from "@/layout/main-layout";

export default function Services() {
  return (
    <MainLayout breadcrumbs={[{ label: "Layanan" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30"></main>
    </MainLayout>
  );
}

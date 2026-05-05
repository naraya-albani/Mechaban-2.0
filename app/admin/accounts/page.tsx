import AccountsClient from "./_components/accounts-client";
import MainLayout from "@/layout/main-layout";

export default async function Accounts() {
  return (
    <MainLayout breadcrumbs={[{ label: "Akun" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        <AccountsClient />
      </main>
    </MainLayout>
  );
}

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { data: session } = await auth.getSession();
  if (!session) redirect("/auth/login");

  return <div>Hello, {session.user.email}</div>;
}

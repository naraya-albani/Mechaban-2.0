export interface NeonAccount {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin" | "mechanic";
  createdAt: string;
  updatedAt: string;
}

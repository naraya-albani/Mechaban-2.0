import { CarStatus, Transmition } from "@/lib/generated/prisma/enums";

export interface Transaction {
  id: string;
  lat: string;
  lng: string;
  car: Car;
  services: Service[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date?;
}

export interface TransactionService {
  id: string;
  transaction: Transaction;
  service: Service;
}

export interface Service {
  id: string;
  service: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Car {
  id: string;
  licensePlate: string;
  merk: string;
  type: string;
  year: string;
  transmition: Transmition;
  status: CarStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface NeonAccount {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

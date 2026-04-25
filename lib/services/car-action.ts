"use server";

import { prisma } from "@/lib/db";
import { Transmition } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function createCar(formData: FormData) {
  const licensePlate = formData.get("license") as string;
  const merk = formData.get("merk") as string;
  const type = formData.get("type") as string;
  const transmition = formData.get("transmition") as Transmition;
  const year = formData.get("year") as string;
  const ownerId = formData.get("ownerId") as string;

  if (!licensePlate || !merk || !type || !transmition || !year || !ownerId) {
    throw new Error("Semua field wajib diisi");
  }

  await prisma.car.create({
    data: {
      licensePlate,
      merk,
      type,
      transmition,
      year,
      ownerId,
      status: "GOOD",
    },
  });

  revalidatePath("/dashboard/garage");
}

export async function readCar(ownerId: string) {
  return await prisma.car.findMany({
    where: { ownerId: ownerId, deleteAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCar(formData: FormData, id: string) {
  const licensePlate = formData.get("license") as string;
  const merk = formData.get("merk") as string;
  const type = formData.get("type") as string;
  const transmition = formData.get("transmition") as Transmition;
  const year = formData.get("year") as string;
  const ownerId = formData.get("ownerId") as string;

  if (!licensePlate || !merk || !type || !transmition || !year || !ownerId) {
    throw new Error("Semua field wajib diisi");
  }

  await prisma.car.update({
    where: { id },
    data: { licensePlate, merk, type, transmition, year, ownerId },
  });

  revalidatePath("/dashboard/garage");
}

export async function deleteCar(id: string) {
  await prisma.car.update({
    where: { id },
    data: { deleteAt: new Date() },
  });

  revalidatePath("/dashboard/garage");
}

"use server";

import { prisma } from "@/lib/db";
import { Transmition } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function createCar(formData: FormData) {
  try {
    const licensePlate = formData.get("license") as string;
    const merk = formData.get("merk") as string;
    const type = formData.get("type") as string;
    const transmition = formData.get("transmition") as Transmition;
    const year = formData.get("year") as string;
    const ownerId = formData.get("ownerId") as string;

    if (!licensePlate || !merk || !type || !transmition || !year || !ownerId) {
      return {
        success: false,
        message: "Semua field wajib diisi",
      };
    }

    await prisma.car.create({
      data: {
        licensePlate,
        merk,
        type,
        transmition,
        year,
        ownerId,
      },
    });

    revalidatePath("/dashboard/garage");

    return {
      success: true,
      message: "Mobil berhasil ditambahkan",
    };
  } catch (error) {
    console.error("Error createCar:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan data mobil",
    };
  }
}

export async function readCar(ownerId: string, isCheckout: boolean = false) {
  return await prisma.car.findMany({
    where: {
      ownerId: ownerId,
      deletedAt: null,
      ...(isCheckout && { status: "GOOD" }),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCar(formData: FormData, id: string) {
  try {
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

    return {
      success: true,
      message: "Mobil berhasil diubah",
    };
  } catch (error) {
    console.error("Error updateCar:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengubah data mobil",
    };
  }
}

export async function deleteCar(id: string) {
  try {
    await prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/garage");

    return {
      success: true,
      message: "Mobil berhasil dihapus",
    };
  } catch (error) {
    console.error("Error deleteCar:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus data mobil",
    };
  }
}

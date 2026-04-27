"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createService(formData: FormData) {
  try {
    const service = formData.get("service") as string;
    const price = Number(formData.get("price"));

    if (!service || isNaN(price)) {
      return {
        success: false,
        message: "Semua field wajib diisi",
      };
    }

    await prisma.service.create({
      data: {
        service,
        price,
      },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: "Servis berhasil ditambahkan",
    };
  } catch (error) {
    console.error("Error createService:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan data servis",
    };
  }
}

export async function readService({
  search = "",
  page = 1,
  limit = 10,
}: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search && {
      service: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: { transactions: true },
    }),
    prisma.service.count({ where }),
  ]);

  return { data, total };
}

export async function updateService(formData: FormData, id: string) {
  try {
    const service = formData.get("service") as string;
    const price = Number(formData.get("price"));

    if (!service || isNaN(price)) {
      return {
        success: false,
        message: "Semua field wajib diisi",
      };
    }

    await prisma.service.update({
      where: { id },
      data: { service, price },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: "Servis berhasil diubah",
    };
  } catch (error) {
    console.error("Error updateService:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengubah data servis",
    };
  }
}

export async function deleteService(id: string) {
  try {
    await prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/services");

    return {
      success: true,
      message: "Servis berhasil dihapus",
    };
  } catch (error) {
    console.error("Error deleteService:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus data servis",
    };
  }
}

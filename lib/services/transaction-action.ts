"use server";

import { prisma } from "../db";

interface CreateTransactionInput {
  carId: string;
  lat: number;
  lng: number;
  serviceIds: string[];
  total: number;
}

export async function createTransaction(input: CreateTransactionInput) {
  try {
    const { carId, lat, lng, serviceIds, total } = input;

    if (!serviceIds || serviceIds.length === 0) {
      return {
        success: false,
        message: "Pilih minimal satu layanan.",
      };
    }

    const transaction = await prisma.transaction.create({
      data: {
        carId,
        lat,
        lng,
        total,
        services: {
          create: serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        services: true,
      },
    });

    await prisma.car.update({
      where: { id: carId },
      data: { status: "REPAIR" },
    });

    return {
      success: true,
      message: "Transaksi berhasil dibuat.",
      data: transaction,
    };
  } catch (error) {
    console.error("Error createCheckout:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data transaksi",
    };
  }
}

export async function readTransaction({
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
      transaction: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, total };
}

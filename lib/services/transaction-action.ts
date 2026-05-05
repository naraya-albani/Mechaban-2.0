"use server";

import { endOfDay } from "date-fns";
import { prisma } from "../db";
import { Prisma } from "../generated/prisma/client";
import { TransactionStatus } from "../generated/prisma/enums";

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
  status,
  dateFrom,
  dateTo,
}: {
  search?: string;
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  dateFrom?: Date;
  dateTo?: Date;
} = {}) {
  const offset = (page - 1) * limit;

  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
    ...(status && { status }),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: endOfDay(dateTo) }),
          },
        }
      : {}),
    ...(search && {
      car: {
        OR: [
          { merk: { contains: search, mode: "insensitive" } },
          { type: { contains: search, mode: "insensitive" } },
          { licensePlate: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        car: true,
        services: { include: { service: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, total };
}

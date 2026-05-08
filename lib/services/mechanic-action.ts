"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { TransactionStatus } from "../generated/prisma/client";

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          // Nominatim wajib ada User-Agent
          "Accept-Language": "id",
          "User-Agent": "MyApp/1.0",
        },
        next: { revalidate: 60 * 60 * 24 }, // cache 24 jam, koordinat jarang berubah
      },
    );

    if (!res.ok) return `${lat}, ${lng}`;

    const data = await res.json();

    return (
      (data.name || data.display_name.split(",")[0]) ??
      data.address?.road ??
      data.address?.suburb ??
      `${lat}, ${lng}`
    );
  } catch {
    return `${lat}, ${lng}`;
  }
}

export async function readOrders() {
  const orders = await prisma.transaction.findMany({
    where: { deletedAt: null, status: "PAYMENT" },
    orderBy: { createdAt: "desc" },
    include: {
      car: true,
      services: {
        include: { service: true },
      },
    },
  });

  // Geocode semua order secara paralel
  const ordersWithLocation = await Promise.all(
    orders.map(async (order) => ({
      ...order,
      locationName: await reverseGeocode(order.lat, order.lng),
    })),
  );

  return ordersWithLocation;
}

export async function takeOrder(orderId: string, mechanicId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const mechanic = await tx.mechanic.findUnique({
        where: { idAccount: mechanicId },
      });

      if (!mechanic) {
        return {
          success: false,
          message: "Tidak ditemukan mekanik dengan ID tersebut",
        };
      }

      // Lock row Transaction
      const [order] = await tx.$queryRaw<
        { id: string; status: TransactionStatus }[]
      >`
      SELECT id, status FROM "Transaction"
      WHERE id = ${orderId}
      FOR UPDATE
    `;

      if (!order) {
        return {
          success: false,
          message: "Pesanan tidak ditemukan",
        };
      }

      // if (order.status !== "PENDING") {
      //   return {
      //     success: false,
      //     message: "Pesanan tidak tersedia",
      //   };
      // }

      // Cek apakah sudah ada mekanik yang mengambil order ini
      const existing = await tx.transactionMechanic.findFirst({
        where: { transactionId: orderId },
      });

      if (existing) {
        return {
          success: false,
          message: "Pesanan sudah diambil mekanik lain",
        };
      }

      // Assign mekanik
      const result = await tx.transactionMechanic.create({
        data: {
          transactionId: orderId,
          mechanicId: mechanic.id,
        },
      });

      // Update status order jadi WAITING
      await tx.transaction.update({
        where: { id: orderId },
        data: { status: "WAITING" },
      });

      revalidatePath("/mechanic");

      return {
        success: true,
        message: "Pesanan berhasil diambil",
        data: result,
      };
    });

    return result;
  } catch (error) {
    console.error("Error takeOrder:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat mengambil pesanan.",
    };
  }
}

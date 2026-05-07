"use client";

import { Button } from "@/components/ui/button";
import {
  Car,
  Service,
  Transaction,
  TransactionService,
} from "@/lib/generated/prisma/client";
import { timeAgo } from "@/lib/helper/helper";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  MapPin,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";

type TransactionWithRelations = Transaction & {
  car: Car;
  services: (TransactionService & { service: Service })[];
  locationName: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  {
    label: "Total Revenue",
    value: "$45,231",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
    sub: "vs. last month",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    label: "Active Users",
    value: "2,350",
    change: "+15.3%",
    trend: "up",
    icon: Users,
    sub: "vs. last month",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    label: "New Orders",
    value: "1,247",
    change: "-3.2%",
    trend: "down",
    icon: ShoppingCart,
    sub: "vs. last month",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    label: "Conversion Rate",
    value: "3.6%",
    change: "+1.2%",
    trend: "up",
    icon: Activity,
    sub: "vs. last month",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
];

const sparklines: Record<string, number[]> = {
  revenue: [40, 55, 45, 70, 60, 80, 75, 90, 85, 100, 92, 88],
  users: [30, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90, 95],
  orders: [90, 80, 75, 85, 70, 60, 65, 55, 60, 50, 55, 48],
  conv: [20, 30, 35, 40, 38, 45, 42, 50, 55, 52, 60, 65],
};
const sparklineKeys = ["revenue", "users", "orders", "conv"];

// ─── Helper components ────────────────────────────────────────────────────────

function MiniBar({ heights }: { heights: number[] }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-current opacity-70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default function MechanicClient({
  orders,
}: {
  orders: TransactionWithRelations[];
}) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isUp = stat.trend === "up";
          return (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}
                >
                  {isUp ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{stat.change}</span>
                  <span className="text-muted-foreground font-normal ml-1">
                    {stat.sub}
                  </span>
                </div>
                <div className={stat.color}>
                  <MiniBar heights={sparklines[sparklineKeys[i]]} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity — 2/3 */}
      <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-foreground">
              Pesanan Terbaru
            </h2>
          </div>
          {orders.length > 5 && (
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Lihat Semua →
            </button>
          )}
        </div>
        <div className="divide-y">
          {orders.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="px-5 py-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.car.licensePlate} - {item.car.merk} {item.car.type}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Wrench className="w-3 h-3" />
                  <p className="text-xs text-muted-foreground">
                    {item.services.map((s) => s.service.service).join(", ")}
                  </p>
                </div>
                <Button
                  variant={"link"}
                  className="flex items-center gap-2 p-0 h-auto mt-1 text-foreground"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${item.lat},${item.lng}`,
                      "_blank",
                    )
                  }
                >
                  <MapPin className="w-3 h-3" />
                  <p className="text-xs">{item.locationName}</p>
                </Button>
              </div>
              <div className="text-right space-y-1 shrink-0">
                <div className="space-x-4">
                  <Button variant="outline">Lihat Detail</Button>
                  <Button>Ambil</Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {timeAgo(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

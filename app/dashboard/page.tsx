"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Car,
  Clock,
  DollarSign,
  ShoppingCart,
  Users,
} from "lucide-react";
import MainLayout from "@/layout/main-layout";

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

const recentActivity = [
  {
    user: "Alice Johnson",
    action: "Placed a new order",
    time: "2 min ago",
    status: "success",
    amount: "$240.00",
  },
  {
    user: "Bob Martinez",
    action: "Subscription renewed",
    time: "18 min ago",
    status: "success",
    amount: "$99.00",
  },
  {
    user: "Carol White",
    action: "Payment failed",
    time: "45 min ago",
    status: "error",
    amount: "$340.00",
  },
  {
    user: "David Kim",
    action: "Account created",
    time: "1 hr ago",
    status: "info",
    amount: "—",
  },
  {
    user: "Eva Chen",
    action: "Refund requested",
    time: "2 hr ago",
    status: "warning",
    amount: "$55.00",
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

function StatusDot({ status }: { status: string }) {
  const cls =
    status === "success"
      ? "bg-emerald-500"
      : status === "error"
        ? "bg-red-500"
        : status === "warning"
          ? "bg-amber-500"
          : "bg-blue-500";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${cls} shrink-0 mt-1`}
    />
  );
}

export default function Dashboard() {
  return (
    <MainLayout breadcrumbs={[{ label: "Dasbor" }]}>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dasbor
          </h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow dark:bg-blue-950/30">
            <div className="flex items-start justify-between">
              <p className="text-2xl font-bold text-foreground">
                Pesan Sekarang
              </p>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Car className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
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
                Recent Activity
              </h2>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </button>
          </div>
          <div className="divide-y">
            {recentActivity.map((item) => (
              <div
                key={item.user}
                className="px-5 py-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors"
              >
                <StatusDot status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.user}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.action}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.amount}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </MainLayout>
  );
}

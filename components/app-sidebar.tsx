"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Car,
  CircleUserRound,
  History,
  LayoutDashboard,
  Logs,
  Settings2,
  SquareTerminal,
  ToolCase,
  UserPen,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { NavHome } from "@/components/nav-home";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Akun",
      url: "/admin/accounts",
      icon: CircleUserRound,
    },
    {
      name: "Pesan",
      url: "/dashboard/checkout",
      icon: UserPen,
    },
    {
      name: "Garasi",
      url: "/dashboard/garage",
      icon: Car,
    },
    {
      name: "Layanan",
      url: "/admin/services",
      icon: ToolCase,
    },
    {
      name: "Mekanik",
      url: "/mechanic",
      icon: LayoutDashboard,
    },
    {
      name: "Pemesanan",
      url: "/dashboard/order",
      icon: Logs,
      isActive: true,
      items: [
        { title: "Menunggu Pembayaran", url: "/dashboard/waiting" },
        { title: "Daftar Transaksi", url: "/dashboard/transactions" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavHome />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

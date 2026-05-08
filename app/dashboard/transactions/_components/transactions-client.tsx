"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TransactionStatus } from "@/lib/generated/prisma/enums";
import { readTransaction } from "@/lib/services/transaction-action";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  ToolCase,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { DateRange } from "react-day-picker";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";

type Transaction = Awaited<ReturnType<typeof readTransaction>>["data"][number];

interface TransactionsClientProps {
  data: Transaction[];
  total: number;
}

const TRANSACTION_STATUSES = [
  { key: "PAYMENT", label: "Menunggu Pembayaran" },
  { key: "PENDING", label: "Menunggu Konfirmasi" },
  { key: "WAITING", label: "Menunggu Montir" },
  { key: "REPAIR", label: "Sedang Diperbaiki" },
  { key: "DONE", label: "Selesai" },
  { key: "CANCELLED", label: "Dibatalkan" },
] as const;

const STATUS_STYLES: Record<
  TransactionStatus,
  { dot: string; active: string }
> = {
  PAYMENT: {
    dot: "bg-amber-400",
    active: "border-amber-400  bg-amber-50  text-amber-700",
  },
  PENDING: {
    dot: "bg-yellow-400",
    active: "border-yellow-400 bg-yellow-50 text-yellow-700",
  },
  WAITING: {
    dot: "bg-blue-400",
    active: "border-blue-400   bg-blue-50   text-blue-700",
  },
  REPAIR: {
    dot: "bg-violet-400",
    active: "border-violet-400 bg-violet-50 text-violet-700",
  },
  DONE: {
    dot: "bg-green-400",
    active: "border-green-400  bg-green-50  text-green-700",
  },
  CANCELLED: {
    dot: "bg-red-400",
    active: "border-red-400    bg-red-50    text-red-700",
  },
};

export default function TransactionsClient({
  data,
  total,
}: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(data);
  const [totalData, setTotalData] = useState(total);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<TransactionStatus | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const totalPages = Math.ceil(totalData / LIMIT);

  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const fetchData = useCallback(
    (currentPage = 1) => {
      startTransition(async () => {
        const result = await readTransaction({
          search,
          page: currentPage,
          limit: LIMIT,
          status:
            (selectedStatus as TransactionStatus | undefined) ?? undefined,
          dateFrom: date?.from,
          dateTo: date?.to,
        });
        setTransactions(result.data);
        setTotalData(result.total);
      });
    },
    [search, selectedStatus, date],
  );

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <InputGroup>
            <InputGroupInput
              name="search"
              placeholder="Cari transaksimu di sini"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon align="inline-start">
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-range"
              className="justify-start px-2.5 font-normal"
            >
              <CalendarIcon />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pilih Tanggal Transaksi</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm shrink-0">Status</p>
          <div className="flex flex-wrap gap-2">
            {TRANSACTION_STATUSES.map(({ key, label }) => {
              const isActive = selectedStatus === key;
              return (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedStatus((prev) => (prev === key ? null : key))
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? STATUS_STYLES[key].active
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      STATUS_STYLES[key].dot,
                    )}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {selectedStatus && (
          <button
            onClick={() => setSelectedStatus(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>
      <ItemGroup className="gap-4">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : transactions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ToolCase className="size-16 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-xl">Tidak ada transaksi</EmptyTitle>
              <EmptyDescription className="text-md">
                Silakan lakukan transaksi untuk melihatnya di sini.
              </EmptyDescription>
              <EmptyContent>
                <Link href="/dashboard/checkout" passHref>
                  <Button>Lakukan Transaksi</Button>
                </Link>
              </EmptyContent>
            </EmptyHeader>
          </Empty>
        ) : (
          transactions.map((trx) => (
            <Item key={trx.id} variant="outline" role="listitem">
              <ItemHeader className="text-muted-foreground">
                {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                {(() => {
                  const statusInfo = TRANSACTION_STATUSES.find(
                    (s) => s.key === trx.status,
                  );
                  if (!statusInfo) return null;
                  return (
                    <span
                      className={cn(
                        "ml-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                        STATUS_STYLES[trx.status as TransactionStatus].active,
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  );
                })()}
              </ItemHeader>
              <ItemContent>
                <ItemTitle className="line-clamp-1">
                  {trx.car.merk} {trx.car.type}{" "}
                  <span className="text-muted-foreground">
                    • {trx.car.licensePlate}
                  </span>
                </ItemTitle>
                <ItemDescription>
                  {trx.services.map((s) => s.service.service).join(", ")}
                </ItemDescription>
              </ItemContent>
              <ItemContent className="flex-none text-center">
                Rp{trx.total.toLocaleString("id-ID")}
              </ItemContent>
              <ItemFooter className="flex justify-end">
                <Button variant="outline">Lihat Detail</Button>
              </ItemFooter>
            </Item>
          ))
        )}
      </ItemGroup>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Total {totalData} data transaksi</span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span>
            Halaman {page} dari {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isPending}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

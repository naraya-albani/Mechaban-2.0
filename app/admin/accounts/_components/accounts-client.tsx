"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { readAccount, updateRoleAccount } from "@/lib/services/account-action";
import { Ban, ChevronLeft, ChevronRight, Search, UserPen } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

const LIMIT = 10;

type AccountRow = Awaited<ReturnType<typeof readAccount>>["data"][number];

export default function AccountsClient() {
  const [data, setData] = useState<AccountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchData = useCallback(
    (currentPage: number, currentSearch: string) => {
      startTransition(async () => {
        const result = await readAccount({
          search: currentSearch || undefined,
          offset: (currentPage - 1) * LIMIT,
        });
        setData(result.data);
        setTotal(result.total);
      });
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchData(1, "");
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchData(1, value);
    }, 500);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, search);
  };

  const handleUpdateRole = async (account: AccountRow) => {
    const newRole = account.role === "user" ? "mechanic" : "user";
    setUpdatingId(account.id);
    try {
      const result = await updateRoleAccount({
        accountId: account.id,
        role: newRole,
      });
      if (result.success) {
        // Optimistically update local state
        setData((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, role: newRole } : a)),
        );
        toast.success(result.message);
      } else {
        console.error(result.message);
        toast.error("Gagal memperbarui role akun");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Search & Action */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No.</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Akun Dibuat</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Tidak ada data akun.
                </TableCell>
              </TableRow>
            ) : (
              data.map((account, index) => (
                <TableRow key={account.id}>
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * 10 + index + 1}
                  </TableCell>
                  <TableCell className="font-semibold flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={account.image || undefined}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback suppressHydrationWarning>
                        {account.name.charAt(0) +
                          account.name.split(" ")[1]?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    {account.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.role === "user" ? (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                        Pelanggan
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Mekanik
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(account.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={updatingId === account.id}
                                >
                                  <UserPen />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Ubah Role ke{" "}
                                {account.role === "user"
                                  ? "Mekanik"
                                  : "Pelanggan"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Ubah Role Akun?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Role akun <strong>{account.name}</strong> akan
                                diubah menjadi{" "}
                                <strong>
                                  {account.role === "user"
                                    ? "Mekanik"
                                    : "Pelanggan"}
                                </strong>
                                . Tindakan ini tidak dapat dibatalkan secara
                                otomatis. Lanjutkan?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUpdateRole(account)}
                              >
                                Ya, Ubah
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Ubah Role ke{" "}
                          {account.role === "user" ? "Mekanik" : "Pelanggan"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label="Submit"
                        >
                          <Ban />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Blokir Akun</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Total {total} data akun</span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1 || isPending}
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
            disabled={page >= totalPages || isPending}
            onClick={() => handlePageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

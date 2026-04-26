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
import { Service } from "@/types";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface Props {
  data: Service[];
  page: number;
  search: string;
  totalPages: number;
  total: number;
}

export default function ServicesClient({
  data,
  page,
  search,
  totalPages,
  total,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (newParams: Record<string, string>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) current.set(key, value);
        else current.delete(key);
      });
      startTransition(() => {
        router.push(`${pathname}?${current.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  let searchTimeout: ReturnType<typeof setTimeout>;
  return (
    <div>
      {/* Search & Action */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email..."
            className="pl-9"
            defaultValue={search}
            onChange={(e) => {
              clearTimeout(searchTimeout);
              const val = e.target.value;
              searchTimeout = setTimeout(() => {
                updateParams({ search: val, page: "1" });
              }, 500);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Akun Dibuat</TableHead>
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
                      <AvatarFallback>
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
                    {account.role === "admin" ? (
                      <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                        Admin
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Pelanggan
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
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span>
            Halaman {page} dari {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

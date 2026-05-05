"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createService,
  deleteService,
  updateService,
} from "@/lib/services/service-action";
import { Service } from "@/lib/generated/prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  ToolCase,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  data: Service[];
  page: number;
  search: string;
  totalPages: number;
  total: number;
}

function ServicesClient({ data, page, search, totalPages, total }: Props) {
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
          <InputGroup>
            <InputGroupInput
              placeholder="Cari nama layanan..."
              defaultValue={search}
              onChange={(e) => {
                clearTimeout(searchTimeout);
                const val = e.target.value;
                searchTimeout = setTimeout(() => {
                  updateParams({ search: val, page: "1" });
                }, 500);
              }}
            />
            <InputGroupAddon align="inline-start">
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <ServiceDialog />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No.</TableHead>
              <TableHead>Nama Layanan</TableHead>
              <TableHead>Harga</TableHead>
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
                <TableCell colSpan={8}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="default">
                        <ToolCase />
                      </EmptyMedia>
                      <EmptyTitle className="text-xl">
                        Tidak ada layanan
                      </EmptyTitle>
                      <EmptyDescription className="text-md">
                        Tambahkan layanan untuk membantu pelanggan.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              data.map((service, index) => (
                <TableRow key={service.id}>
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * 10 + index + 1}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {service.service}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Rp{service.price.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <ServiceDialog service={service} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Total {total} data layanan</span>

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

function ServiceDialog({ service = null }: { service?: Service | null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const parseRupiah = (value: string) =>
    Number(value.replace(/\./g, "").replace(/[^0-9]/g, ""));

  const [display, setDisplay] = useState(
    service?.price ? service.price.toLocaleString("id-ID") : "",
  );
  const [raw, setRaw] = useState(service?.price ?? 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseRupiah(e.target.value);
    setRaw(parsed);
    setDisplay(parsed.toLocaleString("id-ID"));
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = service
          ? await updateService(formData, service.id)
          : await createService(formData);

        if (result && !result.success) {
          setError(result.message);
          return;
        }

        toast.success(result?.message ?? "Berhasil");

        formRef.current?.reset();
        setDialogOpen(false);
        setDisplay("");
        setRaw(0);
      } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan, coba lagi.");
      }
    });
  }

  function handleDelete() {
    if (!service) return;
    startDeleteTransition(async () => {
      try {
        const result = await deleteService(service.id);
        toast.success(result?.message ?? "Berhasil");
        setDialogOpen(false);
      } catch (err) {
        console.error(err);
        setError("Gagal menghapus mobil.");
      }
    });
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setDisplay(
            service?.price ? service.price.toLocaleString("id-ID") : "",
          );
          setRaw(service?.price ?? 0);
          setError(null);
          formRef.current?.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        {service ? (
          <Button variant="outline">Lihat Detail</Button>
        ) : (
          <Button size={"lg"}>
            <Plus />
            Tambah Layanan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {service ? "Detail Layanan" : "Tambah Layanan"}
          </DialogTitle>
          <DialogDescription>
            Daftarkan semua layanan Anda agar bisa membantu pelanggan.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <FieldGroup className="mb-4">
            <Field>
              <Label htmlFor="service">Nama Layanan</Label>
              <Input
                id="service"
                name="service"
                placeholder="Ganti Oli"
                defaultValue={service?.service ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="price">Harga</Label>
              <div className="relative">
                <InputGroup>
                  <InputGroupInput
                    id="price"
                    placeholder="100.000"
                    value={display}
                    onChange={handleChange}
                  />
                  <InputGroupAddon>
                    <InputGroupText>Rp</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {/* Hidden input yang dikirim ke server action */}
                <input type="hidden" name="price" value={raw} />
              </div>
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <DialogFooter>
            {service && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant={"destructive"}>Hapus</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Yakin Ingin Menghapus Layanan?</DialogTitle>
                  <DialogDescription>
                    Ini akan membuat layanan terhapus secara permanen
                  </DialogDescription>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      variant={"destructive"}
                      disabled={isDeleting}
                      onClick={handleDelete}
                    >
                      {isDeleting ? "Menghapus..." : "Hapus"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : service ? "Ubah" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ServicesClient, ServiceDialog };

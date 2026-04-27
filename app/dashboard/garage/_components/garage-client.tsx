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
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { Car } from "@/lib/generated/prisma/client";
import { createCar, deleteCar, updateCar } from "@/lib/services/car-action";
import { toast } from "sonner";

export default function CarDialog({ car = null }: { car?: Car | null }) {
  const { data: session } = authClient.useSession();

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState<string | undefined>(car?.year ?? undefined);
  const [decadeStart, setDecadeStart] = useState(2020);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("ownerId", session?.user.id ?? "");
    formData.set("year", String(year ?? ""));

    startTransition(async () => {
      try {
        const result = car
          ? await updateCar(formData, car.id)
          : await createCar(formData);

        if (result && !result.success) {
          setError(result.message);
          return;
        }

        toast.success(result?.message ?? "Berhasil");

        formRef.current?.reset();
        setYear(undefined);
        setDialogOpen(false);
      } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan, coba lagi.");
      }
    });
  }

  function handleDelete() {
    if (!car) return;
    startDeleteTransition(async () => {
      try {
        const result = await deleteCar(car.id);
        toast.success(result?.message ?? "Berhasil");
        setDialogOpen(false);
      } catch (err) {
        console.error(err);
        setError("Gagal menghapus mobil.");
      }
    });
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {car ? (
          <Button variant="outline" asChild>
            <div className="order-3 ml-auto w-fit gap-2 md:order-0">
              <span>Lihat Detail</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>
        ) : (
          <Button size={"lg"}>
            <Plus />
            Tambah Mobil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{car ? "Detail Mobil" : "Tambah Mobil"}</DialogTitle>
          <DialogDescription>
            Daftarkan semua mobil Anda agar kami bisa bantu rawat.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <FieldGroup className="mb-4">
            <Field>
              <Label htmlFor="license">No. Polisi</Label>
              <Input
                id="license"
                name="license"
                placeholder="AB 1234 CD"
                defaultValue={car?.licensePlate ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="merk">Merk</Label>
              <Input
                id="merk"
                name="merk"
                placeholder="Honda"
                defaultValue={car?.merk ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="type">Tipe</Label>
              <Input
                id="type"
                name="type"
                placeholder="Civic"
                defaultValue={car?.type ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="transmition">Transmisi</Label>
              <Select
                name="transmition"
                defaultValue={car?.transmition ?? undefined}
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Pilih Transmisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Transmisi</SelectLabel>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTO">Auto</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="year">Tahun Produksi</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-30">
                    {year ?? "Pilih tahun"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-55 p-2">
                  {/* Header navigasi */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setDecadeStart((d) => Math.max(1900, d - 12))
                      }
                      disabled={decadeStart <= 1900}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {decadeStart} –{" "}
                      {Math.min(decadeStart + 11, new Date().getFullYear())}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setDecadeStart((d) =>
                          Math.min(new Date().getFullYear(), d + 12),
                        )
                      }
                      disabled={decadeStart + 12 > new Date().getFullYear()}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Grid tahun */}
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from(
                      {
                        length: Math.min(
                          12,
                          new Date().getFullYear() - decadeStart + 1,
                        ),
                      },
                      (_, i) => decadeStart + i,
                    ).map((y) => (
                      <Button
                        key={y}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 text-sm",
                          Number(year) === y &&
                            "bg-primary text-primary-foreground hover:bg-primary",
                        )}
                        onClick={() => {
                          setYear(String(y));
                          setOpen(false);
                        }}
                      >
                        {y}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </Field>
          </FieldGroup>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <DialogFooter>
            {car && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant={"destructive"}>Hapus</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Yakin Ingin Menghapus Mobil?</DialogTitle>
                  <DialogDescription>
                    Ini akan membuat mobil terhapus secara permanen
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
              {isPending ? "Menyimpan..." : car ? "Ubah" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

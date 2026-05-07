"use client";

import {
  AlertCircle,
  Loader2,
  LocateFixed,
  MapPin,
  Route,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { createTransaction } from "@/lib/services/transaction-action";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, Service } from "@/lib/generated/prisma/client";

interface SearchResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

interface RouteInfo {
  coordinates: [number, number][];
  distance: number; // meter
  duration: number; // detik
}

interface Suggestion {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

const CENTER_POINT = {
  lng: 114.15228928828692,
  lat: -8.366400812635693,
  name: "Bengkel MW Marchaban",
};
const MAX_DISTANCE_KM = 5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function formatDuration(s: number) {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} menit`;
  return `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
}

function MapFlyController({
  target,
}: {
  target: { lng: number; lat: number; zoom: number } | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !target) return;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: target.zoom,
      duration: 1800,
      essential: true,
    });
  }, [map, isLoaded, target]);

  return null;
}

export default function CheckoutClient({
  services,
  cars,
}: {
  services: Service[];
  cars: Car[];
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [flyTarget, setFlyTarget] = useState<{
    lng: number;
    lat: number;
    zoom: number;
  } | null>(null);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [carId, setCarId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!carId) return setError("Pilih mobil terlebih dahulu.");
    if (!destination) return setError("Pilih lokasi tujuan terlebih dahulu.");

    const selected = Object.entries(selectedServices)
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    if (selected.length === 0) return setError("Pilih minimal satu layanan.");

    setLoadingSubmit(true);
    const result = await createTransaction({
      carId,
      lat: destination.lat,
      lng: destination.lng,
      serviceIds: selected,
      total,
    });

    if (!result.success) {
      setError(result.message);
    } else {
      toast.success(result.message);
    }
    setLoadingSubmit(false);
  };

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "id", "User-Agent": "MyApp/1.0" } },
        );
        const data = await res.json();
        const results: Suggestion[] = (data || []).map((item: any) => ({
          placeId: item.place_id,
          name: item.name || item.display_name.split(",")[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  }, []);

  // ── Fetch rute OSRM ──────────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (dest: SearchResult) => {
    setLoadingRoute(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
          `${CENTER_POINT.lng},${CENTER_POINT.lat};${dest.lng},${dest.lat}` +
          `?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.routes?.length > 0) {
        const r = data.routes[0];
        setRoute({
          coordinates: r.geometry.coordinates,
          distance: r.distance,
          duration: r.duration,
        });

        // Titik tengah rute → fly ke sana
        const midLng = (CENTER_POINT.lng + dest.lng) / 2;
        const midLat = (CENTER_POINT.lat + dest.lat) / 2;
        setFlyTarget({ lng: midLng, lat: midLat, zoom: 14 });
      }
    } catch {
      setError("Gagal mengambil data rute.");
    } finally {
      setLoadingRoute(false);
    }
  }, []);

  // ── Proses lokasi (validasi radius + fetch rute) ─────────────────────────────
  const processLocation = useCallback(
    async (result: SearchResult) => {
      const distKm = haversineKm(
        CENTER_POINT.lat,
        CENTER_POINT.lng,
        result.lat,
        result.lng,
      );
      if (distKm > MAX_DISTANCE_KM) {
        setError(
          `Lokasi terlalu jauh (${distKm.toFixed(2)} km). Maks. radius ${MAX_DISTANCE_KM} km.`,
        );
        setDestination(null);
        setRoute(null);
        return;
      }
      setDestination(result);
      setError(null);
      await fetchRoute(result);
    },
    [fetchRoute],
  );

  // ── Handle input change ──────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
  };

  // ── Pilih suggestion ─────────────────────────────────────────────────────────
  const handleSelectSuggestion = async (s: Suggestion) => {
    setQuery(s.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setLoadingSearch(true);
    setRoute(null);
    setDestination(null);
    setError(null);
    await processLocation({
      name: s.name,
      displayName: s.displayName,
      lat: s.lat,
      lng: s.lng,
    });
    setLoadingSearch(false);
  };

  // ── Search manual (Enter / tombol) ───────────────────────────────────────────
  const handleSearch = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    setLoadingSearch(true);
    setError(null);
    setRoute(null);
    setDestination(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "Accept-Language": "id", "User-Agent": "MyApp/1.0" } },
      );
      const data = await res.json();
      if (!data?.length) {
        setError("Lokasi tidak ditemukan.");
        return;
      }
      await processLocation({
        name: query,
        displayName: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      });
    } catch {
      setError("Gagal mencari lokasi.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolokasi.");
      return;
    }
    setLoadingGps(true);
    setError(null);
    setRoute(null);
    setDestination(null);
    setShowSuggestions(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let displayName = "Lokasi Saya";
        let name = "Lokasi Saya";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "id", "User-Agent": "MyApp/1.0" } },
          );
          const data = await res.json();
          if (data?.display_name) {
            displayName = data.display_name;
            name = data.name || data.display_name.split(",")[0];
          }
        } catch {}
        setQuery(name);
        await processLocation({ name, displayName, lat, lng });
        setLoadingGps(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Izin lokasi ditolak."
            : "Gagal mendapatkan lokasi GPS.",
        );
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setDestination(null);
    setRoute(null);
    setError(null);
    setFlyTarget({ lng: CENTER_POINT.lng, lat: CENTER_POINT.lat, zoom: 14 });
    inputRef.current?.focus();
  };

  const isLoading = loadingSearch || loadingGps || loadingRoute;

  const toggleService = (id: string) =>
    setSelectedServices((prev) => ({ ...prev, [id]: !prev[id] }));

  const subtotal = services.reduce(
    (sum, s) => sum + (selectedServices[s.id] ? s.price : 0),
    0,
  );
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-17.5">
        <div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="location">Tunjukkan Lokasi Anda</FieldLabel>
              <div className="space-y-3">
                {/* ── Search Bar ── */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      placeholder="Cari lokasi Anda..."
                      value={query}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                        if (e.key === "Escape") setShowSuggestions(false);
                      }}
                      onFocus={() =>
                        suggestions.length > 0 && setShowSuggestions(true)
                      }
                      disabled={isLoading}
                      className="pr-8"
                    />

                    {/* Clear button */}
                    {query && (
                      <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                      <div
                        ref={suggestionsRef}
                        className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border rounded-lg shadow-lg overflow-hidden"
                      >
                        {loadingSuggestions ? (
                          <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" />
                            Mencari...
                          </div>
                        ) : (
                          suggestions.map((s) => (
                            <button
                              key={s.placeId}
                              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-0"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectSuggestion(s)}
                            >
                              <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {s.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {s.displayName}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSearch} disabled={isLoading}>
                    {loadingSearch ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </Button>

                  <Button
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading}
                    variant="outline"
                    title="Gunakan lokasi saat ini"
                  >
                    {loadingGps ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LocateFixed className="size-4" />
                    )}
                  </Button>
                </div>

                {/* ── Error ── */}
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Info Rute ── */}
                {route && destination && (
                  <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <Route className="size-4 text-primary shrink-0" />
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        <span className="text-muted-foreground">Tujuan: </span>
                        <span className="font-medium">{destination.name}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Jarak: </span>
                        <span className="font-medium">
                          {formatDistance(route.distance)}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">
                          Estimasi:{" "}
                        </span>
                        <span className="font-medium">
                          {formatDuration(route.duration)}
                        </span>
                      </span>
                    </div>
                    {loadingRoute && (
                      <Loader2 className="size-4 animate-spin ml-auto text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* ── Map ── */}
                <Card className="h-80 p-0 overflow-hidden relative">
                  <Map center={[CENTER_POINT.lng, CENTER_POINT.lat]} zoom={14}>
                    {/* FlyTo controller — harus di dalam <Map> */}
                    <MapFlyController target={flyTarget} />

                    <MapControls showCompass showFullscreen />

                    {/* Rute */}
                    {route && (
                      <MapRoute
                        coordinates={route.coordinates}
                        color="#6366f1"
                        width={5}
                        opacity={0.85}
                      />
                    )}

                    {/* Marker titik pusat */}
                    <MapMarker
                      longitude={CENTER_POINT.lng}
                      latitude={CENTER_POINT.lat}
                    >
                      <MarkerContent>
                        <div className="size-5 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                        <MarkerLabel position="top">
                          {CENTER_POINT.name}
                        </MarkerLabel>
                      </MarkerContent>
                      <MarkerPopup>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground text-sm">
                            {CENTER_POINT.name}
                          </p>
                          <p className="text-muted-foreground text-xs tabular-nums">
                            {CENTER_POINT.lat.toFixed(5)},{" "}
                            {CENTER_POINT.lng.toFixed(5)}
                          </p>
                        </div>
                      </MarkerPopup>
                    </MapMarker>

                    {/* Marker destinasi */}
                    {destination && (
                      <MapMarker
                        longitude={destination.lng}
                        latitude={destination.lat}
                      >
                        <MarkerContent>
                          <MapPin
                            className="fill-rose-500 stroke-white drop-shadow-md"
                            size={28}
                          />
                        </MarkerContent>
                        <MarkerTooltip>{destination.name}</MarkerTooltip>
                        <MarkerPopup>
                          <div className="space-y-1 max-w-50">
                            <p className="font-medium text-foreground text-sm">
                              {destination.name}
                            </p>
                            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                              {destination.displayName}
                            </p>
                            <p className="text-muted-foreground text-xs tabular-nums">
                              {destination.lat.toFixed(5)},{" "}
                              {destination.lng.toFixed(5)}
                            </p>
                          </div>
                        </MarkerPopup>
                      </MapMarker>
                    )}
                  </Map>

                  {/* Overlay loading rute */}
                  {loadingRoute && (
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center pointer-events-none">
                      <div className="bg-background border rounded-md px-3 py-2 flex items-center gap-2 text-sm shadow-md">
                        <Loader2 className="size-4 animate-spin" />
                        Memuat rute...
                      </div>
                    </div>
                  )}
                </Card>
              </div>
              <FieldDescription>
                Radius maksimal:{" "}
                <span className="font-medium">{MAX_DISTANCE_KM} km</span> dari
                titik pusat
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Pilih Mobil</FieldLabel>
              <Select name="car" value={carId} onValueChange={setCarId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih mobil yang mau diservis" />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.merk} {car.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </div>
        <div>
          <div className="border-b pb-7">
            <h2 className="text-lg font-semibold">Pilih Layanan</h2>
          </div>
          <ScrollArea className="h-72 w-full">
            <div className="my-4 space-y-4">
              {services.map((service) => {
                const selected = !!selectedServices[service.id];
                return (
                  <Field
                    key={service.id}
                    data-state={selected ? "checked" : "unchecked"}
                    className={`rounded-lg border cursor-pointer transition-colors ${
                      selected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <FieldLabel className="flex items-center justify-between w-full cursor-pointer p-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">
                          {service.service}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rp{service.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <Switch
                        checked={selected}
                        onCheckedChange={() => toggleService(service.id)}
                        className="sr-only"
                      />
                    </FieldLabel>
                  </Field>
                );
              })}
            </div>
          </ScrollArea>
          <div className="border-t space-y-2.5 pt-5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Rp{subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Pajak (11%)</span>
              <span>Rp{tax.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total</span>
              <span>Rp{total.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading || loadingSubmit}
            className="w-full mt-4"
          >
            {loadingSubmit ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Buat Transaksi"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

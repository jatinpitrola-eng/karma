"use client";
import { create } from "zustand";

// ---------- Vehicle selector store (applies filter everywhere) ----------
export type VehicleSel = { id: string; key: string; type: string; brand: string; model: string } | null;

type VehicleState = {
  vehicle: VehicleSel;
  setVehicle: (v: VehicleSel) => void;
  clear: () => void;
};

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicle: null,
  setVehicle: (v) => {
    set({ vehicle: v });
    try {
      if (v) localStorage.setItem("pk_vehicle", JSON.stringify(v));
      else localStorage.removeItem("pk_vehicle");
    } catch {}
  },
  clear: () => {
    set({ vehicle: null });
    try {
      localStorage.removeItem("pk_vehicle");
    } catch {}
  },
}));

// Hydrate vehicle from localStorage once on app start
export function hydrateVehicle() {
  try {
    const raw = localStorage.getItem("pk_vehicle");
    if (raw) {
      const v = JSON.parse(raw);
      if (v && v.id) useVehicleStore.getState().setVehicle(v);
    }
  } catch {}
}

// ---------- Lightweight session store (hydrated from /api/auth/me) ----------
export type Me = {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  retailer?: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    city: string;
    categorySlugs: string;
    status: string;
  } | null;
} | null;

type SessionState = {
  me: Me;
  loading: boolean;
  cartCount: number;
  setMe: (m: Me) => void;
  setCartCount: (n: number) => void;
  refresh: () => Promise<void>;
};

export const useSession = create<SessionState>((set) => ({
  me: null,
  loading: true,
  cartCount: 0,
  setMe: (m) => set({ me: m, loading: false }),
  setCartCount: (n) => set({ cartCount: n }),
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({
        me: data.user ? { ...data.user, retailer: data.retailer ?? null } : null,
        cartCount: data.cartCount ?? 0,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));

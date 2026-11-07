# KARMA — India's Auto Parts Marketplace 🛵⚙️

A multi-role auto-parts marketplace PWA (buyers · retailers · admin) built with **Next.js + TypeScript + Tailwind + shadcn/ui + Prisma (SQLite)**.

> Action · Work · Duty

## ✨ Features

- **Flipkart-style storefront** — glass blue header (#2874F0), yellow accents, real product photography, deals countdown, vehicle-fit filtering (bike/scooter/car), search suggestions
- **Customers** — OTP login (demo), cart + `DEMO10` coupon, saved addresses, COD & mock-UPI checkout, live order timeline, in-app + push notifications
- **Retailers (Seller Hub)** — gated onboarding (signup → admin approval → live), add/edit products, tenant-isolated orders, status progression (Confirm → Packed → Shipped) with ≤5s customer notifications
- **Admin console** (secret `/admin`) — approvals, all orders with delivery addresses, products, retailers, customers, low-stock alerts, ₹-formatted revenue
- **PWA** — installable (192/512/maskable icons + manifest), offline shell, service worker (`karma-v5`, never caches `/api/*`), app-open medallion splash loader
- **Trilingual** — English / हिन्दी / ગુજરાતી (100% pure dictionaries, localStorage persisted)
- **Retailer visibility rule** — the store name renders on *every* surface a product appears (cards, product page, cart, checkout, orders) in all 3 languages

## 🚀 Quick start

```bash
npm install
cp .env.example .env        # SQLite database path
npx prisma db push
npm run db:seed             # or: bun prisma/seed.ts  (additive & re-run safe)
npm run dev                 # http://localhost:3000
```

## 🔑 Demo accounts (OTP is always `1234`)

| Role | Phone | Notes |
|---|---|---|
| Customer | `9000000001` | Aarav Shah |
| Retailer (approved) | `9876543210` | Shree Auto Parts |
| Retailer (approved) | `9111100002` | Sharma Motor Parts |
| Admin | `9999999999` | secret console at `/admin` |

Demo coupon: `DEMO10` (10% off) · Mock UPI: any VPA → 2s spinner → success.

## 🧱 Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma + SQLite · Zustand · next-pwa-style hand-rolled SW · i18n (custom, zero-dependency)

## 📁 Structure

```
src/
  app/            # routes: /, /product/[id], /cart, /checkout, /orders, /seller/*, /admin, ...
  api/            # REST endpoints (auth, products, cart, orders, retailer, admin, notifications)
  components/     # layout, product, brand (splash), pwa, notifications, ui
  lib/            # i18n dictionaries (en/hi/gu), session, format (₹ en-IN), db, notify
prisma/           # schema + idempotent seed (8 categories, 39 live products, vehicles, reviews)
public/           # manifest.json, sw.js, icons (medallion set), images
```

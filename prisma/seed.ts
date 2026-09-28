/**
 * PartKart seed — ADDITIVE & RE-RUN SAFE
 * - Every entity is upserted by a stable unique key (slug / key / phone / code)
 * - Second run produces identical row counts, zero duplicates, zero deletes
 * - Prints seeded counts at the end
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---------------- helpers ----------------
const g = (a: string, b: string, c: string) => JSON.stringify([{ g: `${a} ${b} ${c}` }]);
const img3 = (base: string, e: string) =>
  JSON.stringify([
    { g: base, e },
    { g: base.replace("100", "50").replace("200", "100"), e },
    { g: base.replace("orange", "amber").replace("red", "rose"), e },
  ]);

type P = {
  key: string; name: string; partNumber: string; cat: string; retailer: string;
  price: number; mrp: number; stock: number; desc: string; vehicles: string[];
  grad: [string, string, string]; emoji: string;
};

// ---------------- data ----------------
const CATEGORIES = [
  { slug: "chain-sprocket-kits", name: "Chain & Sprocket Kits", nameHi: "चेन और स्प्रॉकेट किट", nameGu: "ચેન અને સ્પ્રોકેટ કીટ", icon: "link", gradient: "from-orange-400 to-red-500" },
  { slug: "gearbox-parts", name: "Gearbox Parts", nameHi: "गियरबॉक्स पार्ट्स", nameGu: "ગિયરબોક્સ પાર્ટ્સ", icon: "cog", gradient: "from-amber-400 to-orange-500" },
  { slug: "drive-belts", name: "Drive Belts", nameHi: "ड्राइव बेल्ट", nameGu: "ડ્રાઇવ બેલ્ટ", icon: "circle-dot", gradient: "from-yellow-400 to-amber-500" },
  { slug: "brake-parts", name: "Brake Parts", nameHi: "ब्रेक पार्ट्स", nameGu: "બ્રેક પાર્ટ્સ", icon: "disc-3", gradient: "from-red-400 to-rose-500" },
  { slug: "clutch-plates", name: "Clutch Plates", nameHi: "क्लच प्लेट", nameGu: "ક્લચ પ્લેટ", icon: "disc", gradient: "from-stone-400 to-neutral-600" },
  { slug: "filters-oils", name: "Filters & Oils", nameHi: "फ़िल्टर और तेल", nameGu: "ફિલ્ટર અને તેલ", icon: "filter", gradient: "from-sky-400 to-cyan-500" },
  { slug: "electrical", name: "Electrical", nameHi: "इलेक्ट्रिकल", nameGu: "ઇલેક્ટ્રિકલ", icon: "zap", gradient: "from-violet-400 to-purple-500" },
  { slug: "body-mirrors", name: "Body & Mirrors", nameHi: "बॉडी और मिरर", nameGu: "બોડી અને મિરર", icon: "car-front", gradient: "from-emerald-400 to-teal-500" },
];

const VEHICLES = [
  { key: "hero-splendor-plus", type: "BIKE", brand: "Hero", model: "Splendor Plus" },
  { key: "bajaj-pulsar-150", type: "BIKE", brand: "Bajaj", model: "Pulsar 150" },
  { key: "honda-activa-6g", type: "SCOOTER", brand: "Honda", model: "Activa 6G" },
  { key: "royal-enfield-classic-350", type: "BIKE", brand: "Royal Enfield", model: "Classic 350" },
  { key: "tvs-jupiter", type: "SCOOTER", brand: "TVS", model: "Jupiter" },
  { key: "maruti-swift", type: "CAR", brand: "Maruti Suzuki", model: "Swift" },
  { key: "hyundai-i10", type: "CAR", brand: "Hyundai", model: "Grand i10" },
];

const RETAILERS = [
  { phone: "9876543210", businessName: "Shree Auto Spares", ownerName: "Ramesh Patel", city: "Ahmedabad", status: "APPROVED", slugs: "chain-sprocket-kits,brake-parts,clutch-plates,filters-oils" },
  { phone: "9876543211", businessName: "Krishna Motors", ownerName: "Suresh Kumar", city: "Jaipur", status: "APPROVED", slugs: "gearbox-parts,drive-belts,electrical,body-mirrors" },
  { phone: "9876543212", businessName: "Raj Auto Works", ownerName: "Vikram Singh", city: "Ludhiana", status: "APPROVED", slugs: "chain-sprocket-kits,brake-parts,electrical,filters-oils,body-mirrors" },
  { phone: "9876500000", businessName: "Modi Spare House", ownerName: "Jayesh Modi", city: "Surat", status: "PENDING", slugs: "clutch-plates,filters-oils" },
];

// 38 products across 8 categories; each mapped to 2-4 vehicles
const PRODUCTS: P[] = [
  // --- Chain & Sprocket Kits (6) — Shree Auto Spares ---
  { key: "p-chain-kit-splendor", name: "Chain Sprocket Kit — Hero Splendor", partNumber: "CSK-SP-101", cat: "chain-sprocket-kits", retailer: "9876543210", price: 1299, mrp: 1899, stock: 24, desc: "Premium 428H chain with hardened sprocket set for Hero Splendor Plus. Heat-treated steel for 2x longer life. Kit includes chain, front sprocket, rear sprocket and connecting clip.", vehicles: ["hero-splendor-plus"], grad: ["from-orange-100", "to-amber-200", "via-orange-50"], emoji: "⛓️" },
  { key: "p-chain-kit-pulsar", name: "Chain Sprocket Kit — Bajaj Pulsar 150", partNumber: "CSK-PG-205", cat: "chain-sprocket-kits", retailer: "9876543210", price: 1649, mrp: 2299, stock: 18, desc: "OEM-grade 520 conversion chain and sprocket kit for Pulsar 150. Smooth engagement, reduced noise, includes rivet-type master link.", vehicles: ["bajaj-pulsar-150"], grad: ["from-orange-100", "to-amber-200", "via-orange-50"], emoji: "⛓️" },
  { key: "p-chain-kit-re350", name: "Chain Sprocket Kit — Royal Enfield Classic 350", partNumber: "CSK-RE-350", cat: "chain-sprocket-kits", retailer: "9876543212", price: 2499, mrp: 3499, stock: 12, desc: "Heavy-duty 530H chain with CNC-machined sprockets for Classic 350. Zinc-coated for corrosion resistance on Indian roads.", vehicles: ["royal-enfield-classic-350"], grad: ["from-orange-100", "to-amber-200", "via-orange-50"], emoji: "⛓️" },
  { key: "p-rear-sprocket-jupiter", name: "Rear Sprocket 42T — TVS Jupiter", partNumber: "RSP-JP-42", cat: "chain-sprocket-kits", retailer: "9876543212", price: 449, mrp: 649, stock: 30, desc: "Genuine-spec 42-tooth rear sprocket for TVS Jupiter. Cold-forged steel with anti-rust black finish.", vehicles: ["tvs-jupiter"], grad: ["from-orange-100", "to-amber-200", "via-orange-50"], emoji: "⚙️" },
  { key: "p-chain-lubricant", name: "Chain Lubricant Spray 150ml", partNumber: "CLB-150", cat: "chain-sprocket-kits", retailer: "9876543210", price: 249, mrp: 399, stock: 45, desc: "High-tack chain lube that resists fling at high RPM. Suitable for all O-ring and X-ring motorcycle chains.", vehicles: ["hero-splendor-plus", "bajaj-pulsar-150", "royal-enfield-classic-350"], grad: ["from-orange-100", "to-amber-200", "via-orange-50"], emoji: "🧴" },
  { key: "p-front-sprocket-activa", name: "Front Sprocket 15T — Honda Activa", partNumber: "FSP-AC-15", cat: "chain-sprocket-kits", retailer: "9876543212", price: 329, mrp: 499, stock: 3, desc: "Precision-hobbed 15T front sprocket for Honda Activa series. Case-hardened for extended wear life.", vehicles: ["honda-activa-6g"], grad: ["from-orange-100", "to-amber-200", "via-orange-50"], emoji: "⚙️" },

  // --- Gearbox Parts (5) — Krishna Motors ---
  { key: "p-gearbox-kit-swift", name: "Gearbox Bearing Kit — Maruti Swift", partNumber: "GBB-SW-01", cat: "gearbox-parts", retailer: "9876543211", price: 2899, mrp: 3999, stock: 8, desc: "Complete gearbox bearing and seal kit for Maruti Swift manual transmission. Japanese-grade NSK equivalent bearings.", vehicles: ["maruti-swift"], grad: ["from-amber-100", "to-yellow-200", "via-amber-50"], emoji: "⚙️" },
  { key: "p-clutch-cable-pulsar", name: "Gear Shift Cable — Bajaj Pulsar 150", partNumber: "GSC-PG-07", cat: "gearbox-parts", retailer: "9876543211", price: 299, mrp: 449, stock: 22, desc: "Smooth-pull gear shift cable with PTFE lining for friction-free shifting on Pulsar 150.", vehicles: ["bajaj-pulsar-150"], grad: ["from-amber-100", "to-yellow-200", "via-amber-50"], emoji: "🔧" },
  { key: "p-gear-lever-splendor", name: "Gear Lever Assembly — Hero Splendor", partNumber: "GLA-SP-03", cat: "gearbox-parts", retailer: "9876543211", price: 349, mrp: 549, stock: 15, desc: "Chrome-plated forged gear lever with anti-slip rubber tip, direct fit for Splendor Plus.", vehicles: ["hero-splendor-plus"], grad: ["from-amber-100", "to-yellow-200", "via-amber-50"], emoji: "🔧" },
  { key: "p-cv-joint-i10", name: "CV Joint Kit — Hyundai Grand i10", partNumber: "CVJ-I10-2", cat: "gearbox-parts", retailer: "9876543211", price: 1999, mrp: 2799, stock: 6, desc: "Complete constant-velocity joint kit with boots, grease and clamps for Grand i10 hatchback.", vehicles: ["hyundai-i10"], grad: ["from-amber-100", "to-yellow-200", "via-amber-50"], emoji: "🔩" },
  { key: "p-gear-oil-re", name: "Gear Oil GL-5 80W-90 — 1L", partNumber: "GO-80W90-1L", cat: "gearbox-parts", retailer: "9876543211", price: 499, mrp: 699, stock: 28, desc: "Extreme-pressure gear oil for gearboxes and differentials. API GL-5 rated, ideal for bullet and cars alike.", vehicles: ["royal-enfield-classic-350", "maruti-swift", "hyundai-i10"], grad: ["from-amber-100", "to-yellow-200", "via-amber-50"], emoji: "🛢️" },

  // --- Drive Belts (4) — Krishna Motors ---
  { key: "p-drive-belt-activa", name: "Drive Belt — Honda Activa 6G", partNumber: "DB-AC-6G", cat: "drive-belts", retailer: "9876543211", price: 649, mrp: 899, stock: 20, desc: "Aramid-cord CVT drive belt for Activa 6G. Heat-resistant rubber compound prevents cracking and glazing.", vehicles: ["honda-activa-6g"], grad: ["from-yellow-100", "to-amber-200", "via-yellow-50"], emoji: "🔗" },
  { key: "p-drive-belt-jupiter", name: "Drive Belt — TVS Jupiter", partNumber: "DB-JP-01", cat: "drive-belts", retailer: "9876543211", price: 599, mrp: 849, stock: 25, desc: "OEM-pattern CVT belt for TVS Jupiter with kevlar reinforcement for smooth acceleration.", vehicles: ["tvs-jupiter"], grad: ["from-yellow-100", "to-amber-200", "via-yellow-50"], emoji: "🔗" },
  { key: "p-fan-belt-swift", name: "Fan Belt (Alternator) — Maruti Swift", partNumber: "FB-SW-A1", cat: "drive-belts", retailer: "9876543211", price: 399, mrp: 599, stock: 14, desc: "EPDM ribbed V-belt for alternator drive on Swift petrol engines. Resists stretching and slipping.", vehicles: ["maruti-swift"], grad: ["from-yellow-100", "to-amber-200", "via-yellow-50"], emoji: "🔗" },
  { key: "p-timing-belt-i10", name: "Timing Belt Kit — Hyundai Grand i10", partNumber: "TB-I10-K1", cat: "drive-belts", retailer: "9876543211", price: 2399, mrp: 3199, stock: 7, desc: "Timing belt with tensioner and idler pulleys for 1.2L Kappa engine. Interference-engine safe.", vehicles: ["hyundai-i10"], grad: ["from-yellow-100", "to-amber-200", "via-yellow-50"], emoji: "🔗" },

  // --- Brake Parts (6) — Shree Auto Spares / Raj Auto ---
  { key: "p-brake-pad-pulsar", name: "Brake Pad Set — Bajaj Pulsar 150", partNumber: "BPD-PG-150", cat: "brake-parts", retailer: "9876543210", price: 549, mrp: 799, stock: 32, desc: "Semi-sintered front brake pads for Pulsar 150 disc. Strong bite, low dust, chamfered edges prevent squeal.", vehicles: ["bajaj-pulsar-150"], grad: ["from-red-100", "to-rose-200", "via-red-50"], emoji: "🛑" },
  { key: "p-brake-shoe-splendor", name: "Brake Shoe Set — Hero Splendor Plus", partNumber: "BSH-SP-01", cat: "brake-parts", retailer: "9876543210", price: 349, mrp: 499, stock: 40, desc: "Asbestos-free brake shoes with high-friction lining for Splendor Plus rear drum.", vehicles: ["hero-splendor-plus"], grad: ["from-red-100", "to-rose-200", "via-red-50"], emoji: "🛑" },
  { key: "p-brake-pad-creta", name: "Brake Pad Set (Front) — Hyundai Grand i10", partNumber: "BPD-I10-FR", cat: "brake-parts", retailer: "9876543212", price: 1149, mrp: 1599, stock: 10, desc: "Ceramic front brake pads for Grand i10. Quiet braking with extended rotor life.", vehicles: ["hyundai-i10"], grad: ["from-red-100", "to-rose-200", "via-red-50"], emoji: "🛞" },
  { key: "p-brake-disc-re", name: "Front Brake Disc — Royal Enfield Classic 350", partNumber: "BDC-RE-300", cat: "brake-parts", retailer: "9876543212", price: 2899, mrp: 3899, stock: 5, desc: "300mm stainless-steel floating disc rotor for Classic 350. Laser-cut vents for heat dissipation.", vehicles: ["royal-enfield-classic-350"], grad: ["from-red-100", "to-rose-200", "via-red-50"], emoji: "🛞" },
  { key: "p-brake-fluid", name: "Brake Fluid DOT-3 — 500ml", partNumber: "BF-DOT3-500", cat: "brake-parts", retailer: "9876543210", price: 199, mrp: 299, stock: 50, desc: "DOT-3 hydraulic brake fluid with high wet boiling point. Suitable for all disc and drum systems.", vehicles: ["bajaj-pulsar-150", "royal-enfield-classic-350", "hyundai-i10", "maruti-swift"], grad: ["from-red-100", "to-rose-200", "via-red-50"], emoji: "🧴" },
  { key: "p-brake-cable-activa", name: "Brake Cable Set — Honda Activa", partNumber: "BCA-AC-2P", cat: "brake-parts", retailer: "9876543210", price: 279, mrp: 429, stock: 4, desc: "Front and rear brake cable pair with sealed liners for Activa 6G. Corrosion-resistant zinc coating.", vehicles: ["honda-activa-6g"], grad: ["from-red-100", "to-rose-200", "via-red-50"], emoji: "🔧" },

  // --- Clutch Plates (5) — Shree Auto Spares ---
  { key: "p-clutch-plate-activa", name: "Clutch Plate Set — Honda Activa", partNumber: "CPL-AC-4P", cat: "clutch-plates", retailer: "9876543210", price: 749, mrp: 1099, stock: 16, desc: "4-plate cork clutch set for Activa 6G. Fibre plates deliver progressive engagement and judder-free take-off.", vehicles: ["honda-activa-6g"], grad: ["from-stone-100", "to-neutral-200", "via-stone-50"], emoji: "🔩" },
  { key: "p-clutch-plate-pulsar", name: "Clutch Plate Set — Bajaj Pulsar 150", partNumber: "CPL-PG-5P", cat: "clutch-plates", retailer: "9876543210", price: 899, mrp: 1249, stock: 12, desc: "5-plate clutch set with steel drive plates for Pulsar 150. CNC-rolled friction faces for consistent bite.", vehicles: ["bajaj-pulsar-150"], grad: ["from-stone-100", "to-neutral-200", "via-stone-50"], emoji: "🔩" },
  { key: "p-clutch-bell-jupiter", name: "Clutch Bell Assembly — TVS Jupiter", partNumber: "CBL-JP-01", cat: "clutch-plates", retailer: "9876543212", price: 1099, mrp: 1599, stock: 9, desc: "Centrifugal clutch bell with bearing for Jupiter CVT. Balanced casting prevents vibration at speed.", vehicles: ["tvs-jupiter"], grad: ["from-stone-100", "to-neutral-200", "via-stone-50"], emoji: "🔩" },
  { key: "p-clutch-cable-re", name: "Clutch Cable — Royal Enfield Classic 350", partNumber: "CCR-RE-01", cat: "clutch-plates", retailer: "9876543210", price: 329, mrp: 499, stock: 20, desc: "Heavy-gauge clutch cable with barrel adjuster for Classic 350 UCE and J-series engines.", vehicles: ["royal-enfield-classic-350"], grad: ["from-stone-100", "to-neutral-200", "via-stone-50"], emoji: "🔧" },
  { key: "p-clutch-kit-swift", name: "Clutch Kit 3-in-1 — Maruti Swift", partNumber: "CKT-SW-3", cat: "clutch-plates", retailer: "9876543210", price: 4299, mrp: 5799, stock: 4, desc: "Complete clutch kit — pressure plate, friction disc and release bearing for Swift 1.2L petrol.", vehicles: ["maruti-swift"], grad: ["from-stone-100", "to-neutral-200", "via-stone-50"], emoji: "🔩" },

  // --- Filters & Oils (6) — Shree / Raj ---
  { key: "p-air-filter-re", name: "Air Filter — Royal Enfield Classic 350", partNumber: "AFR-RE-350", cat: "filters-oils", retailer: "9876543210", price: 449, mrp: 649, stock: 35, desc: "Pleated paper element with rubber seal for Classic 350. Filters 99% of dust particles down to 5 microns.", vehicles: ["royal-enfield-classic-350"], grad: ["from-sky-100", "to-cyan-200", "via-sky-50"], emoji: "🌀" },
  { key: "p-oil-filter-splendor", name: "Oil Filter — Hero Splendor Plus", partNumber: "OFL-SP-01", cat: "filters-oils", retailer: "9876543210", price: 199, mrp: 299, stock: 48, desc: "Spin-on oil filter with anti-drainback valve for Splendor Plus. Change every 5000 km.", vehicles: ["hero-splendor-plus"], grad: ["from-sky-100", "to-cyan-200", "via-sky-50"], emoji: "🌀" },
  { key: "p-engine-oil-10w40", name: "Engine Oil 10W-40 Semi Synthetic — 1L", partNumber: "EO-10W40-1L", cat: "filters-oils", retailer: "9876543212", price: 449, mrp: 649, stock: 60, desc: "JASO MA2 rated semi-synthetic engine oil for bikes and scooters. Smooth cold starts, cooler running.", vehicles: ["hero-splendor-plus", "bajaj-pulsar-150", "honda-activa-6g", "tvs-jupiter", "royal-enfield-classic-350"], grad: ["from-sky-100", "to-cyan-200", "via-sky-50"], emoji: "🛢️" },
  { key: "p-ac-filter-swift", name: "AC Cabin Filter — Maruti Swift", partNumber: "ACF-SW-01", cat: "filters-oils", retailer: "9876543212", price: 549, mrp: 799, stock: 18, desc: "Activated-carbon cabin filter for Swift. Blocks PM2.5, dust and pollen for clean cabin air.", vehicles: ["maruti-swift"], grad: ["from-sky-100", "to-cyan-200", "via-sky-50"], emoji: "🌀" },
  { key: "p-oil-filter-i10", name: "Oil Filter — Hyundai Grand i10", partNumber: "OFL-I10-01", cat: "filters-oils", retailer: "9876543212", price: 299, mrp: 449, stock: 22, desc: "Cartridge-type oil filter for Kappa 1.1/1.2 engines. High-bypass valve protects at cold start.", vehicles: ["hyundai-i10"], grad: ["from-sky-100", "to-cyan-200", "via-sky-50"], emoji: "🌀" },
  { key: "p-fuel-filter-pulsar", name: "Fuel Filter — Bajaj Pulsar 150", partNumber: "FFL-PG-01", cat: "filters-oils", retailer: "9876543210", price: 179, mrp: 279, stock: 38, desc: "Inline fuel filter with 10-micron element, protects carburettor and injectors from rust particles.", vehicles: ["bajaj-pulsar-150"], grad: ["from-sky-100", "to-cyan-200", "via-sky-50"], emoji: "🌀" },

  // --- Electrical (4) — Krishna Motors ---
  { key: "p-battery-activa", name: "Battery 12V 5Ah — Honda Activa", partNumber: "BAT-AC-5AH", cat: "electrical", retailer: "9876543211", price: 1499, mrp: 2099, stock: 11, desc: "Maintenance-free VRLA battery for Activa 6G with 24-month warranty. Sealed calcium plates, no topping up.", vehicles: ["honda-activa-6g"], grad: ["from-violet-100", "to-purple-200", "via-violet-50"], emoji: "🔋" },
  { key: "p-headlamp-re", name: "LED Headlamp Unit — Royal Enfield Classic", partNumber: "HLD-RE-LED", cat: "electrical", retailer: "9876543211", price: 2499, mrp: 3499, stock: 6, desc: "Plug-and-play LED headlamp with projector optics and DRL ring for Classic 350. 4000 lumens, IP67.", vehicles: ["royal-enfield-classic-350"], grad: ["from-violet-100", "to-purple-200", "via-violet-50"], emoji: "💡" },
  { key: "p-spark-plug-pulsar", name: "Spark Plug Iridium — Bajaj Pulsar 150", partNumber: "SPK-PG-IR", cat: "electrical", retailer: "9876543211", price: 349, mrp: 499, stock: 44, desc: "Iridium-tipped spark plug for Pulsar 150. Better cold start, smoother idle, 1.4x service life.", vehicles: ["bajaj-pulsar-150", "hero-splendor-plus"], grad: ["from-violet-100", "to-purple-200", "via-violet-50"], emoji: "⚡" },
  { key: "p-horn-swift", name: "Dual Horn Set 12V — Maruti Swift", partNumber: "HRN-SW-D2", cat: "electrical", retailer: "9876543211", price: 599, mrp: 899, stock: 3, desc: "Wind-tone twin horn set with relay harness for Swift. 118 dB combined output, copper coil.", vehicles: ["maruti-swift"], grad: ["from-violet-100", "to-purple-200", "via-violet-50"], emoji: "📢" },

  // --- Body & Mirrors (4) — Krishna / Raj ---
  { key: "p-mirror-splendor", name: "Rear View Mirror Pair — Hero Splendor", partNumber: "MIR-SP-2P", cat: "body-mirrors", retailer: "9876543211", price: 299, mrp: 449, stock: 26, desc: "OEM-style mirror pair with wide-angle convex glass and anti-vibration stems for Splendor.", vehicles: ["hero-splendor-plus"], grad: ["from-emerald-100", "to-teal-200", "via-emerald-50"], emoji: "🪞" },
  { key: "p-visor-activa", name: "Front Visor — Honda Activa 6G", partNumber: "VSR-AC-6G", cat: "body-mirrors", retailer: "9876543211", price: 449, mrp: 699, stock: 13, desc: "Smoke-tinted ABS front visor for Activa 6G. Scratch-resistant coating, push-fit mounting.", vehicles: ["honda-activa-6g"], grad: ["from-emerald-100", "to-teal-200", "via-emerald-50"], emoji: "🪞" },
  { key: "p-side-panel-pulsar", name: "Side Panel Set — Bajaj Pulsar 150", partNumber: "SDP-PG-2P", cat: "body-mirrors", retailer: "9876543212", price: 899, mrp: 1299, stock: 8, desc: "Left-right side panel pair in factory-match black for Pulsar 150. Flexible ABS resists cracks.", vehicles: ["bajaj-pulsar-150"], grad: ["from-emerald-100", "to-teal-200", "via-emerald-50"], emoji: "🛠️" },
  { key: "p-mudguard-jupiter", name: "Front Mudguard — TVS Jupiter", partNumber: "MGF-JP-01", cat: "body-mirrors", retailer: "9876543212", price: 549, mrp: 799, stock: 10, desc: "Powder-coated steel front mudguard for Jupiter. Factory hole alignment, no cutting needed.", vehicles: ["tvs-jupiter"], grad: ["from-emerald-100", "to-teal-200", "via-emerald-50"], emoji: "🛠️" },
];

// ---------------- main ----------------
async function main() {
  console.log("🌱 Seeding PartKart (additive, upsert by stable keys)…");

  // 1. Categories
  for (const [i, c] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i },
      update: { name: c.name, nameHi: c.nameHi, nameGu: c.nameGu, icon: c.icon, gradient: c.gradient, sortOrder: i },
    });
  }

  // 2. Vehicles
  for (const v of VEHICLES) {
    await db.vehicle.upsert({ where: { key: v.key }, create: v, update: { type: v.type, brand: v.brand, model: v.model } });
  }

  // 3. Users (admin / customer / retailer logins)
  const usersData = [
    { phone: "9999999999", name: "PartKart Admin", role: "ADMIN" },
    { phone: "9000000001", name: "Aarav Shah", role: "CUSTOMER" },
    { phone: "9876543210", name: "Ramesh Patel", role: "RETAILER" },
    { phone: "9876543211", name: "Suresh Kumar", role: "RETAILER" },
    { phone: "9876543212", name: "Vikram Singh", role: "RETAILER" },
    { phone: "9876500000", name: "Jayesh Modi", role: "RETAILER" },
  ];
  for (const u of usersData) {
    await db.user.upsert({ where: { phone: u.phone }, create: u, update: { name: u.name, role: u.role } });
  }

  // 4. Retailers
  const retailerIds: Record<string, string> = {};
  for (const r of RETAILERS) {
    const user = await db.user.findUnique({ where: { phone: r.phone } });
    const rec = await db.retailer.upsert({
      where: { phone: r.phone },
      create: { phone: r.phone, businessName: r.businessName, ownerName: r.ownerName, city: r.city, status: r.status, categorySlugs: r.slugs, userId: user?.id },
      update: { businessName: r.businessName, ownerName: r.ownerName, city: r.city, status: r.status, categorySlugs: r.slugs },
    });
    retailerIds[r.phone] = rec.id;
  }

  // 5. Products + vehicle links
  const vehicleByKey = Object.fromEntries((await db.vehicle.findMany()).map((v) => [v.key, v.id]));
  const productByKey: Record<string, { id: string; retailerId: string; price: number; name: string; images: string }> = {};
  for (const p of PRODUCTS) {
    const slug = p.key.replace("p-", "");
    const images = JSON.stringify([img3(p.grad.join(" "), p.emoji)]);
    const rec = await db.product.upsert({
      where: { key: p.key },
      create: {
        key: p.key, slug, name: p.name, partNumber: p.partNumber, description: p.desc,
        categoryId: (await db.category.findUnique({ where: { slug: p.cat } }))!.id,
        retailerId: retailerIds[p.retailer],
        price: p.price, mrp: p.mrp, stock: p.stock, images: JSON.stringify([{ g: p.grad.join(" "), e: p.emoji }]),
      },
      update: {
        name: p.name, partNumber: p.partNumber, description: p.desc,
        price: p.price, mrp: p.mrp, stock: p.stock,
        images: JSON.stringify([{ g: p.grad.join(" "), e: p.emoji }]),
      },
    });
    productByKey[p.key] = { id: rec.id, retailerId: retailerIds[p.retailer], price: p.price, name: p.name, images };
    for (const vk of p.vehicles) {
      await db.productVehicle.upsert({
        where: { productId_vehicleId: { productId: rec.id, vehicleId: vehicleByKey[vk] } },
        create: { productId: rec.id, vehicleId: vehicleByKey[vk] },
        update: {},
      });
    }
  }

  // 6. Customer address (only if user has none)
  const customer = await db.user.findUnique({ where: { phone: "9000000001" } });
  if (customer && (await db.address.count({ where: { userId: customer.id } })) === 0) {
    await db.address.create({
      data: { userId: customer.id, name: "Aarav Shah", phone: "9000000001", pincode: "380015", line: "B-402, Sunrise Residency, Satellite Road", city: "Ahmedabad", state: "Gujarat", isDefault: true },
    });
  }

  // 7. Demo orders — 4 statuses (Placed, Confirmed, Shipped, Delivered)
  const mkAddress = JSON.stringify({ name: "Aarav Shah", phone: "9000000001", pincode: "380015", line: "B-402, Sunrise Residency, Satellite Road", city: "Ahmedabad", state: "Gujarat" });
  const dayAgo = (n: number, h = 0) => new Date(Date.now() - n * 86400000 - h * 3600000);

  const ORDERS = [
    { code: "ORD-2026-1001", status: "PLACED", payment: "COD", payStatus: "PENDING", at: dayAgo(0, 5), items: [["p-brake-pad-pulsar", 1], ["p-engine-oil-10w40", 2]] as [string, number][], coupon: null as string | null },
    { code: "ORD-2026-1002", status: "CONFIRMED", payment: "UPI", payStatus: "PAID", at: dayAgo(1, 3), items: [["p-drive-belt-activa", 1]] as [string, number][], coupon: "DEMO10" },
    { code: "ORD-2026-1003", status: "SHIPPED", payment: "UPI", payStatus: "PAID", at: dayAgo(3, 2), items: [["p-air-filter-re", 1], ["p-clutch-cable-re", 1], ["p-spark-plug-pulsar", 2]] as [string, number][], coupon: null },
    { code: "ORD-2026-1004", status: "DELIVERED", payment: "COD", payStatus: "PAID", at: dayAgo(8, 1), items: [["p-chain-kit-splendor", 1]] as [string, number][], coupon: null },
  ];

  const FLOW: Record<string, string[]> = {
    PLACED: ["PLACED"],
    CONFIRMED: ["PLACED", "CONFIRMED"],
    SHIPPED: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED"],
    DELIVERED: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"],
  };

  for (const o of ORDERS) {
    const items = o.items.map(([key, qty]) => ({ p: productByKey[key], qty }));
    const itemsTotal = items.reduce((s, it) => s + it.p.price * it.qty, 0);
    const deliveryFee = itemsTotal >= 999 ? 0 : 49;
    const discount = o.coupon === "DEMO10" ? Math.round(itemsTotal * 0.1) : 0;
    const total = itemsTotal + deliveryFee - discount;

    await db.order.upsert({
      where: { code: o.code },
      create: {
        code: o.code, userId: customer!.id, addressJson: mkAddress,
        itemsTotal, deliveryFee, discount, couponCode: o.coupon, total,
        paymentMethod: o.payment, paymentStatus: o.payStatus, status: o.status,
        createdAt: o.at, updatedAt: o.at,
        items: {
          create: items.map((it) => ({
            productId: it.p.id, retailerId: it.p.retailerId, name: it.p.name, image: it.p.images, price: it.p.price, qty: it.qty,
          })),
        },
        events: {
          create: FLOW[o.status].map((st, i) => ({
            status: st,
            note: st === "PLACED" ? "Order placed successfully" : "",
            createdAt: new Date(o.at.getTime() + i * 3600000 * 6),
          })),
        },
      },
      update: {}, // keep existing state on re-run — do not reset demo progress
    });
  }

  // 8. Welcome notifications (only if the user has none — avoids dupes on re-run)
  const welcome: [string, string, string, string][] = [
    ["9000000001", "Welcome to PartKart! 🎉", "India's Auto Parts Marketplace. Find parts for your bike & car from verified retailers.", "PROMO"],
    ["9876543210", "Welcome to PartKart Seller Hub", "Manage your products and orders from the seller portal.", "RETAILER"],
  ];
  for (const [phone, title, body, type] of welcome) {
    const u = await db.user.findUnique({ where: { phone } });
    if (u && (await db.notification.count({ where: { userId: u.id } })) === 0) {
      await db.notification.create({ data: { userId: u.id, title, body, type } });
    }
  }

  // ---------------- counts ----------------
  const [catC, vehC, prodC, retC, userC, ordC, addrC, notC, pvC] = await Promise.all([
    db.category.count(), db.vehicle.count(), db.product.count(), db.retailer.count(),
    db.user.count(), db.order.count(), db.address.count(), db.notification.count(), db.productVehicle.count(),
  ]);
  console.log("✅ Seed complete. Row counts:");
  console.log(JSON.stringify({ categories: catC, vehicles: vehC, products: prodC, productVehicleLinks: pvC, retailers: retC, users: userC, orders: ordC, addresses: addrC, notifications: notC }, null, 2));
  console.log("Demo accounts → Admin: 9999999999 | Retailer (approved): 9876543210 | Retailer (pending): 9876500000 | Customer: 9000000001 | OTP: 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

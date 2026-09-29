/**
 * PartKart seed — ADDITIVE & RE-RUN SAFE (v2 Flipkart catalog)
 * - Every entity is upserted by a stable unique key (slug / key / phone / code)
 * - Second run produces identical row counts, zero duplicates
 * - Products use REAL verified photos (Pexels/Unsplash pool) via images JSON [{url}]
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---------------- verified image pool ----------------
const IMG = {
  engineBW: "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=600", // gears/sprockets/pulleys
  beltPulley: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop", // belt & pulley
  oilPour: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=600&auto=format&fit=crop",
  wheelWrench: "https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=600&auto=format&fit=crop",
  wheelBalance: "https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=600",
  dashboard: "https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?q=80&w=600&auto=format&fit=crop",
  speedo: "https://images.pexels.com/photos/248747/pexels-photo-248747.jpeg?auto=compress&cs=tinysrgb&w=600",
  spanner: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=600&auto=format&fit=crop",
  jeep: "https://images.unsplash.com/photo-1504222490345-c075b6008014?q=80&w=600&auto=format&fit=crop",
  wrench: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop",
  inspect: "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=600",
  garage: "https://images.pexels.com/photos/4480505/pexels-photo-4480505.jpeg?auto=compress&cs=tinysrgb&w=600",
  bikeRed: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600&auto=format&fit=crop",
  bikeHarley: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop",
  bikeKTM: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=600&auto=format&fit=crop",
  rider: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600&auto=format&fit=crop",
};

// gallery per category: [primary, alt, workshop]
const CAT_GALLERY: Record<string, string[]> = {
  chains: [IMG.beltPulley, IMG.engineBW, IMG.wrench],
  sprockets: [IMG.engineBW, IMG.beltPulley, IMG.inspect],
  "clutch-gearbox": [IMG.engineBW, IMG.wrench, IMG.garage],
  "drive-belts": [IMG.beltPulley, IMG.engineBW, IMG.wrench],
  brakes: [IMG.wheelWrench, IMG.wheelBalance, IMG.inspect],
  "engine-oils": [IMG.oilPour, IMG.inspect, IMG.spanner],
  "filters-service": [IMG.spanner, IMG.garage, IMG.wrench],
  electrical: [IMG.dashboard, IMG.speedo, IMG.inspect],
};

// ---------------- data ----------------
const CATEGORIES = [
  { slug: "chains", name: "Chains", nameHi: "चेन", nameGu: "ચેઇન", icon: "link", imageUrl: CAT_GALLERY.chains[0] },
  { slug: "sprockets", name: "Sprockets", nameHi: "स्प्रॉकेट", nameGu: "સ્પ્રોકેટ", icon: "cog", imageUrl: CAT_GALLERY.sprockets[0] },
  { slug: "clutch-gearbox", name: "Clutch & Gearbox", nameHi: "क्लच और गियरबॉक्स", nameGu: "ક્લચ અને ગિયરબોક્સ", icon: "disc", imageUrl: CAT_GALLERY["clutch-gearbox"][0] },
  { slug: "drive-belts", name: "Drive Belts", nameHi: "ड्राइव बेल्ट", nameGu: "ડ્રાઇવ બેલ્ટ", icon: "circle-dot", imageUrl: CAT_GALLERY["drive-belts"][0] },
  { slug: "brakes", name: "Brakes", nameHi: "ब्रेक", nameGu: "બ્રેક", icon: "disc-3", imageUrl: CAT_GALLERY.brakes[0] },
  { slug: "engine-oils", name: "Engine Oil & Lubricants", nameHi: "इंजन ऑयल और लुब्रिकेंट", nameGu: "એન્જિન ઓઈલ અને લ્યુબ્રિકન્ટ", icon: "zap", imageUrl: CAT_GALLERY["engine-oils"][0] },
  { slug: "filters-service", name: "Filters & Service Kits", nameHi: "फ़िल्टर और सर्विस किट", nameGu: "ફિલ્ટર અને સર્વિસ કીટ", icon: "filter", imageUrl: CAT_GALLERY["filters-service"][0] },
  { slug: "electrical", name: "Electrical & Batteries", nameHi: "इलेक्ट्रिकल और बैटरी", nameGu: "ઇલેક્ટ્રિકલ અને બેટરી", icon: "car-front", imageUrl: CAT_GALLERY.electrical[0] },
];

// legacy categories retired by the Flipkart redesign
const RETIRED_CATEGORIES = ["chain-sprocket-kits", "gearbox-parts", "brake-parts", "clutch-plates", "filters-oils", "body-mirrors"];

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
  { phone: "9876543210", businessName: "Shree Auto Parts", ownerName: "Ramesh Patel", city: "Ahmedabad", status: "APPROVED", slugs: "chains,sprockets,brakes,clutch-gearbox" },
  { phone: "9876543211", businessName: "Rajiv Motors", ownerName: "Suresh Kumar", city: "Jaipur", status: "APPROVED", slugs: "clutch-gearbox,drive-belts,electrical,engine-oils" },
  { phone: "9876543212", businessName: "Sai Spare House", ownerName: "Vikram Singh", city: "Ludhiana", status: "APPROVED", slugs: "chains,sprockets,brakes,filters-service,electrical" },
  { phone: "9876500000", businessName: "Patel Chain House", ownerName: "Jayesh Modi", city: "Surat", status: "PENDING", slugs: "clutch-gearbox,filters-service" },
];

type P = {
  key: string; name: string; partNumber: string; cat: string; retailer: string;
  price: number; mrp: number; stock: number; desc: string; vehicles: string[];
};

// 39 products — Chains 6 · Sprockets 5 · Clutch & Gearbox 5 · Drive Belts 4 · Brakes 5 · Engine Oil 5 · Filters 4 · Electrical 5
const PRODUCTS: P[] = [
  // --- Chains (6) ---
  { key: "p-chain-kit-splendor", name: "Chain Sprocket Kit — Hero Splendor", partNumber: "CSK-SP-101", cat: "chains", retailer: "9876543210", price: 1299, mrp: 1849, stock: 24, desc: "Premium 428H chain with hardened sprocket set for Hero Splendor Plus. Heat-treated steel for 2x longer life. Kit includes chain, front sprocket, rear sprocket and connecting clip.", vehicles: ["hero-splendor-plus"] },
  { key: "p-chain-kit-pulsar", name: "Chain Sprocket Kit — Bajaj Pulsar 150", partNumber: "CSK-PG-205", cat: "chains", retailer: "9876543210", price: 1649, mrp: 2299, stock: 18, desc: "OEM-grade 520 conversion chain and sprocket kit for Pulsar 150. Smooth engagement, reduced noise, includes rivet-type master link.", vehicles: ["bajaj-pulsar-150"] },
  { key: "p-chain-kit-re350", name: "Chain Sprocket Kit — Royal Enfield Classic 350", partNumber: "CSK-RE-350", cat: "chains", retailer: "9876543212", price: 2499, mrp: 3499, stock: 12, desc: "Heavy-duty 530H chain with CNC-machined sprockets for Classic 350. Zinc-coated for corrosion resistance on Indian roads.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-chain-lubricant", name: "Chain Lubricant Spray 150ml", partNumber: "CLB-150", cat: "chains", retailer: "9876543210", price: 249, mrp: 399, stock: 45, desc: "High-tack chain lube that resists fling at high RPM. Suitable for all O-ring and X-ring motorcycle chains.", vehicles: ["hero-splendor-plus", "bajaj-pulsar-150", "royal-enfield-classic-350"] },
  { key: "p-chain-428-splendor", name: "Heavy Duty Chain 428H — Hero Splendor", partNumber: "CH-428H-SP", cat: "chains", retailer: "9876543212", price: 499, mrp: 699, stock: 30, desc: "428H heavy-duty drive chain with rivet master link for Splendor series. Pre-stretched, low maintenance, 60,000+ km tested.", vehicles: ["hero-splendor-plus"] },
  { key: "p-chain-oring-pulsar", name: "O-Ring Chain 520 — Bajaj Pulsar 150", partNumber: "CH-520-OR", cat: "chains", retailer: "9876543212", price: 899, mrp: 1299, stock: 16, desc: "520 pitch O-ring chain for Pulsar 150. Sealed O-rings retain grease for smooth, quiet running in dust and rain.", vehicles: ["bajaj-pulsar-150"] },

  // --- Sprockets (5) ---
  { key: "p-rear-sprocket-jupiter", name: "Rear Sprocket 42T — Bajaj Pulsar 150", partNumber: "RSP-PG-42", cat: "sprockets", retailer: "9876543211", price: 549, mrp: 799, stock: 28, desc: "Genuine-spec 42-tooth rear sprocket for Pulsar 150. Cold-forged steel with anti-rust black finish and precise tooth profiling.", vehicles: ["bajaj-pulsar-150"] },
  { key: "p-front-sprocket-activa", name: "Front Sprocket 15T — Hero Splendor Plus", partNumber: "FSP-SP-15", cat: "sprockets", retailer: "9876543212", price: 399, mrp: 599, stock: 3, desc: "Precision-hobbed 15T front sprocket for Splendor Plus. Case-hardened for extended wear life, direct OEM replacement.", vehicles: ["hero-splendor-plus"] },
  { key: "p-rear-sprocket-re", name: "Rear Sprocket 45T — Royal Enfield Classic 350", partNumber: "RSP-RE-45", cat: "sprockets", retailer: "9876543211", price: 899, mrp: 1299, stock: 20, desc: "45-tooth rear sprocket machined from EN8 steel for Classic 350. Hardened teeth resist wear under heavy torque.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-sprocket-set-re", name: "Sprocket Set Front & Rear — Royal Enfield Classic 350", partNumber: "SSR-RE-2P", cat: "sprockets", retailer: "9876543212", price: 1899, mrp: 2599, stock: 10, desc: "Matched front and rear sprocket pair for Classic 350. CNC-cut, zinc-plated and balanced for smooth chain line.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-rear-sprocket-splendor", name: "Rear Sprocket 45T — Hero Splendor Plus", partNumber: "RSP-SP-45", cat: "sprockets", retailer: "9876543211", price: 499, mrp: 699, stock: 26, desc: "OEM-pattern 45T rear sprocket for Splendor Plus. Induction-hardened teeth with black anti-rust coating.", vehicles: ["hero-splendor-plus"] },

  // --- Clutch & Gearbox (5) ---
  { key: "p-clutch-plate-activa", name: "Clutch Plate Set — Honda Activa", partNumber: "CPL-AC-4P", cat: "clutch-gearbox", retailer: "9876543210", price: 749, mrp: 1099, stock: 16, desc: "4-plate cork clutch set for Activa 6G. Fibre plates deliver progressive engagement and judder-free take-off.", vehicles: ["honda-activa-6g"] },
  { key: "p-clutch-plate-pulsar", name: "Clutch Plate Set — Bajaj Pulsar 150", partNumber: "CPL-PG-5P", cat: "clutch-gearbox", retailer: "9876543210", price: 899, mrp: 1249, stock: 12, desc: "5-plate clutch set with steel drive plates for Pulsar 150. CNC-rolled friction faces for consistent bite.", vehicles: ["bajaj-pulsar-150"] },
  { key: "p-clutch-cable-re", name: "Clutch Cable — Royal Enfield Classic 350", partNumber: "CCR-RE-01", cat: "clutch-gearbox", retailer: "9876543210", price: 329, mrp: 499, stock: 20, desc: "Heavy-gauge clutch cable with barrel adjuster for Classic 350 UCE and J-series engines. PTFE-lined for light pull.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-clutch-kit-swift", name: "Clutch Kit 3-in-1 — Maruti Swift", partNumber: "CKT-SW-3", cat: "clutch-gearbox", retailer: "9876543210", price: 4299, mrp: 4999, stock: 4, desc: "Complete clutch kit — pressure plate, friction disc and release bearing for Swift 1.2L petrol. OEM-equivalent spec.", vehicles: ["maruti-swift"] },
  { key: "p-gearbox-kit-swift", name: "Gearbox Bearing Kit — Maruti Swift", partNumber: "GBB-SW-01", cat: "clutch-gearbox", retailer: "9876543211", price: 2899, mrp: 3999, stock: 8, desc: "Complete gearbox bearing and seal kit for Maruti Swift manual transmission. Japanese-grade NSK equivalent bearings.", vehicles: ["maruti-swift"] },

  // --- Drive Belts (4) ---
  { key: "p-drive-belt-activa", name: "Drive Belt — Honda Activa 6G", partNumber: "DB-AC-6G", cat: "drive-belts", retailer: "9876543211", price: 649, mrp: 899, stock: 20, desc: "Aramid-cord CVT drive belt for Activa 6G. Heat-resistant rubber compound prevents cracking and glazing.", vehicles: ["honda-activa-6g"] },
  { key: "p-drive-belt-jupiter", name: "Drive Belt — TVS Jupiter", partNumber: "DB-JP-01", cat: "drive-belts", retailer: "9876543211", price: 599, mrp: 849, stock: 25, desc: "OEM-pattern CVT belt for TVS Jupiter with kevlar reinforcement for smooth acceleration.", vehicles: ["tvs-jupiter"] },
  { key: "p-fan-belt-swift", name: "Fan Belt (Alternator) — Maruti Swift", partNumber: "FB-SW-A1", cat: "drive-belts", retailer: "9876543211", price: 399, mrp: 599, stock: 14, desc: "EPDM ribbed V-belt for alternator drive on Swift petrol engines. Resists stretching and slipping.", vehicles: ["maruti-swift"] },
  { key: "p-timing-belt-i10", name: "Timing Belt Kit — Hyundai Grand i10", partNumber: "TB-I10-K1", cat: "drive-belts", retailer: "9876543211", price: 2399, mrp: 3199, stock: 7, desc: "Timing belt with tensioner and idler pulleys for 1.2L Kappa engine. Interference-engine safe.", vehicles: ["hyundai-i10"] },

  // --- Brakes (5) ---
  { key: "p-brake-pad-pulsar", name: "Brake Pad Set — Bajaj Pulsar 150", partNumber: "BPD-PG-150", cat: "brakes", retailer: "9876543210", price: 549, mrp: 799, stock: 32, desc: "Semi-sintered front brake pads for Pulsar 150 disc. Strong bite, low dust, chamfered edges prevent squeal.", vehicles: ["bajaj-pulsar-150"] },
  { key: "p-brake-shoe-splendor", name: "Brake Shoe Set — Hero Splendor Plus", partNumber: "BSH-SP-01", cat: "brakes", retailer: "9876543210", price: 349, mrp: 499, stock: 40, desc: "Asbestos-free brake shoes with high-friction lining for Splendor Plus rear drum.", vehicles: ["hero-splendor-plus"] },
  { key: "p-brake-pad-creta", name: "Brake Pad Set (Front) — Hyundai Grand i10", partNumber: "BPD-I10-FR", cat: "brakes", retailer: "9876543212", price: 1149, mrp: 1599, stock: 10, desc: "Ceramic front brake pads for Grand i10. Quiet braking with extended rotor life.", vehicles: ["hyundai-i10"] },
  { key: "p-brake-disc-re", name: "Front Brake Disc — Royal Enfield Classic 350", partNumber: "BDC-RE-300", cat: "brakes", retailer: "9876543212", price: 2899, mrp: 3899, stock: 5, desc: "300mm stainless-steel floating disc rotor for Classic 350. Laser-cut vents for heat dissipation.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-brake-fluid", name: "Brake Fluid DOT-3 — 500ml", partNumber: "BF-DOT3-500", cat: "brakes", retailer: "9876543210", price: 199, mrp: 299, stock: 50, desc: "DOT-3 hydraulic brake fluid with high wet boiling point. Suitable for all disc and drum systems.", vehicles: ["bajaj-pulsar-150", "royal-enfield-classic-350", "hyundai-i10", "maruti-swift"] },

  // --- Engine Oil & Lubricants (5) ---
  { key: "p-engine-oil-10w40", name: "Engine Oil 10W-40 Semi Synthetic — 1L", partNumber: "EO-10W40-1L", cat: "engine-oils", retailer: "9876543212", price: 449, mrp: 649, stock: 60, desc: "JASO MA2 rated semi-synthetic engine oil for bikes and scooters. Smooth cold starts, cooler running.", vehicles: ["hero-splendor-plus", "bajaj-pulsar-150", "honda-activa-6g", "tvs-jupiter", "royal-enfield-classic-350"] },
  { key: "p-gear-oil-re", name: "Gear Oil GL-5 80W-90 — 1L", partNumber: "GO-80W90-1L", cat: "engine-oils", retailer: "9876543211", price: 499, mrp: 699, stock: 28, desc: "Extreme-pressure gear oil for gearboxes and differentials. API GL-5 rated, ideal for bullets and cars alike.", vehicles: ["royal-enfield-classic-350", "maruti-swift", "hyundai-i10"] },
  { key: "p-engine-oil-20w40", name: "Engine Oil 20W-40 Mineral — 1.2L", partNumber: "EO-20W40-1.2", cat: "engine-oils", retailer: "9876543210", price: 299, mrp: 449, stock: 50, desc: "Premium mineral engine oil for daily-commute motorcycles. JASO MA2, suits Splendor and CD110 series.", vehicles: ["hero-splendor-plus", "honda-activa-6g"] },
  { key: "p-scooter-oil-10w30", name: "Scooter Engine Oil 10W-30 — 800ml", partNumber: "EO-10W30-SC", cat: "engine-oils", retailer: "9876543212", price: 379, mrp: 549, stock: 34, desc: "Low-friction scooter oil formulated for CVT gearboxes and wet clutches. Keeps Activa and Jupiter engines quiet.", vehicles: ["honda-activa-6g", "tvs-jupiter"] },
  { key: "p-coolant-swift", name: "Long Life Coolant 1:3 — 1L", partNumber: "CLT-LL-1L", cat: "engine-oils", retailer: "9876543211", price: 399, mrp: 549, stock: 22, desc: "Silicate-free long-life coolant concentrate for Swift and i10 radiators. Anti-corrosion, 3-year service life.", vehicles: ["maruti-swift", "hyundai-i10"] },

  // --- Filters & Service Kits (4) ---
  { key: "p-air-filter-re", name: "Air Filter — Royal Enfield Classic 350", partNumber: "AFR-RE-350", cat: "filters-service", retailer: "9876543210", price: 449, mrp: 649, stock: 35, desc: "Pleated paper element with rubber seal for Classic 350. Filters 99% of dust particles down to 5 microns.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-oil-filter-splendor", name: "Oil Filter — Hero Splendor Plus", partNumber: "OFL-SP-01", cat: "filters-service", retailer: "9876543210", price: 199, mrp: 299, stock: 48, desc: "Spin-on oil filter with anti-drainback valve for Splendor Plus. Change every 5000 km.", vehicles: ["hero-splendor-plus"] },
  { key: "p-ac-filter-swift", name: "AC Cabin Filter — Maruti Swift", partNumber: "ACF-SW-01", cat: "filters-service", retailer: "9876543212", price: 549, mrp: 799, stock: 18, desc: "Activated-carbon cabin filter for Swift. Blocks PM2.5, dust and pollen for clean cabin air.", vehicles: ["maruti-swift"] },
  { key: "p-oil-filter-i10", name: "Oil Filter — Hyundai Grand i10", partNumber: "OFL-I10-01", cat: "filters-service", retailer: "9876543212", price: 299, mrp: 449, stock: 22, desc: "Cartridge-type oil filter for Kappa 1.1/1.2 engines. High-bypass valve protects at cold start.", vehicles: ["hyundai-i10"] },

  // --- Electrical & Batteries (5) ---
  { key: "p-battery-activa", name: "Battery 12V 5Ah — Honda Activa", partNumber: "BAT-AC-5AH", cat: "electrical", retailer: "9876543211", price: 1499, mrp: 2099, stock: 11, desc: "Maintenance-free VRLA battery for Activa 6G with 24-month warranty. Sealed calcium plates, no topping up.", vehicles: ["honda-activa-6g"] },
  { key: "p-headlamp-re", name: "LED Headlamp Unit — Royal Enfield Classic", partNumber: "HLD-RE-LED", cat: "electrical", retailer: "9876543211", price: 2499, mrp: 3499, stock: 6, desc: "Plug-and-play LED headlamp with projector optics and DRL ring for Classic 350. 4000 lumens, IP67.", vehicles: ["royal-enfield-classic-350"] },
  { key: "p-spark-plug-pulsar", name: "Spark Plug Iridium — Bajaj Pulsar 150", partNumber: "SPK-PG-IR", cat: "electrical", retailer: "9876543211", price: 349, mrp: 499, stock: 44, desc: "Iridium-tipped spark plug for Pulsar 150. Better cold start, smoother idle, 1.4x service life.", vehicles: ["bajaj-pulsar-150", "hero-splendor-plus"] },
  { key: "p-horn-swift", name: "Dual Horn Set 12V — Maruti Swift", partNumber: "HRN-SW-D2", cat: "electrical", retailer: "9876543211", price: 599, mrp: 899, stock: 3, desc: "Wind-tone twin horn set with relay harness for Swift. 118 dB combined output, copper coil.", vehicles: ["maruti-swift"] },
  { key: "p-battery-swift", name: "Car Battery 12V 35Ah — Maruti Swift", partNumber: "BAT-SW-35", cat: "electrical", retailer: "9876543212", price: 3999, mrp: 4999, stock: 7, desc: "Zero-maintenance calcium car battery for Swift and i10 petrol. 55-month pro-rata warranty, high cranking amps.", vehicles: ["maruti-swift", "hyundai-i10"] },
];

// legacy products retired by the Flipkart catalog (not referenced by any seed order)
const RETIRED_PRODUCTS = [
  "p-clutch-cable-pulsar", "p-gear-lever-splendor", "p-cv-joint-i10", "p-brake-cable-activa",
  "p-clutch-bell-jupiter", "p-fuel-filter-pulsar", "p-mirror-splendor", "p-visor-activa",
  "p-side-panel-pulsar", "p-mudguard-jupiter",
];

// ---------------- main ----------------
async function main() {
  console.log("🌱 Seeding PartKart v2 (Flipkart catalog, additive, upsert by stable keys)…");

  // 0. retire legacy categories & products from v1 catalog
  await db.category.updateMany({ where: { slug: { in: RETIRED_CATEGORIES } }, data: { active: false } });
  await db.product.updateMany({ where: { key: { in: RETIRED_PRODUCTS } }, data: { active: false } });

  // 1. Categories
  for (const [i, c] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i },
      update: { name: c.name, nameHi: c.nameHi, nameGu: c.nameGu, icon: c.icon, imageUrl: c.imageUrl, active: true, sortOrder: i },
    });
  }

  // 2. Vehicles
  for (const v of VEHICLES) {
    await db.vehicle.upsert({ where: { key: v.key }, create: v, update: { type: v.type, brand: v.brand, model: v.model } });
  }

  // 3. Users
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
    const gallery = CAT_GALLERY[p.cat] ?? [IMG.engineBW];
    const images = JSON.stringify(gallery.map((url) => ({ url })));
    const catId = (await db.category.findUnique({ where: { slug: p.cat } }))!.id;
    const rec = await db.product.upsert({
      where: { key: p.key },
      create: {
        key: p.key, slug, name: p.name, partNumber: p.partNumber, description: p.desc,
        categoryId: catId, retailerId: retailerIds[p.retailer],
        price: p.price, mrp: p.mrp, stock: p.stock, images,
      },
      update: {
        name: p.name, partNumber: p.partNumber, description: p.desc, categoryId: catId,
        price: p.price, mrp: p.mrp, stock: p.stock, images, active: true,
      },
    });
    productByKey[p.key] = { id: rec.id, retailerId: retailerIds[p.retailer], price: p.price, name: p.name, images };
    // re-link vehicles deterministically on every run (idempotent)
    await db.productVehicle.deleteMany({ where: { productId: rec.id } });
    await db.productVehicle.createMany({
      data: p.vehicles.map((vk) => ({ productId: rec.id, vehicleId: vehicleByKey[vk] })),
    });
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
    const exists = await db.order.findUnique({ where: { code: o.code } });
    if (exists) continue; // keep existing state on re-run — do not reset demo progress
    const items = o.items.map(([key, qty]) => ({ p: productByKey[key], qty }));
    const itemsTotal = items.reduce((s, it) => s + it.p.price * it.qty, 0);
    const deliveryFee = itemsTotal >= 999 ? 0 : 49;
    const discount = o.coupon === "DEMO10" ? Math.round(itemsTotal * 0.1) : 0;
    const total = itemsTotal + deliveryFee - discount;
    await db.order.create({
      data: {
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
  const activeProducts = await db.product.count({ where: { active: true } });
  const activeCats = await db.category.count({ where: { active: true } });
  console.log("✅ Seed complete. Row counts:");
  console.log(JSON.stringify({ categories: catC, activeCategories: activeCats, vehicles: vehC, products: prodC, activeProducts, productVehicleLinks: pvC, retailers: retC, users: userC, orders: ordC, addresses: addrC, notifications: notC }, null, 2));
  console.log("Demo accounts → Admin: 9999999999 | Retailer (approved): 9876543210 | Retailer (pending): 9876500000 | Customer: 9000000001 | OTP: 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

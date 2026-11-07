// Node.js-only boot logic for KARMA (loaded only when NEXT_RUNTIME === "nodejs").
//
// On Vercel the filesystem is ephemeral: only /tmp is writable and every fresh
// lambda instance starts empty. SQLite therefore lives at /tmp/karma.db (see
// DATABASE_URL env in the Vercel project) and this hook seeds it from the
// base64 snapshot bundled into the lambda (src/seed-db.ts) on first boot.
//
// - Local dev / self-host: no-op (DATABASE_URL already points at db/custom.db).
// - Warm instance: keeps its own copy → sessions/carts/orders persist for the
//   instance lifetime. A recycled instance reseeds from the snapshot.
export async function bootSeed() {
  // Only active on Vercel (VERCEL=1 is injected automatically there)
  if (process.env.VERCEL !== '1') return
  if (!process.env.DATABASE_URL?.startsWith('file:/tmp/')) return

  const fs = await import('fs/promises')
  const target = '/tmp/karma.db'
  const tmp = '/tmp/karma.db.seeding'

  // Already seeded on this instance? Skip (but reseed if it looks broken).
  try {
    const st = await fs.stat(target)
    if (st.size > 4096) return
  } catch {
    /* not present → seed below */
  }

  const { SEED_DB_B64 } = await import('./seed-db')
  const buf = Buffer.from(SEED_DB_B64, 'base64')

  // Never write garbage: validate the SQLite magic header first.
  if (buf.byteLength < 4096 || buf.subarray(0, 16).toString('latin1') !== 'SQLite format 3\x00') {
    throw new Error(`KARMA boot: invalid seed snapshot (${buf.byteLength} bytes)`)
  }

  await fs.writeFile(tmp, buf)
  await fs.rename(tmp, target) // atomic on /tmp
}

// KARMA — server boot hook (runs once per server / serverless instance,
// BEFORE any request is handled).
//
// On Vercel it seeds /tmp/karma.db from the bundled snapshot — see
// src/instrumentation-node.ts for details.
//
// - Local dev / self-host: no-op (DATABASE_URL already points at db/custom.db).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { bootSeed } = await import('./instrumentation-node')
      await bootSeed()
    } catch (err) {
      // Never block the server from booting; DB-backed routes will surface
      // the error, static pages keep working.
      console.error('[KARMA boot] DB seed failed:', err)
    }
  }
}

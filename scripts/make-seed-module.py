#!/usr/bin/env python3
"""KARMA — generate src/seed-db.ts from public/karma-seed.db.

The base64 module is bundled INTO the serverless lambda so the boot hook
(src/instrumentation-node.ts) can seed /tmp/karma.db without any network
access. Regenerate after reseeding the local DB:
    python3 scripts/make-seed-module.py
"""
import base64
import os
import sqlite3
import sys

SRC = os.path.join(os.path.dirname(__file__), "..", "public", "karma-seed.db")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "seed-db.ts")

# Ensure a consistent, checkpointed snapshot
con = sqlite3.connect(SRC)
con.execute("PRAGMA wal_checkpoint(TRUNCATE)")
con.close()

with open(SRC, "rb") as f:
    raw = f.read()

if not raw.startswith(b"SQLite format 3\x00"):
    sys.exit("FATAL: snapshot is not a valid SQLite database")

b64 = base64.b64encode(raw).decode("ascii")
count = lambda t: sqlite3.connect(SRC).execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
counts = {t: count(t) for t in ("User", "Retailer", "Product", "Order", "Category")}

with open(OUT, "w") as f:
    f.write(
        "// GENERATED FILE — do not edit by hand.\n"
        "// Source: public/karma-seed.db (SQLite snapshot of the demo database).\n"
        "// Regenerate with: python3 scripts/make-seed-module.py\n"
        f"// Payload: {len(raw)} bytes db -> {len(b64)} chars base64.\n"
        f"// Seeded rows: {counts}\n"
        "export const SEED_DB_B64 =\n"
    )
    for i in range(0, len(b64), 100):
        f.write(f'  "{b64[i:i+100]}"' + ("+\n" if i + 100 < len(b64) else "\n"))

print(f"OK: src/seed-db.ts written ({os.path.getsize(OUT)} bytes, db {len(raw)} bytes, counts {counts})")

import { db } from "@/lib/db";

/**
 * Allocates the next sequential, human-readable reference number for a given
 * prefix (e.g. "WO", "INV", "PAY", "RS"), scoped to the current year:
 * WO-2026-0001, WO-2026-0002, ... Uses an atomic upsert on Counter so
 * concurrent creates never collide.
 */
export async function nextReference(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const counter = await db.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } }
  });
  return `${key}-${String(counter.value).padStart(4, "0")}`;
}

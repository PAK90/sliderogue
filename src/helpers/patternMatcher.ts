type Item = { name: string; value: number };
type MatcherToken = { tileName: string; tileValue: string | number };

/** "x", "2x", "-0.5x", "+x" -> factor; disallow 0x */
function parseFactor(token: string): number {
  const m = token.trim().match(/^\s*([+-]?(?:\d*\.?\d+)?)\s*x\s*$/i);
  if (!m)
    throw new Error(`Bad tileValue "${token}" (use "x", "2x", "0.5x", etc.)`);
  const g = m[1];
  const num = g === "" || g === "+" || g === "-" ? Number(g + "1") : Number(g);
  if (!Number.isFinite(num)) throw new Error(`Bad factor in "${token}"`);
  if (num === 0) throw new Error(`Zero factor not supported: "${token}"`);
  return num;
}

type RelNeed = { factor: number; pos: number };
type AbsNeed = { value: number; pos: number };

function cloneVmap(vmap: Map<number, number[]>): Map<number, number[]> {
  return new Map(Array.from(vmap.entries(), ([k, v]) => [k, v.slice()]));
}

/**
 * Try to satisfy abs + rel needs against a *copy* of vmap (so failures don't mutate).
 * Returns placements (pos -> itemIndex) and the mutated copy if successful.
 */
function tryPlan(
  vmap: Map<number, number[]>,
  abs: AbsNeed[],
  rel: RelNeed[],
  base: number | null,
):
  | {
      ok: true;
      placements: Array<[number, number]>;
      nextVmap: Map<number, number[]>;
    }
  | { ok: false } {
  const tmp = cloneVmap(vmap);
  const placements: Array<[number, number]> = [];

  // Absolutes (exact values)
  for (const n of abs) {
    const list = tmp.get(n.value);
    if (!list || list.length === 0) return { ok: false };
    placements.push([n.pos, list.pop()!]);
  }

  // Relatives (factor * base)
  if (rel.length > 0) {
    if (base === null || !Number.isFinite(base)) return { ok: false };
    for (const r of rel) {
      const needVal = r.factor * base;
      const list = tmp.get(needVal);
      if (!list || list.length === 0) return { ok: false };
      placements.push([r.pos, list.pop()!]);
    }
  }

  return { ok: true, placements, nextVmap: tmp };
}

/**
 * Match items to matcher tokens by name and value rules.
 * - For each tileName group, relative tokens ("kx") share a base (values are factor * base).
 * - Absolute tokens (numbers) must match exact values.
 * Returns indices into `items` in the same order as `matcher`, or null.
 */
export function findPatternIndicesByName(
  items: Item[],
  matcher: MatcherToken[],
): number[] | null {
  if (matcher.length === 0) return [];

  // Build value -> indices[] per name
  const indicesByName = new Map<string, Map<number, number[]>>();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let vmap = indicesByName.get(it.name);
    if (!vmap) indicesByName.set(it.name, (vmap = new Map()));
    const list = vmap.get(it.value);
    if (list) list.push(i);
    else vmap.set(it.value, [i]);
  }

  // Group matcher needs per name
  const needsByName = new Map<string, { rel: RelNeed[]; abs: AbsNeed[] }>();
  for (let pos = 0; pos < matcher.length; pos++) {
    const { tileName, tileValue } = matcher[pos];
    let g = needsByName.get(tileName);
    if (!g) needsByName.set(tileName, (g = { rel: [], abs: [] }));
    if (typeof tileValue === "number") g.abs.push({ value: tileValue, pos });
    else g.rel.push({ factor: parseFactor(tileValue), pos });
  }

  const result: number[] = new Array(matcher.length);

  // Solve each name-group independently
  for (const [name, group] of needsByName.entries()) {
    const baseVmap = indicesByName.get(name);
    if (!baseVmap) return null;

    // No relatives: only absolutes to match exactly.
    if (group.rel.length === 0) {
      const plan = tryPlan(baseVmap, group.abs, [], null);
      if (!plan.ok) return null;
      for (const [pos, idx] of plan.placements) result[pos] = idx;
      // Not necessary to persist plan.nextVmap globally since names are independent,
      // but we can if desired:
      // indicesByName.set(name, plan.nextVmap);
      continue;
    }

    // Relatives exist: pick a base anchored by the smallest factor.
    group.rel.sort((a, b) => a.factor - b.factor);
    const fMin = group.rel[0].factor;

    let solved = false;
    for (const n of baseVmap.keys()) {
      const base = n / fMin;
      const plan = tryPlan(baseVmap, group.abs, group.rel, base);
      if (plan.ok) {
        for (const [pos, idx] of plan.placements) result[pos] = idx;
        // Optional: indicesByName.set(name, plan.nextVmap);
        solved = true;
        break;
      }
    }
    if (!solved) return null;
  }

  return result;
}

import type { PluginRowFromJson, ProductRowFromJson } from "./types.js";
import productJson from "./product.json" with { type: "json" };
import pluginJson from "./plugin.json" with { type: "json" };

export const products: ProductRowFromJson[] = productJson as ProductRowFromJson[];
export const plugins: PluginRowFromJson[] = pluginJson as PluginRowFromJson[];

/**
 * IDE rows from product.json only (no paid plugins from plugin.json).
 * Used when `productCode` is omitted: keeps license JSON small enough for Workers Free CPU (~10ms).
 */
export function allIdeProductCodesForLicense(): Set<string> {
  const out = new Set<string>();
  for (const p of products) {
    if (!p.productCode?.trim()) continue;
    for (const part of p.productCode.split(",")) {
      const c = part.trim();
      if (c) out.add(c);
    }
  }
  return out;
}

/** IDE + every paid plugin code (large; may exceed Workers Free CPU if used as the default "all"). */
export function allProductCodesForLicense(): Set<string> {
  const out = allIdeProductCodesForLicense();
  for (const pl of plugins) {
    const c = pl.productCode?.trim();
    if (c) out.add(c);
  }
  return out;
}

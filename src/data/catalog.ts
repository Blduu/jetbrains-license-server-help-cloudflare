import type { PluginRowFromJson, ProductRowFromJson } from "./types.js";
import productJson from "./product.json" with { type: "json" };
import pluginJson from "./plugin.json" with { type: "json" };

export const products: ProductRowFromJson[] = productJson as ProductRowFromJson[];
export const plugins: PluginRowFromJson[] = pluginJson as PluginRowFromJson[];

/** Collect product codes for "all products" license (order + dedupe like Java lists before HashSet). */
export function allProductCodesForLicense(): Set<string> {
  const out = new Set<string>();
  for (const p of products) {
    if (!p.productCode?.trim()) continue;
    for (const part of p.productCode.split(",")) {
      const c = part.trim();
      if (c) out.add(c);
    }
  }
  for (const pl of plugins) {
    const c = pl.productCode?.trim();
    if (c) out.add(c);
  }
  return out;
}

import type { Account } from "@/data/mockData";
import type { ProductConsumption } from "@/types/lifecycle";
import { getPipelineType, normalizePipelineType, vendorDisplayName, type PipelineVendor } from "@/lib/pipelineConfig";

export type VendorId = PipelineVendor | "default";

export function getVendorId(): VendorId {
  return getPipelineType();
}

function seedFromId(id: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100;
  return h;
}

function normalizeUtilization(u: number): number {
  if (u <= 1 && u >= 0) return Math.round(u * 100);
  return Math.round(Math.min(100, Math.max(0, u)));
}

export function buildProductConsumption(account: Account, vendor: VendorId): ProductConsumption[] {
  const base = normalizeUtilization(account.utilization ?? 0);
  const id = account.id;

  const catalogs: Record<VendorId, Omit<ProductConsumption, "currentPct" | "deployed">[]> = {
    zscaler: [
      { productId: "zia", name: "ZIA (Internet Access)", purchased: true, targetPct: 80 },
      { productId: "zpa", name: "ZPA (Private Access)", purchased: true, targetPct: 65 },
      { productId: "zdx", name: "ZDX (Digital Experience)", purchased: base > 20, targetPct: 50 },
      { productId: "dlp", name: "DLP (Data Loss Prevention)", purchased: base > 70, targetPct: 40 },
    ],
    adobe: [
      { productId: "cc_all", name: "Creative Cloud All Apps", purchased: true, targetPct: 85 },
      { productId: "acrobat", name: "Acrobat Pro", purchased: true, targetPct: 70 },
      { productId: "stock", name: "Adobe Stock Credits", purchased: base > 50, targetPct: 60 },
      { productId: "sign", name: "Adobe Sign", purchased: base > 60, targetPct: 45 },
    ],
    crowdstrike: [
      { productId: "falcon", name: "Falcon Platform", purchased: true, targetPct: 95 },
      { productId: "identity", name: "Identity Protection", purchased: true, targetPct: 70 },
      { productId: "cloud", name: "Cloud Security", purchased: base > 40, targetPct: 55 },
      { productId: "intel", name: "Threat Intelligence", purchased: base > 65, targetPct: 50 },
    ],
    default: [
      { productId: "core", name: "Core Platform", purchased: true, targetPct: 80 },
      { productId: "addon", name: "Premium Add-on", purchased: base > 30, targetPct: 60 },
    ],
  };

  return catalogs[vendor].map((p, idx) => {
    const variance = seedFromId(id, idx + 7) - 50;
    const currentPct = p.purchased ? Math.max(0, Math.min(100, base + variance - idx * 8)) : 0;
    return { ...p, currentPct, deployed: p.purchased && currentPct >= 15 };
  });
}

export function getVendorDisplayName(vendor: VendorId): string {
  if (vendor === "default") return "Revenue Navigator";
  return vendorDisplayName(normalizePipelineType(vendor));
}
import { loadModuleCatalog } from '../config/module-catalog.loader';
import { TierQuote, TierQuotes } from '../types/negotiation.types';

export interface TierPricingInput {
  baseCostVnd: number;
  recommendedPriceVnd: number;
  matchedModuleIds: string[];
}

export class TierPricingService {
  build(input: TierPricingInput): TierQuotes {
    const anchorPrice = this.resolveAnchorPrice(input.baseCostVnd, input.recommendedPriceVnd);
    const scopeSeed = this.resolveScopeModules(input.matchedModuleIds);

    const basic: TierQuote = {
      tier: 'basic',
      priceVnd: Math.round(anchorPrice * 0.85),
      scopeModules: scopeSeed.slice(0, Math.max(1, Math.ceil(scopeSeed.length * 0.5))),
      clientResponsibilities: [
        'Khach tu lam sach du lieu dau vao theo template da thong nhat',
        'Khach chu dong van hanh import-export du lieu theo quy trinh',
      ],
      vendorResponsibilities: [
        'Trien khai core workflow va handover tai lieu huong dan',
        'Training online 1 buoi cho key user',
      ],
      mandatoryClauses: [
        'Vendor khong chiu trach nhiem doi voi du lieu dau vao khong dat chuan.',
      ],
      explanation: [
        'Goi Basic toi uu ngan sach bang cach gioi han scope va tang trach nhiem van hanh phia khach.',
      ],
    };

    const standard: TierQuote = {
      tier: 'standard',
      priceVnd: Math.round(anchorPrice),
      scopeModules: scopeSeed,
      clientResponsibilities: [
        'Khach bo tri dau moi nghiep vu duyet scope va timeline ban giao du lieu',
      ],
      vendorResponsibilities: [
        'Trien khai day du scope chuan va ho tro onboarding',
      ],
      mandatoryClauses: [
        'Timeline ban giao du lieu dau vao duoc cam ket bang bien ban scope.',
      ],
      explanation: [
        'Goi Standard giu can bang giua gia tri giao va chi phi trien khai.',
      ],
    };

    const premium: TierQuote = {
      tier: 'premium',
      priceVnd: Math.round(anchorPrice * 1.2),
      scopeModules: this.ensurePremiumScope(scopeSeed),
      clientResponsibilities: [
        'Khach bo tri product owner va key user de phe duyet nhanh cac moc UAT',
      ],
      vendorResponsibilities: [
        'Vendor chiu trach nhiem full-stack trien khai va migration theo SLA uu tien',
      ],
      mandatoryClauses: [
        'SLA va pham vi ho tro uu tien cao duoc ghi ro trong phu luc hop dong.',
      ],
      explanation: [
        'Goi Premium mo rong gia tri giao va muc SLA cho nhu cau enterprise.',
      ],
    };

    return { basic, standard, premium };
  }

  private resolveAnchorPrice(baseCostVnd: number, recommendedPriceVnd: number): number {
    const floor = Math.max(0, Math.round(baseCostVnd * 1.08));
    const anchor = Math.max(Math.round(recommendedPriceVnd), floor);
    return anchor > 0 ? anchor : floor;
  }

  private resolveScopeModules(matchedModuleIds: string[]): string[] {
    const moduleCatalog = loadModuleCatalog();
    const byId = new Map(moduleCatalog.map((x) => [x.moduleId, x.moduleName]));

    const resolved = matchedModuleIds
      .map((id) => byId.get(id) || id)
      .filter((x) => Boolean(x));

    if (resolved.length > 0) {
      return this.unique(resolved);
    }

    return ['Core CPQ Engine', 'Bao cao co ban'];
  }

  private ensurePremiumScope(scopeSeed: string[]): string[] {
    const premium = this.unique([...scopeSeed, 'Advanced Analytics']);
    return premium.length > 0 ? premium : ['Core CPQ Engine', 'Advanced Analytics'];
  }

  private unique(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values) {
      const key = value.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
    return out;
  }
}

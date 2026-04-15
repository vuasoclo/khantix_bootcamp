import { NegotiationCard } from '../types/negotiation.types';

const DEFAULT_NEGOTIATION_CARDS: NegotiationCard[] = [
  {
    cardId: 'card-data-clean',
    title: 'Khach tu lam sach du lieu theo template chuan',
    category: 'risk_transfer',
    estimatedSavingVnd: 0.12,
    valueImpactScore: 3,
    operationRiskScore: 8,
    requiresClientCapability: ['data_team'],
    mandatoryClauses: [
      'Khach ban giao du lieu da lam sach theo template da thong nhat truoc moc M1.',
      'Neu du lieu khong dat chuan thi timeline se duoc tinh lai theo phat sinh.',
    ],
    explanationTemplate:
      'Tiet kiem chi phi nhung chuyen trach nhiem chat luong du lieu dau vao cho phia khach hang.',
  },
  {
    cardId: 'card-legacy-batch',
    title: 'Doi tich hop realtime sang batch file hang ngay',
    category: 'risk_transfer',
    estimatedSavingVnd: 0.1,
    valueImpactScore: 4,
    operationRiskScore: 7,
    requiresClientCapability: ['it_team'],
    blocksIfMissingModules: ['MOD_INT_'],
    mandatoryClauses: [
      'Pham vi tich hop phase hien tai gioi han o import-export batch theo lich.',
      'SLA dong bo du lieu theo batch va dung sai duoc ghi ro trong hop dong.',
    ],
    explanationTemplate:
      'Giam effort tich hop phuc tap bang cach doi realtime thanh batch co kiem soat.',
  },
  {
    cardId: 'card-cut-analytics',
    title: 'Cat module Analytics nang cao o phase hien tai',
    category: 'scope_cut',
    estimatedSavingVnd: 0.08,
    valueImpactScore: 6,
    operationRiskScore: 3,
    requiresClientCapability: [],
    blocksIfMissingModules: ['MOD_ANL_'],
    mandatoryClauses: [
      'Analytics nang cao duoc tach sang phase tiep theo theo bien ban scope.',
    ],
    explanationTemplate:
      'Giam gia bang cach cat bo nhom tinh nang nang cao chua can thiet ngay.',
  },
  {
    cardId: 'card-sla-downgrade',
    title: 'Giam SLA ho tro tu 24/7 ve gio hanh chinh',
    category: 'commercial_term',
    estimatedSavingVnd: 0.05,
    valueImpactScore: 2,
    operationRiskScore: 2,
    requiresClientCapability: [],
    mandatoryClauses: [
      'SLA ho tro ap dung theo gio hanh chinh trong suot pham vi hop dong.',
    ],
    explanationTemplate:
      'Giam chi phi van hanh bang cach dieu chinh muc SLA.',
  },
  {
    cardId: 'card-uat-client-led',
    title: 'Khach tu dieu phoi UAT va nghiem thu theo checklist',
    category: 'risk_transfer',
    estimatedSavingVnd: 0.06,
    valueImpactScore: 4,
    operationRiskScore: 6,
    requiresClientCapability: ['product_owner', 'qa_team'],
    mandatoryClauses: [
      'Khach bo tri dau moi nghiem thu va timeline UAT duoc chot truoc khi kickoff.',
    ],
    explanationTemplate:
      'Giam effort phia vendor o giai doan UAT bang cach chuyen dieu phoi cho phia khach.',
  },
];

function cloneCard(card: NegotiationCard): NegotiationCard {
  return {
    ...card,
    requiresClientCapability: [...card.requiresClientCapability],
    blocksIfMissingModules: card.blocksIfMissingModules ? [...card.blocksIfMissingModules] : undefined,
    mandatoryClauses: [...card.mandatoryClauses],
  };
}

export function loadNegotiationCards(): NegotiationCard[] {
  return DEFAULT_NEGOTIATION_CARDS.map(cloneCard);
}

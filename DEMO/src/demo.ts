/**
 * KHantix Demo — Pricing Justifier
 *
 * The system's job is NOT to generate 3 price options.
 * Its job is to take a project's technical realities and explain,
 * in plain language, WHY the price is what it is — so Sales can
 * defend every number in front of a client or manager.
 *
 * Run: npm run demo
 */

import { loadInternalConfigs } from './config/internal-configs.loader';
import { loadHeuristicMatrix } from './config/heuristic-matrix.loader';
import { InvestigatorService } from './services/investigator.service';
import { CalculatorService } from './services/calculator.service';
import { SessionState, RiskSlot } from './types/risk-slot.types';
import { PriceBreakdown } from './types/pricing-output.types';

// ─── Load configs ─────────────────────────────────────────────────────────────
const config = loadInternalConfigs();
const heuristicRules = loadHeuristicMatrix();

const LINE = '═'.repeat(62);
const line = '─'.repeat(62);

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

console.log(`\n${LINE}`);
console.log('  KHANTIX — AI Pricing Justification System');
console.log(`${LINE}`);
console.log(`  ✅ ${heuristicRules.length} heuristic rules loaded`);
console.log(`  ✅ Internal config: Net Margin target = ${pct(config.Margin_NetProfit)}\n`);

// ─── Scenario setup (simulates Investigator output) ───────────────────────────
const investigator = new InvestigatorService();
let session: SessionState = investigator.createSession('demo-001');

// Mock filled slots: mid-size retail chain, messy legacy data, rush go-live
const mockSlots: RiskSlot = {
  Data_Risk:          'HIGH',
  Integration_Risk:   'HIGH',
  Tech_Literacy_Risk: 'HIGH',
  Hardware_Sizing:    'TIER_LARGE',
  Scope_Granularity:  'ENTERPRISE',
  Rush_Factor:        'HIGH',
  Client_Logo_Size:   'SMB',
  Payment_Term:       'INSTALLMENT',
};

session.slots        = mockSlots;
session.filledSlots  = Object.keys(mockSlots) as Array<keyof RiskSlot>;
session.missingSlots = [];

console.log('  📋 SCENARIO: Mid-size retail chain');
console.log('  — Legacy data stored in Excel and USB drives');
console.log('  — Must integrate with existing MISA accounting');
console.log('  — Warehouse staff with low tech literacy');
console.log('  — Go-live required in 1 month (rush)');
console.log(`\n${LINE}\n`);

// ─── Run Calculator ───────────────────────────────────────────────────────────
const calculator = new CalculatorService();
const result: PriceBreakdown = calculator.run(session, config, {
  estimatedManDays: 90,
  primaryRole:      'Senior',
  userCount:        200,
  includesOnsite:   true,
  strategy:         'HUNTER',
});

// ─── Print: Recommended Price ─────────────────────────────────────────────────
console.log(`  💰 RECOMMENDED PRICE: ${formatVND(result.recommendedPrice)}`);
console.log(`${LINE}\n`);

// ─── Print: Narrative (The Story) ────────────────────────────────────────────
console.log('  WHY THIS PRICE?');
console.log(`  ${line}\n`);
result.narrative.forEach((para, i) => {
  // Word-wrap at ~72 chars for readability
  const words = para.split(' ');
  let line_ = `  ${i + 1}. `;
  words.forEach(word => {
    if ((line_ + word).length > 76) {
      console.log(line_);
      line_ = '     ' + word + ' ';
    } else {
      line_ += word + ' ';
    }
  });
  if (line_.trim()) console.log(line_);
  console.log('');
});

// ─── Print: Cost Line Items ───────────────────────────────────────────────────
console.log(`  ${line}`);
console.log('  COST BREAKDOWN\n');
for (const item of result.costLineItems) {
  console.log(`  • ${item.category.padEnd(28)} ${formatVND(item.amount)}`);
  console.log(`    ${item.explanation}\n`);
}

// ─── Print: Risk Adjustments ──────────────────────────────────────────────────
console.log(`  ${line}`);
console.log('  RISK ADJUSTMENTS APPLIED\n');
if (result.riskAdjustments.length === 0) {
  console.log('  No risk adjustments were needed.\n');
} else {
  for (const risk of result.riskAdjustments) {
    console.log(`  ⚠  ${risk.dimension} [${risk.level}]`);
    console.log(`     Buffer: +${pct(risk.bufferApplied)} | Extra days: +${risk.extraDays}`);
    console.log(`     ${risk.why}\n`);
  }
}

// ─── Print: Margin Breakdown ──────────────────────────────────────────────────
console.log(`  ${line}`);
console.log('  MARGIN BREAKDOWN\n');
console.log(`  Net Profit:     ${pct(result.marginBreakdown.netProfitPct)}`);
console.log(`  Risk Premium:   ${pct(result.marginBreakdown.riskPremiumPct)}`);
console.log(`  Reinvestment:   ${pct(result.marginBreakdown.reinvestmentPct)}`);
console.log(`  ──────────────────────`);
console.log(`  Total Margin:   ${pct(result.marginBreakdown.totalMarginPct)}  (${formatVND(result.marginBreakdown.totalMarginAmount)})`);
console.log(`\n  ${result.marginBreakdown.why}\n`);

// ─── Print: Debug Audit Trail ────────────────────────────────────────────────
console.log(`${LINE}`);
console.log('  AUDIT TRAIL (internal — not shown to client)\n');
console.log(`  Base man-days:        ${result._debug.baseManDays} days`);
console.log(`  Adjusted man-days:    ${Math.round(result._debug.adjustedManDays)} days`);
console.log(`  Total risk mult.:     ×${result._debug.totalRiskMultiplier.toFixed(2)}`);
console.log(`  Base cost:            ${formatVND(result._debug.baseCost)}`);
console.log(`  Adjusted cost:        ${formatVND(result._debug.adjustedCost)}`);
console.log(`${LINE}\n`);

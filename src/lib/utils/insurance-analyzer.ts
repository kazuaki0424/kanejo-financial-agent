/**
 * 保険見直しエンジン
 *
 * ユーザーのライフステージと資産状況から必要保障額を算出し、
 * 現在の保険とのギャップを分析する。
 */

import { formatCurrency } from '@/lib/utils/format';

// ============================================================
// Types
// ============================================================

export interface InsuranceProfile {
  age: number;
  maritalStatus: string;
  dependents: number;
  dependentAges: number[];
  annualIncome: number;
  monthlyExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  currentInsurance: CurrentInsurance[];
}

export interface CurrentInsurance {
  type: 'life' | 'medical' | 'cancer' | 'disability' | 'whole_life';
  name: string;
  coverage: number;
  monthlyPremium: number;
}

export interface CoverageNeed {
  type: InsuranceCoverageType;
  label: string;
  description: string;
  requiredAmount: number;
  currentAmount: number;
  gap: number;
  status: 'sufficient' | 'insufficient' | 'excessive' | 'not_needed';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

export const COVERAGE_TYPES = ['life', 'medical', 'disability', 'cancer'] as const;
export type InsuranceCoverageType = (typeof COVERAGE_TYPES)[number];

export interface InsuranceAnalysis {
  needs: CoverageNeed[];
  totalMonthlyPremium: number;
  recommendedMonthlyBudget: number;
  premiumRatio: number;
  lifeStage: LifeStage;
  overallScore: number;
  suggestions: InsuranceSuggestion[];
}

export interface InsuranceSuggestion {
  title: string;
  description: string;
  potentialSaving: number;
  priority: 'high' | 'medium' | 'low';
}

export type LifeStage = 'single_young' | 'single_mid' | 'married_no_kids' | 'married_young_kids' | 'married_school_kids' | 'pre_retirement' | 'retired';

// ============================================================
// Life stage detection
// ============================================================

function detectLifeStage(profile: InsuranceProfile): LifeStage {
  const { age, maritalStatus, dependents, dependentAges } = profile;

  if (age >= 65) return 'retired';
  if (age >= 55) return 'pre_retirement';

  if (maritalStatus === 'single') {
    return age < 35 ? 'single_young' : 'single_mid';
  }

  if (dependents === 0) return 'married_no_kids';

  const hasYoungKids = dependentAges.some((a) => a < 7);
  return hasYoungKids ? 'married_young_kids' : 'married_school_kids';
}

const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  single_young: '独身（若年）',
  single_mid: '独身（中年）',
  married_no_kids: '既婚（子なし）',
  married_young_kids: '子育て期（未就学）',
  married_school_kids: '子育て期（就学）',
  pre_retirement: '退職準備期',
  retired: '退職後',
};

// ============================================================
// Required coverage calculation
// ============================================================

function calculateLifeInsuranceNeed(profile: InsuranceProfile, lifeStage: LifeStage): number {
  if (lifeStage === 'single_young' || lifeStage === 'single_mid') {
    // Single: funeral costs + debt payoff only
    return 3_000_000 + Math.max(0, profile.totalLiabilities);
  }

  if (lifeStage === 'retired') {
    return 3_000_000; // Funeral costs
  }

  // Family: income replacement + education + living costs - assets
  const yearsToRetirement = Math.max(0, 65 - profile.age);
  const incomeReplacement = profile.annualIncome * 0.7 * Math.min(yearsToRetirement, 20);

  // Education costs per child (estimate)
  const educationCost = profile.dependentAges.reduce((sum, childAge) => {
    const yearsOfEducation = Math.max(0, 22 - childAge);
    return sum + yearsOfEducation * 500_000;
  }, 0);

  // Living costs for family for 10 years
  const livingCosts = profile.monthlyExpenses * 12 * 10;

  const totalNeed = incomeReplacement + educationCost + livingCosts;
  const covered = profile.totalAssets + 10_000_000; // Assets + assumed public pension survivor benefit

  return Math.max(0, totalNeed - covered);
}

function calculateMedicalNeed(profile: InsuranceProfile): number {
  // High-cost medical care system covers most, but out-of-pocket can be 800K-1M per year
  const baseNeed = profile.age < 40 ? 3_000_000 : profile.age < 60 ? 5_000_000 : 8_000_000;

  // If assets can cover, less need
  if (profile.totalAssets > baseNeed * 2) {
    return Math.round(baseNeed * 0.5);
  }

  return baseNeed;
}

function calculateDisabilityNeed(profile: InsuranceProfile): number {
  if (profile.dependents === 0 && profile.totalAssets > 10_000_000) return 0;

  // Monthly income replacement for 5 years
  return Math.round(profile.annualIncome * 0.6 * 5);
}

// ============================================================
// Main analysis
// ============================================================

export function analyzeInsurance(profile: InsuranceProfile): InsuranceAnalysis {
  const lifeStage = detectLifeStage(profile);

  // Calculate needs
  const lifeNeed = calculateLifeInsuranceNeed(profile, lifeStage);
  const medicalNeed = calculateMedicalNeed(profile);
  const disabilityNeed = calculateDisabilityNeed(profile);

  // Current coverage
  const currentLife = profile.currentInsurance
    .filter((i) => i.type === 'life' || i.type === 'whole_life')
    .reduce((s, i) => s + i.coverage, 0);
  const currentMedical = profile.currentInsurance
    .filter((i) => i.type === 'medical')
    .reduce((s, i) => s + i.coverage, 0);
  const currentDisability = profile.currentInsurance
    .filter((i) => i.type === 'disability')
    .reduce((s, i) => s + i.coverage, 0);

  const totalPremium = profile.currentInsurance.reduce((s, i) => s + i.monthlyPremium, 0);

  // Recommended budget: 5-10% of monthly income
  const monthlyIncome = Math.round(profile.annualIncome / 12);
  const recommendedBudget = Math.round(monthlyIncome * 0.07);
  const premiumRatio = monthlyIncome > 0 ? totalPremium / monthlyIncome : 0;

  // Build coverage needs
  const needs: CoverageNeed[] = [];

  // Life insurance
  const lifeGap = lifeNeed - currentLife;
  needs.push({
    type: 'life',
    label: '死亡保障',
    description: '万が一の際に遺族の生活を守る保障',
    requiredAmount: lifeNeed,
    currentAmount: currentLife,
    gap: lifeGap,
    status: lifeNeed === 0 ? 'not_needed'
      : lifeGap > 1_000_000 ? 'insufficient'
      : lifeGap < -5_000_000 ? 'excessive'
      : 'sufficient',
    priority: lifeStage === 'married_young_kids' || lifeStage === 'married_school_kids' ? 'high' : 'low',
    recommendation: lifeGap > 1_000_000
      ? `¥${formatCurrency(lifeGap)}の不足。定期保険での上乗せを検討してください。`
      : lifeGap < -5_000_000
        ? '過剰な保障があります。保険の見直しで保険料を削減できる可能性があります。'
        : '適切な水準です。',
  });

  // Medical
  const medicalGap = medicalNeed - currentMedical;
  needs.push({
    type: 'medical',
    label: '医療保障',
    description: '入院・手術時の自己負担をカバーする保障',
    requiredAmount: medicalNeed,
    currentAmount: currentMedical,
    gap: medicalGap,
    status: medicalGap > 1_000_000 ? 'insufficient'
      : medicalGap < -2_000_000 ? 'excessive'
      : 'sufficient',
    priority: 'medium',
    recommendation: medicalGap > 1_000_000
      ? '医療保険の加入を検討してください。高額療養費制度でカバーされない分を備えましょう。'
      : '高額療養費制度と合わせて十分な水準です。',
  });

  // Disability
  const disabilityGap = disabilityNeed - currentDisability;
  if (disabilityNeed > 0) {
    needs.push({
      type: 'disability',
      label: '就業不能保障',
      description: '病気やケガで働けなくなった時の収入保障',
      requiredAmount: disabilityNeed,
      currentAmount: currentDisability,
      gap: disabilityGap,
      status: disabilityGap > 1_000_000 ? 'insufficient' : 'sufficient',
      priority: profile.dependents > 0 ? 'high' : 'medium',
      recommendation: disabilityGap > 1_000_000
        ? '就業不能保険の検討をおすすめします。特に家族がいる場合は重要です。'
        : '現在の保障で十分カバーされています。',
    });
  }

  // Overall score (0-100)
  const scores = needs.map((n) => {
    if (n.status === 'sufficient' || n.status === 'not_needed') return 100;
    if (n.status === 'excessive') return 70;
    return Math.max(0, Math.round((n.currentAmount / Math.max(1, n.requiredAmount)) * 100));
  });
  const overallScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  // Suggestions
  const suggestions: InsuranceSuggestion[] = [];

  const insufficient = needs.filter((n) => n.status === 'insufficient');
  const excessive = needs.filter((n) => n.status === 'excessive');

  if (insufficient.length > 0) {
    suggestions.push({
      title: '保障の追加を検討',
      description: `${insufficient.map((n) => n.label).join('・')}が不足しています。ネット保険なら割安に保障を追加できます。`,
      potentialSaving: 0,
      priority: 'high',
    });
  }

  if (excessive.length > 0) {
    const excessivePremium = profile.currentInsurance
      .filter((i) => excessive.some((e) => e.type === i.type))
      .reduce((s, i) => s + i.monthlyPremium, 0);
    suggestions.push({
      title: '過剰な保障の見直し',
      description: `${excessive.map((n) => n.label).join('・')}が必要以上に手厚い可能性があります。見直しで月額¥${formatCurrency(Math.round(excessivePremium * 0.3))}の削減が見込めます。`,
      potentialSaving: Math.round(excessivePremium * 0.3 * 12),
      priority: 'medium',
    });
  }

  if (premiumRatio > 0.10) {
    suggestions.push({
      title: '保険料の割合が高い',
      description: `月収に対する保険料の割合が${(premiumRatio * 100).toFixed(1)}%です。一般的に7%以下が目安です。不要な特約の削除を検討してください。`,
      potentialSaving: Math.round((totalPremium - recommendedBudget) * 12),
      priority: 'medium',
    });
  }

  if (profile.age < 40 && profile.currentInsurance.some((i) => i.type === 'whole_life')) {
    suggestions.push({
      title: '終身保険→定期保険への切り替え',
      description: '若い間は定期保険の方が保険料が安く、同じ保障額を確保できます。貯蓄機能は投資で代替可能です。',
      potentialSaving: 0,
      priority: 'low',
    });
  }

  suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return {
    needs,
    totalMonthlyPremium: totalPremium,
    recommendedMonthlyBudget: recommendedBudget,
    premiumRatio,
    lifeStage,
    overallScore,
    suggestions,
  };
}

export { LIFE_STAGE_LABELS };

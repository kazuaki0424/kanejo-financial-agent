/**
 * クレジットカード最適化エンジン
 *
 * ユーザーの支出カテゴリ別パターンから、
 * ポイント還元率を最大化するカードの組み合わせを提案する。
 */

import { CREDIT_CARDS, type ServiceData } from '@/lib/constants/financial-services';
import { formatCurrency } from '@/lib/utils/format';

// ============================================================
// Types
// ============================================================

export interface SpendingPattern {
  category: string;
  label: string;
  monthlyAmount: number;
}

export interface CardRewardRule {
  cardId: string;
  /** カテゴリ別の還元率マップ */
  categoryRates: Record<string, number>;
  /** 基本還元率 */
  baseRate: number;
  /** 年会費 */
  annualFee: number;
}

export interface CardRecommendation {
  card: ServiceData;
  role: 'main' | 'sub';
  assignedCategories: Array<{ category: string; label: string; monthlyAmount: number; rewardRate: number; monthlyReward: number }>;
  annualReward: number;
  annualFee: number;
  netBenefit: number;
}

export interface OptimizationResult {
  singleBest: CardRecommendation;
  comboBest: CardRecommendation[];
  singleAnnualReward: number;
  comboAnnualReward: number;
  comboNetBenefit: number;
  improvementOverSingle: number;
  spendingSummary: {
    totalMonthly: number;
    totalAnnual: number;
    effectiveRate: number;
  };
}

// ============================================================
// Reward rate data per card per spending category
// ============================================================

const CARD_REWARD_RULES: CardRewardRule[] = [
  {
    cardId: 'cc-rakuten',
    baseRate: 0.01,
    annualFee: 0,
    categoryRates: {
      // 楽天市場での買い物は別途（ここでは日常支出カテゴリのみ）
      food: 0.01,
      entertainment: 0.01,
      subscription: 0.01,
      clothing: 0.01,
    },
  },
  {
    cardId: 'cc-jcbw',
    baseRate: 0.01,
    annualFee: 0,
    categoryRates: {
      subscription: 0.02, // Amazon
      food: 0.01,
      entertainment: 0.01,
    },
  },
  {
    cardId: 'cc-amex-gold',
    baseRate: 0.005,
    annualFee: 31_900,
    categoryRates: {
      transportation: 0.01, // マイル換算
      entertainment: 0.01,
    },
  },
  {
    cardId: 'cc-three-mitsui',
    baseRate: 0.005,
    annualFee: 0,
    categoryRates: {
      food: 0.07, // コンビニ・飲食店
      entertainment: 0.02,
    },
  },
];

function getRewardRate(rule: CardRewardRule, spendingCategory: string): number {
  return rule.categoryRates[spendingCategory] ?? rule.baseRate;
}

function getCardData(cardId: string): ServiceData | undefined {
  return CREDIT_CARDS.find((c) => c.id === cardId);
}

// ============================================================
// Optimization
// ============================================================

function evaluateSingleCard(
  rule: CardRewardRule,
  spending: SpendingPattern[],
): CardRecommendation | null {
  const card = getCardData(rule.cardId);
  if (!card) return null;

  const assigned = spending.map((s) => {
    const rate = getRewardRate(rule, s.category);
    return {
      category: s.category,
      label: s.label,
      monthlyAmount: s.monthlyAmount,
      rewardRate: rate,
      monthlyReward: Math.round(s.monthlyAmount * rate),
    };
  });

  const annualReward = assigned.reduce((sum, a) => sum + a.monthlyReward, 0) * 12;

  return {
    card,
    role: 'main',
    assignedCategories: assigned,
    annualReward,
    annualFee: rule.annualFee,
    netBenefit: annualReward - rule.annualFee,
  };
}

/**
 * 2枚の組み合わせで最適化:
 * 各カテゴリで還元率が高い方のカードを使い分ける
 */
function evaluateCombo(
  mainRule: CardRewardRule,
  subRule: CardRewardRule,
  spending: SpendingPattern[],
): CardRecommendation[] | null {
  const mainCard = getCardData(mainRule.cardId);
  const subCard = getCardData(subRule.cardId);
  if (!mainCard || !subCard) return null;

  const mainAssigned: CardRecommendation['assignedCategories'] = [];
  const subAssigned: CardRecommendation['assignedCategories'] = [];

  for (const s of spending) {
    const mainRate = getRewardRate(mainRule, s.category);
    const subRate = getRewardRate(subRule, s.category);

    const entry = {
      category: s.category,
      label: s.label,
      monthlyAmount: s.monthlyAmount,
    };

    if (subRate > mainRate) {
      subAssigned.push({ ...entry, rewardRate: subRate, monthlyReward: Math.round(s.monthlyAmount * subRate) });
    } else {
      mainAssigned.push({ ...entry, rewardRate: mainRate, monthlyReward: Math.round(s.monthlyAmount * mainRate) });
    }
  }

  const mainAnnual = mainAssigned.reduce((s, a) => s + a.monthlyReward, 0) * 12;
  const subAnnual = subAssigned.reduce((s, a) => s + a.monthlyReward, 0) * 12;

  return [
    {
      card: mainCard,
      role: 'main',
      assignedCategories: mainAssigned,
      annualReward: mainAnnual,
      annualFee: mainRule.annualFee,
      netBenefit: mainAnnual - mainRule.annualFee,
    },
    {
      card: subCard,
      role: 'sub',
      assignedCategories: subAssigned,
      annualReward: subAnnual,
      annualFee: subRule.annualFee,
      netBenefit: subAnnual - subRule.annualFee,
    },
  ];
}

export function optimizeCreditCards(spending: SpendingPattern[]): OptimizationResult {
  const totalMonthly = spending.reduce((s, p) => s + p.monthlyAmount, 0);
  const totalAnnual = totalMonthly * 12;

  // 1. Find best single card
  let bestSingle: CardRecommendation | null = null;
  for (const rule of CARD_REWARD_RULES) {
    const result = evaluateSingleCard(rule, spending);
    if (result && (!bestSingle || result.netBenefit > bestSingle.netBenefit)) {
      bestSingle = result;
    }
  }

  // 2. Find best 2-card combo
  let bestCombo: CardRecommendation[] = [];
  let bestComboNet = -Infinity;

  for (let i = 0; i < CARD_REWARD_RULES.length; i++) {
    for (let j = i + 1; j < CARD_REWARD_RULES.length; j++) {
      const combo = evaluateCombo(CARD_REWARD_RULES[i], CARD_REWARD_RULES[j], spending);
      if (!combo) continue;

      const totalNet = combo.reduce((s, c) => s + c.netBenefit, 0);
      if (totalNet > bestComboNet) {
        bestComboNet = totalNet;
        bestCombo = combo;
      }
    }
  }

  // Fallback if no cards found
  const fallbackCard: CardRecommendation = {
    card: CREDIT_CARDS[0],
    role: 'main',
    assignedCategories: spending.map((s) => ({
      category: s.category,
      label: s.label,
      monthlyAmount: s.monthlyAmount,
      rewardRate: 0.01,
      monthlyReward: Math.round(s.monthlyAmount * 0.01),
    })),
    annualReward: Math.round(totalAnnual * 0.01),
    annualFee: 0,
    netBenefit: Math.round(totalAnnual * 0.01),
  };

  const singleBest = bestSingle ?? fallbackCard;
  const comboBest = bestCombo.length >= 2 ? bestCombo : [singleBest];

  const comboAnnualReward = comboBest.reduce((s, c) => s + c.annualReward, 0);
  const comboTotalFee = comboBest.reduce((s, c) => s + c.annualFee, 0);
  const comboNetBenefit = comboAnnualReward - comboTotalFee;

  return {
    singleBest,
    comboBest,
    singleAnnualReward: singleBest.annualReward,
    comboAnnualReward,
    comboNetBenefit,
    improvementOverSingle: comboNetBenefit - singleBest.netBenefit,
    spendingSummary: {
      totalMonthly,
      totalAnnual,
      effectiveRate: totalAnnual > 0 ? comboAnnualReward / totalAnnual : 0,
    },
  };
}

/**
 * 金融サービス比較エンジン
 *
 * ユーザープロファイルに基づいてサービスをスコアリングし、
 * 最適なサービスをレコメンドする。
 */

import { type ServiceData, type ServiceCategory, getServicesByCategory } from '@/lib/constants/financial-services';

export interface UserPreferences {
  annualIncome: number;
  monthlySpending: number;
  age: number;
  priorities: ('cost' | 'rewards' | 'coverage' | 'quality')[];
}

export interface ScoredService {
  service: ServiceData;
  score: number;
  annualCost: number;
  annualBenefit: number;
  netValue: number;
  recommendation: string;
  isRecommended: boolean;
}

export interface ComparisonResult {
  category: ServiceCategory;
  services: ScoredService[];
  topPick: ScoredService | null;
  potentialSavings: number;
}

/**
 * カテゴリ内のサービスを比較・スコアリング
 */
export function compareServices(
  category: ServiceCategory,
  preferences: UserPreferences,
  currentServiceId?: string,
): ComparisonResult {
  const services = getServicesByCategory(category);
  const scored = services.map((s) => scoreService(s, category, preferences));
  scored.sort((a, b) => b.score - a.score);

  // Mark top pick
  const scoredWithRecommendation = scored.map((s, i) => ({
    ...s,
    isRecommended: i === 0,
  }));

  const topPick = scoredWithRecommendation[0] ?? null;

  // Calculate potential savings vs current service
  let potentialSavings = 0;
  if (currentServiceId && topPick) {
    const current = scoredWithRecommendation.find((s) => s.service.id === currentServiceId);
    if (current && topPick.service.id !== currentServiceId) {
      potentialSavings = current.annualCost - topPick.annualCost;
    }
  }

  return {
    category,
    services: scoredWithRecommendation,
    topPick,
    potentialSavings,
  };
}

function scoreService(
  service: ServiceData,
  category: ServiceCategory,
  prefs: UserPreferences,
): ScoredService {
  let score = service.rating * 20; // Base: rating out of 5 → 0-100

  const annualCost = service.annualFee > 0 ? service.annualFee : service.monthlyFee * 12;
  let annualBenefit = 0;
  let recommendation = '';

  switch (category) {
    case 'credit_card': {
      // Estimate rewards based on spending
      const rewardRate = parseRewardRate(service);
      annualBenefit = Math.round(prefs.monthlySpending * 12 * rewardRate);

      // Cost priority: penalize annual fee
      if (prefs.priorities.includes('cost')) {
        score += annualCost === 0 ? 15 : -10;
      }
      // Rewards priority: boost high reward rate
      if (prefs.priorities.includes('rewards')) {
        score += rewardRate * 1000;
      }
      // Age restriction
      if (service.id === 'cc-jcbw' && prefs.age > 39) {
        score -= 50;
        recommendation = '39歳以下限定のため申込不可';
      }

      if (!recommendation) {
        recommendation = annualBenefit > annualCost
          ? `年間約¥${annualBenefit.toLocaleString()}のポイント還元`
          : 'コスト面で要検討';
      }
      break;
    }

    case 'insurance': {
      if (prefs.priorities.includes('coverage')) {
        score += 10;
      }
      if (prefs.priorities.includes('cost')) {
        score += annualCost < 20_000 ? 10 : -5;
      }
      recommendation = `月額¥${service.monthlyFee.toLocaleString()}`;
      break;
    }

    case 'telecom': {
      if (prefs.priorities.includes('cost')) {
        score += annualCost < 15_000 ? 15 : annualCost < 25_000 ? 5 : -5;
      }
      if (prefs.priorities.includes('quality')) {
        // Major carrier lines get quality bonus
        const majorCarrier = ['ドコモ', 'ソフトバンク'].some((c) =>
          service.features.some((f) => f.value.includes(c)),
        );
        if (majorCarrier) score += 10;
      }
      recommendation = `月額¥${service.monthlyFee.toLocaleString()}`;
      break;
    }

    case 'utility': {
      if (prefs.priorities.includes('cost')) {
        score += annualCost < 100_000 ? 10 : -5;
      }
      recommendation = `月額目安¥${service.monthlyFee.toLocaleString()}`;
      break;
    }

    default:
      recommendation = '';
  }

  const netValue = annualBenefit - annualCost;

  return {
    service,
    score: Math.max(0, Math.min(100, Math.round(score))),
    annualCost,
    annualBenefit,
    netValue,
    recommendation,
    isRecommended: false,
  };
}

function parseRewardRate(service: ServiceData): number {
  const rateFeature = service.features.find((f) => f.label.includes('還元率'));
  if (!rateFeature) return 0.005;
  const match = rateFeature.value.match(/([\d.]+)%/);
  return match ? Number.parseFloat(match[1]) / 100 : 0.005;
}

/**
 * アラート・通知エンジン
 *
 * ユーザーの家計データを分析し、注意が必要な項目を検知する。
 */

import { formatCurrency } from '@/lib/utils/format';

// ============================================================
// Types
// ============================================================

export const ALERT_TYPES = ['spending_anomaly', 'score_change', 'deadline', 'savings_opportunity', 'system'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_PRIORITIES = ['urgent', 'warning', 'info'] as const;
export type AlertPriority = (typeof ALERT_PRIORITIES)[number];

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
  read: boolean;
}

export interface AlertContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  householdScore: number;
  netWorth: number;
  expenses: Array<{ category: string; label: string; amount: number; isFixed: boolean }>;
  furusatoLimit: number;
  age: number;
  hasFurusato: boolean;
  hasIdeco: boolean;
}

// ============================================================
// Alert generation
// ============================================================

export function generateAlerts(ctx: AlertContext): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  const month = now.getMonth();

  // --- 支出異常検知 ---
  if (ctx.monthlyExpenses > ctx.monthlyIncome) {
    alerts.push({
      id: 'spending-over-income',
      type: 'spending_anomaly',
      priority: 'urgent',
      title: '支出が収入を超えています',
      message: `月間支出¥${formatCurrency(ctx.monthlyExpenses)}が月収¥${formatCurrency(ctx.monthlyIncome)}を上回っています。家計の見直しを検討してください。`,
      actionLabel: '家計診断を見る',
      actionHref: '/diagnosis',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // 貯蓄率が低い
  if (ctx.savingsRate < 10 && ctx.savingsRate >= 0 && ctx.monthlyIncome > 0) {
    alerts.push({
      id: 'low-savings-rate',
      type: 'spending_anomaly',
      priority: 'warning',
      title: '貯蓄率が低下しています',
      message: `貯蓄率${ctx.savingsRate}%は推奨値（20%以上）を下回っています。固定費の見直しが効果的かもしれません。`,
      actionLabel: '固定費を見直す',
      actionHref: '/agent',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // 高額カテゴリの検知
  for (const exp of ctx.expenses) {
    const ratio = ctx.monthlyIncome > 0 ? exp.amount / ctx.monthlyIncome : 0;
    if (exp.category === 'housing' && ratio > 0.35) {
      alerts.push({
        id: 'high-housing',
        type: 'spending_anomaly',
        priority: 'warning',
        title: '住居費の割合が高めです',
        message: `住居費が収入の${(ratio * 100).toFixed(0)}%を占めています。一般的に30%以下が目安です。`,
        actionLabel: 'サービス比較',
        actionHref: '/compare',
        createdAt: now.toISOString(),
        read: false,
      });
    }
  }

  // --- 家計スコア ---
  if (ctx.householdScore < 40) {
    alerts.push({
      id: 'low-score',
      type: 'score_change',
      priority: 'warning',
      title: '家計スコアが低下しています',
      message: `家計スコアが${ctx.householdScore}点です。改善ポイントを確認しましょう。`,
      actionLabel: '改善ポイントを見る',
      actionHref: '/diagnosis',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // --- 季節イベント ---

  // ふるさと納税（10-12月）
  if (month >= 9 && !ctx.hasFurusato && ctx.furusatoLimit > 5_000) {
    alerts.push({
      id: 'furusato-reminder',
      type: 'deadline',
      priority: month === 11 ? 'urgent' : 'info',
      title: 'ふるさと納税の期限が近づいています',
      message: `控除上限額¥${formatCurrency(ctx.furusatoLimit)}まで寄付可能です。12月31日までに手続きを完了してください。`,
      actionLabel: 'ふるさと納税',
      actionHref: '/tax/furusato',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // 確定申告（1-3月）
  if (month >= 0 && month <= 2) {
    alerts.push({
      id: 'tax-filing',
      type: 'deadline',
      priority: month === 2 ? 'urgent' : 'info',
      title: '確定申告の時期です',
      message: '確定申告の提出期限は3月15日です。必要書類を準備しましょう。',
      actionLabel: '確定申告ガイド',
      actionHref: '/tax',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // 年末調整（10-11月）
  if (month >= 9 && month <= 10) {
    alerts.push({
      id: 'year-end-adjustment',
      type: 'deadline',
      priority: 'info',
      title: '年末調整の準備をしましょう',
      message: '保険料控除証明書やiDeCoの掛金払込証明書を準備してください。',
      actionLabel: '年末調整ウィザード',
      actionHref: '/tax',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // --- 節税機会 ---
  if (!ctx.hasIdeco && ctx.age < 60) {
    alerts.push({
      id: 'ideco-opportunity',
      type: 'savings_opportunity',
      priority: 'info',
      title: 'iDeCoに加入していません',
      message: 'iDeCoは掛金全額が所得控除の対象です。節税効果が高い制度を活用しましょう。',
      actionLabel: 'iDeCo/NISAを見る',
      actionHref: '/tax/ideco-nisa',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // 純資産マイナス
  if (ctx.netWorth < 0) {
    alerts.push({
      id: 'negative-networth',
      type: 'spending_anomaly',
      priority: 'urgent',
      title: '純資産がマイナスです',
      message: `純資産が¥${formatCurrency(Math.abs(ctx.netWorth))}のマイナスです。負債の返済計画を見直しましょう。`,
      actionLabel: 'シミュレーション',
      actionHref: '/simulation',
      createdAt: now.toISOString(),
      read: false,
    });
  }

  // Sort by priority
  const priorityOrder: Record<AlertPriority, number> = { urgent: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return alerts;
}

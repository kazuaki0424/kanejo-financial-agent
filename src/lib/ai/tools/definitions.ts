/**
 * エージェントツール定義
 *
 * Claude API の Tool Use 機能で使用するツール群。
 * エージェントがユーザーの質問に応じて自律的にツールを選択・実行する。
 */

import type Anthropic from '@anthropic-ai/sdk';

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_services',
    description: '金融サービス（クレジットカード、保険、通信、電力）を検索・比較します。カテゴリを指定すると、ユーザーの状況に合ったサービスをスコアリングして返します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['credit_card', 'insurance', 'telecom', 'utility'],
          description: '検索するサービスカテゴリ',
        },
        priority: {
          type: 'string',
          enum: ['cost', 'rewards', 'coverage', 'quality'],
          description: '重視するポイント',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'calculate_tax',
    description: 'ユーザーの年収と控除情報から所得税・住民税・手取りを計算します。控除を追加した場合のシミュレーションにも使えます。',
    input_schema: {
      type: 'object' as const,
      properties: {
        annual_salary: {
          type: 'number',
          description: '年間給与収入',
        },
        deductions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['spouse', 'dependent_general', 'ideco', 'life_insurance', 'medical', 'furusato', 'housing_loan'] },
              amount: { type: 'number' },
            },
            required: ['type', 'amount'],
          },
          description: '適用する控除のリスト',
        },
      },
      required: ['annual_salary'],
    },
  },
  {
    name: 'calculate_furusato_limit',
    description: 'ふるさと納税の控除上限額を計算します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        annual_salary: { type: 'number', description: '年間給与収入' },
        is_married: { type: 'boolean', description: '既婚かどうか' },
        dependents: { type: 'number', description: '扶養人数' },
      },
      required: ['annual_salary'],
    },
  },
  {
    name: 'simulate_investment',
    description: '積立投資のシミュレーション。月額積立額・期間・利回りから将来の評価額を計算します。',
    input_schema: {
      type: 'object' as const,
      properties: {
        monthly_amount: { type: 'number', description: '月額積立額' },
        years: { type: 'number', description: '積立期間（年）' },
        annual_return_rate: { type: 'number', description: '想定年利回り（例: 0.05 = 5%）' },
      },
      required: ['monthly_amount', 'years', 'annual_return_rate'],
    },
  },
  {
    name: 'get_user_summary',
    description: 'ユーザーの家計サマリー（月収、月支出、貯蓄率、家計スコア、純資産）を取得します。',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'audit_subscriptions',
    description: 'ユーザーのサブスクリプションと固定費を監査し、削減可能な項目を特定します。',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'generate_switch_guide',
    description: 'サービスの契約切替ガイドを生成します。切替手順・節約額・注意事項を含みます。',
    input_schema: {
      type: 'object' as const,
      properties: {
        from_service: { type: 'string', description: '現在のサービス名' },
        to_service: { type: 'string', description: '切替先のサービス名' },
        current_monthly_cost: { type: 'number', description: '現在の月額' },
        new_monthly_cost: { type: 'number', description: '切替先の月額' },
      },
      required: ['from_service', 'to_service', 'current_monthly_cost', 'new_monthly_cost'],
    },
  },
];

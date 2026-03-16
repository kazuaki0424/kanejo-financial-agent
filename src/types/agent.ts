/**
 * エージェントシステムの型定義
 */

export const TASK_STATUSES = ['proposed', 'approved', 'executing', 'completed', 'failed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_TYPES = ['service_switch', 'subscription_audit', 'tax_optimization', 'insurance_review', 'custom'] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export interface AgentTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description: string;
  estimatedSaving: number;
  steps: TaskStep[];
  createdAt: string;
  completedAt?: string;
}

export interface TaskStep {
  order: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface AgentMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  timestamp: string;
  task?: AgentTask;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  service_switch: 'サービス切替',
  subscription_audit: 'サブスク監査',
  tax_optimization: '節税最適化',
  insurance_review: '保険見直し',
  custom: 'カスタム',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  proposed: '提案中',
  approved: '承認済み',
  executing: '実行中',
  completed: '完了',
  failed: '失敗',
  cancelled: 'キャンセル',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  proposed: 'text-primary',
  approved: 'text-info',
  executing: 'text-warning',
  completed: 'text-positive',
  failed: 'text-negative',
  cancelled: 'text-ink-subtle',
};

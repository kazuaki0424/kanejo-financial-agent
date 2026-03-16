'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/shared/currency-input';
import { LIFE_EVENT_TEMPLATES, type LifeEventTemplate } from '@/lib/constants/life-events';
import type { LifeEvent } from '@/lib/utils/cashflow-engine';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface TimelineEditorProps {
  currentAge: number;
  events: LifeEvent[];
  onEventsChange: (events: LifeEvent[]) => void;
}

export function TimelineEditor({ currentAge, events, onEventsChange }: TimelineEditorProps): React.ReactElement {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const addEvent = useCallback((template: LifeEventTemplate): void => {
    const newEvent: LifeEvent = {
      age: currentAge + 5,
      type: template.type,
      name: template.label,
      oneTimeCost: template.defaultOneTimeCost,
      annualCostChange: template.defaultAnnualCostChange,
      annualIncomeChange: template.defaultAnnualIncomeChange,
    };
    onEventsChange([...events, newEvent].sort((a, b) => a.age - b.age));
    setShowAddPanel(false);
    setEditingId(events.length);
  }, [currentAge, events, onEventsChange]);

  const updateEvent = useCallback((index: number, updates: Partial<LifeEvent>): void => {
    const updated = events.map((e, i) => i === index ? { ...e, ...updates } : e);
    onEventsChange(updated.sort((a, b) => a.age - b.age));
  }, [events, onEventsChange]);

  const removeEvent = useCallback((index: number): void => {
    onEventsChange(events.filter((_, i) => i !== index));
    setEditingId(null);
  }, [events, onEventsChange]);

  const maxAge = Math.max(currentAge + 30, ...events.map((e) => e.age));
  const timelineRange = maxAge - currentAge;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-medium text-foreground">ライフイベント</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddPanel(!showAddPanel)}
        >
          {showAddPanel ? '閉じる' : 'イベントを追加'}
        </Button>
      </div>

      {/* Add event panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {LIFE_EVENT_TEMPLATES.map((template) => (
                <button
                  key={template.type + template.label}
                  type="button"
                  onClick={() => addEvent(template)}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <EventIcon type={template.type} color={template.color} size={20} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-foreground">{template.label}</span>
                    <p className="mt-0.5 text-[10px] text-ink-subtle">{template.description}</p>
                    {template.costBreakdown.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {template.costBreakdown.slice(0, 3).map((item) => (
                          <div key={item.label} className="flex justify-between text-[10px]">
                            <span className="text-ink-subtle truncate">{item.label}</span>
                            <span className="tabular-nums text-ink-muted ml-2 shrink-0">¥{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        {template.costBreakdown.length > 3 && (
                          <p className="text-[10px] text-ink-subtle">他{template.costBreakdown.length - 3}項目</p>
                        )}
                      </div>
                    )}
                    {template.defaultOneTimeCost > 0 && (
                      <p className="mt-1 text-[10px] font-medium tabular-nums text-negative">
                        合計 ~¥{formatCurrency(template.defaultOneTimeCost)}
                      </p>
                    )}
                    {template.defaultAnnualCostChange !== 0 && (
                      <p className="text-[10px] tabular-nums text-ink-muted">
                        年間 {template.defaultAnnualCostChange > 0 ? '+' : ''}¥{formatCurrency(template.defaultAnnualCostChange)}/年
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual timeline */}
      {events.length > 0 && (
        <div className="mb-4">
          <div className="relative h-16">
            {/* Timeline track */}
            <div className="absolute top-6 left-0 h-0.5 w-full bg-border" />

            {/* Age labels */}
            <div className="absolute top-9 left-0 text-[10px] text-ink-subtle">{currentAge}歳</div>
            <div className="absolute top-9 right-0 text-[10px] text-ink-subtle">{maxAge}歳</div>

            {/* Event markers */}
            {events.map((event, index) => {
              const position = timelineRange > 0
                ? ((event.age - currentAge) / timelineRange) * 100
                : 50;
              const template = LIFE_EVENT_TEMPLATES.find((t) => t.type === event.type);
              const color = template?.color ?? 'var(--color-ink-subtle)';

              return (
                <motion.button
                  key={`${event.type}-${event.age}-${index}`}
                  type="button"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 -translate-x-1/2"
                  style={{ left: `${Math.min(95, Math.max(5, position))}%` }}
                  onClick={() => setEditingId(editingId === index ? null : index)}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-surface transition-shadow',
                      editingId === index ? 'shadow-md' : '',
                    )}
                    style={{ borderColor: color }}
                  >
                    <EventIcon type={event.type} color={color} size={14} />
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink-muted">
                    {event.age}歳
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 && (
        <p className="py-4 text-center text-sm text-ink-subtle">
          イベントを追加して将来のキャッシュフローをシミュレートしましょう
        </p>
      )}

      <div className="space-y-2">
        {events.map((event, index) => {
          const template = LIFE_EVENT_TEMPLATES.find((t) => t.type === event.type);
          const color = template?.color ?? 'var(--color-ink-subtle)';
          const isEditing = editingId === index;

          return (
            <div key={`${event.type}-${event.age}-${index}`}>
              <button
                type="button"
                onClick={() => setEditingId(isEditing ? null : index)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors',
                  'hover:bg-[var(--color-surface-hover)]',
                  isEditing && 'bg-[var(--color-surface-hover)]',
                )}
              >
                <EventIcon type={event.type} color={color} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{event.name}</span>
                  <span className="ml-2 text-xs text-ink-subtle">{event.age}歳</span>
                </div>
                {event.oneTimeCost > 0 && (
                  <span className="text-xs tabular-nums text-negative">
                    -¥{formatCurrency(event.oneTimeCost)}
                  </span>
                )}
              </button>

              {/* Edit form */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <EventEditForm
                      event={event}
                      currentAge={currentAge}
                      onChange={(updates) => updateEvent(index, updates)}
                      onRemove={() => removeEvent(index)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EventEditForm({
  event,
  currentAge,
  onChange,
  onRemove,
}: {
  event: LifeEvent;
  currentAge: number;
  onChange: (updates: Partial<LifeEvent>) => void;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <div className="mx-3 mb-2 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="イベント名"
          value={event.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Input
          label="年齢"
          type="number"
          min={currentAge}
          max={100}
          value={event.age}
          onChange={(e) => onChange({ age: Number(e.target.value) })}
        />
        <CurrencyInput
          label="一時的な支出"
          name={`event-cost-${event.age}`}
          defaultValue={event.oneTimeCost}
          onChange={(v) => onChange({ oneTimeCost: v })}
        />
        <CurrencyInput
          label="年間支出の増減"
          name={`event-annual-${event.age}`}
          defaultValue={event.annualCostChange}
          onChange={(v) => onChange({ annualCostChange: v })}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="danger" size="sm" onClick={onRemove}>
          削除
        </Button>
      </div>
    </div>
  );
}

function EventIcon({ type, color, size = 16 }: { type: string; color: string; size?: number }): React.ReactElement {
  const style = { color };
  const props = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', style, 'aria-hidden': true as const };

  switch (type) {
    case 'marriage':
      return (
        <svg {...props}>
          <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 9L6 14L8 12L10 14L8 9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case 'childbirth':
      return (
        <svg {...props}>
          <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 14C4 11.8 5.8 10 8 10C10.2 10 12 11.8 12 14" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'housing_purchase':
    case 'housing_rent':
      return (
        <svg {...props}>
          <path d="M3 8L8 3L13 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 7V13H11V7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 13V10H9V13" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'car_purchase':
      return (
        <svg {...props}>
          <path d="M3 10L4 7H12L13 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="2" y="10" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="5" cy="13" r="1" fill="currentColor" />
          <circle cx="11" cy="13" r="1" fill="currentColor" />
        </svg>
      );
    case 'education':
      return (
        <svg {...props}>
          <path d="M2 7L8 4L14 7L8 10L2 7Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M11 8.5V12L8 13.5L5 12V8.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'retirement':
      return (
        <svg {...props}>
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3 14H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M5 14L7 10M11 14L9 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 5.5V10.5M5.5 8H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
}

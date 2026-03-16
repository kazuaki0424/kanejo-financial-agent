'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from '@/lib/constants/life-events';
import type { LifeEvent } from '@/lib/utils/cashflow-engine';

interface ScenarioTemplatePickerProps {
  currentAge: number;
  onSelect: (name: string, events: LifeEvent[]) => void;
}

export function ScenarioTemplatePicker({ currentAge, onSelect }: ScenarioTemplatePickerProps): React.ReactElement {
  return (
    <Card>
      <p className="mb-3 text-[13px] font-medium text-foreground">テンプレートから始める</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIO_TEMPLATES.map((template, index) => (
          <TemplateCard
            key={template.id}
            template={template}
            currentAge={currentAge}
            onSelect={onSelect}
            index={index}
          />
        ))}
      </div>
    </Card>
  );
}

function TemplateCard({
  template,
  currentAge,
  onSelect,
  index,
}: {
  template: ScenarioTemplate;
  currentAge: number;
  onSelect: (name: string, events: LifeEvent[]) => void;
  index: number;
}): React.ReactElement {
  const events = template.buildEvents(currentAge);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      onClick={() => onSelect(template.name, events)}
      className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)] hover:border-border-strong"
    >
      <span className="text-sm font-medium text-foreground">{template.name}</span>
      <span className="text-xs leading-relaxed text-ink-muted">{template.description}</span>
      <div className="flex flex-wrap gap-1">
        {template.tags.map((tag) => (
          <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
        ))}
        {events.length > 0 && (
          <Badge variant="primary" className="text-[10px]">{events.length}イベント</Badge>
        )}
      </div>
    </motion.button>
  );
}

'use client';

import { ThemeToggle } from '@/components/shared/theme-toggle';

const COLOR_GROUPS = [
  {
    title: 'ベースカラー',
    colors: [
      { name: '--color-ink', label: 'Ink' },
      { name: '--color-ink-muted', label: 'Ink Muted' },
      { name: '--color-ink-subtle', label: 'Ink Subtle' },
      { name: '--color-surface', label: 'Surface' },
      { name: '--color-surface-alt', label: 'Surface Alt' },
      { name: '--color-surface-hover', label: 'Surface Hover' },
      { name: '--color-border', label: 'Border' },
      { name: '--color-border-strong', label: 'Border Strong' },
    ],
  },
  {
    title: 'アクセント',
    colors: [
      { name: '--color-primary', label: 'Primary' },
      { name: '--color-primary-light', label: 'Primary Light' },
      { name: '--color-primary-hover', label: 'Primary Hover' },
    ],
  },
  {
    title: 'セマンティック',
    colors: [
      { name: '--color-positive', label: 'Positive' },
      { name: '--color-positive-bg', label: 'Positive BG' },
      { name: '--color-negative', label: 'Negative' },
      { name: '--color-negative-bg', label: 'Negative BG' },
      { name: '--color-warning', label: 'Warning' },
      { name: '--color-warning-bg', label: 'Warning BG' },
      { name: '--color-info', label: 'Info' },
      { name: '--color-info-bg', label: 'Info BG' },
    ],
  },
  {
    title: 'チャート',
    colors: [
      { name: '--chart-1', label: 'Chart 1' },
      { name: '--chart-2', label: 'Chart 2' },
      { name: '--chart-3', label: 'Chart 3' },
      { name: '--chart-4', label: 'Chart 4' },
      { name: '--chart-5', label: 'Chart 5' },
      { name: '--chart-6', label: 'Chart 6' },
    ],
  },
] as const;

const SAMPLE_AMOUNT = '¥2,450,000';

export function DesignShowcase(): React.ReactElement {
  return (
    <div className="mx-auto max-w-5xl px-[var(--space-page)] py-12">
      {/* ヘッダー */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-foreground">Kanejo</h1>
          <p className="mt-1 text-ink-muted">デザインシステム — トークン一覧</p>
        </div>
        <ThemeToggle />
      </div>

      {/* タイポグラフィ */}
      <Section title="タイポグラフィ">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-ink-subtle">Instrument Serif — 見出し・大きな数値</p>
            <p className="font-display text-5xl text-foreground">{SAMPLE_AMOUNT}</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-ink-subtle">Instrument Serif Italic</p>
            <p className="font-display text-3xl italic text-foreground">年間節税額</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-ink-subtle">Noto Sans JP — 本文</p>
            <div className="space-y-1">
              <p className="text-base font-light text-foreground">Light 300 — すべての人に、自分だけのCFOを。</p>
              <p className="text-base font-normal text-foreground">Regular 400 — すべての人に、自分だけのCFOを。</p>
              <p className="text-base font-medium text-foreground">Medium 500 — すべての人に、自分だけのCFOを。</p>
              <p className="text-base font-bold text-foreground">Bold 700 — すべての人に、自分だけのCFOを。</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-ink-subtle">Tabular Nums — 桁揃え</p>
            <div className="tabular-nums space-y-0.5 font-display text-2xl text-foreground">
              <p>¥1,234,567</p>
              <p>¥   98,000</p>
              <p>¥  450,200</p>
            </div>
          </div>
        </div>
      </Section>

      {/* カラーパレット */}
      {COLOR_GROUPS.map((group) => (
        <Section key={group.title} title={`カラー — ${group.title}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {group.colors.map((color) => (
              <div key={color.name} className="overflow-hidden rounded-[var(--radius-md)] border border-border">
                <div
                  className="h-16"
                  style={{ backgroundColor: `var(${color.name})` }}
                />
                <div className="bg-surface px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{color.label}</p>
                  <p className="font-mono text-xs text-ink-subtle">{color.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}

      {/* スペーシング・ラディウス */}
      <Section title="ボーダーラディウス">
        <div className="flex flex-wrap items-end gap-6">
          {[
            { name: 'sm', size: 'var(--radius-sm)' },
            { name: 'md', size: 'var(--radius-md)' },
            { name: 'lg', size: 'var(--radius-lg)' },
            { name: 'full', size: 'var(--radius-full)' },
          ].map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-16 border border-border bg-primary-light"
                style={{ borderRadius: r.size }}
              />
              <p className="text-xs text-ink-muted">{r.name}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* シャドウ */}
      <Section title="シャドウ">
        <div className="flex flex-wrap gap-8">
          {['sm', 'md', 'lg'].map((s) => (
            <div
              key={s}
              className="flex h-24 w-32 items-center justify-center rounded-[var(--radius-lg)] bg-surface"
              style={{ boxShadow: `var(--shadow-${s})` }}
            >
              <p className="text-sm text-ink-muted">{s}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AIインサイトサンプル */}
      <Section title="AIインサイト表示例">
        <div className="rounded-[var(--radius-md)] border-l-[3px] border-l-primary bg-primary-light px-5 py-4">
          <p className="text-sm leading-relaxed text-foreground">
            現在の貯蓄率から試算すると、ふるさと納税の控除上限額まで約3万円の余裕があるかもしれません。
            年末までに寄付を検討する余地があります。
          </p>
        </div>
      </Section>

      {/* メトリクスカード例 */}
      <Section title="メトリクスカード例">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="月収" value="¥580,000" change={2.3} />
          <MetricCard label="月支出" value="¥342,000" change={-5.1} />
          <MetricCard label="貯蓄率" value="41%" change={3.2} />
          <MetricCard label="家計スコア" value="78" change={0} suffix="/100" />
        </div>
      </Section>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps): React.ReactElement {
  return (
    <section className="mb-12">
      <h2 className="mb-6 border-b border-border pb-3 text-lg font-medium text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  suffix?: string;
}

function MetricCard({ label, value, change, suffix }: MetricCardProps): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-5">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-[32px] leading-tight text-foreground tabular-nums">
        {value}
        {suffix && <span className="text-lg text-ink-muted">{suffix}</span>}
      </p>
      {change !== 0 && (
        <p
          className={`mt-2 text-sm font-medium ${
            change > 0 ? 'text-positive' : 'text-negative'
          }`}
        >
          {change > 0 ? '+' : ''}
          {change}%
        </p>
      )}
    </div>
  );
}

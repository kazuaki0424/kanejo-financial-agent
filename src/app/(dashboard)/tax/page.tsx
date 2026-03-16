import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchTaxSummary } from './_actions/tax';
import { TaxSavingsDashboard } from './_components/tax-savings-dashboard';
import { FilingGuide } from './_components/filing-guide';
import { TaxAdvisor } from './_components/tax-advisor';
import { YearEndWizard } from './_components/year-end-wizard';
import { calculateTaxSavings } from '@/lib/utils/tax-savings';
import { formatCurrency } from '@/lib/utils/format';
import type { FilingProfile } from '@/lib/utils/tax-filing';

export const metadata: Metadata = {
  title: '節税・補助金 — Kanejo',
};

export default async function TaxPage() {
  const data = await fetchTaxSummary();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">節税・補助金</h1>
        <Card>
          <p className="text-sm text-ink-muted">プロファイルが見つかりません。</p>
        </Card>
      </div>
    );
  }

  // Build filing profile from user data
  const filingProfile: FilingProfile = {
    annualSalary: data.annualSalary,
    occupation: 'employee',
    hasSideIncome: false,
    sideIncomeAmount: 0,
    hasMultipleEmployers: false,
    hasMedicalExpenses: false,
    medicalExpenseAmount: 0,
    hasHousingLoan: false,
    housingLoanFirstYear: false,
    hasFurusato: false,
    furusatoCount: 0,
    hasStockIncome: false,
    hasRentalIncome: false,
    leftJobMidYear: false,
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">節税・補助金</h1>

      {/* 税金サマリー */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-[11px] text-ink-muted">所得税</p>
          <p className="mt-1 font-display text-xl tabular-nums text-foreground">
            ¥{formatCurrency(data.taxResult.incomeTax)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">住民税</p>
          <p className="mt-1 font-display text-xl tabular-nums text-foreground">
            ¥{formatCurrency(data.taxResult.residentTax)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">実効税率</p>
          <p className="mt-1 font-display text-xl tabular-nums text-foreground">
            {(data.taxResult.effectiveRate * 100).toFixed(1)}%
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">手取り（概算）</p>
          <p className="mt-1 font-display text-xl tabular-nums text-positive">
            ¥{formatCurrency(data.taxResult.takeHome)}
          </p>
        </Card>
      </div>

      {/* 節税メニュー */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TaxMenuCard
          href="/tax/furusato"
          title="ふるさと納税"
          description="控除上限額の計算と返礼品シミュレーション"
          badge={`上限 ¥${formatCurrency(data.furusatoLimit)}`}
          badgeVariant="primary"
        />
        <TaxMenuCard
          href="/tax/ideco-nisa"
          title="iDeCo / NISA"
          description="非課税投資枠の最適活用シミュレーション"
          badge="節税"
          badgeVariant="primary"
        />
        <TaxMenuCard
          href="/tax/subsidies"
          title="補助金・給付金"
          description="あなたの条件に合う補助金をマッチング"
          badge="マッチング"
          badgeVariant="primary"
        />
      </div>

      {/* 節税サマリー */}
      <TaxSavingsDashboard summary={calculateTaxSavings({
        annualSalary: data.annualSalary,
        occupation: data.occupation,
        maritalStatus: data.maritalStatus,
        dependents: data.dependents,
        age: data.age,
        currentDeductions: [],
      })} />

      {/* 年末調整ウィザード */}
      <YearEndWizard
        annualSalary={data.annualSalary}
        maritalStatus={data.maritalStatus}
        dependents={data.dependents}
      />

      {/* AI税務アドバイザー */}
      <TaxAdvisor />

      {/* 確定申告ガイド */}
      <FilingGuide initialProfile={filingProfile} />
    </div>
  );
}

function TaxMenuCard({
  href,
  title,
  description,
  badge,
  badgeVariant,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
  badgeVariant: 'primary' | 'default';
}): React.ReactElement {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-[var(--color-surface-hover)]">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
      </Card>
    </Link>
  );
}

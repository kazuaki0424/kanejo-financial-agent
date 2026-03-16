/**
 * キャッシュフロー予測エンジン
 *
 * 年次ベースで最大50年分の資産推移をシミュレートする。
 * ライフイベント（結婚・住宅購入・退職等）による一時的な収支変動にも対応。
 */

// ============================================================
// Types
// ============================================================

export interface SimulationParams {
  /** 現在の年齢 */
  currentAge: number;
  /** シミュレーション年数（デフォルト30） */
  years: number;
  /** 年間手取り収入 */
  annualIncome: number;
  /** 年間支出 */
  annualExpenses: number;
  /** 現在の総資産 */
  totalAssets: number;
  /** 現在の総負債 */
  totalLiabilities: number;
  /** 年間ローン返済額 */
  annualLoanPayment: number;
  /** 昇給率（年率、0.02 = 2%） */
  salaryGrowthRate: number;
  /** インフレ率（年率、0.01 = 1%） */
  inflationRate: number;
  /** 投資利回り（年率、0.03 = 3%） */
  investmentReturnRate: number;
  /** 退職年齢 */
  retirementAge: number;
  /** 退職金（一時金） */
  retirementBonus: number;
  /** 年金受給額（年額） */
  pensionAmount: number;
  /** 年金受給開始年齢 */
  pensionStartAge: number;
  /** ライフイベント */
  lifeEvents: LifeEvent[];
}

export interface LifeEvent {
  /** イベント発生年齢 */
  age: number;
  /** イベント種別 */
  type: LifeEventType;
  /** イベント名 */
  name: string;
  /** 一時的な支出（プラス値） */
  oneTimeCost: number;
  /** 年間支出の増減（プラス=支出増、マイナス=支出減） */
  annualCostChange: number;
  /** 年間収入の増減 */
  annualIncomeChange: number;
}

export const LIFE_EVENT_TYPES = [
  'marriage',
  'childbirth',
  'housing_purchase',
  'housing_rent',
  'car_purchase',
  'education',
  'retirement',
  'custom',
] as const;

export type LifeEventType = (typeof LIFE_EVENT_TYPES)[number];

export interface YearlyProjection {
  year: number;
  age: number;
  /** 年間収入（税引後） */
  income: number;
  /** 年間支出 */
  expenses: number;
  /** 年間貯蓄（income - expenses） */
  savings: number;
  /** 年末の総資産 */
  totalAssets: number;
  /** 年末の残負債 */
  totalLiabilities: number;
  /** 純資産（assets - liabilities） */
  netWorth: number;
  /** その年に発生したイベント */
  events: string[];
  /** 投資リターン */
  investmentReturn: number;
}

export interface SimulationResult {
  projections: YearlyProjection[];
  summary: {
    /** 退職時の純資産 */
    netWorthAtRetirement: number;
    /** シミュレーション終了時の純資産 */
    finalNetWorth: number;
    /** 資産がマイナスになる年齢（ならなければ null） */
    bankruptcyAge: number | null;
    /** 生涯貯蓄総額 */
    totalSavings: number;
    /** 生涯投資リターン総額 */
    totalInvestmentReturns: number;
  };
}

// ============================================================
// Default parameters
// ============================================================

export const DEFAULT_PARAMS: Omit<SimulationParams, 'currentAge' | 'annualIncome' | 'annualExpenses' | 'totalAssets' | 'totalLiabilities'> = {
  years: 30,
  annualLoanPayment: 0,
  salaryGrowthRate: 0.02,
  inflationRate: 0.01,
  investmentReturnRate: 0.03,
  retirementAge: 65,
  retirementBonus: 0,
  pensionAmount: 2_000_000,
  pensionStartAge: 65,
  lifeEvents: [],
};

// ============================================================
// Engine
// ============================================================

export function runSimulation(params: SimulationParams): SimulationResult {
  const projections: YearlyProjection[] = [];
  const currentYear = new Date().getFullYear();

  let assets = params.totalAssets;
  let liabilities = params.totalLiabilities;
  let annualIncome = params.annualIncome;
  let annualExpenses = params.annualExpenses;
  let totalSavings = 0;
  let totalInvestmentReturns = 0;
  let bankruptcyAge: number | null = null;
  let netWorthAtRetirement = 0;

  // Track cumulative annual cost/income changes from events
  let cumulativeExpenseChange = 0;
  let cumulativeIncomeChange = 0;

  for (let i = 0; i < params.years; i++) {
    const year = currentYear + i;
    const age = params.currentAge + i;
    const events: string[] = [];

    // Apply salary growth (pre-retirement)
    if (i > 0 && age < params.retirementAge) {
      annualIncome *= (1 + params.salaryGrowthRate);
    }

    // Apply inflation to expenses
    if (i > 0) {
      annualExpenses *= (1 + params.inflationRate);
    }

    // Calculate this year's income
    let yearIncome = age < params.retirementAge
      ? annualIncome + cumulativeIncomeChange
      : 0;

    // Retirement event
    if (age === params.retirementAge) {
      events.push('退職');
      assets += params.retirementBonus;
    }

    // Pension income
    if (age >= params.pensionStartAge) {
      yearIncome += params.pensionAmount;
    }

    // Process life events for this age
    const yearEvents = params.lifeEvents.filter((e) => e.age === age);
    let oneTimeCosts = 0;

    for (const event of yearEvents) {
      events.push(event.name);
      oneTimeCosts += event.oneTimeCost;
      cumulativeExpenseChange += event.annualCostChange;
      cumulativeIncomeChange += event.annualIncomeChange;
    }

    // Calculate expenses
    const yearExpenses = Math.max(0, annualExpenses + cumulativeExpenseChange) + oneTimeCosts;

    // Loan payment
    if (liabilities > 0 && params.annualLoanPayment > 0) {
      const payment = Math.min(params.annualLoanPayment, liabilities);
      liabilities -= payment;
    }

    // Savings
    const savings = yearIncome - yearExpenses - Math.min(params.annualLoanPayment, liabilities > 0 ? params.annualLoanPayment : 0);
    totalSavings += savings;

    // Investment returns on assets (only on positive balance)
    const investmentReturn = assets > 0
      ? Math.round(assets * params.investmentReturnRate)
      : 0;
    totalInvestmentReturns += investmentReturn;

    // Update assets
    assets = assets + savings + investmentReturn;

    // Track bankruptcy
    const netWorth = assets - liabilities;
    if (netWorth < 0 && bankruptcyAge === null) {
      bankruptcyAge = age;
    }

    // Track retirement net worth
    if (age === params.retirementAge) {
      netWorthAtRetirement = netWorth;
    }

    projections.push({
      year,
      age,
      income: Math.round(yearIncome),
      expenses: Math.round(yearExpenses),
      savings: Math.round(savings),
      totalAssets: Math.round(assets),
      totalLiabilities: Math.round(Math.max(0, liabilities)),
      netWorth: Math.round(netWorth),
      events,
      investmentReturn: Math.round(investmentReturn),
    });
  }

  const finalProjection = projections[projections.length - 1];

  return {
    projections,
    summary: {
      netWorthAtRetirement: Math.round(netWorthAtRetirement),
      finalNetWorth: finalProjection ? Math.round(finalProjection.netWorth) : 0,
      bankruptcyAge,
      totalSavings: Math.round(totalSavings),
      totalInvestmentReturns: Math.round(totalInvestmentReturns),
    },
  };
}

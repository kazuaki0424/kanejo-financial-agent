import { describe, it, expect } from 'vitest';
import { generateAlerts, type AlertContext } from '@/lib/utils/alert-engine';

function makeCtx(overrides: Partial<AlertContext> = {}): AlertContext {
  return {
    monthlyIncome: 500_000,
    monthlyExpenses: 350_000,
    savingsRate: 30,
    householdScore: 72,
    netWorth: 5_000_000,
    expenses: [
      { category: 'housing', label: '家賃', amount: 100_000, isFixed: true },
      { category: 'food', label: '食費', amount: 50_000, isFixed: false },
    ],
    furusatoLimit: 60_000,
    age: 35,
    hasFurusato: false,
    hasIdeco: false,
    ...overrides,
  };
}

describe('generateAlerts', () => {
  it('returns alerts sorted by priority', () => {
    const alerts = generateAlerts(makeCtx({ monthlyExpenses: 600_000, householdScore: 30 }));
    const priorities = alerts.map((a) => a.priority);
    const order = { urgent: 0, warning: 1, info: 2 };
    for (let i = 1; i < priorities.length; i++) {
      expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
    }
  });

  describe('spending anomalies', () => {
    it('alerts when expenses exceed income', () => {
      const alerts = generateAlerts(makeCtx({ monthlyExpenses: 600_000 }));
      expect(alerts.some((a) => a.id === 'spending-over-income')).toBe(true);
      expect(alerts.find((a) => a.id === 'spending-over-income')?.priority).toBe('urgent');
    });

    it('no alert when expenses < income', () => {
      const alerts = generateAlerts(makeCtx());
      expect(alerts.some((a) => a.id === 'spending-over-income')).toBe(false);
    });

    it('alerts on low savings rate', () => {
      const alerts = generateAlerts(makeCtx({ savingsRate: 5 }));
      expect(alerts.some((a) => a.id === 'low-savings-rate')).toBe(true);
    });

    it('no alert on good savings rate', () => {
      const alerts = generateAlerts(makeCtx({ savingsRate: 25 }));
      expect(alerts.some((a) => a.id === 'low-savings-rate')).toBe(false);
    });

    it('alerts on high housing ratio', () => {
      const alerts = generateAlerts(makeCtx({
        expenses: [{ category: 'housing', label: '家賃', amount: 200_000, isFixed: true }],
      }));
      expect(alerts.some((a) => a.id === 'high-housing')).toBe(true);
    });

    it('alerts on negative net worth', () => {
      const alerts = generateAlerts(makeCtx({ netWorth: -2_000_000 }));
      expect(alerts.some((a) => a.id === 'negative-networth')).toBe(true);
      expect(alerts.find((a) => a.id === 'negative-networth')?.priority).toBe('urgent');
    });
  });

  describe('score alerts', () => {
    it('alerts on low household score', () => {
      const alerts = generateAlerts(makeCtx({ householdScore: 30 }));
      expect(alerts.some((a) => a.id === 'low-score')).toBe(true);
    });

    it('no alert on good score', () => {
      const alerts = generateAlerts(makeCtx({ householdScore: 75 }));
      expect(alerts.some((a) => a.id === 'low-score')).toBe(false);
    });
  });

  describe('savings opportunities', () => {
    it('suggests iDeCo when not enrolled', () => {
      const alerts = generateAlerts(makeCtx({ hasIdeco: false, age: 40 }));
      expect(alerts.some((a) => a.id === 'ideco-opportunity')).toBe(true);
    });

    it('no iDeCo alert when enrolled', () => {
      const alerts = generateAlerts(makeCtx({ hasIdeco: true }));
      expect(alerts.some((a) => a.id === 'ideco-opportunity')).toBe(false);
    });

    it('no iDeCo alert for age 60+', () => {
      const alerts = generateAlerts(makeCtx({ hasIdeco: false, age: 62 }));
      expect(alerts.some((a) => a.id === 'ideco-opportunity')).toBe(false);
    });
  });

  describe('alert structure', () => {
    it('all alerts have required fields', () => {
      const alerts = generateAlerts(makeCtx({ monthlyExpenses: 600_000, householdScore: 30 }));
      for (const alert of alerts) {
        expect(alert.id).toBeTruthy();
        expect(alert.type).toBeTruthy();
        expect(alert.priority).toBeTruthy();
        expect(alert.title).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.createdAt).toBeTruthy();
        expect(typeof alert.read).toBe('boolean');
      }
    });

    it('healthy user gets no spending/score urgents', () => {
      const alerts = generateAlerts(makeCtx({
        savingsRate: 30,
        householdScore: 80,
        hasIdeco: true,
        hasFurusato: true,
      }));
      // Only check non-seasonal urgent alerts
      const spendingUrgent = alerts.filter((a) => a.priority === 'urgent' && a.type === 'spending_anomaly');
      expect(spendingUrgent.length).toBe(0);
    });
  });
});

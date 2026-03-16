import { describe, it, expect } from 'vitest';
import {
  calculateSalaryDeduction,
  calculateIncomeTax,
  calculateResidentTax,
  calculateTax,
  calculateFurusatoLimit,
  type TaxInput,
  type Deduction,
} from '@/lib/utils/calculations';

describe('calculateSalaryDeduction (給与所得控除)', () => {
  it('returns 0 for zero salary', () => {
    expect(calculateSalaryDeduction(0)).toBe(0);
  });

  it('returns minimum 550,000 for low salary', () => {
    expect(calculateSalaryDeduction(1_000_000)).toBe(550_000);
  });

  it('returns correct deduction for 3M salary', () => {
    // 3,000,000 × 30% + 80,000 = 980,000
    expect(calculateSalaryDeduction(3_000_000)).toBe(980_000);
  });

  it('returns correct deduction for 5M salary', () => {
    // 5,000,000 × 20% + 440,000 = 1,440,000
    expect(calculateSalaryDeduction(5_000_000)).toBe(1_440_000);
  });

  it('returns correct deduction for 8M salary', () => {
    // 8,000,000 × 10% + 1,100,000 = 1,900,000
    expect(calculateSalaryDeduction(8_000_000)).toBe(1_900_000);
  });

  it('caps at 1,950,000 for salary over 8.5M', () => {
    expect(calculateSalaryDeduction(10_000_000)).toBe(1_950_000);
    expect(calculateSalaryDeduction(20_000_000)).toBe(1_950_000);
  });
});

describe('calculateIncomeTax (所得税)', () => {
  it('returns 0 for zero taxable income', () => {
    expect(calculateIncomeTax(0)).toBe(0);
  });

  it('returns 0 for negative taxable income', () => {
    expect(calculateIncomeTax(-100_000)).toBe(0);
  });

  it('calculates 5% bracket correctly', () => {
    // 1,000,000 × 5% = 50,000 + reconstruction tax
    const tax = calculateIncomeTax(1_000_000);
    expect(tax).toBe(Math.floor(50_000 * 1.021));
  });

  it('calculates 10% bracket correctly', () => {
    // 3,000,000 × 10% - 97,500 = 202,500 + reconstruction tax
    const tax = calculateIncomeTax(3_000_000);
    expect(tax).toBe(Math.floor(202_500 * 1.021));
  });

  it('calculates 20% bracket correctly', () => {
    // 5,000,000 × 20% - 427,500 = 572,500 + reconstruction tax
    const tax = calculateIncomeTax(5_000_000);
    expect(tax).toBe(Math.floor(572_500 * 1.021));
  });

  it('includes reconstruction tax (2.1%)', () => {
    const taxWithout = 1_000_000 * 0.05;
    const taxWith = calculateIncomeTax(1_000_000);
    expect(taxWith).toBeGreaterThan(taxWithout);
    expect(taxWith).toBeLessThan(taxWithout * 1.03); // Should be ~2.1% more
  });

  it('is progressive (higher income = higher rate)', () => {
    const tax3m = calculateIncomeTax(3_000_000);
    const tax5m = calculateIncomeTax(5_000_000);
    const tax10m = calculateIncomeTax(10_000_000);

    expect(tax5m / 5_000_000).toBeGreaterThan(tax3m / 3_000_000);
    expect(tax10m / 10_000_000).toBeGreaterThan(tax5m / 5_000_000);
  });
});

describe('calculateResidentTax (住民税)', () => {
  it('returns flat amount for zero income', () => {
    expect(calculateResidentTax(0)).toBe(5_000);
  });

  it('calculates 10% rate + flat amount', () => {
    const tax = calculateResidentTax(3_000_000);
    expect(tax).toBe(300_000 + 5_000);
  });

  it('flat rate (no progressive brackets)', () => {
    const rate1 = (calculateResidentTax(3_000_000) - 5_000) / 3_000_000;
    const rate2 = (calculateResidentTax(10_000_000) - 5_000) / 10_000_000;
    expect(rate1).toBeCloseTo(rate2, 2);
  });
});

describe('calculateTax (総合計算)', () => {
  function makeTaxInput(salary: number, deductions: Deduction[] = []): TaxInput {
    return { annualSalary: salary, deductions };
  }

  describe('年収300万 (basic tier)', () => {
    it('calculates reasonable tax for 3M salary', () => {
      const result = calculateTax(makeTaxInput(3_000_000));
      expect(result.salaryDeduction).toBe(980_000);
      expect(result.salaryIncome).toBe(2_020_000);
      expect(result.totalTax).toBeGreaterThan(0);
      expect(result.takeHome).toBeGreaterThan(2_000_000);
      expect(result.takeHome).toBeLessThan(3_000_000);
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(0.15);
    });
  });

  describe('年収500万 (middle low)', () => {
    it('calculates reasonable tax for 5M salary', () => {
      const result = calculateTax(makeTaxInput(5_000_000));
      expect(result.totalTax).toBeGreaterThan(200_000);
      expect(result.takeHome).toBeGreaterThan(3_500_000);
      expect(result.effectiveRate).toBeLessThan(0.15);
    });
  });

  describe('年収800万 (middle)', () => {
    it('calculates reasonable tax for 8M salary', () => {
      const result = calculateTax(makeTaxInput(8_000_000));
      expect(result.totalTax).toBeGreaterThan(500_000);
      expect(result.takeHome).toBeGreaterThan(5_500_000);
      expect(result.effectiveRate).toBeGreaterThan(0.05);
      expect(result.effectiveRate).toBeLessThan(0.20);
    });
  });

  describe('年収1200万 (high)', () => {
    it('calculates reasonable tax for 12M salary', () => {
      const result = calculateTax(makeTaxInput(12_000_000));
      expect(result.totalTax).toBeGreaterThan(1_500_000);
      expect(result.effectiveRate).toBeGreaterThan(0.10);
      expect(result.effectiveRate).toBeLessThan(0.30);
    });
  });

  describe('年収2000万 (high_end)', () => {
    it('calculates reasonable tax for 20M salary', () => {
      const result = calculateTax(makeTaxInput(20_000_000));
      expect(result.totalTax).toBeGreaterThan(4_000_000);
      expect(result.effectiveRate).toBeGreaterThan(0.20);
      expect(result.effectiveRate).toBeLessThan(0.45);
    });
  });

  describe('deductions', () => {
    it('spouse deduction reduces tax', () => {
      const without = calculateTax(makeTaxInput(8_000_000));
      const withSpouse = calculateTax(makeTaxInput(8_000_000, [{ type: 'spouse', amount: 1 }]));
      expect(withSpouse.totalTax).toBeLessThan(without.totalTax);
    });

    it('dependent deductions reduce tax per dependent', () => {
      const zero = calculateTax(makeTaxInput(8_000_000));
      const one = calculateTax(makeTaxInput(8_000_000, [{ type: 'dependent_general', amount: 1 }]));
      const two = calculateTax(makeTaxInput(8_000_000, [{ type: 'dependent_general', amount: 2 }]));
      expect(one.totalTax).toBeLessThan(zero.totalTax);
      expect(two.totalTax).toBeLessThan(one.totalTax);
    });

    it('iDeCo deduction reduces tax', () => {
      const without = calculateTax(makeTaxInput(8_000_000));
      const withIdeco = calculateTax(makeTaxInput(8_000_000, [{ type: 'ideco', amount: 276_000 }]));
      expect(withIdeco.totalTax).toBeLessThan(without.totalTax);
    });

    it('housing loan credit reduces final tax', () => {
      const without = calculateTax(makeTaxInput(8_000_000));
      const withLoan = calculateTax(makeTaxInput(8_000_000, [{ type: 'housing_loan', amount: 30_000_000 }]));
      expect(withLoan.taxCredits).toBeGreaterThan(0);
      expect(withLoan.finalIncomeTax).toBeLessThan(without.finalIncomeTax);
    });

    it('medical deduction applies above 100K threshold', () => {
      const below = calculateTax(makeTaxInput(8_000_000, [{ type: 'medical', amount: 50_000 }]));
      const above = calculateTax(makeTaxInput(8_000_000, [{ type: 'medical', amount: 200_000 }]));
      expect(above.totalDeductions).toBeGreaterThan(below.totalDeductions);
    });

    it('combined deductions stack', () => {
      const allDeductions: Deduction[] = [
        { type: 'spouse', amount: 1 },
        { type: 'dependent_general', amount: 2 },
        { type: 'ideco', amount: 276_000 },
        { type: 'life_insurance', amount: 80_000 },
      ];
      const noDeductions = calculateTax(makeTaxInput(8_000_000));
      const withAll = calculateTax(makeTaxInput(8_000_000, allDeductions));
      expect(withAll.totalTax).toBeLessThan(noDeductions.totalTax);
      // Savings should be significant
      expect(noDeductions.totalTax - withAll.totalTax).toBeGreaterThan(200_000);
    });
  });

  describe('edge cases', () => {
    it('handles zero salary', () => {
      const result = calculateTax(makeTaxInput(0));
      expect(result.totalTax).toBe(5_000); // Resident tax flat only
      expect(result.takeHome).toBeLessThan(0); // Negative because of social insurance calc
    });

    it('takeHome is always less than salary', () => {
      for (const salary of [3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000]) {
        const result = calculateTax(makeTaxInput(salary));
        expect(result.takeHome).toBeLessThan(salary);
      }
    });

    it('effective rate increases with income', () => {
      const rates = [3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000].map(
        (salary) => calculateTax(makeTaxInput(salary)).effectiveRate,
      );
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeGreaterThan(rates[i - 1]);
      }
    });
  });
});

describe('calculateFurusatoLimit (ふるさと納税上限)', () => {
  it('returns minimum (2000) for zero salary', () => {
    expect(calculateFurusatoLimit(0, [])).toBe(0);
  });

  it('increases with salary', () => {
    const limit3m = calculateFurusatoLimit(3_000_000, []);
    const limit5m = calculateFurusatoLimit(5_000_000, []);
    const limit8m = calculateFurusatoLimit(8_000_000, []);

    expect(limit5m).toBeGreaterThan(limit3m);
    expect(limit8m).toBeGreaterThan(limit5m);
  });

  it('returns reasonable range for 5M salary', () => {
    const limit = calculateFurusatoLimit(5_000_000, []);
    // Should be roughly 60,000-70,000 for 5M salary single person
    expect(limit).toBeGreaterThan(40_000);
    expect(limit).toBeLessThan(120_000);
  });

  it('returns reasonable range for 8M salary', () => {
    const limit = calculateFurusatoLimit(8_000_000, []);
    expect(limit).toBeGreaterThan(100_000);
    expect(limit).toBeLessThan(200_000);
  });

  it('decreases with iDeCo deduction', () => {
    const without = calculateFurusatoLimit(8_000_000, []);
    const withIdeco = calculateFurusatoLimit(8_000_000, [{ type: 'ideco', amount: 276_000 }]);
    expect(withIdeco).toBeLessThan(without);
  });

  it('spouse deduction reduces limit', () => {
    const single = calculateFurusatoLimit(8_000_000, []);
    const married = calculateFurusatoLimit(8_000_000, [{ type: 'spouse', amount: 1 }]);
    expect(married).toBeLessThan(single);
  });
});

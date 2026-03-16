import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
import postgres from 'postgres';

// Load env vars
config({ path: '.env.local' });

const TEST_USER_ID = '00000000-0000-0000-0000-000000000012';

let sql: ReturnType<typeof postgres>;

beforeAll(() => {
  sql = postgres(process.env.DATABASE_URL!, { prepare: false });
});

afterAll(async () => {
  // Cleanup all test data
  await sql`DELETE FROM profile_snapshots WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM assets WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM liabilities WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM expense_records WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM income_sources WHERE user_id = ${TEST_USER_ID}`;
  await sql`DELETE FROM user_profiles WHERE user_id = ${TEST_USER_ID}`;
  await sql.end();
});

describe('profile CRUD operations', () => {
  it('creates a user profile', async () => {
    await sql`
      INSERT INTO user_profiles (user_id, birth_date, prefecture, marital_status, occupation, tier, annual_income, onboarding_completed)
      VALUES (${TEST_USER_ID}, '1990-01-15', '東京都', 'single', 'employee', 'basic', 4000000, false)
    `;

    const [profile] = await sql`SELECT * FROM user_profiles WHERE user_id = ${TEST_USER_ID}`;
    expect(profile.prefecture).toBe('東京都');
    expect(profile.annual_income).toBe(4000000);
    expect(profile.tier).toBe('basic');
    expect(profile.onboarding_completed).toBe(false);
  });

  it('creates income sources', async () => {
    await sql`
      INSERT INTO income_sources (user_id, category, name, monthly_amount, is_gross, is_recurring)
      VALUES (${TEST_USER_ID}, 'salary', '給与収入', 333000, true, true)
    `;

    const rows = await sql`SELECT * FROM income_sources WHERE user_id = ${TEST_USER_ID}`;
    expect(rows.length).toBe(1);
    expect(rows[0].monthly_amount).toBe(333000);
  });

  it('creates expense records', async () => {
    await sql`
      INSERT INTO expense_records (user_id, category, name, monthly_amount, is_fixed, is_recurring) VALUES
      (${TEST_USER_ID}, 'housing', '住居費', 80000, true, true),
      (${TEST_USER_ID}, 'food', '食費', 40000, false, true)
    `;

    const rows = await sql`SELECT * FROM expense_records WHERE user_id = ${TEST_USER_ID} ORDER BY category`;
    expect(rows.length).toBe(2);
    expect(rows[0].category).toBe('food');
    expect(rows[1].category).toBe('housing');
  });

  it('creates assets', async () => {
    await sql`
      INSERT INTO assets (user_id, category, name, amount, is_liquid) VALUES
      (${TEST_USER_ID}, 'cash', '預貯金', 3000000, true),
      (${TEST_USER_ID}, 'stocks', '株式', 1000000, true)
    `;

    const rows = await sql`SELECT * FROM assets WHERE user_id = ${TEST_USER_ID}`;
    expect(rows.length).toBe(2);
    const [sum] = await sql`SELECT COALESCE(SUM(amount), 0)::int AS total FROM assets WHERE user_id = ${TEST_USER_ID}`;
    expect(Number(sum.total)).toBe(4000000);
  });

  it('creates liabilities', async () => {
    await sql`
      INSERT INTO liabilities (user_id, category, name, principal_amount, remaining_amount) VALUES
      (${TEST_USER_ID}, 'student_loan', '奨学金', 2000000, 1500000)
    `;

    const rows = await sql`SELECT * FROM liabilities WHERE user_id = ${TEST_USER_ID}`;
    expect(rows.length).toBe(1);
    expect(Number(rows[0].remaining_amount)).toBe(1500000);
  });

  it('updates profile and saves snapshot', async () => {
    // Save snapshot
    const [current] = await sql`SELECT * FROM user_profiles WHERE user_id = ${TEST_USER_ID}`;
    await sql`INSERT INTO profile_snapshots (user_id, snapshot) VALUES (${TEST_USER_ID}, ${JSON.stringify(current)}::jsonb)`;

    // Update
    await sql`
      UPDATE user_profiles SET
        annual_income = 6000000,
        tier = 'middle',
        occupation = 'self_employed',
        onboarding_completed = true,
        updated_at = NOW()
      WHERE user_id = ${TEST_USER_ID}
    `;

    // Verify update
    const [updated] = await sql`SELECT * FROM user_profiles WHERE user_id = ${TEST_USER_ID}`;
    expect(updated.annual_income).toBe(6000000);
    expect(updated.tier).toBe('middle');
    expect(updated.onboarding_completed).toBe(true);

    // Verify snapshot exists and contains previous data
    const snapshots = await sql`SELECT * FROM profile_snapshots WHERE user_id = ${TEST_USER_ID}`;
    expect(snapshots.length).toBe(1);
    const snapshotRaw = snapshots[0].snapshot;
    const snapshotData = typeof snapshotRaw === 'string' ? JSON.parse(snapshotRaw) : snapshotRaw;
    expect(snapshotData).toBeDefined();
    expect(snapshotData.annual_income).toBe(4000000);
    expect(snapshotData.tier).toBe('basic');
  });

  it('calculates net worth correctly', async () => {
    const [assetSum] = await sql`SELECT COALESCE(SUM(amount), 0)::int AS total FROM assets WHERE user_id = ${TEST_USER_ID}`;
    const [liabilitySum] = await sql`SELECT COALESCE(SUM(remaining_amount), 0)::int AS total FROM liabilities WHERE user_id = ${TEST_USER_ID}`;

    const totalAssets = Number(assetSum.total);
    const totalLiabilities = Number(liabilitySum.total);
    const netWorth = totalAssets - totalLiabilities;

    expect(totalAssets).toBe(4000000);
    expect(totalLiabilities).toBe(1500000);
    expect(netWorth).toBe(2500000);
  });
});

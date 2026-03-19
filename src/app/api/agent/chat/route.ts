export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/client';
import { AGENT_SYSTEM_PROMPT } from '@/lib/ai/prompts/agent';
import { AGENT_TOOLS } from '@/lib/ai/tools/definitions';
import { executeToolCall, type ToolContext } from '@/lib/ai/tools/handlers';
import { fetchDashboardMetrics, fetchExpenseCategories } from '@/app/(dashboard)/_actions/dashboard';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/format';
import type Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }

  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json({ error: 'AI機能は現在利用できません。' }, { status: 503 });
  }

  let userMessage = '';
  try {
    const body = await request.json() as { message?: string };
    userMessage = body.message ?? '';
  } catch {
    return NextResponse.json({ error: '不正なリクエストです。' }, { status: 400 });
  }

  // Build context
  const [metrics, categories] = await Promise.all([
    fetchDashboardMetrics(),
    fetchExpenseCategories(),
  ]);

  const [profile] = await db
    .select({ birthDate: userProfiles.birthDate, maritalStatus: userProfiles.maritalStatus, dependents: userProfiles.dependents })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const age = profile ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear() : 35;

  const toolContext: ToolContext = {
    annualIncome: metrics?.monthlyIncome ? metrics.monthlyIncome * 12 : 0,
    monthlyIncome: metrics?.monthlyIncome ?? 0,
    monthlyExpenses: metrics?.monthlyExpenses ?? 0,
    totalAssets: metrics?.totalAssets ?? 0,
    netWorth: metrics?.netWorth ?? 0,
    householdScore: metrics?.householdScore ?? 0,
    savingsRate: metrics?.savingsRate ?? 0,
    age,
    maritalStatus: profile?.maritalStatus ?? 'single',
    dependents: profile?.dependents ?? 0,
    expenses: categories.map((c) => ({
      category: c.category,
      name: c.label,
      monthlyAmount: c.amount,
      isFixed: c.isFixed,
    })),
  };

  let contextStr = '';
  if (metrics) {
    const expenseList = categories.map((c) => `${c.label}: ¥${formatCurrency(c.amount)}/月`).join(', ');
    contextStr = `\n\n[ユーザー情報] 月収¥${formatCurrency(metrics.monthlyIncome)} / 月支出¥${formatCurrency(metrics.monthlyExpenses)} / 貯蓄率${metrics.savingsRate}% / スコア${metrics.householdScore}/100 / 純資産¥${formatCurrency(metrics.netWorth)} / 支出: ${expenseList}`;
  }

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: (userMessage || 'この状況に最適な家計改善アクションを提案してください') + contextStr },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller): Promise<void> {
      try {
        // First call with tools
        let response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: AGENT_SYSTEM_PROMPT,
          tools: AGENT_TOOLS,
          messages,
        });

        // Handle tool use loop (max 3 iterations)
        let iterations = 0;
        while (response.stop_reason === 'tool_use' && iterations < 3) {
          iterations++;

          const toolBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
          );

          for (const tool of toolBlocks) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ text: `\n🔧 ${toolDisplayName(tool.name)} を実行中...\n` })}\n\n`,
            ));
          }

          // Execute tools
          const toolResults: Anthropic.ToolResultBlockParam[] = toolBlocks.map((tool) => {
            const result = executeToolCall(tool.name, tool.input as Record<string, unknown>, toolContext);
            return {
              type: 'tool_result' as const,
              tool_use_id: tool.id,
              content: result.data,
            };
          });

          messages.push({ role: 'assistant', content: response.content });
          messages.push({ role: 'user', content: toolResults });

          response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: AGENT_SYSTEM_PROMPT,
            tools: AGENT_TOOLS,
            messages,
          });
        }

        // Stream final text
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === 'text',
        );

        for (const block of textBlocks) {
          const chunks = block.text.match(/.{1,20}/g) ?? [block.text];
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            await new Promise((r) => setTimeout(r, 15));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'エラーが発生しました。' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}

function toolDisplayName(name: string): string {
  const map: Record<string, string> = {
    search_services: 'サービス検索',
    calculate_tax: '税額計算',
    calculate_furusato_limit: 'ふるさと納税上限',
    simulate_investment: '投資シミュレーション',
    get_user_summary: 'ユーザー情報取得',
  };
  return map[name] ?? name;
}

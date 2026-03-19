export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/client';
import { SIMULATION_SYSTEM_PROMPT, buildSimulationPrompt } from '@/lib/ai/prompts/simulation';
import { runSimulation, type SimulationParams, type LifeEvent } from '@/lib/utils/cashflow-engine';

interface RequestBody {
  params: {
    currentAge: number;
    years: number;
    annualIncome: number;
    annualExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
    annualLoanPayment: number;
    salaryGrowthRate: number;
    inflationRate: number;
    investmentReturnRate: number;
    retirementAge: number;
    retirementBonus: number;
    pensionAmount: number;
    pensionStartAge: number;
    lifeEvents: LifeEvent[];
  };
}

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }

  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json(
      { error: 'AI機能は現在利用できません。' },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: '不正なリクエストです。' }, { status: 400 });
  }

  const params: SimulationParams = body.params;
  const result = runSimulation(params);
  const userPrompt = buildSimulationPrompt(params, result);

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SIMULATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller): Promise<void> {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'ストリーミング中にエラーが発生しました。' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

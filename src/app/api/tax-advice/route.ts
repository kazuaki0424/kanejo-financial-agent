import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/client';
import { TAX_ADVISOR_SYSTEM_PROMPT, buildTaxContext } from '@/lib/ai/prompts/tax-advisor';
import { fetchTaxSummary } from '@/app/(dashboard)/tax/_actions/tax';
import { calculateTaxSavings } from '@/lib/utils/tax-savings';

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

  let userQuestion = '';
  try {
    const body = await request.json() as { question?: string };
    userQuestion = body.question ?? '';
  } catch {
    // empty body is ok
  }

  const taxData = await fetchTaxSummary();
  if (!taxData) {
    return NextResponse.json({ error: 'プロファイルが見つかりません。' }, { status: 404 });
  }

  const savings = calculateTaxSavings({
    annualSalary: taxData.annualSalary,
    occupation: taxData.occupation,
    maritalStatus: taxData.maritalStatus,
    dependents: taxData.dependents,
    age: taxData.age,
    currentDeductions: [],
  });

  const context = buildTaxContext(taxData, savings);
  const prompt = userQuestion
    ? `${context}\n\n## ユーザーの質問\n${userQuestion}\n\n上記の税務状況を踏まえて、質問に回答してください。`
    : `${context}\n\nこのユーザーに最も効果的な節税アドバイスを3つ提案してください。未活用の施策を優先してください。`;

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: TAX_ADVISOR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'エラーが発生しました。' })}\n\n`));
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

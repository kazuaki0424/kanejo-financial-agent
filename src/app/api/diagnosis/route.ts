export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/client';
import { SYSTEM_PROMPT, buildDiagnosisPrompt, computeContextHash } from '@/lib/ai/prompts/diagnosis';
import { fetchDashboardMetrics, fetchExpenseCategories } from '@/app/(dashboard)/_actions/dashboard';
import { db } from '@/lib/db/client';
import { aiInsightCache } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

const CACHE_TTL_HOURS = 24;

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
  }

  // Parse request body for force refresh
  let forceRefresh = false;
  try {
    const body = await request.json() as { refresh?: boolean };
    forceRefresh = body.refresh === true;
  } catch {
    // No body is fine
  }

  // Fetch user data
  const [metrics, categories] = await Promise.all([
    fetchDashboardMetrics(),
    fetchExpenseCategories(),
  ]);

  if (!metrics) {
    return NextResponse.json(
      { error: 'プロファイルデータが見つかりません。' },
      { status: 404 },
    );
  }

  const contextHash = computeContextHash(metrics);

  // Check cache (unless force refresh)
  if (!forceRefresh) {
    try {
      const [cached] = await db
        .select({ content: aiInsightCache.content })
        .from(aiInsightCache)
        .where(
          and(
            eq(aiInsightCache.userId, user.id),
            eq(aiInsightCache.type, 'diagnosis'),
            eq(aiInsightCache.contextHash, contextHash),
            gt(aiInsightCache.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (cached) {
        // Return cached content as a single SSE message
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller): void {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cached.content })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Cache': 'HIT',
          },
        });
      }
    } catch {
      // Cache miss — proceed with generation
    }
  }

  // Check API key
  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json(
      { error: 'AI機能は現在利用できません。APIキーが設定されていません。' },
      { status: 503 },
    );
  }

  const userPrompt = buildDiagnosisPrompt(metrics, categories);

  // Stream response + collect for caching
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const encoder = new TextEncoder();
  let fullContent = '';

  const readable = new ReadableStream({
    async start(controller): Promise<void> {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullContent += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        // Save to cache after streaming completes
        if (fullContent.length > 0) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

          try {
            // Delete old cache entries for this user+type
            await db
              .delete(aiInsightCache)
              .where(
                and(
                  eq(aiInsightCache.userId, user.id),
                  eq(aiInsightCache.type, 'diagnosis'),
                ),
              );

            // Insert new cache
            await db.insert(aiInsightCache).values({
              userId: user.id,
              type: 'diagnosis',
              content: fullContent,
              contextHash,
              expiresAt,
            });
          } catch {
            // Cache save failure is non-critical
          }
        }
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
      'X-Cache': 'MISS',
    },
  });
}

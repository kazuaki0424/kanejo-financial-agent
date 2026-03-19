import type { Metadata } from 'next';
import { AgentChat } from './_components/agent-chat';

export const maxDuration = 30;

export const metadata: Metadata = {
  title: 'エージェント — Kanejo',
};

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">金融エージェント</h1>
      <AgentChat />
    </div>
  );
}

import Anthropic from '@anthropic-ai/sdk';

let clientInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  if (!clientInstance) {
    clientInstance = new Anthropic({ apiKey });
  }

  return clientInstance;
}

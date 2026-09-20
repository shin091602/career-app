import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './_prompt';

/** APIキーはサーバー側の環境変数からのみ読む。フロントには絶対に置かない */
export type ProviderName = 'gemini' | 'claude';

export const DEFAULT_MODEL: Record<ProviderName, string> = {
  // 現行世代で安価な Flash 系（入力 $0.25 / 出力 $1.50 per 1M tokens）
  gemini: 'gemini-3.1-flash-lite',
  claude: 'claude-haiku-4-5-20251001',
};

/** 出力トークンの上限。長文化＝コスト増なので既定を低めに抑える */
export const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

export class ProviderConfigError extends Error {}
export class ProviderCallError extends Error {}

export function resolveProvider(): ProviderName {
  const raw = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();
  if (raw !== 'gemini' && raw !== 'claude') {
    throw new ProviderConfigError(`AI_PROVIDER が不正です: ${raw}（gemini か claude）`);
  }
  return raw;
}

export function resolveMaxOutputTokens(): number {
  const raw = process.env.AI_MAX_OUTPUT_TOKENS;
  if (!raw) return DEFAULT_MAX_OUTPUT_TOKENS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_OUTPUT_TOKENS;
  // 上限を超える指定は無視する（想定外のコストを防ぐ）
  return Math.min(parsed, 4096);
}

/** 選択中のプロバイダにプロンプトを投げ、生のテキストを返す */
export async function callProvider(
  provider: ProviderName,
  userPrompt: string,
  maxOutputTokens: number,
): Promise<string> {
  if (provider === 'gemini') return callGemini(userPrompt, maxOutputTokens);
  return callClaude(userPrompt, maxOutputTokens);
}

async function callGemini(userPrompt: string, maxOutputTokens: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderConfigError('GEMINI_API_KEY が未設定です');

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL.gemini,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens,
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });
    return response.text ?? '';
  } catch (error) {
    throw new ProviderCallError(`Gemini の呼び出しに失敗しました: ${describe(error)}`);
  }
}

async function callClaude(userPrompt: string, maxOutputTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ProviderConfigError('ANTHROPIC_API_KEY が未設定です');

  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL.claude,
      max_tokens: maxOutputTokens,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
        // JSON以外を書き始めないよう、開き括弧まで先に置く
        { role: 'assistant', content: '{' },
      ],
    });

    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');
    return `{${text}`;
  } catch (error) {
    throw new ProviderCallError(`Claude の呼び出しに失敗しました: ${describe(error)}`);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

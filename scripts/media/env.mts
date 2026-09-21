/**
 * .env.local からAPIキーなどを読む。
 * dotenv を入れずに済ませたいので最小の実装にしてある。
 * **ここで読む値はコミットしない**（.env.local は .gitignore 済み）。
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../episodes.mts';
import { DEFAULT_MAX_COST_USD } from './config.mts';

function parse(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

let cache: Record<string, string> | null = null;

/** .env.local → .env → 実際の環境変数 の順に見る */
export function envValue(key: string): string | undefined {
  if (!cache) {
    cache = {};
    for (const file of ['.env', '.env.local']) {
      const full = path.join(ROOT, file);
      if (existsSync(full)) Object.assign(cache, parse(readFileSync(full, 'utf8')));
    }
  }
  return process.env[key] ?? cache[key] ?? undefined;
}

export function requireApiKey(): string {
  const key = envValue('GEMINI_API_KEY');
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY がありません。.env.local に GEMINI_API_KEY=... を書いてください（コミットしないこと）。',
    );
  }
  return key;
}

/** 1回の実行で使ってよい上限（ドル） */
export function maxCostUsd(): number {
  const raw = envValue('MEDIA_MAX_COST_USD');
  if (!raw) return DEFAULT_MAX_COST_USD;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`MEDIA_MAX_COST_USD の値がおかしい（${raw}）`);
  }
  return value;
}

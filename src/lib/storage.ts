/**
 * localStorage の薄いラッパー。
 * プライベートウィンドウやストレージ無効環境では throw するので、
 * すべての読み書きを try/catch で包み、失敗時は既定値で動かす。
 */

const PREFIX = 'careerApp:v1:';

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 保存できなくても体験は続行させる
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // 何もしない
  }
}

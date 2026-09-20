import { useCallback, useEffect, useRef, useState } from 'react';
import { loadJson, removeKey, saveJson } from './storage';

/**
 * localStorage に同期する useState。
 * 初回レンダリングで読み出し、値が変わるたび書き戻す。
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => loadJson(key, initialValue));

  // 初回の保存は不要（読み出した値と同じ）
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    saveJson(key, value);
  }, [key, value]);

  const reset = useCallback(() => {
    removeKey(key);
    skipFirstSave.current = true;
    setValue(initialValue);
    // reset 直後は「初期値の保存」を飛ばしたいので skipFirstSave を立てておく
  }, [key, initialValue]);

  return [value, setValue, reset];
}

import { usePersistentState } from './usePersistentState';

/**
 * 簡易パスコード。ホーム画面で一度入力し、以降のAPI送信に自動で付与する。
 * 正しさの判定はサーバー側（APP_PASSCODE との照合）でのみ行う。
 */
export function usePasscode() {
  const [passcode, setPasscode, clearPasscode] = usePersistentState<string>('passcode', '');
  return { passcode, setPasscode, clearPasscode };
}

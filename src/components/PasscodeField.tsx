import { useState } from 'react';
import { Button } from './Button';
import { usePasscode } from '../lib/usePasscode';

/**
 * ホーム画面でのパスコード入力。
 * 入力値は localStorage に保存され、AIフィードバックの送信時に自動で付与される。
 * 照合はサーバー側のみで行うため、ここでは正しさを判定しない。
 */
export function PasscodeField() {
  const { passcode, setPasscode, clearPasscode } = usePasscode();
  const [draft, setDraft] = useState('');

  if (passcode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="text-ink-muted">パスコード設定済み</span>
        <Button
          variant="quiet"
          onClick={() => {
            clearPasscode();
            setDraft('');
          }}
        >
          変更する
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-line bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const value = draft.trim();
        if (value) setPasscode(value);
      }}
    >
      <label htmlFor="passcode" className="block text-sm font-medium">
        パスコード
      </label>
      <p className="mt-1 text-xs text-ink-muted">
        AIフィードバックを使うために必要です。一度入力すると、この端末に保存されます。
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id="passcode"
          type="password"
          inputMode="text"
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-[44px] flex-1 rounded-xl border border-line bg-bg px-3 text-base"
          placeholder="配布されたパスコード"
        />
        <Button type="submit" disabled={draft.trim().length === 0}>
          保存
        </Button>
      </div>
    </form>
  );
}

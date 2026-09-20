import { useCallback, useState } from 'react';
import {
  FEEDBACK_LIMITS,
  isFeedbackErrorBody,
  type FeedbackRequest,
  type FeedbackResponse,
} from '../../types';

type Status = 'idle' | 'loading' | 'done' | 'error';

/** エラーコードごとの、テスターに見せる文面 */
const ERROR_MESSAGE: Record<string, string> = {
  unauthorized: 'パスコードが違います。ホーム画面で入力し直してください。',
  payload_too_large: '回答が長すぎます。短くしてから送ってください。',
  not_configured: 'サーバー側の設定（APIキー・パスコード）が未完了です。',
  provider_error: 'AIの呼び出しに失敗しました。少し待ってからもう一度試してください。',
  parse_error: 'AIの返答を読み取れませんでした。もう一度試してください。',
  bad_request: '送信内容に不備があります。',
  method_not_allowed: '送信方法が不正です。',
};

export function useFeedback() {
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setFeedback(null);
    setErrorMessage(null);
  }, []);

  const submit = useCallback(async (request: FeedbackRequest) => {
    setStatus('loading');
    setErrorMessage(null);
    setFeedback(null);

    const body = JSON.stringify(request);
    if (body.length > FEEDBACK_LIMITS.payloadMaxLength) {
      setStatus('error');
      setErrorMessage(ERROR_MESSAGE.payload_too_large);
      return;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const json: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message = isFeedbackErrorBody(json)
          ? (ERROR_MESSAGE[json.code] ?? json.message)
          : `サーバーエラー（${response.status}）が返りました。`;
        setStatus('error');
        setErrorMessage(message);
        return;
      }

      setFeedback(json as FeedbackResponse);
      setStatus('done');
    } catch {
      // vercel dev を起動していない場合もここに来る
      setStatus('error');
      setErrorMessage(
        'APIに接続できませんでした。`vercel dev` で起動しているか確認してください。',
      );
    }
  }, []);

  return { status, feedback, errorMessage, submit, reset };
}

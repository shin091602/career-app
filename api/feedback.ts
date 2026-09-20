import {
  FEEDBACK_LIMITS,
  type FeedbackErrorBody,
  type FeedbackErrorCode,
  type FeedbackRequest,
  type FeedbackResponse,
  type TaskPayload,
} from '../src/types/feedback';
import { buildUserPrompt } from './_prompt';
import {
  callProvider,
  ProviderCallError,
  ProviderConfigError,
  resolveMaxOutputTokens,
  resolveProvider,
} from './_providers';

export const config = { runtime: 'nodejs' };

function fail(status: number, code: FeedbackErrorCode, message: string, raw?: string): Response {
  const body: FeedbackErrorBody = { code, message, ...(raw ? { raw } : {}) };
  return json(status, body);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** 型を信用せず、フロントから来た値を検証する */
function validate(value: unknown): { request: FeedbackRequest } | { error: string } {
  if (typeof value !== 'object' || value === null) return { error: 'JSONオブジェクトが必要です' };
  const body = value as Partial<FeedbackRequest>;

  if (typeof body.passcode !== 'string') return { error: 'passcode が必要です' };
  if (typeof body.taskId !== 'string') return { error: 'taskId が必要です' };
  if (typeof body.answer !== 'string') return { error: 'answer が必要です' };
  if (typeof body.prototypeId !== 'string') return { error: 'prototypeId が必要です' };

  const task = body.task as Partial<TaskPayload> | undefined;
  if (typeof task !== 'object' || task === null) return { error: 'task が必要です' };
  const requiredStrings: (keyof TaskPayload)[] = [
    'title',
    'jobTitle',
    'situation',
    'materialsText',
    'modelAnswer',
    'proInsight',
  ];
  for (const key of requiredStrings) {
    if (typeof task[key] !== 'string') return { error: `task.${key} が必要です` };
  }
  if (!Array.isArray(task.criteria) || task.criteria.some((item) => typeof item !== 'string')) {
    return { error: 'task.criteria が必要です' };
  }

  return { request: body as FeedbackRequest };
}

/** AIの出力からJSONを取り出す（前後に余計な文字が付いていても拾う） */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function toFeedback(parsed: unknown): FeedbackResponse | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const candidate = parsed as Record<string, unknown>;
  const good = candidate.good;
  const improve = candidate.improve;
  const proThinking = candidate.proThinking;

  if (!Array.isArray(good) || !Array.isArray(improve) || typeof proThinking !== 'string') {
    return null;
  }

  return {
    good: good.filter((item): item is string => typeof item === 'string').slice(0, 5),
    improve: improve.filter((item): item is string => typeof item === 'string').slice(0, 5),
    proThinking,
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'POST のみ受け付けます');
  }

  const expectedPasscode = process.env.APP_PASSCODE;
  if (!expectedPasscode) {
    return fail(503, 'not_configured', 'APP_PASSCODE がサーバー側で未設定です');
  }

  // 入力サイズの上限（本文を読む前に Content-Length でも弾く）
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(declaredLength) && declaredLength > FEEDBACK_LIMITS.payloadMaxLength * 4) {
    return fail(413, 'payload_too_large', '送信データが大きすぎます');
  }

  const rawBody = await request.text();
  if (rawBody.length > FEEDBACK_LIMITS.payloadMaxLength) {
    return fail(413, 'payload_too_large', '送信データが大きすぎます');
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return fail(400, 'bad_request', 'JSONとして読めませんでした');
  }

  const validated = validate(parsedBody);
  if ('error' in validated) {
    return fail(400, 'bad_request', validated.error);
  }
  const { request: feedbackRequest } = validated;

  if (feedbackRequest.passcode !== expectedPasscode) {
    return fail(401, 'unauthorized', 'パスコードが違います');
  }

  if (feedbackRequest.answer.length > FEEDBACK_LIMITS.answerMaxLength) {
    return fail(413, 'payload_too_large', '回答が長すぎます');
  }

  let raw: string;
  try {
    const provider = resolveProvider();
    raw = await callProvider(
      provider,
      buildUserPrompt(feedbackRequest.task, feedbackRequest.answer),
      resolveMaxOutputTokens(),
    );
  } catch (error) {
    if (error instanceof ProviderConfigError) {
      return fail(503, 'not_configured', error.message);
    }
    if (error instanceof ProviderCallError) {
      return fail(502, 'provider_error', error.message);
    }
    return fail(502, 'provider_error', error instanceof Error ? error.message : '不明なエラー');
  }

  const feedback = toFeedback(extractJson(raw));
  if (!feedback) {
    return fail(502, 'parse_error', 'AIの返答をJSONとして読み取れませんでした', raw.slice(0, 2000));
  }

  return json(200, feedback);
}

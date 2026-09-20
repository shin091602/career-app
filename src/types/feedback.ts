/**
 * /api/feedback のリクエスト／レスポンス型。
 * フロント（src/engine/task）とサーバー（api/feedback.ts）の両方から読む。
 * worktree側のエージェントは編集せず、必要な変更を報告すること。
 */
import type { PrototypeId } from './common';

/** 入力の上限。サーバー側でも同じ値で検証する */
export const FEEDBACK_LIMITS = {
  /** 回答本文の最大文字数 */
  answerMaxLength: 2000,
  /** リクエストJSON全体の最大文字数 */
  payloadMaxLength: 12000,
} as const;

/** 課題のうち、AIに渡す必要がある部分だけを抜き出したもの */
export interface TaskPayload {
  title: string;
  jobTitle: string;
  situation: string;
  /** 資料をプレーンテキストに整形したもの */
  materialsText: string;
  /** 評価の観点（「ラベル：説明」の配列） */
  criteria: string[];
  modelAnswer: string;
  proInsight: string;
}

export interface FeedbackRequest {
  /** 簡易パスコード（APP_PASSCODE と照合する） */
  passcode: string;
  prototypeId: PrototypeId;
  taskId: string;
  task: TaskPayload;
  /** 利用者の回答。選択式のときは選んだ選択肢のラベルを連結した文字列 */
  answer: string;
}

export interface FeedbackResponse {
  /** 良かった点 */
  good: string[];
  /** 改善点 */
  improve: string[];
  /** プロならこう考える */
  proThinking: string;
  /** AIの生出力（JSONパースに失敗したときの確認用） */
  raw?: string;
}

/** エラーコード。フロントは code を見て文面を出し分ける */
export type FeedbackErrorCode =
  | 'method_not_allowed'
  | 'bad_request'
  | 'unauthorized'
  | 'payload_too_large'
  | 'not_configured'
  | 'provider_error'
  | 'parse_error';

export interface FeedbackErrorBody {
  code: FeedbackErrorCode;
  message: string;
  raw?: string;
}

export function isFeedbackErrorBody(value: unknown): value is FeedbackErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

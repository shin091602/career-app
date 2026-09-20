/**
 * 「業務のミニ版に挑戦」型プロトタイプ（task-bank / task-ad）のデータ型。
 * worktree側のエージェントは編集せず、必要な変更を報告すること。
 */
import type { Term, VerifiableMeta } from './common';

/** 課題に添える資料 */
export type Material =
  | { kind: 'text'; id: string; title: string; body: string }
  | {
      kind: 'table';
      id: string;
      title: string;
      headers: string[];
      rows: string[][];
      caption?: string;
    }
  | { kind: 'note'; id: string; title: string; body: string };

export interface ChoiceOption {
  id: string;
  label: string;
  /** 選択後に見せる短い解説（任意） */
  note?: string;
}

/** 回答形式 */
export type AnswerFormat =
  | {
      kind: 'free';
      /** 送信を許可する最小文字数 */
      minLength: number;
      /** 入力欄と送信の上限文字数（APIの入力上限より小さくする） */
      maxLength: number;
      placeholder?: string;
    }
  | {
      kind: 'choice';
      options: ChoiceOption[];
      /** 複数選択を許すか */
      multiple?: boolean;
    };

/** 評価の観点。AIへのフィードバック依頼にそのまま渡す */
export interface Criterion {
  key: string;
  label: string;
  description: string;
}

export interface Task extends VerifiableMeta {
  id: string;
  title: string;
  /** 状況説明 */
  situation: string;
  materials: Material[];
  answerFormat: AnswerFormat;
  criteria: Criterion[];
  /** 模範解答。フィードバック表示後に見せる */
  modelAnswer: string;
  /** プロの考え方（現場ではどこを見るか） */
  proInsight: string;
  terms?: Term[];
}

export interface TaskSet extends VerifiableMeta {
  id: string;
  title: string;
  jobTitle: string;
  description: string;
  tasks: Task[];
}

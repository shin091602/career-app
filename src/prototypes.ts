import type { PrototypeId, Scenario, TaskSet } from './types';
import { scenario as novelBankScenario } from '../content/novel-bank/scenario';
import { scenario as novelAdScenario } from '../content/novel-ad/scenario';
import { taskSet as taskBankSet } from '../content/task-bank/tasks';
import { taskSet as taskAdSet } from '../content/task-ad/tasks';

/**
 * 4つのプロトタイプの一覧。ホーム画面の入口はここから生成する。
 *
 * 公開状態はこのファイルで持たない。`content/<名前>/` のエクスポートが
 * null かどうかで「準備中」を自動判定するため、
 * 各worktreeは自分のコンテンツを入れるだけで公開できる（共有ファイルを触らない）。
 */
export interface PrototypeMeta {
  id: PrototypeId;
  path: string;
  /** 体験形式の名前 */
  format: string;
  /** コンテンツが未投入のときにホームで出す職業名 */
  fallbackJobTitle: string;
  /** コンテンツが未投入のときにホームで出す説明 */
  fallbackDescription: string;
  /** 担当worktreeが入れるコンテンツ。null なら準備中 */
  content: Scenario | TaskSet | null;
}

export const PROTOTYPES: readonly PrototypeMeta[] = [
  {
    id: 'novel-bank',
    path: '/novel-bank',
    format: 'ノベルゲーム型',
    fallbackJobTitle: '銀行員',
    fallbackDescription: '物語を読み進めながら選択して、銀行員の仕事を体験する。',
    content: novelBankScenario,
  },
  {
    id: 'task-bank',
    path: '/task-bank',
    format: '業務のミニ版に挑戦',
    fallbackJobTitle: '銀行員',
    fallbackDescription: '実際の業務を小さくした課題に答えて、AIから講評をもらう。',
    content: taskBankSet,
  },
  {
    id: 'novel-ad',
    path: '/novel-ad',
    format: 'ノベルゲーム型',
    fallbackJobTitle: '広告代理店社員',
    fallbackDescription: '物語を読み進めながら選択して、広告の仕事を体験する。',
    content: novelAdScenario,
  },
  {
    id: 'task-ad',
    path: '/task-ad',
    format: '業務のミニ版に挑戦',
    fallbackJobTitle: '広告代理店社員',
    fallbackDescription: '実際の業務を小さくした課題に答えて、AIから講評をもらう。',
    content: taskAdSet,
  },
] as const;

export function getPrototype(id: PrototypeId): PrototypeMeta {
  const found = PROTOTYPES.find((prototype) => prototype.id === id);
  if (!found) throw new Error(`未知のプロトタイプ: ${id}`);
  return found;
}

/** コンテンツが入っているか（入っていなければ「準備中」） */
export function isReady(prototype: PrototypeMeta): boolean {
  return prototype.content !== null;
}

/** ホームのカードに出す職業名。コンテンツがあればそちらを優先する */
export function jobTitleOf(prototype: PrototypeMeta): string {
  return prototype.content?.jobTitle ?? prototype.fallbackJobTitle;
}

/** ホームのカードに出す説明。コンテンツがあればそちらを優先する */
export function descriptionOf(prototype: PrototypeMeta): string {
  return prototype.content?.description ?? prototype.fallbackDescription;
}

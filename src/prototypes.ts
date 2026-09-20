import type { Episode, PrototypeId, TaskSet } from './types';
import { episodes as novelBankEpisodes } from '../content/novel-bank/episodes';
import { episodes as novelAdEpisodes } from '../content/novel-ad/episodes';
import { taskSet as taskBankSet } from '../content/task-bank/tasks';
import { taskSet as taskAdSet } from '../content/task-ad/tasks';

/**
 * 4つのプロトタイプの一覧。ホーム画面の入口はここから生成する。
 *
 * 公開状態はこのファイルで持たない。`content/<名前>/` のエクスポートが
 * 空かどうかで「準備中」を自動判定するため、
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
  /** ノベル型のエピソード一覧（課題型では空） */
  episodes: Episode[];
  /** 課題型の課題集（ノベル型では null） */
  taskSet: TaskSet | null;
}

export const PROTOTYPES: readonly PrototypeMeta[] = [
  {
    id: 'novel-bank',
    path: '/novel-bank',
    format: 'ショートドラマ型',
    fallbackJobTitle: '銀行員',
    fallbackDescription: '動画でドラマを見ながら選択して、銀行員の仕事を体験する。',
    episodes: novelBankEpisodes,
    taskSet: null,
  },
  {
    id: 'task-bank',
    path: '/task-bank',
    format: '業務のミニ版に挑戦',
    fallbackJobTitle: '銀行員',
    fallbackDescription: '実際の業務を小さくした課題に答えて、AIから講評をもらう。',
    episodes: [],
    taskSet: taskBankSet,
  },
  {
    id: 'novel-ad',
    path: '/novel-ad',
    format: 'ショートドラマ型',
    fallbackJobTitle: '広告代理店社員',
    fallbackDescription: '動画でドラマを見ながら選択して、広告の仕事を体験する。',
    episodes: novelAdEpisodes,
    taskSet: null,
  },
  {
    id: 'task-ad',
    path: '/task-ad',
    format: '業務のミニ版に挑戦',
    fallbackJobTitle: '広告代理店社員',
    fallbackDescription: '実際の業務を小さくした課題に答えて、AIから講評をもらう。',
    episodes: [],
    taskSet: taskAdSet,
  },
] as const;

export function getPrototype(id: PrototypeId): PrototypeMeta {
  const found = PROTOTYPES.find((prototype) => prototype.id === id);
  if (!found) throw new Error(`未知のプロトタイプ: ${id}`);
  return found;
}

/** 公開できる中身が入っているか（入っていなければ「準備中」） */
export function isReady(prototype: PrototypeMeta): boolean {
  return prototype.episodes.length > 0 || prototype.taskSet !== null;
}

/** そのプロトタイプの代表コンテンツ（ホームの表示に使う） */
function primary(prototype: PrototypeMeta): Episode | TaskSet | null {
  return prototype.episodes[0] ?? prototype.taskSet;
}

/** ホームのカードに出す職業名。コンテンツがあればそちらを優先する */
export function jobTitleOf(prototype: PrototypeMeta): string {
  return primary(prototype)?.jobTitle ?? prototype.fallbackJobTitle;
}

/** ホームのカードに出す説明。コンテンツがあればそちらを優先する */
export function descriptionOf(prototype: PrototypeMeta): string {
  return primary(prototype)?.description ?? prototype.fallbackDescription;
}

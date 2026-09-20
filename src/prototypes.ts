import type { PrototypeId } from './types';

/**
 * 4つのプロトタイプの一覧。ホーム画面の入口はここから生成する。
 * コンテンツが揃ったプロトタイプは status を 'ready' に変えると遷移できるようになる。
 * （この1行の切り替えだけは、担当worktreeのエージェントが変更してよい）
 */
export interface PrototypeMeta {
  id: PrototypeId;
  path: string;
  /** 体験形式の名前 */
  format: string;
  /** 職業名 */
  jobTitle: string;
  /** ホームのカードに出す説明 */
  description: string;
  status: 'ready' | 'preparing';
}

export const PROTOTYPES: readonly PrototypeMeta[] = [
  {
    id: 'novel-bank',
    path: '/novel-bank',
    format: 'ノベルゲーム型',
    jobTitle: '銀行員',
    description: '物語を読み進めながら選択して、銀行員の一日を体験する。',
    status: 'ready',
  },
  {
    id: 'task-bank',
    path: '/task-bank',
    format: '業務のミニ版に挑戦',
    jobTitle: '銀行員',
    description: '実際の業務を小さくした課題に答えて、AIから講評をもらう。',
    status: 'ready',
  },
  {
    id: 'novel-ad',
    path: '/novel-ad',
    format: 'ノベルゲーム型',
    jobTitle: '広告代理店社員',
    description: '物語を読み進めながら選択して、広告の仕事を体験する。',
    status: 'preparing',
  },
  {
    id: 'task-ad',
    path: '/task-ad',
    format: '業務のミニ版に挑戦',
    jobTitle: '広告代理店社員',
    description: '実際の業務を小さくした課題に答えて、AIから講評をもらう。',
    status: 'preparing',
  },
] as const;

export function getPrototype(id: PrototypeId): PrototypeMeta {
  const found = PROTOTYPES.find((prototype) => prototype.id === id);
  if (!found) throw new Error(`未知のプロトタイプ: ${id}`);
  return found;
}

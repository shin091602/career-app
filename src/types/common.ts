/**
 * 全プロトタイプ共通の型。
 * このファイルは4つのプロトタイプ間の「契約」なので、
 * worktree側のエージェントは編集せず、必要な変更を報告すること。
 */

/** 4つのプロトタイプの識別子 */
export type PrototypeId = 'novel-bank' | 'novel-ad' | 'task-bank' | 'task-ad';

export const PROTOTYPE_IDS: readonly PrototypeId[] = [
  'novel-bank',
  'novel-ad',
  'task-bank',
  'task-ad',
] as const;

/**
 * 素材ID。実ファイルは public/assets/<PrototypeId>/<AssetId>.<ext> に置く。
 * 素材が未用意のうちはダミー表示（色付き矩形＋ID）になる。
 */
export type AssetId = string;

/** 参考にした公開情報のメモ */
export interface SourceRef {
  /** 出典の名前（例：「◯◯業界団体 2024年度資料」） */
  title: string;
  /** 参照できるURL（あれば） */
  url?: string;
  /** どの記述の根拠にしたかのメモ */
  note?: string;
}

/**
 * 事実確認の状態。シナリオ・課題など「業務描写を含むデータ」に必ず付ける。
 * - verified: true  … 公開情報で裏取り済み。sources を必ず1件以上入れる
 * - verified: false … 推測・創作を含む。レビュー前提
 */
export interface VerifiableMeta {
  verified: boolean;
  sources: SourceRef[];
}

/** 中高生向けの用語解説。難しい言葉には必ず付ける */
export interface Term {
  /** 本文中に現れる語（完全一致で照合する） */
  term: string;
  /** 1〜2文の短い解説 */
  description: string;
}

/** 表やテキストの資料。課題の資料としても、ノベルの書類ズームとしても使う */
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

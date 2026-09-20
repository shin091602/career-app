/**
 * ノベルゲーム型プロトタイプ（novel-bank / novel-ad）のデータ型。
 * worktree側のエージェントは編集せず、必要な変更を報告すること。
 */
import type { AssetId, Term, VerifiableMeta } from './common';

/** 評価パラメータの定義（例：顧客との信頼、リスク感覚） */
export interface ParamDef {
  key: string;
  label: string;
  /** 中高生に何を測っているか伝えるための一文 */
  description: string;
}

/** 選択肢がパラメータに与える影響 */
export interface ParamEffect {
  key: string;
  delta: number;
}

/** 選択肢 */
export interface Choice {
  label: string;
  /** 選んだあとに進む場面ID */
  nextSceneId: string;
  effects?: ParamEffect[];
  /** 選択直後に短く表示する補足（任意） */
  hint?: string;
}

/**
 * 場面の種類
 * - dialogue … 通常の会話・描写
 * - ending   … エンディング本文
 * - debrief  … 答え合わせ（「実際の仕事ではこう動く」）
 */
export type SceneKind = 'dialogue' | 'ending' | 'debrief';

export interface Scene {
  id: string;
  kind: SceneKind;
  /** 話者名。ナレーションのときは省略する */
  speaker?: string;
  /** 本文。改行は \n で表す */
  text: string;
  /** 背景画像の素材ID（9:16） */
  bgAssetId?: AssetId;
  /** 人物画像の素材ID（透過PNG・縦長）。任意 */
  charAssetId?: AssetId;
  /** この場面で出てくる難語の解説 */
  terms?: Term[];
  /** 選択肢。ある場合は next より優先される */
  choices?: Choice[];
  /** 選択肢がないときに進む次の場面ID。省略時はその枝の終端 */
  next?: string;
}

/** エンディングと、その後に見せる答え合わせ場面の並び */
export interface Ending {
  id: string;
  /** kind: 'ending' の場面ID */
  sceneId: string;
  title: string;
  /** 一覧やまとめで使う短い説明 */
  summary: string;
  /**
   * エンディングの後に順番に見せる答え合わせ場面（kind: 'debrief'）のID。
   * 「実際の仕事ではこう動く」をここに置く。
   */
  debriefSceneIds: string[];
}

export interface Scenario extends VerifiableMeta {
  id: string;
  title: string;
  /** 体験する職業名（例：「銀行員（法人営業）」） */
  jobTitle: string;
  /** ホーム画面や導入で見せる説明 */
  description: string;
  /** 最初の場面ID */
  startSceneId: string;
  scenes: Scene[];
  params: ParamDef[];
  endings: Ending[];
}

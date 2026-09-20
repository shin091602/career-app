/**
 * ノベルゲーム型プロトタイプ（novel-bank / novel-ad）のデータ型。
 * worktree側のエージェントは編集せず、必要な変更を報告すること。
 *
 * 演出（立ち絵・テロップ・割り込み・書類ズーム・制限時間・音）は
 * すべて Scene の任意フィールドとして指定する。書かなければ素の会話場面になる。
 */
import type { AssetId, Material, Term, VerifiableMeta } from './common';

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

/** 立ち絵を置く位置 */
export type CharacterSlot = 'left' | 'center' | 'right';

/**
 * 画面に立たせる人物1体。
 * 表情差分は型を増やさず、素材IDで分ける（例：char-senior-banker-serious）。
 */
export interface StageCharacter {
  assetId: AssetId;
  slot: CharacterSlot;
  /** 話している人物。手前に出して明るく表示する */
  speaking?: boolean;
}

/** 場面に入るときの転換 */
export type SceneTransition = 'none' | 'fade' | 'blackout';

/** 時刻と場所のテロップ（例：「9:02 ／ 港南支店 融資課」） */
export interface Telop {
  time?: string;
  place?: string;
}

/** 上司や顧客からの割り込み（チャット・メール・電話） */
export interface Interrupt {
  kind: 'chat' | 'mail' | 'call';
  /** 送り主・発信者の名前 */
  from: string;
  /** メールの件名 */
  subject?: string;
  body: string;
  /** 閉じるボタンの文言。省略時は種類ごとの標準文言 */
  dismissLabel?: string;
}

/** 書類（決算書・企画書など）のズーム表示 */
export interface DocumentZoom {
  title: string;
  material: Material;
  /** 紙面イメージの素材ID（任意） */
  assetId?: AssetId;
  /** true なら場面に入った時点で開く。false なら「資料を見る」ボタンで開く */
  autoOpen?: boolean;
}

/** 制限時間が切れたときの結果 */
export interface TimeoutOutcome {
  /** バックログと結果表示に出す文言（例：「答えられず、沈黙が流れた」） */
  label: string;
  nextSceneId: string;
  effects?: ParamEffect[];
}

/** 場面に紐づく音。既定はミュートで、利用者がタップで有効化するまで鳴らない */
export interface SceneSound {
  /** 流し始めるBGMの素材ID（同じIDが続く間は鳴らし直さない） */
  bgm?: AssetId;
  /** 場面に入った瞬間に一度だけ鳴らす効果音 */
  se?: AssetId;
  /** true ならBGMを止める */
  stopBgm?: boolean;
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
  /** この場面で出てくる難語の解説 */
  terms?: Term[];
  /** 選択肢。ある場合は next より優先される */
  choices?: Choice[];
  /** 選択肢がないときに進む次の場面ID。省略時はその枝の終端 */
  next?: string;

  // --- ここから下は演出。すべて任意 ---

  /** 立ち絵。左・中央・右に最大3体まで */
  characters?: StageCharacter[];
  /** 場面に入るときの転換。省略時は 'none' */
  transition?: SceneTransition;
  /** 時刻・場所のテロップ */
  telop?: Telop;
  /** 上司・顧客からの割り込み */
  interrupt?: Interrupt;
  /** 書類のズーム表示 */
  document?: DocumentZoom;
  /**
   * 選択肢の制限時間（秒）。choices がある場面でのみ意味を持つ。
   * 指定するときは onTimeout も必ず書く
   */
  timeLimitSec?: number;
  /** 制限時間が切れたときの結果 */
  onTimeout?: TimeoutOutcome;
  /** 音（既定ミュート） */
  sound?: SceneSound;
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

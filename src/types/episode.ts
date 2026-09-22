/**
 * ノベル型プロトタイプ（novel-bank / novel-ad）のデータ型。
 *
 * 体験は「分岐する縦型ショートドラマ」。縦画面いっぱいに動画を再生し、
 * セリフは字幕としてアプリ側で重ねる（動画に文字は焼き込まない）。
 *
 * worktree側のエージェントは編集せず、必要な変更を報告すること。
 */
import type { AssetId, Term, VerifiableMeta } from './common';

/** 動画に音声が入っているか、アプリ側で音を合成するか */
export type AudioMode = 'embedded' | 'separate';

/** ゲージ（例：信頼、成果）。選択の積み重ねを見せる */
export interface GaugeDef {
  key: string;
  label: string;
  /** 中高生に何を測っているか伝えるための一文 */
  description: string;
}

export interface GaugeEffect {
  key: string;
  delta: number;
}

/** 字幕1枚。ショート動画風に短く出す */
export interface Subtitle {
  /** 話者名。ナレーションや主人公の心の声では省略する */
  speaker?: string;
  /** 本文。1行（目安24文字）に収める。長ければ字幕を分ける */
  text: string;
  /** ショット先頭からの秒数 */
  atSec: number;
  /** 表示時間（秒）。省略時は次の字幕が出るまで */
  durationSec?: number;
  /** この字幕に出てくる難語の解説 */
  terms?: Term[];
}

/**
 * 次のショットIDの代わりに書くと、**ゲージの合計点で結末を選ぶ**。
 * どの結末に行くかは EndingCard の minScore で決まる。
 */
export const SCORE_ENDING = '@ending';

/** 選択肢。ラベルは10文字以内 */
export interface Choice {
  label: string;
  /** 選んだあとに再生するショット（ふつうは反応ショット）。SCORE_ENDING も書ける */
  nextShotId: string;
  effects?: GaugeEffect[];
}

/** 制限時間が切れたときの結果 */
export interface TimeoutOutcome {
  /** 字幕ログと結果に出す文言（例：「答えられず、間が空いた」） */
  label: string;
  nextShotId: string;
  effects?: GaugeEffect[];
}

/**
 * 分岐。選択肢は必ず2つ。
 * 分かれたあとは合流させる（理由は CLAUDE.md の「ショットの書き方」を参照）。
 */
export interface Branch {
  /** 選択肢を出す秒数。省略するとショットの終わりで出す */
  atSec?: number;
  /** 制限時間（秒）。省略すると待ち続ける */
  timeLimitSec?: number;
  /** 時間切れの結果。黙っていた結果もドラマとして描く */
  onTimeout: TimeoutOutcome;
  choices: [Choice, Choice];
}

/** 時刻と場所のテロップ（例：「9:02 ／ 港南支店 融資課」） */
export interface Telop {
  time?: string;
  place?: string;
}

/** 上司や顧客からの割り込み（チャット・メール・電話） */
export interface Interrupt {
  kind: 'chat' | 'mail' | 'call';
  from: string;
  subject?: string;
  body: string;
  /** 閉じるボタンの文言。省略時は種類ごとの標準文言 */
  dismissLabel?: string;
  /** 割り込ませる秒数。省略すると0秒（ショットの頭） */
  atSec?: number;
}

/** ショットに紐づく音（audioMode: 'separate' のときに使う） */
export interface ShotSound {
  bgm?: AssetId;
  se?: AssetId;
  stopBgm?: boolean;
}

/**
 * ショットの種類
 * - story    … 本編
 * - reaction … 選択直後の反応
 * - ending   … 結末
 * - debrief  … 答え合わせ（先輩キャラが「実際の仕事では」を話す）
 */
export type ShotKind = 'story' | 'reaction' | 'ending' | 'debrief';

export interface Shot {
  id: string;
  kind: ShotKind;
  /**
   * 尺（秒）。**動画があれば動画の実際の長さが優先される**（Flow は8秒か10秒かが
   * 生成してみるまで決まらないため）。動画が無いときは、この尺で絵コンテ／静止画が進む
   */
  durationSec: number;
  /** 動画の素材ID（縦 720×1280 目安のMP4） */
  videoAssetId?: AssetId;
  /** 動画が無いときに使う静止画の素材ID。ゆっくりズームして見せる */
  imageAssetId?: AssetId;
  /** 音声方式。省略時はエピソードの既定に従う */
  audioMode?: AudioMode;
  subtitles: Subtitle[];
  telop?: Telop;
  interrupt?: Interrupt;
  sound?: ShotSound;
  /** 終わったら進む次のショット。SCORE_ENDING なら点数で結末を選ぶ */
  next?: string;
  /** 分岐。あれば next より優先される */
  branch?: Branch;
}

/** 結末と、その結果カード（タイプ診断） */
export interface EndingCard {
  id: string;
  /** kind: 'ending' のショットID */
  shotId: string;
  /** 結果カードの見出し（例：「持ち帰り型」） */
  type: string;
  /** タイプの説明。2〜3文 */
  summary: string;
  /** 結末のあとに見せる答え合わせショット（kind: 'debrief'） */
  debriefShotIds: string[];
  /**
   * この点数以上で到達する。**SCORE_ENDING で選ぶ結末には必ず書く**。
   * 条件を満たす結末のうち、いちばん高い minScore のものが選ばれ、
   * どれにも届かなければ最下位（minScore が一番低いもの）になる
   */
  minScore?: number;
}

export interface Episode extends VerifiableMeta {
  id: string;
  title: string;
  /** 体験する職業名（例：「銀行員（法人営業）」） */
  jobTitle: string;
  /** ホーム画面や一覧に出す説明 */
  description: string;
  /** このエピソードの既定の音声方式 */
  audioMode: AudioMode;
  /** 最初のショットID */
  startShotId: string;
  shots: Shot[];
  gauges: GaugeDef[];
  endings: EndingCard[];
  /** 結末の点数に使うゲージ。省略時はすべてのゲージの合計 */
  scoreGauges?: string[];
}

/** 結末を決める点数（ゲージの合計） */
export function scoreOf(episode: Episode, gauges: Record<string, number>): number {
  const keys = episode.scoreGauges ?? episode.gauges.map((gauge) => gauge.key);
  return keys.reduce((sum, key) => sum + (gauges[key] ?? 0), 0);
}

/** 点数で選ぶ結末（minScore を持つもの）を、低い順に並べて返す */
export function scoreEndings(episode: Episode): EndingCard[] {
  return episode.endings
    .filter((ending) => ending.minScore !== undefined)
    .sort((a, b) => (a.minScore ?? 0) - (b.minScore ?? 0));
}

/**
 * 点数に応じた結末を返す（SCORE_ENDING の行き先）。
 * minScore 以上の結末のうち一番高いもの。どれにも届かなければ最下位の結末。
 */
export function endingForScore(episode: Episode, score: number): EndingCard | undefined {
  const candidates = scoreEndings(episode);
  let chosen = candidates[0];
  for (const ending of candidates) {
    if ((ending.minScore ?? 0) <= score) chosen = ending;
  }
  return chosen;
}

/** ショットの実効的な音声方式を返す */
export function audioModeOf(episode: Episode, shot: Shot): AudioMode {
  return shot.audioMode ?? episode.audioMode;
}

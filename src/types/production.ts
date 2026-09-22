/**
 * 制作メモ（素材を生成するための指示書）。
 *
 * 実行時には使わない。content/<名前>/production.ts に置き、
 * ショットリスト・Flow制作シート（npm run shotlist）と
 * メディアパイプライン（npm run media）だけが読む。
 * アプリからは import しないので、バンドルには含まれない。
 */

/** 人物の設定画を作る向き */
export type CharacterAngle = 'front' | 'three-quarter' | 'profile';

/** 登場人物。設定画（無地背景）を最初に作って使い回す */
export interface ProductionCharacter {
  /** 設定画の素材ID。Flow では <id>-<向き> の名前で保存する */
  id: string;
  name: string;
  /** 見た目の指定。設定画の生成プロンプトになる（服・年齢・髪型など） */
  appearance: string;
  /** 表情違い（npm run media 用）。省略時は 'normal' だけ */
  expressions?: string[];
  /** 設定画を作る向き（Flow 用）。省略時は正面・斜め・横の3方向 */
  angles?: CharacterAngle[];
}

/** 場所。人物なしの背景として最初に作る */
export interface ProductionPlace {
  id: string;
  name: string;
  /** 背景画の生成プロンプト */
  prompt: string;
}

/**
 * キーフレーム。Flow の Frames to Video で、クリップの始点・終点に使う静止画。
 * 同じキーフレームを複数のクリップで共有すると、分岐しても継ぎ目なくつながる。
 */
export interface ProductionKeyframe {
  /** 素材ID。静止画としてアプリにも入れる（動画が無いときの代替表示になる） */
  id: string;
  /** 人が読むための名前（例：「課長がファイルを置き、見下ろす」） */
  name: string;
  /** 画像の生成プロンプト */
  prompt: string;
  placeId?: string;
  /** 映る人物。設定画を参照画像として渡す */
  characterIds?: string[];
}

export interface ShotProduction {
  /** 最初のフレーム（静止画）の生成プロンプト。キーフレームを使うショットでは省略してよい */
  imagePrompt?: string;
  /** 動画にするときの動きの指示（セリフは字幕から自動で足す） */
  motionPrompt: string;
  /** カメラ・構図のメモ（一人称視点の指示など） */
  cameraNote?: string;
  /** このショットの場所（ProductionPlace の id） */
  placeId?: string;
  /** 映る登場人物（ProductionCharacter の id）。Flow では Ingredients に入れる */
  characterIds?: string[];
  /** 音声の追加指示（環境音など） */
  soundNote?: string;
  /** Frames to Video の始点（ProductionKeyframe の id） */
  startFrame?: string;
  /** Frames to Video の終点（ProductionKeyframe の id）。省略すると始点だけで作る */
  endFrame?: string;
}

export interface ProductionNotes {
  characters: ProductionCharacter[];
  places: ProductionPlace[];
  /** Flow の Frames to Video で使う始点・終点の静止画 */
  keyframes?: ProductionKeyframe[];
  /** ショットID → 制作メモ */
  shots: Record<string, ShotProduction>;
}

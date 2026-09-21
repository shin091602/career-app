/**
 * 制作メモ（素材を生成するための指示書）。
 *
 * 実行時には使わない。content/<名前>/production.ts に置き、
 * ショットリスト生成（npm run shotlist）と
 * メディアパイプライン（npm run media）だけが読む。
 * アプリからは import しないので、バンドルには含まれない。
 */

/** 登場人物。設定画（無地背景・表情違い）を最初に作って使い回す */
export interface ProductionCharacter {
  /** 設定画の素材ID。実ファイルは <id>-<表情>.webp として生成される */
  id: string;
  name: string;
  /** 見た目の指定。設定画の生成プロンプトになる（服・年齢・髪型など） */
  appearance: string;
  /** 表情違い。省略時は 'normal' だけ作る */
  expressions?: string[];
}

/** 場所。人物なしの背景として最初に作る */
export interface ProductionPlace {
  id: string;
  name: string;
  /** 背景画の生成プロンプト */
  prompt: string;
}

export interface ShotProduction {
  /** 最初のフレーム（静止画）の生成プロンプト */
  imagePrompt: string;
  /** 動画にするときの動きの指示 */
  motionPrompt: string;
  /** カメラ・構図のメモ（一人称視点の指示など） */
  cameraNote?: string;
  /** このショットの場所（ProductionPlace の id） */
  placeId?: string;
  /** 映る登場人物（ProductionCharacter の id）。参照画像として渡される */
  characterIds?: string[];
  /** 音声の追加指示（環境音など）。セリフは字幕から自動で組み立てる */
  soundNote?: string;
}

export interface ProductionNotes {
  characters: ProductionCharacter[];
  places: ProductionPlace[];
  /** ショットID → 制作メモ */
  shots: Record<string, ShotProduction>;
}

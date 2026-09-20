/**
 * 制作メモ（素材を手作業で生成するための指示書）。
 *
 * 実行時には使わない。content/<名前>/production.ts に置き、
 * ショットリスト生成スクリプト（npm run shotlist）だけが読む。
 * アプリからは import しないので、バンドルには含まれない。
 */

export interface ProductionCharacter {
  name: string;
  /** 見た目を揃えるために参照する設定画の素材ID */
  referenceAssetId?: string;
}

export interface ShotProduction {
  /** ChatGPT 向け：静止画の生成プロンプト */
  imagePrompt: string;
  /** Google Flow 向け：画像から動画にするときの動き指示 */
  motionPrompt: string;
  /** カメラ・構図のメモ（一人称視点の指示など） */
  cameraNote?: string;
  /** 登場人物と、参照すべき設定画 */
  characters?: ProductionCharacter[];
}

/** ショットID → 制作メモ */
export type ProductionNotes = Record<string, ShotProduction>;

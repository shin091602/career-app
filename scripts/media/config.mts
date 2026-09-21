/**
 * メディアパイプラインの設定。
 *
 * モデルIDと料金は**公式ドキュメントで確認した値**（2026-09-21 時点）。
 * - 料金：https://ai.google.dev/gemini-api/docs/pricing
 * - 動画：https://ai.google.dev/gemini-api/docs/veo
 * - 画像：https://ai.google.dev/gemini-api/docs/image-generation
 *
 * 画像も動画も**無料枠は無い**（有料ティアのみ）。
 * 値上げ・値下げがあり得るので、費用を見積もるときはここだけを直す。
 */

export type Quality = 'draft' | 'mid' | 'final';

/** 生成の段階。人のチェックポイントはこの区切りに合わせる */
export type Stage = 'characters' | 'places' | 'frames' | 'videos';

export const STAGES: Stage[] = ['characters', 'places', 'frames', 'videos'];

export const STAGE_LABEL: Record<Stage, string> = {
  characters: '登場人物の設定画',
  places: '場所の背景画',
  frames: '最初のフレーム',
  videos: '動画',
};

export type ImageSize = '0.5K' | '1K' | '2K' | '4K';

export interface ImageModel {
  id: string;
  /** 画像1枚あたりの料金（ドル）。サイズごと */
  pricePerImage: Partial<Record<ImageSize, number>>;
}

export const IMAGE_MODELS = {
  liteImage: {
    id: 'gemini-3.1-flash-lite-image',
    pricePerImage: { '1K': 0.0336 },
  },
  flashImage: {
    id: 'gemini-3.1-flash-image',
    pricePerImage: { '0.5K': 0.045, '1K': 0.067, '2K': 0.101, '4K': 0.151 },
  },
  proImage: {
    id: 'gemini-3-pro-image',
    pricePerImage: { '1K': 0.134, '2K': 0.134, '4K': 0.24 },
  },
} satisfies Record<string, ImageModel>;

export type Resolution = '720p' | '1080p' | '4k';

export interface VideoModel {
  id: string;
  /** 1秒あたりの料金（ドル）。解像度ごと */
  pricePerSec: Partial<Record<Resolution, number>>;
  /** referenceImages（設定画を直接渡して見た目を揃える）に対応しているか */
  supportsReferenceImages: boolean;
}

export const VIDEO_MODELS = {
  lite: {
    id: 'veo-3.1-lite-generate-preview',
    pricePerSec: { '720p': 0.05, '1080p': 0.08 },
    supportsReferenceImages: false,
  },
  fast: {
    id: 'veo-3.1-fast-generate-preview',
    pricePerSec: { '720p': 0.1, '1080p': 0.12, '4k': 0.3 },
    supportsReferenceImages: true,
  },
  standard: {
    id: 'veo-3.1-generate-preview',
    pricePerSec: { '720p': 0.4, '1080p': 0.4, '4k': 0.6 },
    supportsReferenceImages: true,
  },
} satisfies Record<string, VideoModel>;

export interface QualityPreset {
  label: string;
  /** 設定画・背景画に使うモデル */
  sheet: { model: ImageModel; size: ImageSize };
  /** 最初のフレームに使うモデル（参照画像を多く渡すので下書きでも少し良いものを使う） */
  frame: { model: ImageModel; size: ImageSize };
  video: {
    model: VideoModel;
    /** 画像入力を受け付けなかったときに切り替える先 */
    fallbackModel?: VideoModel;
    resolution: Resolution;
    /** 設定画を referenceImages として渡すか（渡すと尺が8秒固定になる） */
    useReferenceImages: boolean;
  };
}

export const QUALITY_PRESETS: Record<Quality, QualityPreset> = {
  draft: {
    label: '下書き（構図とセリフの確認用）',
    sheet: { model: IMAGE_MODELS.liteImage, size: '1K' },
    frame: { model: IMAGE_MODELS.flashImage, size: '1K' },
    video: {
      model: VIDEO_MODELS.lite,
      fallbackModel: VIDEO_MODELS.fast,
      resolution: '720p',
      useReferenceImages: false,
    },
  },
  mid: {
    label: '中間（構図は決まった。質を上げて確かめる）',
    sheet: { model: IMAGE_MODELS.flashImage, size: '1K' },
    frame: { model: IMAGE_MODELS.proImage, size: '2K' },
    video: {
      model: VIDEO_MODELS.fast,
      resolution: '720p',
      // 設定画を直接渡せる（Lite では使えない一貫性の切り札）。尺は8秒固定になる
      useReferenceImages: true,
    },
  },
  final: {
    label: '本番（採用したショットだけ）',
    sheet: { model: IMAGE_MODELS.proImage, size: '2K' },
    frame: { model: IMAGE_MODELS.proImage, size: '2K' },
    video: {
      model: VIDEO_MODELS.standard,
      resolution: '720p',
      useReferenceImages: true,
    },
  },
};

/** Veo が一度に作れる尺。ショットの尺はこれに切り上げて生成し、あとで詰める */
export const VEO_DURATIONS = [4, 6, 8] as const;

/** referenceImages を使うときは尺が8秒固定になる（公式ドキュメント） */
export const VEO_REFERENCE_DURATION = 8;

/** referenceImages に渡せる枚数の上限 */
export const VEO_REFERENCE_MAX = 3;

/** 最初のフレームに渡せる参照画像の枚数（場所＋登場人物） */
export const FRAME_REFERENCE_MAX = 5;

/** 縦画面 */
export const SCENE_ASPECT = '9:16';
/** 設定画は人物が見やすい比率で作る */
export const SHEET_ASPECT = '3:4';

/** 画面に文字を出さないための指定 */
export const NO_TEXT_RULE = '画面に文字・字幕・ロゴ・透かしを入れない。';
export const NEGATIVE_PROMPT =
  'text, subtitles, captions, letters, numbers, watermark, logo, signage, user interface, split screen, ' +
  'illustration, anime, cartoon, drawing, painting, 3d render, cgi, plastic skin';

/** 1回の実行あたりの上限費用（ドル）。MEDIA_MAX_COST_USD で上書きできる */
export const DEFAULT_MAX_COST_USD = 5;

/** 表情キーの日本語。設定画のプロンプトに使う */
export const EXPRESSION_LABEL: Record<string, string> = {
  normal: 'ふつうの表情、口を閉じている',
  smile: 'やわらかい笑顔',
  serious: '真剣な表情',
  stern: '厳しい表情、目を細めている',
  plea: '頼み込むような表情',
  think: '考え込む表情',
};

/** Veo の尺（4/6/8秒）に切り上げる */
export function veoSecondsFor(durationSec: number): number {
  for (const candidate of VEO_DURATIONS) {
    if (durationSec <= candidate) return candidate;
  }
  return VEO_DURATIONS[VEO_DURATIONS.length - 1];
}

export function imagePrice(model: ImageModel, size: ImageSize): number {
  const price = model.pricePerImage[size];
  if (price === undefined) {
    const sizes = Object.keys(model.pricePerImage).join(' / ');
    throw new Error(`${model.id} は ${size} に対応していません（対応：${sizes}）`);
  }
  return price;
}

export function videoPricePerSec(model: VideoModel, resolution: Resolution): number {
  const price = model.pricePerSec[resolution];
  if (price === undefined) {
    throw new Error(`${model.id} は ${resolution} に対応していません`);
  }
  return price;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Gemini API の呼び出し（画像生成・動画生成）。
 *
 * - 画像：新しい interactions API で呼び、受け付けられなければ
 *   generateContent（responseModalities: IMAGE）に切り替える
 * - 動画：generateVideos は長時間処理なので、operations を10秒ごとに見に行く
 * - 安全フィルタで断られた場合は例外にせず、理由を返してスキップできるようにする
 */
import { readFile } from 'node:fs/promises';
import { GoogleGenAI } from '@google/genai';
import type { ImageSize, Resolution } from './config.mts';
import { NEGATIVE_PROMPT } from './config.mts';
import { requireApiKey } from './env.mts';

let client: GoogleGenAI | null = null;

function ai(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: requireApiKey() });
  return client;
}

export type MediaResult =
  | { ok: true; modelUsed: string; fallbackFrom?: string }
  | { ok: false; reason: string; blocked: boolean };

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** 安全フィルタ・ポリシーによる拒否か（＝作り直しても同じなのでスキップする） */
function looksBlocked(message: string): boolean {
  return /safety|blocked|prohibited|policy|rai|violat|sensitive/i.test(message);
}

/** Lite が画像入力を受け付けなかったか（＝上位モデルに切り替える） */
function looksUnsupportedInput(message: string): boolean {
  return /not support|unsupported|invalid argument|image.*not|400/i.test(message);
}

async function toInlineImage(file: string): Promise<{ mimeType: string; data: string }> {
  const bytes = await readFile(file);
  const mimeType = file.endsWith('.webp')
    ? 'image/webp'
    : file.endsWith('.jpg') || file.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/png';
  return { mimeType, data: bytes.toString('base64') };
}

export interface ImageRequest {
  model: string;
  prompt: string;
  aspect: string;
  size: ImageSize;
  /** 参照画像（場所・設定画）のファイルパス */
  refFiles: string[];
}

/** 画像を作って base64 を返す */
export async function generateImage(
  request: ImageRequest,
): Promise<{ ok: true; base64: string; modelUsed: string } | { ok: false; reason: string; blocked: boolean }> {
  const refs = await Promise.all(request.refFiles.map(toInlineImage));

  // --- まず interactions API（公式ドキュメントの現行の呼び方） ---
  try {
    const input = [
      { type: 'text' as const, text: request.prompt },
      ...refs.map((ref) => ({ type: 'image' as const, mime_type: ref.mimeType, data: ref.data })),
    ];
    const create = ai().interactions.create as unknown as (
      params: Record<string, unknown>,
    ) => Promise<{ output_image?: { data?: string } }>;

    const interaction = await create({
      model: request.model,
      input,
      response_format: {
        type: 'image',
        mime_type: 'image/png',
        aspect_ratio: request.aspect,
        image_size: request.size,
      },
    });

    const data = interaction.output_image?.data;
    if (data) return { ok: true, base64: data, modelUsed: request.model };
    // 画像が返らなかった＝断られたか、応答の形が違う。generateContent を試す
  } catch (error) {
    const message = messageOf(error);
    if (looksBlocked(message)) return { ok: false, reason: message, blocked: true };
    // それ以外は呼び方の違いかもしれないので、下の generateContent を試す
  }

  // --- 従来の generateContent（responseModalities: IMAGE） ---
  try {
    const parts = [
      { text: request.prompt },
      ...refs.map((ref) => ({ inlineData: { mimeType: ref.mimeType, data: ref.data } })),
    ];
    const response = await ai().models.generateContent({
      model: request.model,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: request.aspect, imageSize: request.size },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      const data = part.inlineData?.data;
      if (data) return { ok: true, base64: data, modelUsed: request.model };
    }
    const finish = response.candidates?.[0]?.finishReason ?? '不明';
    return { ok: false, reason: `画像が返らなかった（finishReason: ${finish}）`, blocked: true };
  } catch (error) {
    const message = messageOf(error);
    return { ok: false, reason: message, blocked: looksBlocked(message) };
  }
}

export interface VideoRequest {
  model: string;
  /** Lite が画像入力を断ったときの切り替え先 */
  fallbackModel?: string;
  prompt: string;
  /** 1コマ目に使う静止画 */
  firstFrameFile: string;
  /** 見た目を揃えるための設定画（対応モデルのみ） */
  referenceFiles: string[];
  seconds: number;
  resolution: Resolution;
  withAudio: boolean;
  /** 書き出し先 */
  downloadPath: string;
}

async function requestVideo(
  model: string,
  request: VideoRequest,
): Promise<{ ok: true } | { ok: false; reason: string; blocked: boolean }> {
  const frame = await toInlineImage(request.firstFrameFile);
  const references = await Promise.all(request.referenceFiles.map(toInlineImage));

  let operation = await ai().models.generateVideos({
    model,
    prompt: request.prompt,
    image: { imageBytes: frame.data, mimeType: frame.mimeType },
    config: {
      aspectRatio: '9:16',
      resolution: request.resolution,
      durationSeconds: request.seconds,
      numberOfVideos: 1,
      negativePrompt: NEGATIVE_PROMPT,
      generateAudio: request.withAudio,
      personGeneration: 'allow_adult',
      ...(references.length > 0
        ? {
            referenceImages: references.map((reference) => ({
              image: { imageBytes: reference.data, mimeType: reference.mimeType },
              referenceType: 'asset',
            })),
          }
        : {}),
    },
  });

  // 長時間処理。公式ドキュメントのとおり10秒ごとに様子を見る
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    operation = await ai().operations.getVideosOperation({ operation });
  }

  if (operation.error) {
    const message = JSON.stringify(operation.error);
    return { ok: false, reason: message, blocked: looksBlocked(message) };
  }

  const response = operation.response;
  if (response?.raiMediaFilteredCount && response.raiMediaFilteredCount > 0) {
    const reasons = response.raiMediaFilteredReasons?.join(' / ') ?? '理由の記載なし';
    return { ok: false, reason: `安全フィルタで生成されなかった：${reasons}`, blocked: true };
  }

  const video = response?.generatedVideos?.[0]?.video;
  if (!video) return { ok: false, reason: '動画が返らなかった', blocked: false };

  // 生成物はサーバー上に2日しか残らないので、すぐ落とす
  await ai().files.download({ file: video, downloadPath: request.downloadPath });
  return { ok: true };
}

/** 例外も「失敗」として同じ形で返す */
async function tryVideo(
  model: string,
  request: VideoRequest,
): Promise<{ ok: true } | { ok: false; reason: string; blocked: boolean }> {
  try {
    return await requestVideo(model, request);
  } catch (error) {
    const message = messageOf(error);
    return { ok: false, reason: message, blocked: looksBlocked(message) };
  }
}

/** 動画を作って downloadPath に保存する */
export async function generateVideo(request: VideoRequest): Promise<MediaResult> {
  const first = await tryVideo(request.model, request);
  if (first.ok) return { ok: true, modelUsed: request.model };

  // 画像入力を受け付けないモデルだった場合だけ、上位モデルに切り替える
  const canFallback =
    !first.blocked && Boolean(request.fallbackModel) && looksUnsupportedInput(first.reason);
  if (!canFallback || !request.fallbackModel) {
    return { ok: false, reason: first.reason, blocked: first.blocked };
  }

  console.log(
    `  ↳ ${request.model} が画像入力を受け付けませんでした（${first.reason}）。` +
      `${request.fallbackModel} に切り替えます。`,
  );
  const second = await tryVideo(request.fallbackModel, request);
  if (second.ok) {
    return { ok: true, modelUsed: request.fallbackModel, fallbackFrom: request.model };
  }
  return {
    ok: false,
    reason: `${request.fallbackModel} でも失敗：${second.reason}`,
    blocked: second.blocked,
  };
}

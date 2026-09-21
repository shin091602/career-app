/**
 * 機械可読なショットリスト（media/spec/<エピソードID>.json）。
 *
 * 脚本の正本は content/<名前>/episodes.ts と production.ts のままで、
 * このJSONはそこから生成する（二重管理をしない）。
 * パイプラインの各段階はこのJSONだけを見て動く。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Episode, PrototypeId, ProductionNotes, Shot } from '../../src/types/index.ts';
import { NOVEL_PROTOTYPES, ROOT, audioModeOf, loadPrototype } from '../episodes.mts';
import { validateEpisode } from '../validate-episode.mts';
import { EXPRESSION_LABEL, NO_TEXT_RULE, veoSecondsFor } from './config.mts';

export interface SpecCharacter {
  id: string;
  name: string;
  appearance: string;
  expressions: string[];
}

export interface SpecPlace {
  id: string;
  name: string;
  prompt: string;
}

export interface SpecShot {
  id: string;
  kind: Shot['kind'];
  /** アプリで再生する尺 */
  durationSec: number;
  /** 生成を頼む尺（Veo は 4 / 6 / 8 秒のみ） */
  veoSeconds: number;
  audioMode: string;
  videoAssetId?: string;
  imageAssetId?: string;
  placeId?: string;
  characterIds: string[];
  imagePrompt: string;
  motionPrompt: string;
  cameraNote?: string;
  soundNote?: string;
  dialogue: { speaker?: string; text: string }[];
}

export interface MediaSpec {
  episodeId: string;
  prototypeId: PrototypeId;
  title: string;
  audioMode: string;
  characters: SpecCharacter[];
  places: SpecPlace[];
  shots: SpecShot[];
}

function buildSpec(
  prototypeId: PrototypeId,
  episode: Episode,
  production: ProductionNotes,
): MediaSpec {
  return {
    episodeId: episode.id,
    prototypeId,
    title: episode.title,
    audioMode: episode.audioMode,
    characters: production.characters.map((character) => ({
      id: character.id,
      name: character.name,
      appearance: character.appearance,
      expressions: character.expressions ?? ['normal'],
    })),
    places: production.places.map((place) => ({ ...place })),
    shots: episode.shots.map((shot) => {
      const note = production.shots[shot.id];
      return {
        id: shot.id,
        kind: shot.kind,
        durationSec: shot.durationSec,
        veoSeconds: veoSecondsFor(shot.durationSec),
        audioMode: audioModeOf(episode, shot),
        videoAssetId: shot.videoAssetId,
        imageAssetId: shot.imageAssetId,
        placeId: note?.placeId,
        characterIds: note?.characterIds ?? [],
        imagePrompt: note?.imagePrompt ?? '',
        motionPrompt: note?.motionPrompt ?? '',
        cameraNote: note?.cameraNote,
        soundNote: note?.soundNote,
        dialogue: shot.subtitles
          // 「（あなた）」は心の声なので声にはしない
          .filter((subtitle) => subtitle.speaker && !subtitle.speaker.startsWith('（'))
          .map((subtitle) => ({ speaker: subtitle.speaker, text: subtitle.text })),
      };
    }),
  };
}

/** 全ノベルプロトタイプのエピソードを読み、検査してから spec を返す */
export async function loadSpecs(): Promise<MediaSpec[]> {
  const specs: MediaSpec[] = [];
  const problems: string[] = [];

  for (const prototypeId of NOVEL_PROTOTYPES) {
    const { episodes, production } = await loadPrototype(prototypeId);
    for (const episode of episodes) {
      problems.push(...validateEpisode(prototypeId, episode, production));
      specs.push(buildSpec(prototypeId, episode, production));
    }
  }

  if (problems.length > 0) {
    const lines = problems.map((problem) => `  - ${problem}`).join('\n');
    throw new Error(`エピソードに問題があります。直してから実行してください。\n${lines}`);
  }
  return specs;
}

export async function loadSpec(episodeId: string): Promise<MediaSpec> {
  const specs = await loadSpecs();
  const spec = specs.find((candidate) => candidate.episodeId === episodeId);
  if (!spec) {
    const known = specs.map((candidate) => candidate.episodeId).join(' / ') || 'なし';
    throw new Error(`エピソード ${episodeId} が見つかりません（あるのは：${known}）`);
  }
  return spec;
}

/** media/spec/<エピソードID>.json に書き出す（人が見るため・差分を見るため） */
export async function writeSpec(spec: MediaSpec): Promise<string> {
  const dir = path.join(ROOT, 'media', 'spec');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${spec.episodeId}.json`);
  await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
  return path.relative(ROOT, file);
}

// ===== プロンプトの組み立て =====

export function characterSheetPrompt(
  character: SpecCharacter,
  expression: string,
  /** 最初の表情の設定画を参照画像として渡すか（2枚目以降） */
  withReference = false,
): string {
  const face = EXPRESSION_LABEL[expression] ?? expression;
  return [
    `キャラクター設定画。${character.appearance}`,
    withReference
      ? '参照画像と同じ人物。顔・髪型・ひげの有無・服装・絵柄を変えず、表情だけ差し替える。'
      : '',
    `${face}。正面から上半身、まっすぐ立っている。`,
    '背景は無地の薄いグレー。影は柔らかく。日本のアニメ調。',
    '実在の人物・企業・ロゴを思わせるものは出さない。',
    NO_TEXT_RULE,
  ]
    .filter((line) => line !== '')
    .join(' ');
}

export function placePrompt(place: SpecPlace): string {
  return [place.prompt, '人物は映さない。実在の企業名やロゴは出さない。', NO_TEXT_RULE].join(' ');
}

/** 最初のフレーム。場所と設定画を参照画像として一緒に渡す */
export function framePrompt(shot: SpecShot, spec: MediaSpec): string {
  const characters = shot.characterIds
    .map((id) => spec.characters.find((character) => character.id === id))
    .filter((character): character is SpecCharacter => Boolean(character));

  const lines = [
    `動画の最初のコマになる静止画。${shot.imagePrompt}`,
    shot.cameraNote ?? '',
    characters.length > 0
      ? `参照画像の人物をそのまま使う（顔・髪型・服装を変えない）：${characters
          .map((character) => character.name)
          .join('、')}。`
      : '',
    shot.placeId ? '背景は参照画像の場所と同じ部屋にする。' : '',
    NO_TEXT_RULE,
  ];
  return lines.filter((line) => line !== '').join(' ');
}

/** 動画。セリフは引用符で囲むと Veo が日本語でしゃべる（公式ドキュメント） */
export function videoPrompt(shot: SpecShot): string {
  const lines = [shot.motionPrompt, shot.cameraNote ?? ''];

  if (shot.audioMode === 'embedded' && shot.dialogue.length > 0) {
    const dialogue = shot.dialogue
      .map((line) => `${line.speaker}が日本語で「${line.text}」と言う`)
      .join('。');
    lines.push(`セリフ（日本語・自然な話し方で、口の動きを合わせる）：${dialogue}。`);
  } else {
    lines.push('セリフは入れない。');
  }

  if (shot.soundNote) lines.push(`音：${shot.soundNote}`);
  lines.push(NO_TEXT_RULE);

  return lines.filter((line) => line !== '').join(' ');
}

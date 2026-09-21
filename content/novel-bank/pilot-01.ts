import type { Episode } from '../../src/types';

/**
 * 試作用エピソード（3ショット）。
 *
 * 目的は素材の作り方の検証。
 * - 手作業（ChatGPT + Google Flow）と自動生成（npm run media）で
 *   同じ3ショットを作り、**顔の一貫性・日本語のセリフ・口の動き**を見比べる
 * - 音声方式の比較も兼ねる
 *   - p1 / p2 は audioMode: 'embedded'（動画に音声が入っている想定）
 *   - p3 は audioMode: 'separate'（無音動画に、アプリ側でBGMと効果音を重ねる）
 *
 * 登場人物は融資課長と町工場の社長の2人、場所は支店の応接室だけ。
 * 素材が無いあいだは絵コンテ風で実尺どおりに再生される。
 */
export const pilotEpisode: Episode = {
  id: 'pilot-01',
  title: '【試作】素材の作り方の検証',
  jobTitle: '銀行員（法人営業）',
  description: '3ショットだけの検証用。手作業と自動生成を見比べ、音声方式も確かめる。',
  verified: false,
  sources: [],
  audioMode: 'embedded',
  startShotId: 'p1',
  gauges: [{ key: 'trust', label: '信頼', description: '相手の話を正面から受け止められたか。' }],
  shots: [
    {
      id: 'p1',
      kind: 'story',
      durationSec: 6,
      videoAssetId: 'v-p1-order',
      imageAssetId: 'i-p1-order',
      audioMode: 'embedded',
      telop: { time: '17:40', place: '港南支店 応接室' },
      subtitles: [
        { speaker: '融資課長', text: '新人、この融資は君が判断しろ。', atSec: 0.8 },
        { speaker: '融資課長', text: '明日の朝までだ。', atSec: 3.6 },
      ],
      next: 'p2',
    },
    {
      id: 'p2',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-p2-plea',
      imageAssetId: 'i-p2-plea',
      audioMode: 'embedded',
      subtitles: [
        { speaker: '山田社長', text: 'どうか……', atSec: 1.2 },
        { speaker: '山田社長', text: 'この工場を守りたいんです。', atSec: 2.6 },
        { speaker: '（あなた）', text: '……どう答える。', atSec: 5.0 },
      ],
      branch: {
        atSec: 6.0,
        timeLimitSec: 8,
        onTimeout: {
          label: '答えられない',
          nextShotId: 'p3',
          effects: [{ key: 'trust', delta: -1 }],
        },
        choices: [
          { label: 'すぐ手配します', nextShotId: 'p3', effects: [{ key: 'trust', delta: -1 }] },
          { label: '詳しく聞かせて', nextShotId: 'p3', effects: [{ key: 'trust', delta: 2 }] },
        ],
      },
    },
    {
      id: 'p3',
      kind: 'ending',
      durationSec: 6,
      videoAssetId: 'v-p3-proof',
      imageAssetId: 'i-p3-proof',
      // 無音動画＋アプリ側の音。BGMと効果音の素材が無いうちは無音のまま進む
      audioMode: 'separate',
      sound: { bgm: 'bgm-office', se: 'se-notify' },
      subtitles: [
        { speaker: '融資課長', text: '根拠は？', atSec: 0.8 },
        { speaker: '融資課長', text: '数字で説明できるか。', atSec: 2.4 },
      ],
    },
  ],
  endings: [
    {
      id: 'pilot-ending',
      shotId: 'p3',
      type: '検証用',
      summary: '試作用のエピソードなので、結末は1つだけ。素材の作り方と音声方式の比較に使う。',
      debriefShotIds: [],
    },
  ],
};

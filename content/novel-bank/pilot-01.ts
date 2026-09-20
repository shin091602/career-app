import type { Episode } from '../../src/types';

/**
 * 試作用エピソード（3ショット）。
 *
 * 目的は素材の差し替えと**音声方式の検証**。
 * - s1 / s2 は audioMode: 'embedded'（動画に音声が入っている想定）
 * - s3 は audioMode: 'separate'（無音動画に、アプリ側でBGMと効果音を重ねる）
 *
 * 本編を作る前に、この1本で「どちらの方式が扱いやすいか」を確かめる。
 * 素材が無いあいだは絵コンテ風で実尺どおりに再生される。
 */
export const pilotEpisode: Episode = {
  id: 'pilot-01',
  title: '【試作】音声方式の確認',
  jobTitle: '銀行員（法人営業）',
  description: '3ショットだけの検証用。素材の差し替えと音声方式を確かめる。',
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
      videoAssetId: 'v-p1-desk',
      imageAssetId: 'i-p1-desk',
      audioMode: 'embedded',
      telop: { time: '9:02', place: '港南支店 融資課' },
      subtitles: [
        { speaker: '先輩', text: '今日、山田製作所に行くぞ。', atSec: 0.5 },
        { speaker: '先輩', text: '新しい機械を入れたいらしい。', atSec: 3.2 },
      ],
      next: 'p2',
    },
    {
      id: 'p2',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-p2-owner',
      imageAssetId: 'i-p2-owner',
      audioMode: 'embedded',
      subtitles: [
        { speaker: '山田社長', text: '3,000万、貸してもらえないかな。', atSec: 0.5 },
        { speaker: '（あなた）', text: '……どう答える？', atSec: 4.0 },
      ],
      branch: {
        atSec: 5.5,
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
      videoAssetId: 'v-p3-silent',
      imageAssetId: 'i-p3-silent',
      // 無音動画＋アプリ側の音。BGMと効果音の素材が無いうちは無音のまま進む
      audioMode: 'separate',
      sound: { bgm: 'bgm-office', se: 'se-notify' },
      subtitles: [{ speaker: '先輩', text: '持ち帰ろう。それでいい。', atSec: 0.8 }],
    },
  ],
  endings: [
    {
      id: 'pilot-ending',
      shotId: 'p3',
      type: '検証用',
      summary: '試作用のエピソードなので、結末は1つだけ。音声方式の比較に使う。',
      debriefShotIds: [],
    },
  ],
};

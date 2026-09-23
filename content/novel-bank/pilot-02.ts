import type { Episode } from '../../src/types';
import { SCORE_ENDING } from '../../src/types';

/**
 * 試作エピソード2「明日の朝までだ」（Flow で作る縦切り）。
 *
 * 動画は Google Flow（Veo 3.1）の Frames to Video で1本ずつ作る前提の、ターン制の見本。
 *
 * - **1ターン＝本編1本 → 選択 → 分岐した反応1本**
 * - 本編は最後のコマで止めて選択肢を出す。反応の2本はそのコマ（キーフレーム）から始まる
 * - 結末は3つ。ゲージの合計点で決まる（成功／失敗の二択にしない）
 * - 尺は Flow の出力（8秒か10秒）に合わせて自動で決まる。字幕は8秒でも収まる位置に置く
 *
 * 登場人物は融資課長と町工場の社長、場所は支店の応接室だけ。
 * 登場する会社・人物・数値はすべて架空。裏取りをしていないので verified: false。
 */
export const pilotEpisode02: Episode = {
  id: 'pilot-02',
  title: '【試作】明日の朝までだ',
  jobTitle: '銀行員（法人営業）',
  description: '融資の判断を任された新人の、ひと晩。3回の選択で結末が変わる。',
  verified: false,
  sources: [],
  audioMode: 'embedded',
  startShotId: 'p0-desk',
  prologue: {
    lines: [
      '入行1年目。配属は融資課。',
      '町工場から、3,000万円の相談。',
      '判断を任された。明日の朝までに。',
    ],
    hint: '選択肢は2つ。迷って黙っていても、話は進みます。',
  },
  lessons: [
    '融資は「返せるかどうか」で判断する',
    '相手の熱意と、数字の裏づけは別々に確かめる',
    '売上が1社に偏ると、止まったとき一気に苦しくなる',
  ],
  gauges: [
    { key: 'trust', label: '信頼', description: '相手の話を正面から受け止められたか。' },
    { key: 'result', label: '根拠', description: '判断を数字と事実で支えられたか。' },
  ],
  shots: [
    // ===== プロローグ：手元の資料から、課長が入ってくるまで =====
    {
      id: 'p0-desk',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-p0-desk',
      imageAssetId: 'k-p0-desk',
      telop: { time: '17:38', place: '港南支店 応接室' },
      subtitles: [
        { speaker: '（あなた）', text: '入行1年目。配属は、融資課。', atSec: 0.6 },
        { speaker: '（あなた）', text: '町工場から、3,000万円の相談。', atSec: 3.2 },
        { speaker: '（あなた）', text: '……数字は、ひととおり見た。', atSec: 5.8 },
      ],
      next: 't1-order',
    },

    // ===== ターン1：課長からの指示 =====
    {
      id: 't1-order',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-t1-order',
      imageAssetId: 'k-t1-walk',
      telop: { time: '17:40', place: '港南支店 応接室' },
      subtitles: [
        { speaker: '融資課長', text: '新人、この融資は君が判断しろ。', atSec: 0.2 },
        { speaker: '融資課長', text: '明日の朝までだ。', atSec: 2.5 },
      ],
      branch: {
        question: '課長に、どう返す？',
        timeLimitSec: 8,
        onTimeout: {
          label: '黙ってうなずいた',
          nextShotId: 't1a-accept',
          effects: [{ key: 'trust', delta: -1 }],
        },
        choices: [
          {
            label: '承知しました',
            nextShotId: 't1a-accept',
            effects: [{ key: 'result', delta: 1 }],
          },
          {
            label: '判断の基準は？',
            nextShotId: 't1b-criteria',
            effects: [
              { key: 'trust', delta: 1 },
              { key: 'result', delta: 1 },
            ],
          },
        ],
      },
    },
    {
      id: 't1a-accept',
      kind: 'reaction',
      durationSec: 8,
      videoAssetId: 'v-t1a-accept',
      imageAssetId: 'k-t1-wait',
      subtitles: [
        { speaker: '融資課長', text: '……即答か。', atSec: 0.2 },
        { speaker: '融資課長', text: 'なら根拠も、明日聞かせてもらう。', atSec: 2.2 },
      ],
      next: 't2-plea',
    },
    {
      id: 't1b-criteria',
      kind: 'reaction',
      durationSec: 8,
      videoAssetId: 'v-t1b-criteria',
      imageAssetId: 'k-t1-wait',
      subtitles: [
        { speaker: '融資課長', text: 'いい質問だ。', atSec: 0.3 },
        {
          speaker: '融資課長',
          text: '返せるかどうか。それだけを見ろ。',
          atSec: 2.2,
          terms: [
            {
              term: '返済能力',
              description: '借りたお金を、約束どおりに返していけるか。融資の判断でいちばん大事な点。',
            },
          ],
        },
      ],
      next: 't2-plea',
    },

    // ===== ターン2：社長の頼み =====
    {
      id: 't2-plea',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-t2-plea',
      imageAssetId: 'k-t2-bow',
      telop: { time: '18:05', place: '港南支店 応接室' },
      subtitles: [
        { speaker: '山田社長', text: 'どうか……', atSec: 0.6 },
        { speaker: '山田社長', text: 'この工場を守りたいんです。', atSec: 3.6 },
      ],
      branch: {
        question: '社長に、どう答える？',
        timeLimitSec: 8,
        onTimeout: {
          label: '言葉が出なかった',
          nextShotId: 't2b-numbers',
          effects: [{ key: 'trust', delta: -1 }],
        },
        choices: [
          {
            label: '必ず通します',
            nextShotId: 't2a-promise',
            effects: [
              { key: 'trust', delta: 2 },
              { key: 'result', delta: -2 },
            ],
          },
          {
            label: '数字を見せてください',
            nextShotId: 't2b-numbers',
            effects: [
              { key: 'trust', delta: 1 },
              { key: 'result', delta: 2 },
            ],
          },
        ],
      },
    },
    {
      id: 't2a-promise',
      kind: 'reaction',
      durationSec: 8,
      videoAssetId: 'v-t2a-promise',
      imageAssetId: 'k-t2-look',
      subtitles: [
        { speaker: '山田社長', text: 'ありがとうございます……！', atSec: 0.3 },
        { speaker: '山田社長', text: 'これで、みんなに顔向けできます。', atSec: 4.7 },
      ],
      next: 't3-proof',
    },
    {
      id: 't2b-numbers',
      kind: 'reaction',
      durationSec: 8,
      videoAssetId: 'v-t2b-numbers',
      imageAssetId: 'k-t2-look',
      subtitles: [
        {
          speaker: '山田社長',
          text: '……これが、うちの3年分です。',
          atSec: 0.5,
          terms: [
            {
              term: '決算書',
              description: '会社の1年分の売上・費用・借金などをまとめた書類。融資の判断の土台になる。',
            },
          ],
        },
        { speaker: '山田社長', text: '1社に、ずいぶん頼ってましてね。', atSec: 4.8 },
      ],
      next: 't3-proof',
    },

    // ===== ターン3：課長の問い =====
    {
      id: 't3-proof',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-t3-proof',
      imageAssetId: 'k-t3-sit',
      telop: { time: '19:20', place: '港南支店 応接室' },
      subtitles: [
        { speaker: '融資課長', text: 'で、どうだった。', atSec: 0.6 },
        { speaker: '融資課長', text: '根拠は？　数字で説明できるか。', atSec: 3.0 },
      ],
      branch: {
        question: '根拠として、何を出す？',
        timeLimitSec: 10,
        onTimeout: {
          label: '答えられなかった',
          nextShotId: 't3a-growth',
          effects: [{ key: 'result', delta: -2 }],
        },
        choices: [
          {
            label: '売上は伸びています',
            nextShotId: 't3a-growth',
            effects: [{ key: 'result', delta: 1 }],
          },
          {
            label: '取引先が偏っています',
            nextShotId: 't3b-risk',
            effects: [
              { key: 'trust', delta: 1 },
              { key: 'result', delta: 2 },
            ],
          },
        ],
      },
    },
    {
      id: 't3a-growth',
      kind: 'reaction',
      durationSec: 8,
      videoAssetId: 'v-t3a-growth',
      imageAssetId: 'k-t3-lean',
      subtitles: [
        { speaker: '融資課長', text: '伸びている、だけか。', atSec: 0.6 },
        { speaker: '融資課長', text: '止まったときの話をしてみろ。', atSec: 3.0 },
      ],
      next: SCORE_ENDING,
    },
    {
      id: 't3b-risk',
      kind: 'reaction',
      durationSec: 8,
      videoAssetId: 'v-t3b-risk',
      imageAssetId: 'k-t3-lean',
      subtitles: [
        { speaker: '融資課長', text: '……そこに気づいたか。', atSec: 0.3 },
        { speaker: '融資課長', text: 'なら、打てる手もある。', atSec: 3.4 },
      ],
      next: SCORE_ENDING,
    },

    // ===== 結末（点数で決まる） =====
    {
      id: 'e-high',
      kind: 'ending',
      durationSec: 8,
      videoAssetId: 'v-e-high',
      imageAssetId: 'k-end',
      subtitles: [
        { speaker: '融資課長', text: '明日、一緒に社長のところへ行こう。', atSec: 0.8 },
        {
          speaker: '融資課長',
          text: '稟議は、君が書け。',
          atSec: 3.8,
          terms: [
            {
              term: '稟議（りんぎ）',
              description: '貸してよいかを社内で検討して決める手続き。担当が資料を作って上司に諮る。',
            },
          ],
        },
      ],
    },
    {
      id: 'e-mid',
      kind: 'ending',
      durationSec: 8,
      videoAssetId: 'v-e-mid',
      imageAssetId: 'k-end',
      subtitles: [
        { speaker: '融資課長', text: '明日の朝、もう一度だ。', atSec: 0.4 },
        { speaker: '融資課長', text: '数字の出どころまで見てこい。', atSec: 3.7 },
      ],
    },
    {
      id: 'e-low',
      kind: 'ending',
      durationSec: 8,
      videoAssetId: 'v-e-low',
      imageAssetId: 'k-end',
      subtitles: [
        { speaker: '融資課長', text: '……今回は、私が見る。', atSec: 0.4 },
        { speaker: '融資課長', text: '社長の顔だけで、判断するな。', atSec: 4.1 },
      ],
    },
  ],
  endings: [
    {
      id: 'ending-high',
      shotId: 'e-high',
      type: '根拠で語れる新人',
      summary:
        '相手の気持ちを受け止めたうえで、数字の弱点まで自分から話せた。融資の担当に求められるのは、この両方を持つこと。',
      debriefShotIds: [],
      minScore: 6,
    },
    {
      id: 'ending-mid',
      shotId: 'e-mid',
      type: '伸びしろのある新人',
      summary:
        '筋は悪くないが、あと一歩の確認が足りなかった。数字が「伸びている」だけでなく、どこから来ているかまで見るのが次の課題。',
      debriefShotIds: [],
      minScore: 2,
    },
    {
      id: 'ending-low',
      shotId: 'e-low',
      type: '気持ちが先に立つ新人',
      summary:
        '社長の思いに応えたい気持ちは本物だった。ただ、融資は情だけでは決められない。守りたいものがあるほど、根拠が要る。',
      debriefShotIds: [],
      // 最下位。どの点数帯にも届かなければここになる
      minScore: -Infinity,
    },
  ],
};

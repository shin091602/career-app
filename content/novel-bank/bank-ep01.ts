import type { Episode } from '../../src/types';

/**
 * 銀行員編 第1話「3,000万円の相談」。
 *
 * - 一人称視点。主人公（あなた＝新人）は画面に映さない
 * - 冒頭3秒で社長の依頼から始め、そのあと朝に戻る
 * - 分岐は2回。どちらも合流型（増えるのは反応ショットだけ）
 * - 結末は2つ。結果カードのタイプ診断で回収状況を見せる
 * - 最後は課長の一言で次回に引く
 * - 1ショットは8秒以下（動画生成の上限に合わせ、カットを速くする）
 *
 * 登場する会社・人物・数値はすべて架空。取材・裏取りをしていないため
 * verified: false、sources は空にしてある。
 */
export const bankEpisode01: Episode = {
  id: 'bank-ep01',
  title: '第1話 3,000万円の相談',
  jobTitle: '銀行員（法人営業）',
  description: '取引先の町工場から「機械を買いたい」と相談された。あなたは1年目の法人営業。',
  verified: false,
  sources: [],
  audioMode: 'embedded',
  startShotId: 's01-hook',
  gauges: [
    { key: 'trust', label: '信頼', description: '相手の話を正面から受け止められたか。' },
    { key: 'result', label: '成果', description: '仕事として前に進められたか。' },
  ],
  shots: [
    // ===== つかみ（3秒） =====
    {
      id: 's01-hook',
      kind: 'story',
      durationSec: 4,
      videoAssetId: 'v-s01-hook',
      imageAssetId: 'i-s01-hook',
      subtitles: [
        { speaker: '山田社長', text: 'なんとか、貸してもらえないかな。', atSec: 0.3 },
        { text: '——3時間前。', atSec: 2.6 },
      ],
      next: 's02-morning',
    },

    // ===== 支店の朝 =====
    {
      id: 's02-morning',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-s02-morning',
      imageAssetId: 'i-s02-morning',
      telop: { time: '9:02', place: '港南支店 融資課' },
      subtitles: [
        { speaker: '佐伯', text: '今日、山田製作所へ行く。', atSec: 0.6 },
        { speaker: '佐伯', text: '新しい機械を入れたいそうだ。', atSec: 3.0 },
        {
          speaker: '佐伯',
          text: 'お前が主担当な。',
          atSec: 5.6,
          terms: [
            {
              term: '主担当',
              description: 'その取引先のことを一番よく知っておく係。窓口になり、社内へ説明する。',
            },
          ],
        },
      ],
      next: 's03-chat',
    },

    // ===== 課長からのチャットが割り込む =====
    {
      id: 's03-chat',
      kind: 'story',
      durationSec: 6,
      videoAssetId: 'v-s03-desk',
      imageAssetId: 'i-s03-desk',
      interrupt: {
        kind: 'chat',
        from: '融資課長',
        body: '行く前に、ここ3年の数字を見ておくこと。\n感触だけで帰ってこないように。',
        atSec: 1.0,
      },
      subtitles: [
        { speaker: '（あなた）', text: '……数字を見ておけ、か。', atSec: 2.0 },
        {
          speaker: '（あなた）',
          text: '売上は伸びてる。借入も減ってる。',
          atSec: 4.2,
          terms: [
            {
              term: '借入',
              description: '銀行などから借りているお金。返し終わっていない分を借入残高という。',
            },
          ],
        },
      ],
      next: 's04-move',
    },

    // ===== 移動 =====
    {
      id: 's04-move',
      kind: 'story',
      durationSec: 4,
      videoAssetId: 'v-s04-move',
      imageAssetId: 'i-s04-move',
      telop: { time: '10:30', place: '山田製作所' },
      subtitles: [{ speaker: '佐伯', text: '数字は頭に入ったな。', atSec: 0.6 }],
      next: 's05-ask',
    },

    // ===== 分岐1：社長の依頼への最初の一言 =====
    {
      id: 's05-ask',
      kind: 'story',
      durationSec: 6,
      videoAssetId: 'v-s05-ask',
      imageAssetId: 'i-s05-ask',
      subtitles: [
        { speaker: '山田社長', text: '注文が増えてね。機械が追いつかない。', atSec: 0.5 },
        { speaker: '山田社長', text: '3,000万、なんとかならないか。', atSec: 3.2 },
      ],
      next: 's05b-wait',
    },

    // ----- 分岐そのものは「返事を待たれている4秒」に分けてある -----
    {
      id: 's05b-wait',
      kind: 'story',
      durationSec: 4,
      videoAssetId: 'v-s05b-wait',
      imageAssetId: 'i-s05b-wait',
      subtitles: [{ speaker: '（あなた）', text: '……どう答える。', atSec: 0.4 }],
      branch: {
        atSec: 1.6,
        timeLimitSec: 10,
        onTimeout: {
          label: '答えられなかった',
          nextShotId: 's06b-silence',
          effects: [{ key: 'trust', delta: -1 }],
        },
        choices: [
          {
            label: 'お任せください',
            nextShotId: 's06b-silence',
            effects: [
              { key: 'trust', delta: 1 },
              { key: 'result', delta: -2 },
            ],
          },
          {
            label: '使いみちを教えて',
            nextShotId: 's06a-listen',
            effects: [
              { key: 'trust', delta: 2 },
              { key: 'result', delta: 2 },
            ],
          },
        ],
      },
    },

    // ----- 反応ショット（合流する） -----
    {
      id: 's06a-listen',
      kind: 'reaction',
      durationSec: 6,
      videoAssetId: 'v-s06a-listen',
      imageAssetId: 'i-s06a-listen',
      subtitles: [
        { speaker: '山田社長', text: 'よく聞いてくれたね。', atSec: 0.5 },
        { speaker: '山田社長', text: '注文元は3社。うち1社で7割だ。', atSec: 2.8 },
      ],
      next: 's07-turn',
    },
    {
      id: 's06b-silence',
      kind: 'reaction',
      durationSec: 6,
      videoAssetId: 'v-s06b-silence',
      imageAssetId: 'i-s06b-silence',
      subtitles: [
        { speaker: '佐伯', text: '——社長、少しお時間を。', atSec: 0.6 },
        { speaker: '（あなた）', text: '……助けられた。', atSec: 3.4 },
      ],
      next: 's07-turn',
    },

    // ===== 合流。ここで話が動く =====
    {
      id: 's07-turn',
      kind: 'story',
      durationSec: 6,
      videoAssetId: 'v-s07-turn',
      imageAssetId: 'i-s07-turn',
      subtitles: [
        { speaker: '山田社長', text: '実は、その1社から話が来ていて。', atSec: 0.5 },
        { speaker: '山田社長', text: '来期は量を減らすかもしれない、と。', atSec: 3.2 },
      ],
      next: 's07b-weight',
    },
    {
      id: 's07b-weight',
      kind: 'story',
      durationSec: 4,
      videoAssetId: 'v-s07b-weight',
      imageAssetId: 'i-s07b-weight',
      subtitles: [
        { speaker: '（あなた）', text: '聞かなかったことには、できない。', atSec: 0.4 },
      ],
      next: 's08-decide',
    },

    // ===== 分岐2：その情報をどう扱うか =====
    {
      id: 's08-decide',
      kind: 'story',
      durationSec: 8,
      videoAssetId: 'v-s08-decide',
      imageAssetId: 'i-s08-decide',
      subtitles: [
        { speaker: '佐伯', text: '（お前が決めろ、という目）', atSec: 0.6 },
        { speaker: '（あなた）', text: 'ここで、何を言う。', atSec: 3.0 },
      ],
      branch: {
        atSec: 5.0,
        timeLimitSec: 10,
        onTimeout: {
          label: '言い出せなかった',
          nextShotId: 's09b-hold',
          effects: [{ key: 'trust', delta: -1 }],
        },
        choices: [
          {
            label: '今日は預かります',
            nextShotId: 's09a-carry',
            effects: [
              { key: 'trust', delta: 2 },
              { key: 'result', delta: 1 },
            ],
          },
          {
            label: '金額を下げては',
            nextShotId: 's09b-hold',
            effects: [
              { key: 'trust', delta: -1 },
              { key: 'result', delta: 2 },
            ],
          },
        ],
      },
    },

    // ----- 反応ショット（それぞれの結末へ） -----
    {
      id: 's09a-carry',
      kind: 'reaction',
      durationSec: 6,
      videoAssetId: 'v-s09a-carry',
      imageAssetId: 'i-s09a-carry',
      subtitles: [
        { speaker: '（あなた）', text: '今日のお話、預からせてください。', atSec: 0.5 },
        { speaker: '山田社長', text: '……ありがとう。待つよ。', atSec: 3.4 },
      ],
      next: 'e01-carry',
    },
    {
      id: 's09b-hold',
      kind: 'reaction',
      durationSec: 6,
      videoAssetId: 'v-s09b-hold',
      imageAssetId: 'i-s09b-hold',
      subtitles: [
        { speaker: '（あなた）', text: '金額を見直す手もあります。', atSec: 0.5 },
        { speaker: '山田社長', text: '……そうか。考えてみる。', atSec: 3.6 },
      ],
      next: 'e02-propose',
    },

    // ===== 結末1 =====
    {
      id: 'e01-carry',
      kind: 'ending',
      durationSec: 8,
      videoAssetId: 'v-e01-carry',
      imageAssetId: 'i-e01-carry',
      telop: { time: '15:40', place: '港南支店 融資課' },
      subtitles: [
        { speaker: '融資課長', text: '聞いてきたことを、一枚にまとめて。', atSec: 0.6 },
        { speaker: '融資課長', text: '——その7割の話、本当か？', atSec: 4.0 },
      ],
    },

    // ===== 結末2 =====
    {
      id: 'e02-propose',
      kind: 'ending',
      durationSec: 8,
      videoAssetId: 'v-e02-propose',
      imageAssetId: 'i-e02-propose',
      telop: { time: '15:40', place: '港南支店 融資課' },
      subtitles: [
        { speaker: '融資課長', text: '金額を下げる提案をしたのか。', atSec: 0.6 },
        { speaker: '融資課長', text: '——それ、社長は納得してたか？', atSec: 4.0 },
      ],
    },

    // ===== 答え合わせ（先輩キャラの短いショット） =====
    {
      id: 'd01-decide',
      kind: 'debrief',
      durationSec: 6,
      videoAssetId: 'v-d01-decide',
      imageAssetId: 'i-d01-decide',
      subtitles: [
        { speaker: '佐伯', text: '融資は、担当がその場で決めない。', atSec: 0.5 },
        {
          speaker: '佐伯',
          text: '資料をそろえて、社内で検討するんだ。',
          atSec: 3.2,
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
      id: 'd01b-visit',
      kind: 'debrief',
      durationSec: 4,
      videoAssetId: 'v-d01b-visit',
      imageAssetId: 'i-d01b-visit',
      subtitles: [{ speaker: '佐伯', text: '訪問の仕事は「聞き出すこと」だよ。', atSec: 0.4 }],
    },
    {
      id: 'd02-concentration',
      kind: 'debrief',
      durationSec: 6,
      videoAssetId: 'v-d02-concentration',
      imageAssetId: 'i-d02-concentration',
      subtitles: [
        { speaker: '佐伯', text: '1社で7割。良い話にも危ない話にもなる。', atSec: 0.5 },
        { speaker: '佐伯', text: '止まったとき、一気に苦しくなるからね。', atSec: 3.2 },
      ],
    },
    {
      id: 'd02b-origin',
      kind: 'debrief',
      durationSec: 4,
      videoAssetId: 'v-d02b-origin',
      imageAssetId: 'i-d02b-origin',
      subtitles: [{ speaker: '佐伯', text: '数字は「どこから来たか」まで見る。', atSec: 0.4 }],
    },
  ],
  endings: [
    {
      id: 'ending-carry',
      shotId: 'e01-carry',
      type: '持ち帰り型',
      summary:
        'その場で答えを出さず、確かめるべきことを持ち帰った。実務に近い判断だが、相手を待たせる責任も引き受けることになる。',
      debriefShotIds: ['d01-decide', 'd01b-visit', 'd02-concentration', 'd02b-origin'],
    },
    {
      id: 'ending-propose',
      shotId: 'e02-propose',
      type: '提案先行型',
      summary:
        'その場で代案を出して前に進めた。動きは早いが、相手が本当に納得しているかを確かめる手間が残る。',
      debriefShotIds: ['d01-decide', 'd01b-visit', 'd02-concentration', 'd02b-origin'],
    },
  ],
};

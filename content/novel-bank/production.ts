import type { ProductionNotes } from '../../src/types';

/**
 * 素材の制作メモ（ショットID → 生成プロンプト）。
 * アプリからは読まれず、npm run shotlist だけが使う。
 *
 * 共通の決まり：
 * - **一人称視点。主人公（あなた＝新人）は画面に映さない。**
 *   手元・相手の顔・書類・窓の外などで「自分が見ている景色」を作る
 * - 実在の企業名・ロゴ・実在人物を思わせるものを出さない
 * - 画面に文字を焼き込まない（字幕はアプリ側で重ねる）
 * - 縦 9:16。まず静止画を作り、それを動かして動画にする
 */

/** 見た目を揃えるための設定画（最初に作って使い回す） */
const SAEKI = { name: '佐伯（先輩行員・30代半ば）', referenceAssetId: 'ref-saeki' };
const OWNER = { name: '山田社長（60代・町工場の社長）', referenceAssetId: 'ref-yamada' };

const FIRST_PERSON = '一人称視点。主人公は映さず、カメラが主人公の目線そのものになる。';

export const production: ProductionNotes = {
  // ===== 第1話 =====
  's01-hook': {
    imagePrompt:
      '古い町工場の応接スペース。60代の男性社長が、机越しにこちらへ身を乗り出して頼み込んでいる。逆光ぎみの昼の光。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '社長がわずかに身を乗り出し、目線がこちらに定まる。カメラはほぼ固定で微かに呼吸。',
    cameraNote: `${FIRST_PERSON} 冒頭3秒で引き込むため、最初のコマから社長の顔が画面を占める。`,
    characters: [OWNER],
  },
  's02-morning': {
    imagePrompt:
      '日本の地方銀行の支店、法人営業のデスクが並ぶフロア。朝の柔らかい光。30代半ばのスーツの男性行員が、こちらを見て話しかけている。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '佐伯が書類を手に取りながら話す。背景で同僚がゆっくり歩く。',
    cameraNote: `${FIRST_PERSON} 自分の席から先輩を見上げる角度。`,
    characters: [SAEKI],
  },
  's03-chat': {
    imagePrompt:
      'デスクの上の決算資料。数字の並んだ表とボールペン、スマートフォンが置かれている。手元だけが画面下に少し入る。日本のアニメ調、縦9:16、読める文字は入れない。',
    motionPrompt: '手が資料のページをめくり、指が数字の行をなぞる。',
    cameraNote: `${FIRST_PERSON} 真上からやや斜めに見下ろす手元のカット。`,
  },
  's04-move': {
    imagePrompt:
      '車の助手席から見た窓の外。住宅と小さな工場が混じる郊外の景色が流れていく。昼の光。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '景色が横に流れ、最後に工場の門が近づいて止まる。',
    cameraNote: `${FIRST_PERSON} 移動と場面転換を1カットで見せる。`,
  },
  's05-ask': {
    imagePrompt:
      '町工場の応接スペース。机を挟んで山田社長が座り、真剣な表情でこちらに話している。奥の窓から作業場が見える。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '社長が言葉を選びながら話し、最後に口を閉じてこちらの返事を待つ。',
    cameraNote: `${FIRST_PERSON} 選択肢が出る「間」を作るため、最後の2秒は動きを止める。`,
    characters: [OWNER],
  },
  's06a-listen': {
    imagePrompt:
      '山田社長の表情がふっとゆるみ、安心したように話し出す。町工場の応接スペース。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '肩の力が抜け、少し前に乗り出して話し始める。',
    cameraNote: `${FIRST_PERSON} 選んだ結果が伝わるよう、表情の変化を大きめに。`,
    characters: [OWNER],
  },
  's06b-silence': {
    imagePrompt:
      '町工場の応接スペース。佐伯が横から口を開き、社長がそちらへ視線を移す。気まずさの残る空気。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '佐伯が半歩前に出て話し、社長の視線が佐伯へ移る。',
    cameraNote: `${FIRST_PERSON} 自分が答えられなかったことが伝わる構図。`,
    characters: [SAEKI, OWNER],
  },
  's07-turn': {
    imagePrompt:
      '山田社長が視線を落とし、言いにくそうに話し始める。机の上には湯呑み。町工場の応接スペース。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '社長が一度言葉を切り、意を決して顔を上げる。',
    cameraNote: `${FIRST_PERSON} 話が動く場面なので、やや寄りで。`,
    characters: [OWNER],
  },
  's08-decide': {
    imagePrompt:
      '町工場の応接スペースで、佐伯が横からこちらを見ている。何も言わず、判断を委ねる目。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '佐伯がこちらへ視線を送り、わずかにうなずいて待つ。',
    cameraNote: `${FIRST_PERSON} 2回目の分岐。沈黙の圧を作る。`,
    characters: [SAEKI],
  },
  's09a-carry': {
    imagePrompt:
      '山田社長が小さく頭を下げ、感謝の表情を見せる。町工場の応接スペース。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '社長が軽く頭を下げ、ゆっくり顔を上げる。',
    cameraNote: FIRST_PERSON,
    characters: [OWNER],
  },
  's09b-hold': {
    imagePrompt:
      '山田社長が腕を組み、考え込む表情になる。町工場の応接スペース。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '社長が腕を組み、視線を机に落として考える。',
    cameraNote: FIRST_PERSON,
    characters: [OWNER],
  },
  'e01-carry': {
    imagePrompt:
      '夕方の支店。融資課長のデスク越しに、課長がこちらを見上げて話している。窓の外は夕焼け。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '課長が書類から顔を上げ、最後の一言で目を細める。',
    cameraNote: `${FIRST_PERSON} 次回への引きなので、最後のコマで止める。`,
    characters: [{ name: '融資課長（50代）', referenceAssetId: 'ref-kacho' }],
  },
  'e02-propose': {
    imagePrompt:
      '夕方の支店。融資課長がペンを置き、こちらへ体を向けて問いかけている。窓の外は夕焼け。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '課長がペンを置き、こちらへ体を向けて問いかける。',
    cameraNote: `${FIRST_PERSON} 次回への引きなので、最後のコマで止める。`,
    characters: [{ name: '融資課長（50代）', referenceAssetId: 'ref-kacho' }],
  },
  'd01-decide': {
    imagePrompt:
      '支店の休憩スペース。佐伯が壁にもたれ、穏やかにこちらへ説明している。夕方の光。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '佐伯が身振りを交えて落ち着いて話す。',
    cameraNote: `${FIRST_PERSON} 答え合わせ。説明口調になりすぎないよう、表情は柔らかく。`,
    characters: [SAEKI],
  },
  'd02-concentration': {
    imagePrompt:
      '支店の休憩スペース。佐伯が指を3本立てて説明している。夕方の光。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '佐伯が指を立てて数え、最後に手を下ろす。',
    cameraNote: `${FIRST_PERSON} 答え合わせ2本目。`,
    characters: [SAEKI],
  },

  // ===== 試作用エピソード =====
  p1: {
    imagePrompt:
      '日本の地方銀行の支店、朝のフロア。先輩行員がこちらに話しかけている。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '先輩が資料を手に取りながら話す。',
    cameraNote: `${FIRST_PERSON} 音声込みの動画として書き出す（audioMode: embedded の検証）。`,
    characters: [SAEKI],
  },
  p2: {
    imagePrompt:
      '町工場の応接スペース。社長が頼み込むようにこちらを見ている。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '社長が話したあと、返事を待って動きを止める。',
    cameraNote: `${FIRST_PERSON} 分岐の「間」を作るため、最後の2秒は静止。音声込み。`,
    characters: [OWNER],
  },
  p3: {
    imagePrompt:
      '夕方の支店の廊下。窓から斜めの光が差している。人物は映さない。日本のアニメ調、縦9:16、文字やロゴは入れない。',
    motionPrompt: '光がゆっくり動くだけの静かなカット。',
    cameraNote: `${FIRST_PERSON} **無音で書き出す**（audioMode: separate の検証。BGMと効果音はアプリ側）。`,
  },
};

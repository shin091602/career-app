import type { ProductionNotes } from '../../src/types';

/**
 * 素材の制作メモ（設定画・場所・ショットごとの生成プロンプト）。
 * アプリからは読まれず、npm run shotlist と npm run media だけが使う。
 *
 * 共通の決まり：
 * - **一人称視点。主人公（あなた＝新人）は画面に映さない。**
 *   手元・相手の顔・書類・窓の外などで「自分が見ている景色」を作る
 * - 実在の企業名・ロゴ・実在人物を思わせるものを出さない
 * - 画面に文字を焼き込まない（字幕はアプリ側で重ねる）
 * - 縦 9:16。まず静止画を作り、それを動かして動画にする
 * - 1ショットは8秒以下（動画生成が一度に作れる上限）
 * - **絵柄は実写。写真と見分けがつかない質感を狙う**（STYLE を全プロンプトに付ける）
 */

const FIRST_PERSON = '一人称視点。主人公は映さず、カメラが主人公の目線そのものになる。';

/**
 * どのショットのプロンプトにも付ける絵柄の指定。
 * **実写**（写真と見分けがつかない質感）で統一する。
 */
const STYLE =
  '実写の写真。自然光、肌や布の質感が分かる解像感、浅い被写界深度。' +
  'イラスト・アニメ調・CG・3Dレンダリングにしない。縦9:16、文字やロゴは入れない。';

export const production: ProductionNotes = {
  characters: [
    {
      id: 'ref-saeki',
      name: '佐伯（先輩行員・30代半ば）',
      appearance:
        '30代半ばの日本人男性。細身、短い黒髪。グレーのスーツに落ち着いた青のネクタイ。面倒見のよさが表情に出ている。',
      expressions: ['normal', 'smile'],
    },
    {
      id: 'ref-yamada',
      name: '山田社長（60代半ば・町工場の社長）',
      appearance:
        '60代半ばの日本人男性。短く刈った白髪、日に焼けた顔、太い指。ベージュの作業着の上着に濃紺のインナー。',
      expressions: ['normal', 'plea', 'think'],
    },
    {
      id: 'ref-kacho',
      name: '融資課長（40代後半）',
      appearance:
        '40代後半の日本人男性。がっしりした体格、七三に分けた黒髪、銀縁の眼鏡、ひげは無い。濃紺のスーツに濃紺のネクタイ。感情を出さない。',
      expressions: ['normal', 'stern'],
    },
  ],

  places: [
    {
      id: 'pl-branch',
      name: '港南支店 融資課フロア',
      prompt: `日本の地方銀行の支店、法人営業のデスクが並ぶフロア。朝の柔らかい光。人物は映さない。${STYLE}`,
    },
    {
      id: 'pl-reception',
      name: '港南支店 応接室',
      prompt: `日本の地方銀行支店の応接室。低いテーブルと布張りのソファ、壁際にパーテーション。人物は映さない。${STYLE}`,
    },
    {
      id: 'pl-factory',
      name: '山田製作所 応接スペース',
      prompt: `古い町工場の応接スペース。使い込まれた机とパイプ椅子、奥の窓から作業場が見える。人物は映さない。${STYLE}`,
    },
    {
      id: 'pl-car',
      name: '移動中の車内',
      prompt: `車の助手席から見た窓の外。住宅と小さな工場が混じる郊外の景色。昼の光。人物は映さない。${STYLE}`,
    },
    {
      id: 'pl-lounge',
      name: '港南支店 休憩スペース',
      prompt: `銀行の支店の休憩スペース。自販機と小さなテーブル、夕方の斜めの光。人物は映さない。${STYLE}`,
    },
  ],

  // Flow の Frames to Video で始点・終点に使う静止画（pilot-02）
  keyframes: [
    {
      id: 'k-t1-walk',
      name: '課長がファイルを手に、こちらへ歩いてくる',
      prompt: `支店の応接室。濃紺のスーツの40代後半の男性が、厚いファイルを片手に、ソファに座ったこちらへ歩いてくる途中。座った目線の高さから見たウエストショット。夕方の窓の光。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
    },
    {
      id: 'k-t1-wait',
      name: '課長がファイルを置き、見下ろして返事を待つ',
      prompt: `支店の応接室。濃紺のスーツの40代後半の男性が、低いテーブルに紙のファイルを置き終え、座ったこちらを立ったまま見下ろしている。表情は硬く、返事を待っている。手前にテーブルの端が入る。夕方の窓の光。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
    },
    {
      id: 'k-t2-bow',
      name: '社長がテーブル越しに深く頭を下げている',
      prompt: `支店の応接室。ベージュの作業着の60代半ばの男性が、低いテーブルを挟んで正面のソファに座り、膝に手を置いて深く頭を下げている。座った目線の高さ、頭と肩が画面の大きな部分を占める近さ。夕方の光。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-yamada'],
    },
    {
      id: 'k-t2-look',
      name: '社長が顔を上げ、こちらをまっすぐ見る',
      prompt: `支店の応接室。ベージュの作業着の60代半ばの男性が、正面のソファで顔を上げ、目を潤ませてこちらをまっすぐ見ている。口は閉じている。バストショット。夕方の光。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-yamada'],
    },
    {
      id: 'k-t3-sit',
      name: '夜。課長が正面のソファに座っている',
      prompt: `夜の支店の応接室。窓の外は暗く、室内灯だけ。濃紺のスーツの40代後半の男性が、低いテーブルを挟んで正面のソファに座り、膝の上のファイルからこちらへ視線を上げる。ウエストショット。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
    },
    {
      id: 'k-t3-lean',
      name: '課長が目を細め、身を乗り出す',
      prompt: `夜の支店の応接室、室内灯だけ。濃紺のスーツの40代後半の男性が、正面のソファで目を細め、わずかに身を乗り出してこちらを見据えている。口は閉じている。バストショット、顔が画面の上半分を占める。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
    },
    {
      id: 'k-end',
      name: '課長がソファに座り直し、静かにこちらを見る',
      prompt: `夜の支店の応接室、室内灯だけ。濃紺のスーツの40代後半の男性が、正面のソファに深く座り直し、膝の上で手を組んで静かにこちらを見ている。表情は読めない。ウエストショット。${STYLE}`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
    },
  ],

  shots: {
    // ===== 第1話 =====
    's01-hook': {
      imagePrompt: `町工場の応接スペース。60代の男性社長が、机越しにこちらへ身を乗り出して頼み込んでいる。逆光ぎみの昼の光。${STYLE}`,
      motionPrompt: '社長がわずかに身を乗り出し、目線がこちらに定まる。カメラはほぼ固定で微かに呼吸。',
      cameraNote: `${FIRST_PERSON} 冒頭3秒で引き込むため、最初のコマから社長の顔が画面を占める。`,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },
    's02-morning': {
      imagePrompt: `銀行の支店の法人営業フロア。30代半ばのスーツの男性行員が、書類を手にこちらを見て話しかけている。朝の光。${STYLE}`,
      motionPrompt: '佐伯が書類を手に取りながら話す。背景で同僚がゆっくり歩く。',
      cameraNote: `${FIRST_PERSON} 自分の席から先輩を見上げる角度。`,
      placeId: 'pl-branch',
      characterIds: ['ref-saeki'],
    },
    's03-chat': {
      imagePrompt: `デスクの上の決算資料。数字の並んだ表とボールペン、スマートフォンが置かれている。手元だけが画面下に少し入る。${STYLE}`,
      motionPrompt: '手が資料のページをめくり、指が数字の行をなぞる。',
      cameraNote: `${FIRST_PERSON} 真上からやや斜めに見下ろす手元のカット。`,
      placeId: 'pl-branch',
      soundNote: 'フロアのざわめきと、スマートフォンの短い通知音。',
    },
    's04-move': {
      imagePrompt: `車の助手席から見た窓の外。住宅と小さな工場が混じる郊外の景色が流れていく。昼の光。${STYLE}`,
      motionPrompt: '景色が横に流れ、最後に工場の門が近づいて止まる。',
      cameraNote: `${FIRST_PERSON} 移動と場面転換を1カットで見せる。`,
      placeId: 'pl-car',
      characterIds: ['ref-saeki'],
    },
    's05-ask': {
      imagePrompt: `町工場の応接スペース。机を挟んで60代の男性社長が座り、真剣な表情でこちらに話している。奥の窓から作業場が見える。${STYLE}`,
      motionPrompt: '社長が言葉を選びながら話し、最後に机の上で手を組む。',
      cameraNote: `${FIRST_PERSON} 依頼の中身を聞かせるカット。`,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },
    's05b-wait': {
      imagePrompt: `町工場の応接スペース。60代の男性社長が口を閉じ、こちらの返事をまっすぐ待っている。${STYLE}`,
      motionPrompt: '社長が口を閉じ、まばたきをしてこちらを見つめたまま動きを止める。',
      cameraNote: `${FIRST_PERSON} 選択肢が出る「間」。最後の2秒はほぼ静止させる。`,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },

    // ----- 反応ショット（合流する） -----
    's06a-listen': {
      imagePrompt: `町工場の応接スペース。60代の男性社長の表情がふっとゆるみ、安心したように話し出す。${STYLE}`,
      motionPrompt: '肩の力が抜け、少し前に乗り出して話し始める。',
      cameraNote: `${FIRST_PERSON} 選んだ結果が伝わるよう、表情の変化を大きめに。`,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },
    's06b-silence': {
      imagePrompt: `町工場の応接スペース。スーツの男性行員が横から口を開き、作業着の社長がそちらへ視線を移す。気まずさの残る空気。${STYLE}`,
      motionPrompt: '佐伯が半歩前に出て話し、社長の視線が佐伯へ移る。',
      cameraNote: `${FIRST_PERSON} 自分が答えられなかったことが伝わる構図。`,
      placeId: 'pl-factory',
      characterIds: ['ref-saeki', 'ref-yamada'],
    },

    // ===== 合流 =====
    's07-turn': {
      imagePrompt: `町工場の応接スペース。60代の男性社長が視線を落とし、言いにくそうに話し始める。机の上には湯呑み。${STYLE}`,
      motionPrompt: '社長が一度言葉を切り、意を決して顔を上げる。',
      cameraNote: `${FIRST_PERSON} 話が動く場面なので、やや寄りで。`,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },
    's07b-weight': {
      imagePrompt: `町工場の応接スペースの机。湯呑みと、めくられたままの決算資料。奥に作業着の社長の胸元がぼやけて見える。${STYLE}`,
      motionPrompt: 'カメラがゆっくり手元へ落ちる。湯呑みの湯気が揺れる。',
      cameraNote: `${FIRST_PERSON} 聞いてしまった事実の重さを、間で見せる。`,
      placeId: 'pl-factory',
      soundNote: '工場の低い機械音だけが続く。',
    },
    's08-decide': {
      imagePrompt: `町工場の応接スペースで、スーツの男性行員が横からこちらを見ている。何も言わず、判断を委ねる目。${STYLE}`,
      motionPrompt: '佐伯がこちらへ視線を送り、わずかにうなずいて待つ。',
      cameraNote: `${FIRST_PERSON} 2回目の分岐。沈黙の圧を作る。`,
      placeId: 'pl-factory',
      characterIds: ['ref-saeki'],
    },

    // ----- 反応ショット（それぞれの結末へ） -----
    's09a-carry': {
      imagePrompt: `町工場の応接スペース。60代の男性社長が小さく頭を下げ、感謝の表情を見せる。${STYLE}`,
      motionPrompt: '社長が軽く頭を下げ、ゆっくり顔を上げる。',
      cameraNote: FIRST_PERSON,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },
    's09b-hold': {
      imagePrompt: `町工場の応接スペース。60代の男性社長が腕を組み、考え込む表情になる。${STYLE}`,
      motionPrompt: '社長が腕を組み、視線を机に落として考える。',
      cameraNote: FIRST_PERSON,
      placeId: 'pl-factory',
      characterIds: ['ref-yamada'],
    },

    // ===== 結末 =====
    'e01-carry': {
      imagePrompt: `夕方の銀行支店。濃紺のスーツの40代後半の男性がデスク越しにこちらを見上げて話している。窓の外は夕焼け。${STYLE}`,
      motionPrompt: '課長が書類から顔を上げ、最後の一言で目を細める。',
      cameraNote: `${FIRST_PERSON} 次回への引きなので、最後のコマで止める。`,
      placeId: 'pl-branch',
      characterIds: ['ref-kacho'],
    },
    'e02-propose': {
      imagePrompt: `夕方の銀行支店。濃紺のスーツの40代後半の男性がペンを置き、こちらへ体を向けて問いかけている。窓の外は夕焼け。${STYLE}`,
      motionPrompt: '課長がペンを置き、こちらへ体を向けて問いかける。',
      cameraNote: `${FIRST_PERSON} 次回への引きなので、最後のコマで止める。`,
      placeId: 'pl-branch',
      characterIds: ['ref-kacho'],
    },

    // ===== 答え合わせ =====
    'd01-decide': {
      imagePrompt: `銀行支店の休憩スペース。30代半ばのスーツの男性行員が壁にもたれ、穏やかにこちらへ説明している。夕方の光。${STYLE}`,
      motionPrompt: '佐伯が身振りを交えて落ち着いて話す。',
      cameraNote: `${FIRST_PERSON} 答え合わせ。説明口調になりすぎないよう、表情は柔らかく。`,
      placeId: 'pl-lounge',
      characterIds: ['ref-saeki'],
    },
    'd01b-visit': {
      imagePrompt: `銀行支店の休憩スペース。30代半ばのスーツの男性行員が軽く笑って言い添えている。夕方の光。${STYLE}`,
      motionPrompt: '佐伯が肩をすくめて笑い、最後に真顔に戻る。',
      cameraNote: `${FIRST_PERSON} 答え合わせの締め。`,
      placeId: 'pl-lounge',
      characterIds: ['ref-saeki'],
    },
    'd02-concentration': {
      imagePrompt: `銀行支店の休憩スペース。30代半ばのスーツの男性行員が指を3本立てて説明している。夕方の光。${STYLE}`,
      motionPrompt: '佐伯が指を立てて数え、最後に手を下ろす。',
      cameraNote: `${FIRST_PERSON} 答え合わせ2本目。`,
      placeId: 'pl-lounge',
      characterIds: ['ref-saeki'],
    },
    'd02b-origin': {
      imagePrompt: `銀行支店の休憩スペース。30代半ばのスーツの男性行員が資料を指さし、こちらへ視線を向ける。夕方の光。${STYLE}`,
      motionPrompt: '佐伯が資料を指でとんとんと叩き、こちらを見る。',
      cameraNote: `${FIRST_PERSON} 答え合わせ2本目の締め。`,
      placeId: 'pl-lounge',
      characterIds: ['ref-saeki'],
    },

    // ===== 試作エピソード2（Flow の Frames to Video で作る縦切り） =====
    't1-order': {
      motionPrompt:
        '課長が数歩こちらへ歩いてきて、手に持ったファイルを低いテーブルに置き、体を起こしてこちらを見下ろして話す。言い終えたら、その姿勢のまま返事を待つ。',
      cameraNote: `${FIRST_PERSON} カメラはソファに座った目線でほぼ固定。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      soundNote: '革靴の足音、紙の束がテーブルに当たる音。',
      startFrame: 'k-t1-walk',
      endFrame: 'k-t1-wait',
    },
    't1a-accept': {
      motionPrompt:
        '課長がわずかに眉を上げて短く話し、すぐに背を向けて部屋の出口へ歩いていく。',
      cameraNote: FIRST_PERSON,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      soundNote: '遠ざかる足音、ドアの閉まる音。',
      startFrame: 'k-t1-wait',
    },
    't1b-criteria': {
      motionPrompt:
        '課長が小さくうなずいて話し、テーブルのファイルを指で2回叩いてから、背を向けて部屋を出ていく。',
      cameraNote: FIRST_PERSON,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      soundNote: 'ファイルを指で叩く音、遠ざかる足音。',
      startFrame: 'k-t1-wait',
    },
    't2-plea': {
      motionPrompt:
        '社長が頭を下げたまま数秒動かず、震える声で話しながらゆっくり顔を上げ、こちらをまっすぐ見る。言い終えたら動きを止めて返事を待つ。',
      cameraNote: `${FIRST_PERSON} 選択の「間」を作るため、最後の2秒はほぼ静止。`,
      placeId: 'pl-reception',
      characterIds: ['ref-yamada'],
      soundNote: '静かな室内。空調の低い音。',
      startFrame: 'k-t2-bow',
      endFrame: 'k-t2-look',
    },
    't2a-promise': {
      motionPrompt:
        '社長の顔がぱっと明るくなり、何度も小さく頭を下げながら、安堵した声で話す。',
      cameraNote: `${FIRST_PERSON} 安請け合いに見える明るさ。少しだけ危うさを残す。`,
      placeId: 'pl-reception',
      characterIds: ['ref-yamada'],
      startFrame: 'k-t2-look',
    },
    't2b-numbers': {
      motionPrompt:
        '社長が一瞬迷うように目を伏せ、足元の鞄から紙の書類の束を取り出してテーブルに置き、こちらへ滑らせながら話す。',
      cameraNote: `${FIRST_PERSON} 書類がこちらへ近づいてくる。読める文字は映さない。`,
      placeId: 'pl-reception',
      characterIds: ['ref-yamada'],
      soundNote: '鞄を開ける音、紙がテーブルを滑る音。',
      startFrame: 'k-t2-look',
    },
    't3-proof': {
      motionPrompt:
        '課長がファイルから顔を上げて短く問い、ファイルを閉じてわずかに身を乗り出し、目を細めて問い詰める。言い終えたらこちらを見据えたまま止まる。',
      cameraNote: `${FIRST_PERSON} 夜。緊張を高めるため、カメラはごくゆっくり課長へ寄る。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      soundNote: '静かな夜の室内。ファイルを閉じる音。',
      startFrame: 'k-t3-sit',
      endFrame: 'k-t3-lean',
    },
    't3a-growth': {
      motionPrompt:
        '課長が小さく息を吐き、少し失望したように話してから、ソファに深く座り直してこちらを見る。',
      cameraNote: FIRST_PERSON,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      startFrame: 'k-t3-lean',
      endFrame: 'k-end',
    },
    't3b-risk': {
      motionPrompt:
        '課長の目がわずかに見開かれ、感心したように低い声で話してから、ソファに深く座り直してこちらを見る。',
      cameraNote: FIRST_PERSON,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      startFrame: 'k-t3-lean',
      endFrame: 'k-end',
    },
    'e-high': {
      motionPrompt: '課長が口元だけでわずかに笑い、穏やかに話す。最後は小さくうなずく。',
      cameraNote: `${FIRST_PERSON} 結末。張りつめた空気がほどける。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      startFrame: 'k-end',
    },
    'e-mid': {
      motionPrompt: '課長が表情を変えずに話し、ファイルをこちらへ差し出す。',
      cameraNote: `${FIRST_PERSON} 結末。突き放しすぎず、宿題を渡す温度感。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      startFrame: 'k-end',
    },
    'e-low': {
      motionPrompt:
        '課長が静かに目を閉じてから話し、テーブルのファイルを自分の手元へ引き寄せる。',
      cameraNote: `${FIRST_PERSON} 結末。叱るのではなく、仕事の重さを伝える静けさ。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      startFrame: 'k-end',
    },

    // ===== 試作用エピソード（パイプラインの検証用） =====
    p1: {
      imagePrompt: `日本の地方銀行支店の応接室。濃紺のスーツを着た40代後半の男性が歩いてきて、ファイルを机に置こうとしている。${STYLE}`,
      motionPrompt:
        '課長が数歩こちらへ歩いてきて、手に持ったファイルを机に置き、こちらを見て話す。',
      cameraNote: `${FIRST_PERSON} 座っているこちらを課長が見下ろす角度。声込みで書き出す。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      soundNote: '革靴の足音と、紙の束が机に当たる音。',
    },
    p2: {
      imagePrompt: `日本の地方銀行支店の応接室。ベージュの作業着を着た60代半ばの男性が、低いテーブル越しに深く頭を下げている。座ったこちらの目線の高さから見た近い距離で、頭と肩が画面の大きな部分を占める。${STYLE}`,
      motionPrompt:
        '社長が頭を下げたまま数秒静止し、ゆっくり顔を上げてこちらを見る。言い終えたあとは動きを止める。',
      cameraNote: `${FIRST_PERSON} 分岐の「間」を作るため、最後の2秒は静止。声込みで書き出す。`,
      placeId: 'pl-reception',
      characterIds: ['ref-yamada'],
    },
    p3: {
      imagePrompt: `日本の地方銀行支店の応接室。濃紺のスーツの40代後半の男性が、低いテーブルを挟んで正面のソファに座り、目を細めてこちらを見ている。バストショットで顔が画面の上半分を占める。夕方の斜めの光。${STYLE}`,
      motionPrompt: '課長が目を細め、わずかに身を乗り出してこちらを見つめる。',
      cameraNote: `${FIRST_PERSON} 問い詰める緊張感。声込みで書き出す。`,
      placeId: 'pl-reception',
      characterIds: ['ref-kacho'],
      soundNote: '静かな室内。空調の低い音だけが背景にある。',
    },
  },
};

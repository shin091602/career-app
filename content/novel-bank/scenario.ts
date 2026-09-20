import type { Scenario } from '../../src/types';

/**
 * 動作確認用のサンプル（銀行員・法人営業）。
 * 追加した演出（テロップ・割り込み・書類ズーム・制限時間・立ち絵・転換・音）を
 * ひととおり使い、シナリオの書き方の見本を兼ねている。
 *
 * 本番コンテンツは worktree 側で差し替える。
 * 登場する会社・人物・数値はすべて架空。取材・裏取りをしていないため
 * verified: false、sources は空のままにしてある。
 *
 * この `scenario` が null でなくなった時点で、ホーム画面の「準備中」が自動で外れる。
 * エクスポート名 `scenario` は4つのプロトタイプで共通なので変更しないこと。
 */
export const scenario: Scenario | null = {
  id: 'novel-bank-sample',
  title: '町工場からの相談',
  jobTitle: '銀行員（法人営業）',
  description:
    '取引先の町工場から「新しい機械を買いたい」と相談された。あなたは1年目の法人営業。',
  verified: false,
  sources: [],
  startSceneId: 's01',
  params: [
    {
      key: 'trust',
      label: 'お客さまとの信頼',
      description: '相手の話を正面から受け止め、立場を理解できたか。',
    },
    {
      key: 'risk',
      label: 'リスクを見る力',
      description: '返せる見込みがあるかを、数字と事実で確かめられたか。',
    },
  ],
  scenes: [
    // --- 1. 朝の支店。テロップ＋フェードで場所と時刻を示す ---
    {
      id: 's01',
      kind: 'dialogue',
      speaker: '先輩行員',
      text: 'おはよう。今日は一緒に山田製作所へ行こう。\n社長から「新しい機械を入れたい」って電話があってね。\n\n……こういう相談、うちの仕事のど真ん中だよ。',
      bgAssetId: 'bg-bank-office',
      transition: 'fade',
      telop: { time: '9:02', place: '港南支店 融資課' },
      characters: [{ assetId: 'char-senior-banker-normal', slot: 'center', speaking: true }],
      sound: { bgm: 'bgm-office' },
      terms: [
        {
          term: '法人営業',
          description: '会社を相手にする営業のこと。お金を貸したり、経営の相談を受けたりする。',
        },
      ],
      next: 's02',
    },

    // --- 2. 上司からのチャットが割り込む ---
    {
      id: 's02',
      kind: 'dialogue',
      speaker: 'あなた',
      text: '（訪問の前に、資料を見ておかないと……）',
      bgAssetId: 'bg-bank-office',
      characters: [{ assetId: 'char-senior-banker-normal', slot: 'right' }],
      interrupt: {
        kind: 'chat',
        from: '融資課長',
        body: '山田製作所の件、訪問前にここ3年の数字を押さえておいて。\n感触だけで持ち帰ってこないように。',
      },
      sound: { se: 'se-notify' },
      next: 's03',
    },

    // --- 3. 決算書を読む。書類ズームを自動で開く ---
    {
      id: 's03',
      kind: 'dialogue',
      speaker: 'あなた',
      text: '売上は3年で18,000万円から22,000万円へ。\n営業利益も伸びていて、借入は少しずつ減っている。\n\n（数字だけ見れば、悪くない……？）',
      bgAssetId: 'bg-bank-office',
      characters: [{ assetId: 'char-senior-banker-normal', slot: 'right' }],
      document: {
        title: '山田製作所の決算資料',
        autoOpen: true,
        assetId: 'doc-financial-statement',
        material: {
          kind: 'table',
          id: 'doc-financials',
          title: '業績の推移（単位：万円）',
          headers: ['年度', '売上高', '営業利益', '借入残高'],
          rows: [
            ['2023年度', '18,000', '900', '4,000'],
            ['2024年度', '19,500', '1,050', '3,500'],
            ['2025年度', '22,000', '1,200', '3,000'],
          ],
          caption: 'このアプリ用に作った架空の数値です。',
        },
      },
      terms: [
        {
          term: '営業利益',
          description: '本業でどれだけ儲かったかを表す数字。売上から仕入れや人件費などを引いたもの。',
        },
        {
          term: '借入残高',
          description: '今まだ返し終わっていない借金の合計額。',
        },
      ],
      next: 's04',
    },

    // --- 4. 移動。暗転で場面を大きく切り替える ---
    {
      id: 's04',
      kind: 'dialogue',
      speaker: '先輩行員',
      text: '（車中）\n数字は頭に入ったね。\nでも今日聞きたいのは、その数字の「中身」だ。\n\n……着いたよ。',
      bgAssetId: 'bg-bank-factory',
      transition: 'blackout',
      telop: { time: '10:30', place: '山田製作所 応接スペース' },
      characters: [{ assetId: 'char-senior-banker-normal', slot: 'left', speaking: true }],
      sound: { bgm: 'bgm-factory' },
      next: 's05',
    },

    // --- 5. 社長との面談。立ち絵2体＋制限時間つき選択肢 ---
    {
      id: 's05',
      kind: 'dialogue',
      speaker: '山田社長',
      text: '注文が増えてきてね。今の機械じゃ追いつかないんだ。\n3,000万円の機械を入れたい。\n\n……なんとか、貸してもらえないかな。',
      bgAssetId: 'bg-bank-factory',
      characters: [
        { assetId: 'char-senior-banker-normal', slot: 'left' },
        { assetId: 'char-factory-owner-worried', slot: 'right', speaking: true },
      ],
      terms: [
        {
          term: '融資',
          description: '銀行が会社や人にお金を貸すこと。返す約束（期間と利息）をセットで決める。',
        },
      ],
      timeLimitSec: 12,
      onTimeout: {
        label: '答えられず、沈黙が流れた',
        nextSceneId: 's06-silence',
        effects: [{ key: 'trust', delta: -1 }],
      },
      choices: [
        {
          label: '「お任せください、すぐ手続きします」と即答する',
          nextSceneId: 's06-silence',
          effects: [
            { key: 'trust', delta: 1 },
            { key: 'risk', delta: -2 },
          ],
        },
        {
          label: '注文が増えている理由と、返済の見込みを詳しく聞く',
          nextSceneId: 's06-listen',
          effects: [
            { key: 'trust', delta: 1 },
            { key: 'risk', delta: 2 },
          ],
        },
        {
          label: '「今は難しいと思います」とその場で断る',
          nextSceneId: 's06-silence',
          effects: [{ key: 'trust', delta: -2 }],
        },
      ],
    },

    // --- 6a. 踏み込んで聞けた場合 ---
    {
      id: 's06-listen',
      kind: 'dialogue',
      speaker: '山田社長',
      text: '……よく聞いてくれたね。\n注文元は3社。うち1社で売上の7割だ。\n\n先輩行員：「そこが大事なところです。持ち帰って、きちんと検討させてください」',
      bgAssetId: 'bg-bank-factory',
      characters: [
        { assetId: 'char-senior-banker-normal', slot: 'left' },
        { assetId: 'char-factory-owner-normal', slot: 'right', speaking: true },
      ],
      terms: [
        {
          term: '稟議（りんぎ）',
          description:
            '貸してよいかを社内で検討し、決めてもらうための手続き。担当者が資料を作って上司に判断を仰ぐ。',
        },
      ],
      next: 's07',
    },

    // --- 6b. 即答・沈黙・その場で断った場合 ---
    {
      id: 's06-silence',
      kind: 'dialogue',
      speaker: '先輩行員',
      text: '（帰り道）\nその場で答えを出したい気持ちは分かる。黙ってしまう気持ちもね。\nでも、決めるのは担当者ひとりじゃないんだ。\n\n何を確かめれば決められるのか──そこから逆算しよう。',
      bgAssetId: 'bg-bank-corridor',
      transition: 'fade',
      characters: [{ assetId: 'char-senior-banker-serious', slot: 'center', speaking: true }],
      next: 's07',
    },

    // --- 7. 課長からの電話が割り込む ---
    {
      id: 's07',
      kind: 'dialogue',
      speaker: 'あなた',
      text: '（支店に戻ったら、まず何から整理しよう……）',
      bgAssetId: 'bg-bank-corridor',
      characters: [{ assetId: 'char-senior-banker-normal', slot: 'right' }],
      interrupt: {
        kind: 'call',
        from: '融資課長',
        body: '戻ったら、聞いてきたことを一枚にまとめて。\n「いくら」「何に使う」「どう返す」──この3つから先に書いて。',
        dismissLabel: '出る',
      },
      sound: { se: 'se-phone' },
      next: 'ending-01',
    },

    // --- エンディング ---
    {
      id: 'ending-01',
      kind: 'ending',
      speaker: '先輩行員',
      text: 'おつかれさま。\n今日の訪問で分かったことを、明日いちばんに整理しよう。\n\nこの仕事は、その場の返事より「持ち帰ったあと」で差がつく。',
      bgAssetId: 'bg-bank-office',
      transition: 'fade',
      characters: [{ assetId: 'char-senior-banker-normal', slot: 'center', speaking: true }],
      sound: { bgm: 'bgm-office' },
    },

    // --- 答え合わせ ---
    {
      id: 'debrief-01',
      kind: 'debrief',
      speaker: '実際の仕事では',
      text: '融資の可否は、担当者がその場で決めるものではありません。\n決算書や試算表で売上・利益・借入の状況を確かめ、資料をそろえて社内で検討します。\n\nだから訪問では「決めること」より「決めるために必要なことを聞き出すこと」が仕事になります。',
      terms: [
        {
          term: '決算書',
          description: '1年間の売上・費用・利益や、財産と借金の状況をまとめた会社の成績表。',
        },
      ],
    },
    {
      id: 'debrief-02',
      kind: 'debrief',
      speaker: '実際の仕事では',
      text: '「1社で売上の7割」は、良い話にも危ない話にもなります。\nその会社との取引が続く間は安定しますが、止まったときに一気に苦しくなるからです。\n\n数字の大きさだけでなく「どこから来ているお金か」を見るのが、現場の見方のひとつです。',
    },
    {
      id: 'debrief-03',
      kind: 'debrief',
      speaker: '実際の仕事では',
      text: '返事を待たれている時間は、実際にはもっと長く感じます。\nそれでも、その場で答えられないことを正直に伝え、いつまでに何を返すかを約束するほうが信頼されます。\n\n「分かりません」ではなく「持ち帰って、○日までにお返事します」と言えるかどうかです。',
    },
  ],
  endings: [
    {
      id: 'ending-01',
      sceneId: 'ending-01',
      title: '持ち帰って検討へ',
      summary: '相談をその場で結論づけず、社内での検討につなげた。',
      debriefSceneIds: ['debrief-01', 'debrief-02', 'debrief-03'],
    },
  ],
};

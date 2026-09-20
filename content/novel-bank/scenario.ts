import type { Scenario } from '../../src/types';

/**
 * 動作確認用の最小サンプル（銀行員・法人営業）。
 * 本番コンテンツは worktree 側で差し替える。
 * 取材・裏取りをしていないため verified: false、sources は空のままにしてある。
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
    {
      id: 's01',
      kind: 'dialogue',
      speaker: '先輩行員',
      text: '今日は一緒に山田製作所へ行こう。\n社長から「新しい機械を入れたい」って電話があってね。\n\n……こういう相談、うちの仕事のど真ん中だよ。',
      bgAssetId: 'bg-bank-office',
      characters: [{ assetId: 'char-senior-banker', slot: 'center', speaking: true }],
      terms: [
        {
          term: '法人営業',
          description: '会社を相手にする営業のこと。お金を貸したり、経営の相談を受けたりする。',
        },
      ],
      next: 's02',
    },
    {
      id: 's02',
      kind: 'dialogue',
      speaker: '山田社長',
      text: '注文が増えてきてね。今の機械じゃ追いつかないんだ。\n3,000万円の機械を入れたい。\n\n……なんとか、貸してもらえないかな。',
      bgAssetId: 'bg-bank-factory',
      characters: [{ assetId: 'char-factory-owner', slot: 'center', speaking: true }],
      terms: [
        {
          term: '融資',
          description: '銀行が会社や人にお金を貸すこと。返す約束（期間と利息）をセットで決める。',
        },
      ],
      choices: [
        {
          label: '「お任せください、すぐ手続きします」と即答する',
          nextSceneId: 's03-quick',
          effects: [
            { key: 'trust', delta: 1 },
            { key: 'risk', delta: -2 },
          ],
        },
        {
          label: '注文が増えている理由と、返済の見込みを詳しく聞く',
          nextSceneId: 's03-listen',
          effects: [
            { key: 'trust', delta: 1 },
            { key: 'risk', delta: 2 },
          ],
        },
        {
          label: '「今は難しいと思います」とその場で断る',
          nextSceneId: 's03-quick',
          effects: [{ key: 'trust', delta: -2 }],
        },
      ],
    },
    {
      id: 's03-listen',
      kind: 'dialogue',
      speaker: '山田社長',
      text: '……よく聞いてくれたね。\n注文元は3社。うち1社で売上の7割だ。\n\n先輩行員：「そこが大事なところです。持ち帰って、きちんと検討させてください」',
      bgAssetId: 'bg-bank-factory',
      characters: [{ assetId: 'char-factory-owner', slot: 'center', speaking: true }],
      terms: [
        {
          term: '稟議（りんぎ）',
          description:
            '貸してよいかを社内で検討し、決めてもらうための手続き。担当者が資料を作って上司に判断を仰ぐ。',
        },
      ],
      next: 'ending-01',
    },
    {
      id: 's03-quick',
      kind: 'dialogue',
      speaker: '先輩行員',
      text: '（帰り道）\nその場で答えを出したい気持ちは分かる。\nでも、決めるのは担当者ひとりじゃないんだ。\n\n何を確かめれば決められるのか──そこから逆算しよう。',
      bgAssetId: 'bg-bank-office',
      characters: [{ assetId: 'char-senior-banker', slot: 'center', speaking: true }],
      next: 'ending-01',
    },
    {
      id: 'ending-01',
      kind: 'ending',
      speaker: '先輩行員',
      text: 'おつかれさま。\n今日の訪問で分かったことを、明日いちばんに整理しよう。\n\nこの仕事は、その場の返事より「持ち帰ったあと」で差がつく。',
      bgAssetId: 'bg-bank-office',
      characters: [{ assetId: 'char-senior-banker', slot: 'center', speaking: true }],
    },
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
  ],
  endings: [
    {
      id: 'ending-01',
      sceneId: 'ending-01',
      title: '持ち帰って検討へ',
      summary: '相談をその場で結論づけず、社内での検討につなげた。',
      debriefSceneIds: ['debrief-01', 'debrief-02'],
    },
  ],
};

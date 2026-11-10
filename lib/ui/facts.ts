// Shown while a paper is being written (10–30 seconds). Every fact here
// should be true and checkable — no folk etymologies.

export interface Fact {
  jp?: string;
  text: string;
}

export const JAPANESE_FACTS: Fact[] = [
  // Words and where they come from
  { jp: "ありがとう", text: "comes from 有り難い (arigatai), \"hard to come by\" — thanks for something rare." },
  { jp: "いただきます", text: "said before eating, comes from 頂く, a humble way of saying \"I receive\"." },
  { jp: "ごちそうさま", text: "comes from 馳走 — both kanji mean \"run\": the running about a host did to prepare the meal." },
  { jp: "カラオケ", text: "is 空 (kara, \"empty\") + オケ, short for オーケストラ (orchestra)." },
  { jp: "パン", text: "(bread) came into Japanese from Portuguese pão in the 1500s." },
  { jp: "アルバイト", text: "(a part-time job) comes from the German word Arbeit, \"work\"." },
  { jp: "サラリーマン", text: "is wasei-eigo — \"English\" made in Japan. It means an office worker." },
  { jp: "ノートパソコン", text: "\"note\" + \"personal computer\": Japanese for a laptop." },
  { jp: "日本", text: "means \"origin of the sun\" — where \"Land of the Rising Sun\" comes from." },
  { jp: "猫舌", text: "Nekojita, \"cat tongue\", is someone who can't handle hot food." },
  { jp: "木漏れ日", text: "Komorebi: sunlight filtering through leaves. One word for it." },
  { jp: "積ん読", text: "Tsundoku: buying books and letting them pile up unread." },
  { jp: "もったいない", text: "is the feeling of regret when something useful goes to waste." },
  { jp: "一期一会", text: "Ichigo ichie, \"one time, one meeting\": treasure each encounter — it won't come again." },

  // Writing
  { text: "A single Japanese sentence often mixes three scripts: hiragana, katakana and kanji." },
  { text: "Hiragana and katakana each have 46 basic characters." },
  { jp: "常用漢字", text: "The official list of everyday kanji has 2,136 characters." },
  { jp: "あ · ア", text: "Hiragana grew from cursive kanji — あ from 安. Katakana took pieces of kanji — ア from 阿." },
  { text: "Most kanji have two kinds of reading: on'yomi, from Chinese, and kun'yomi, native Japanese." },
  { jp: "今日", text: "is read きょう — a special reading for the whole word, not built from its kanji." },
  { jp: "一日", text: "is いちにち (one day) — but ついたち when it means the 1st of the month." },
  { jp: "大人 · 一人", text: "おとな and ひとり are special whole-word readings too." },
  { jp: "々", text: "repeats the kanji before it: 人々 (ひとびと, people), 時々 (ときどき, sometimes)." },
  { jp: "木 · 林 · 森", text: "One tree is 木. Two make 林, a grove. Three make 森, a forest." },
  { jp: "休", text: "is written with person 亻 and tree 木 — and means \"rest\"." },
  { jp: "明", text: "is written with sun 日 and moon 月 — and means \"bright\"." },
  { jp: "海 · 池 · 泳", text: "The three-drop radical 氵 means water: sea, pond, swim." },
  { jp: "峠 · 畑 · 働", text: "These kanji were invented in Japan, not China. They're called 国字." },
  { text: "Kanji stroke order mostly goes top to bottom, left to right — and it changes how handwriting looks." },
  { jp: "縦書き", text: "Vertical writing runs top to bottom, and the columns go right to left." },
  { text: "Manga are read right to left, starting from what English readers call the back." },
  { jp: "ふりがな", text: "are the small kana written above kanji to show how they're read." },
  { jp: "ゝ · ゞ", text: "are old repeat marks for kana; you'll still see them in some names and signs." },
  { jp: "ゐ · ゑ", text: "are kana that dropped out of everyday use after the 1946 spelling reform." },

  // Sounds
  { jp: "っ", text: "The small っ doubles the next consonant: きて (come) vs きって (stamp)." },
  { jp: "ー", text: "In katakana, ー stretches the vowel before it: コーヒー, ケーキ." },
  { jp: "゛", text: "Dakuten voice a consonant: か → が, さ → ざ, た → だ." },
  { jp: "゜", text: "Handakuten only go on the h-row: は → ぱ, ひ → ぴ." },
  { jp: "は · へ · を", text: "As particles they're said \"wa\", \"e\" and \"o\" — spelling kept from older Japanese." },
  { jp: "ん", text: "is the only kana that is just a consonant. Almost no Japanese word starts with it." },
  { jp: "しりとり", text: "In the word-chain game, saying a word that ends in ん loses — nothing can follow it." },
  { text: "Japanese uses pitch, not stress: in Tokyo speech, あめ is rain or candy depending on pitch." },
  { jp: "はし", text: "can be 橋 (bridge), 箸 (chopsticks) or 端 (edge). Kanji and pitch tell them apart." },
  { text: "Japanese counts morae, not syllables: とうきょう is four beats, to-u-kyo-u." },
  { text: "A haiku has 5, 7 and 5 morae (音) — not syllables as in English." },
  { jp: "人々", text: "Sounds often voice when words join: ひと + ひと = ひとびと. It's called rendaku." },
  { text: "Japanese is full of sound-words: キラキラ (sparkling), ドキドキ (heart pounding), ペラペラ (fluent)." },

  // Grammar
  { text: "The verb comes at the end of a Japanese sentence — you wait for the action." },
  { text: "Japanese often drops \"I\" or \"you\" when it's clear who's meant." },
  { jp: "本", text: "Most nouns have no plural: 本 is one book or a hundred." },
  { jp: "本 · 枚 · 匹", text: "Counters change with shape: 本 for long thin things, 枚 for flat ones, 匹 for small animals." },
  { text: "Particles do the work English word order does: は marks the topic, を the object, に the target." },
  { jp: "私 · 僕 · 俺", text: "Japanese has many words for \"I\". Which one you use says a lot about you." },
  { text: "Adjectives conjugate like verbs: たかい (expensive) → たかかった (was expensive)." },
  { jp: "敬語", text: "Polite speech has three parts: 尊敬語 lifts others, 謙譲語 lowers yourself, 丁寧語 is everyday polite." },
  { jp: "行く", text: "becomes いらっしゃる when respecting someone else, and 参る or 伺う when humbling yourself." },
  { jp: "ました", text: "ありがとうございました thanks someone for something that's finished." },

  // Everyday phrases
  { jp: "すみません", text: "can mean \"sorry\", \"excuse me\" and \"thank you\"." },
  { jp: "お疲れさまです", text: "works at the office as hello, goodbye and thanks for your work." },
  { jp: "よろしくお願いします", text: "has no neat English match — roughly \"I'm counting on you, let's get along\"." },
  { jp: "いってきます", text: "\"I'll go and come back\" — said leaving home. The reply is いってらっしゃい." },
  { jp: "ただいま", text: "\"I'm home\" — answered with おかえり, \"welcome back\"." },
  { jp: "頑張って", text: "\"Hang in there, do your best\" — what everyone will say before your JLPT." },
  { jp: "さん", text: "is never used for yourself — only for other people." },
  { jp: "先生", text: "is used for teachers, doctors, lawyers and politicians alike." },

  // Sayings
  { jp: "七転び八起き", text: "Fall down seven times, get up eight." },
  { jp: "猿も木から落ちる", text: "Even monkeys fall from trees — even experts make mistakes." },
  { jp: "石の上にも三年", text: "Three years on a cold stone: patience pays off." },
  { jp: "十人十色", text: "Ten people, ten colours — everyone is different." },
  { jp: "花より団子", text: "Dumplings over flowers: substance before style." },
  { jp: "継続は力なり", text: "Continuing is power — a little every day adds up." },
  { jp: "千里の道も一歩から", text: "A thousand-ri journey starts with one step." },

  // Japan
  { jp: "令和8年", text: "In Japan's era calendar, 2026 is Reiwa 8." },
  { text: "Dates go year, month, day: 2026年11月10日." },
  { text: "Addresses go from biggest to smallest: prefecture, city, district, block, building." },
  { text: "Japan has 47 prefectures." },
  { text: "The Japanese school year starts in April." },
  { jp: "四 · 九", text: "し sounds like 死 (death) and く like 苦 (suffering), so 4 is often よん and 9 きゅう." },
  { jp: "桜前線", text: "The \"cherry blossom front\" is forecast as it moves north through Japan each spring." },
  { jp: "七五三", text: "In November, families celebrate children aged three, five and seven." },
  { jp: "〒", text: "is the Japanese postal mark — you'll see it before postcodes." },

  // The JLPT
  { text: "The JLPT is usually held on the first Sunday of July and of December." },
  { text: "N5 is the easiest JLPT level and N1 the hardest." },
  { text: "The JLPT tests reading and listening only — there's no speaking or writing section." },
  { text: "Every JLPT section has its own pass mark: a high total can still fail on one weak section." },
  { jp: "漢字検定", text: "Kanken is a separate kanji test — its top level covers about 6,000 characters." },
  { jp: "花丸", text: "Hanamaru, the flower circle teachers draw on excellent work. Score 90% to earn one here." },
];

/** 5–7 seconds, longer for longer facts. */
export function factDuration(f: Fact): number {
  const chars = f.text.length + (f.jp?.length ?? 0) * 2;
  return Math.max(5000, Math.min(7000, 3800 + chars * 32));
}

/** A shuffled order, so no fact repeats until all have been shown. */
export function shuffled<T>(list: readonly T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

import type { GeneratedQuestion } from "./schema";

// Hand-written questions used ONLY in local development when no GROQ_API_KEY
// is set, so the whole app can be exercised without the model. Never served
// in production (see fixturesEnabled in ./client).

type Fixture = Omit<GeneratedQuestion, "format" | "acceptedAnswers"> & { acceptedAnswers?: string[] };

const mc = (
  point: string,
  prompt: string,
  options: string[],
  answerIndex: number,
  explanationEn: string,
  explanationJp: string,
  gloss: string,
  extra: Partial<Fixture> = {}
): Fixture => ({
  point,
  passage: null,
  audioScript: null,
  prompt,
  options,
  answerIndex,
  answerText: null,
  explanationEn,
  explanationJp,
  gloss,
  ...extra,
});

const BANK: Record<string, Fixture[]> = {
  kanji_reading: [
    mc(
      "駅 (えき) — station",
      "{毎朝|まいあさ}、【駅】まで{歩|ある}いて{行|い}きます。",
      ["えき", "えぎ", "いき", "えいき"],
      0,
      "駅 is read えき. えぎ adds voicing that isn't there, and いき is a sound-alike.",
      "「{駅|えき}」は「えき」と{読|よ}みます。",
      "Every morning I walk to the station."
    ),
    mc(
      "新しい (あたらしい) — new",
      "【新しい】{靴|くつ}を{買|か}いました。",
      ["あたらしい", "あらたしい", "あたらし", "あたしらい"],
      0,
      "新しい is あたらしい. あらたしい swaps the middle syllables — a very common slip.",
      "「{新|あたら}しい」は「あたらしい」と{読|よ}みます。",
      "I bought new shoes."
    ),
  ],
  orthography: [
    mc(
      "会社 (かいしゃ) — company",
      "【かいしゃ】に{電車|でんしゃ}で{行|い}きます。",
      ["会社", "会者", "合社", "回社"],
      0,
      "かいしゃ is written 会社. 会者 uses the 者 of 'person', not 社 of 'company'.",
      "「かいしゃ」は「{会社|かいしゃ}」と{書|か}きます。",
      "I go to the company by train."
    ),
  ],
  word_formation: [
    mc(
      "〜化 — -ization, becoming",
      "この{町|まち}は{観光|かんこう}（　　）が{進|すす}んでいる。",
      ["化", "性", "的", "風"],
      0,
      "観光化 means the town is becoming touristy. 〜的 makes an adjective and can't be the subject of 進む here.",
      "「{観光化|かんこうか}」は{観光地|かんこうち}になっていくことです。",
      "This town is becoming more and more touristy."
    ),
  ],
  context: [
    mc(
      "着る (きる) — to wear on the body",
      "{寒|さむ}いので、（　　）を{着|き}て{出|で}かけました。",
      ["コート", "ぼうし", "くつした", "めがね"],
      0,
      "着る is for clothes on the body, like a coat. Hats take かぶる, socks はく, glasses かける.",
      "「{着|き}る」は{体|からだ}に{着|つ}けるものに{使|つか}います。",
      "It was cold, so I put on a (coat) and went out."
    ),
    mc(
      "借りる (かりる) — to borrow",
      "{友|とも}だちに{本|ほん}を（　　）ので、{明日|あした}{返|かえ}します。",
      ["かりた", "かした", "あげた", "おくった"],
      0,
      "You return something you borrowed, so かりた. かした (lent) would mean the friend returns it.",
      "{返|かえ}すのは{借|か}りたものです。",
      "I (borrowed) a book from a friend, so I'll return it tomorrow."
    ),
  ],
  paraphrase: [
    mc(
      "きたない — dirty",
      "この{部屋|へや}は【きたない】です。",
      [
        "この{部屋|へや}はきれいではありません。",
        "この{部屋|へや}はせまいです。",
        "この{部屋|へや}はあかるくないです。",
        "この{部屋|へや}はしずかではありません。",
      ],
      0,
      "きたない (dirty) is the opposite of きれい (clean), so 'not clean' says the same thing.",
      "「きたない」は「きれいではない」という{意味|いみ}です。",
      "This room is dirty."
    ),
  ],
  usage: [
    mc(
      "届ける (とどける) — to deliver, hand in",
      "「{届|とど}ける」の{使|つか}い{方|かた}として、いちばんいいものはどれですか。",
      [
        "{忘|わす}れ{物|もの}を{友|とも}だちの{家|いえ}に{届|とど}けました。",
        "{毎晩|まいばん}、{音楽|おんがく}を{届|とど}けて{寝|ね}ます。",
        "{電車|でんしゃ}が{駅|えき}に{届|とど}けました。",
        "{窓|まど}を{届|とど}けて、{部屋|へや}を{明|あか}るくしました。",
      ],
      0,
      "届ける means taking something to someone. A train arriving is 着く, and opening a window is 開ける.",
      "「{届|とど}ける」は、ものを{相手|あいて}のところへ{持|も}っていくことです。",
      "Which sentence uses 届ける correctly?"
    ),
  ],
  grammar_form: [
    mc(
      "で — place where an action happens",
      "{駅|えき}（　　）{友|とも}だちに{会|あ}いました。",
      ["で", "を", "へ", "が"],
      0,
      "で marks where an action takes place. へ marks a direction of movement, which 会う isn't.",
      "{動作|どうさ}をする{場所|ばしょ}には「で」を{使|つか}います。",
      "I met a friend (at) the station."
    ),
    mc(
      "〜ように — so that (non-volitional)",
      "{日本語|にほんご}が{上手|じょうず}に{話|はな}せる（　　）、{毎日|まいにち}{練習|れんしゅう}しています。",
      ["ように", "ために", "のに", "ので"],
      0,
      "話せる is a potential (non-volitional) form, which takes ように. ために needs a volitional verb like 話す.",
      "「〜ように」は、{可能形|かのうけい}などの{後|あと}に{使|つか}います。",
      "I practise every day (so that) I can speak Japanese well."
    ),
  ],
  sentence_order: [
    mc(
      "word order — time, companion, object, purpose",
      "{私|わたし}は ＿＿＿ ＿＿＿ ＿★＿ ＿＿＿ {行|い}きました。",
      ["{見|み}に", "{映画|えいが}を", "{昨日|きのう}", "{友|とも}だちと"],
      1,
      "The sentence is 私は昨日友だちと映画を見に行きました, so 映画を sits in the ★ slot.",
      "{正|ただ}しい{文|ぶん}は「{私|わたし}は{昨日|きのう}{友|とも}だちと{映画|えいが}を{見|み}に{行|い}きました」です。",
      "Yesterday I went with a friend to see a movie."
    ),
  ],
  text_grammar: [
    mc(
      "でも — contrast between sentences",
      "（　　）に{入|はい}るものはどれですか。",
      ["でも", "だから", "それに", "たとえば"],
      0,
      "The writer usually cooks, then didn't last week — a contrast, so でも. だから would mean 'therefore'.",
      "{前|まえ}の{文|ぶん}と{反対|はんたい}のことを{言|い}うので「でも」です。",
      "Which word fills the blank?",
      {
        passage:
          "{私|わたし}の{趣味|しゅみ}は{料理|りょうり}です。{週末|しゅうまつ}は{家族|かぞく}のために{晩|ばん}ご{飯|はん}を{作|つく}ります。（　　）、{先週|せんしゅう}は{忙|いそが}しくて{作|つく}れませんでした。{来週|らいしゅう}はカレーを{作|つく}りたいです。",
      }
    ),
  ],
  reading_short: [
    mc(
      "spotting a changed detail",
      "{田中|たなか}さんは{明日|あした}、{何時|なんじ}に{会議|かいぎ}に{行|い}けばいいですか。",
      ["{午後|ごご}２{時|じ}", "{午後|ごご}３{時|じ}", "{午前|ごぜん}３{時|じ}", "{午後|ごご}２{時半|じはん}"],
      1,
      "The memo says the meeting moved from 2 p.m. to 3 p.m. — 2 p.m. is the trap because it's mentioned first.",
      "「３{時|じ}からになりました」と{書|か}いてあります。",
      "What time should Tanaka go to the meeting tomorrow?",
      {
        passage:
          "{田中|たなか}さんへ　{明日|あした}の{会議|かいぎ}は{午後|ごご}２{時|じ}からではなく、３{時|じ}からになりました。{場所|ばしょ}は{変|か}わりません。{資料|しりょう}は{会議|かいぎ}の{前|まえ}に{読|よ}んでおいてください。　{山田|やまだ}",
      }
    ),
  ],
  reading_mid: [
    mc(
      "finding the reason",
      "この{人|ひと}が{自転車|じてんしゃ}で{会社|かいしゃ}に{行|い}くようになったのは、どうしてですか。",
      [
        "{電車|でんしゃ}が{込|こ}んでいて{疲|つか}れたから",
        "{雨|あめ}の{日|ひ}が{好|す}きだから",
        "{会社|かいしゃ}が{近|ちか}くなったから",
        "{電車|でんしゃ}が{高|たか}くなったから",
      ],
      0,
      "The writer says the morning trains were always packed and left them tired before work.",
      "「{電車|でんしゃ}はいつも{込|こ}んでいて…{疲|つか}れてしまいました」とあります。",
      "Why did this person start cycling to work?",
      {
        passage:
          "{私|わたし}は{去年|きょねん}の{春|はる}から、{毎朝|まいあさ}{自転車|じてんしゃ}で{会社|かいしゃ}に{行|い}っています。{前|まえ}は{電車|でんしゃ}を{使|つか}っていましたが、{朝|あさ}の{電車|でんしゃ}はいつも{込|こ}んでいて、{会社|かいしゃ}に{着|つ}く{前|まえ}に{疲|つか}れてしまいました。{自転車|じてんしゃ}に{変|か}えてから、{体|からだ}の{調子|ちょうし}がよくなりました。{雨|あめ}の{日|ひ}は{大変|たいへん}ですが、{今|いま}は{電車|でんしゃ}に{戻|もど}りたいとは{思|おも}いません。",
      }
    ),
  ],
  info_retrieval: [
    mc(
      "combining two details in a notice",
      "{日曜日|にちようび}に{大人|おとな}{二人|ふたり}と{子|こ}ども{一人|ひとり}でプールに{行|い}きます。いくらかかりますか。",
      ["６００{円|えん}", "８００{円|えん}", "１０００{円|えん}", "４００{円|えん}"],
      1,
      "Two adults at 400 yen is 800 yen, and children are free at weekends, so 800 yen.",
      "{土日|どにち}は{子|こ}どもが{無料|むりょう}なので、{大人|おとな}{二人分|ふたりぶん}だけです。",
      "Two adults and one child go to the pool on Sunday. How much does it cost?",
      {
        passage:
          "【{市民|しみん}プール】\n{営業時間|えいぎょうじかん}：{午前|ごぜん}９{時|じ}〜{午後|ごご}８{時|じ}（{月曜日|げつようび}は{休|やす}み）\n{料金|りょうきん}：{大人|おとな} ４００{円|えん}　{子|こ}ども ２００{円|えん}\n※{土曜日|どようび}と{日曜日|にちようび}は、{子|こ}どもは{無料|むりょう}です。",
      }
    ),
  ],
  integrated_reading: [
    mc(
      "what both texts agree on",
      "AとBのどちらも{述|の}べていることは{何|なに}か。",
      [
        "{同僚|どうりょう}と{話|はな}す{機会|きかい}が{減|へ}ること",
        "{通勤|つうきん}の{時間|じかん}がなくなること",
        "{集中|しゅうちゅう}しやすくなること",
        "{家族|かぞく}との{時間|じかん}が{増|ふ}えること",
      ],
      0,
      "Only fewer chances to talk with colleagues appears in both A and B; the others appear in just one.",
      "AもBも、{会社|かいしゃ}の{人|ひと}と{話|はな}す{機会|きかい}が{減|へ}ると{言|い}っています。",
      "What do both A and B say?",
      {
        passage:
          "A：{在宅勤務|ざいたくきんむ}は{通勤|つうきん}の{時間|じかん}がなくなり、{家族|かぞく}と{過|す}ごす{時間|じかん}が{増|ふ}える。ただ、{同僚|どうりょう}との{会話|かいわ}が{減|へ}るのは{問題|もんだい}だ。\nB：{在宅勤務|ざいたくきんむ}では{集中|しゅうちゅう}しやすい{一方|いっぽう}、{仕事|しごと}と{生活|せいかつ}の{区別|くべつ}がつきにくい。{会社|かいしゃ}の{人|ひと}と{話|はな}す{機会|きかい}も{少|すく}なくなる。",
      }
    ),
  ],
  listening_task: [
    mc(
      "picking the final decision",
      "{女|おんな}の{人|ひと}は{何|なに}を{買|か}いますか。",
      ["{飲|の}み{物|もの}", "ケーキ", "{紙|かみ}のお{皿|さら}", "{花|はな}"],
      2,
      "Drinks are already bought and Tanaka is making the cake; the man asks her to get paper plates.",
      "{男|おとこ}の{人|ひと}が「{紙|かみ}のお{皿|さら}…{頼|たの}める？」と{言|い}っています。",
      "What will the woman buy?",
      {
        audioScript:
          "女：{明日|あした}のパーティー、{何|なに}か{持|も}っていったほうがいいかな。\n男：{飲|の}み{物|もの}はもう{買|か}ってあるよ。\n女：じゃあ、ケーキを{買|か}っていこうか。\n男：ケーキは{田中|たなか}さんが{作|つく}ってくれるって。{紙|かみ}のお{皿|さら}が{足|た}りないから、それを{頼|たの}める？\n女：わかった。{帰|かえ}りに{買|か}っていくね。",
      }
    ),
  ],
  listening_point: [
    mc(
      "catching the real reason",
      "{女|おんな}の{人|ひと}はどうして{試合|しあい}に{行|い}きませんでしたか。",
      ["{風邪|かぜ}をひいたから", "{母|はは}が{来|き}たから", "{試合|しあい}が{好|す}きではないから", "{仕事|しごと}があったから"],
      1,
      "Her mother came over unexpectedly. The man guesses a cold, but she says she's fine.",
      "「{急|きゅう}に{母|はは}が{来|く}ることになって」と{言|い}っています。",
      "Why didn't the woman go to the game?",
      {
        audioScript:
          "男：{山田|やまだ}さん、{昨日|きのう}の{試合|しあい}、{見|み}に{来|こ}なかったね。\n女：うん、{行|い}きたかったんだけど、{急|きゅう}に{母|はは}が{来|く}ることになって。\n男：そうか。{風邪|かぜ}でもひいたのかと{思|おも}ったよ。\n女：ううん、{元気|げんき}だよ。",
      }
    ),
  ],
  listening_summary: [
    mc(
      "the speaker's main point",
      "{男|おとこ}の{人|ひと}が{一番|いちばん}{言|い}いたいことは{何|なん}ですか。",
      [
        "{朝|あさ}は{少|すこ}しでも{食|た}べたほうがいい",
        "バナナは{体|からだ}にいい",
        "{朝|あさ}は{早|はや}く{起|お}きたほうがいい",
        "{午前中|ごぜんちゅう}は{仕事|しごと}をしないほうがいい",
      ],
      0,
      "The banana is only an example; the message is to eat something, however small, before going out.",
      "「バナナ{一本|いっぽん}でもいいので、{何|なに}か{食|た}べて」が{言|い}いたいことです。",
      "What is the man's main point?",
      {
        audioScript:
          "男：{最近|さいきん}、{朝|あさ}ご{飯|はん}を{食|た}べない{人|ひと}が{増|ふ}えています。{時間|じかん}がないという{人|ひと}が{多|おお}いのですが、{朝|あさ}{何|なに}も{食|た}べないと、{午前中|ごぜんちゅう}に{集中|しゅうちゅう}できません。バナナ{一本|いっぽん}でもいいので、{何|なに}か{食|た}べてから{出|で}かけましょう。",
      }
    ),
  ],
  listening_response: [
    mc(
      "お先に失礼します — leaving work first",
      "{何|なん}と{答|こた}えますか。",
      ["お{疲|つか}れさまでした。", "いただきます。", "お{待|ま}たせしました。", "ただいま。"],
      0,
      "When a colleague leaves first, you answer お疲れさまでした. ただいま is what you say coming home.",
      "{先|さき}に{帰|かえ}る{人|ひと}には「お{疲|つか}れさまでした」と{言|い}います。",
      "A colleague says: 'I'll be leaving before you.' How do you reply?",
      { audioScript: "女：お{先|さき}に{失礼|しつれい}します。" }
    ),
  ],
  recall_reading: [
    {
      point: "映画 (えいが) — movie",
      passage: null,
      audioScript: null,
      prompt: "{週末|しゅうまつ}は【映画】を{見|み}ます。【映画】の{読|よ}み{方|かた}をひらがなで{書|か}いてください。",
      options: [],
      answerIndex: null,
      answerText: "えいが",
      acceptedAnswers: [],
      explanationEn: "映画 is えいが — 映 (えい, reflect) + 画 (が, picture).",
      explanationJp: "「{映画|えいが}」は「えいが」と{読|よ}みます。",
      gloss: "I watch a movie at the weekend. Write the reading of 映画.",
    },
  ],
  recall_form: [
    {
      point: "〜ました — polite past",
      passage: null,
      audioScript: null,
      prompt: "{昨日|きのう}は{雨|あめ}だったので、{家|いえ}で{本|ほん}を（　　）。【{読|よ}む】",
      options: [],
      answerIndex: null,
      answerText: "読みました",
      acceptedAnswers: ["よみました"],
      explanationEn: "Yesterday is past, and the sentence is polite, so 読む becomes 読みました.",
      explanationJp: "{過去|かこ}のていねいな{形|かたち}は「〜ました」です。",
      gloss: "It rained yesterday, so I (read) a book at home.",
    },
  ],
};

export function fixtureQuestions(formats: string[]): GeneratedQuestion[] {
  return formats.map((format) => {
    const bank = BANK[format] ?? BANK.grammar_form;
    const f = bank[Math.floor(Math.random() * bank.length)];
    return { format, acceptedAnswers: [], ...f };
  });
}

export function fixtureTutorReply(question: string): string {
  return `Good question. In short: ${question.trim().slice(0, 80)} comes down to what the sentence needs at that spot. Look at the word right after the blank — it tells you which form fits. (This is a sample reply: no GROQ_API_KEY is set, so the tutor runs in demo mode.)`;
}

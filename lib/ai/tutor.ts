import type { StoredQuestion, TutorTurn } from "@/lib/domain/question";
import { formatLabel } from "@/lib/domain/question";
import { plainText } from "@/lib/ja/ruby";
import { groq, MODEL_WRITER, fixturesEnabled } from "./client";
import { fixtureTutorReply } from "./fixture";
import { TUTOR_SYSTEM } from "./prompt";

function questionBrief(q: StoredQuestion): string {
  const answer =
    q.answerIndex != null ? `${q.answerIndex + 1}) ${plainText(q.options[q.answerIndex] ?? "")}` : q.answerText ?? "";
  const mine =
    q.userChoice != null
      ? `${q.userChoice + 1}) ${plainText(q.options[q.userChoice] ?? "")}`
      : q.userText || "(no answer)";
  return [
    `Question type: ${formatLabel(q.format)}${q.point ? ` — testing ${q.point}` : ""}`,
    q.passage ? `Passage: ${plainText(q.passage)}` : null,
    q.audioScript ? `Audio script: ${plainText(q.audioScript)}` : null,
    `Question: ${plainText(q.prompt)}`,
    q.options.length ? `Options:\n${q.options.map((o, i) => `${i + 1}) ${plainText(o)}`).join("\n")}` : null,
    `Correct answer: ${answer}`,
    `Learner's answer: ${mine}${q.isCorrect ? " (correct)" : q.isCorrect === false ? " (wrong)" : ""}`,
    `Explanation already shown to them: ${q.explanationEn}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Streams the tutor's reply as plain text chunks. */
export async function* tutorReply(
  q: StoredQuestion,
  history: TutorTurn[],
  message: string
): AsyncGenerator<string> {
  if (fixturesEnabled()) {
    for (const word of fixtureTutorReply(message).split(/(?<= )/)) {
      await new Promise((r) => setTimeout(r, 25));
      yield word;
    }
    return;
  }
  const stream = await groq().chat.completions.create({
    model: MODEL_WRITER,
    stream: true,
    temperature: 0.4,
    reasoning_effort: "low",
    include_reasoning: false,
    max_completion_tokens: 1200,
    messages: [
      { role: "system", content: `${TUTOR_SYSTEM}\n\nThe question:\n${questionBrief(q)}` },
      ...history.slice(-6).map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: message },
    ],
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

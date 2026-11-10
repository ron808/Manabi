"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spokenText } from "./ruby";

// Listening audio via the browser's own Japanese voice: free, offline-capable,
// no server cost. Voice quality varies by device, so callers must handle
// `available === false` (show the script instead).

const PREFERRED = ["Kyoko", "Otoya", "O-Ren", "Hattori", "Google 日本語", "Nanami", "Keita", "Haruka", "Ichiro"];
// Apple's character voices: fine as a last resort, odd for a listening test.
const NOVELTY = ["Eddy", "Flo", "Grandma", "Grandpa", "Reed", "Rocko", "Sandy", "Shelley"];

function japaneseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
  const natural = all.filter((v) => !NOVELTY.some((n) => v.name.startsWith(n)));
  return (natural.length ? natural : all).sort((a, b) => rank(a) - rank(b));
}

function rank(v: SpeechSynthesisVoice) {
  const i = PREFERRED.findIndex((p) => v.name.includes(p));
  return (i === -1 ? 50 : i) + (v.localService ? 0 : 5);
}

interface Line {
  speaker: number;
  text: string;
}

/** Splits a script into lines; `男：` / `女：` / `A:` prefixes pick alternating voices. */
export function scriptLines(script: string): Line[] {
  const speakers = new Map<string, number>();
  const lines: Line[] = [];
  for (const raw of script.split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([^：:\s]{1,4})[：:]\s*(.+)$/);
    let speaker = 0;
    let text = line;
    if (m) {
      if (!speakers.has(m[1])) speakers.set(m[1], speakers.size);
      speaker = speakers.get(m[1])!;
      text = m[2];
    }
    // Long lines get cut off by some engines; speak sentence by sentence.
    for (const sentence of spokenText(text).split(/(?<=[。！？!?])/)) {
      if (sentence.trim()) lines.push({ speaker, text: sentence.trim() });
    }
  }
  return lines;
}

let unlocked = false;

export function useJapaneseSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const token = useRef(0);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setReady(true);
      return;
    }
    const load = () => {
      setVoices(japaneseVoices());
      setReady(true);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    // Some browsers never fire voiceschanged when the list is already final.
    const t = window.setTimeout(() => setReady(true), 1200);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.clearTimeout(t);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Chrome garbage-collects queued utterances (and then never fires onend)
  // unless something holds a reference to them.
  const queue = useRef<SpeechSynthesisUtterance[]>([]);

  // Chrome desktop silently pauses speech after ~15s; nudging it keeps it going.
  useEffect(() => {
    if (!speaking) return;
    const id = window.setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 8000);
    return () => window.clearInterval(id);
  }, [speaking]);

  const stop = useCallback(() => {
    token.current++;
    queue.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /**
   * iOS Safari only lets a page speak once speech has started inside a tap.
   * Call this synchronously in the click handler, before any `await`.
   */
  const unlock = useCallback(() => {
    if (!("speechSynthesis" in window) || unlocked) return;
    unlocked = true;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(
    (script: string, { rate = 0.95 }: { rate?: number } = {}) => {
      if (!voices.length) return;
      const synth = window.speechSynthesis;
      const busy = synth.speaking || synth.pending;
      token.current++;
      if (busy) synth.cancel();
      const mine = token.current;
      const lines = scriptLines(script);
      const utterances = lines.map((line, i) => {
        const u = new SpeechSynthesisUtterance(line.text);
        u.lang = "ja-JP";
        u.voice = voices[line.speaker % voices.length];
        // With fewer voices than speakers, a lower pitch tells the second one apart.
        u.pitch = line.speaker >= voices.length ? 0.78 : 1;
        u.rate = rate;
        if (i === lines.length - 1) {
          u.onend = () => token.current === mine && setSpeaking(false);
        }
        u.onerror = (e) => {
          // "interrupted"/"canceled" just mean we stopped it ourselves.
          if (token.current === mine && e.error !== "interrupted" && e.error !== "canceled") setSpeaking(false);
        };
        return u;
      });
      queue.current = utterances;
      setSpeaking(true);
      const enqueue = () => {
        if (token.current !== mine) return;
        utterances.forEach((u) => synth.speak(u));
      };
      // Chrome drops speech queued in the same tick as cancel().
      if (busy) window.setTimeout(enqueue, 80);
      else enqueue();
    },
    [voices]
  );

  return { ready, available: voices.length > 0, speaking, speak, stop, unlock };
}

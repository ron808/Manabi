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

/** How long to keep looking for voices before deciding the device has none. */
const VOICE_WAIT_MS = 6000;

export function useJapaneseSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  /** The browser refused to speak (no tap on the page yet). */
  const [blocked, setBlocked] = useState(false);
  const token = useRef(0);
  // Chrome garbage-collects an utterance that nothing references, and then
  // never fires its onend — keep the current one alive.
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  // Chrome fills the voice list late and doesn't reliably fire
  // "voiceschanged" for listeners added after the page loaded, so poll too.
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setReady(true);
      return;
    }
    const started = Date.now();
    const tokens = token;
    let poll = 0;
    const load = () => {
      const found = japaneseVoices();
      if (found.length) {
        setVoices(found);
        setReady(true);
        window.clearInterval(poll);
      } else if (Date.now() - started > VOICE_WAIT_MS) {
        setReady(true);
        window.clearInterval(poll);
      }
    };
    load();
    poll = window.setInterval(load, 250);
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.clearInterval(poll);
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      tokens.current++;
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    token.current++;
    current.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /**
   * Speaks a script line by line, each starting when the previous ends.
   * Must be called directly from a tap/click (no `await` before it) — iOS
   * Safari only allows speech that starts inside a user gesture.
   */
  const speak = useCallback(
    (script: string, { rate = 0.95 }: { rate?: number } = {}) => {
      const synth = window.speechSynthesis;
      const list = voices.length ? voices : japaneseVoices();
      if (!list.length) return false;
      if (synth.speaking || synth.pending) synth.cancel();
      const mine = ++token.current;
      const lines = scriptLines(script);
      let i = 0;
      const next = () => {
        if (token.current !== mine) return;
        const line = lines[i++];
        if (!line) {
          current.current = null;
          setSpeaking(false);
          return;
        }
        const u = new SpeechSynthesisUtterance(line.text);
        u.lang = "ja-JP";
        u.voice = list[line.speaker % list.length];
        // With fewer voices than speakers, a lower pitch tells the second one apart.
        u.pitch = line.speaker >= list.length ? 0.78 : 1;
        u.rate = rate;
        u.onend = next;
        u.onerror = (e) => {
          // "interrupted"/"canceled" mean we stopped it ourselves.
          if (e.error === "interrupted" || e.error === "canceled") return;
          if (e.error === "not-allowed") {
            token.current++;
            setSpeaking(false);
            setBlocked(true);
            return;
          }
          next();
        };
        current.current = u;
        synth.speak(u);
      };
      setBlocked(false);
      setSpeaking(true);
      next();
      return true;
    },
    [voices]
  );

  return { ready, available: voices.length > 0, speaking, blocked, speak, stop };
}

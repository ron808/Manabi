// Short enough to take in at a glance while the clouds are up.
export const LOADING_LINES = [
  "Coming your way…",
  "Sharpening the red pen…",
  "Grinding fresh ink…",
  "Shuffling the papers…",
  "Folding a paper crane…",
];

export function randomItem<T>(list: readonly T[], not?: T): T {
  if (list.length < 2) return list[0];
  let pick = list[Math.floor(Math.random() * list.length)];
  while (pick === not) pick = list[Math.floor(Math.random() * list.length)];
  return pick;
}

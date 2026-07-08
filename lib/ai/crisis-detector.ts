const CRISIS_REGEXES = [
  /\bsuicide\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bend it all\b/i,
  /\bself-harm\b/i,
  /\bcutting\b/i,
  /\bworthless\b/i,
  /\bwant to die\b/i,
  /\bno reason to live\b/i,
];

export function detectCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_REGEXES.some((regex) => regex.test(text));
}

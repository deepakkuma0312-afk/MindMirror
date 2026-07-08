import { isSameDay, subDays } from 'date-fns';

export function calculateStreak(entries: { createdAt: Date }[]): number {
  if (entries.length === 0) return 0;

  // Sort entries descending
  const sorted = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const today = new Date();
  const yesterday = subDays(today, 1);

  const latestDate = new Date(sorted[0].createdAt);
  const isLatestToday = isSameDay(latestDate, today);
  const isLatestYesterday = isSameDay(latestDate, yesterday);

  // If no entry today or yesterday, streak is broken (0)
  if (!isLatestToday && !isLatestYesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = isLatestToday ? today : yesterday;

  // Track backward day by day
  while (true) {
    const hasEntry = sorted.some((e) => isSameDay(new Date(e.createdAt), checkDate));
    if (hasEntry) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

export function extractTriggerTags(entries: { tags: string[] | null }[]): { text: string; count: number }[] {
  const counts: Record<string, number> = {};
  
  entries.forEach((entry) => {
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag) => {
        const cleanTag = tag.trim();
        if (cleanTag) {
          counts[cleanTag] = (counts[cleanTag] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(counts)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);
}

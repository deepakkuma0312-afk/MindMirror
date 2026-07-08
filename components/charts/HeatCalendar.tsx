'use client';

import { useEffect, useState } from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';

interface HeatCalendarProps {
  entries: {
    createdAt: Date;
    moodScore: number;
  }[];
}

export default function HeatCalendar({ entries }: HeatCalendarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-32 w-full bg-stone-100/50 animate-pulse rounded-xl" />;
  }

  // Create array of last 90 days
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);
  const startDate = startOfWeek(ninetyDaysAgo); // Align to week

  const totalDays = 98; // Roughly 14 weeks to look complete
  const daysArray = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));

  // Helper to color code mood score
  const getColorClass = (score: number | null) => {
    if (score === null) return 'bg-stone-200/40 dark:bg-stone-800/40 hover:bg-stone-300/60';
    if (score >= 9) return 'bg-emerald-600 text-white hover:bg-emerald-700';
    if (score >= 7) return 'bg-primary text-white hover:bg-primary/90';
    if (score >= 5) return 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300';
    if (score >= 3) return 'bg-purple-200 text-purple-800 hover:bg-purple-300';
    return 'bg-rose-200 text-rose-800 hover:bg-rose-300'; // low mood
  };

  const getMoodForDay = (date: Date) => {
    const matching = entries.find((e) => isSameDay(new Date(e.createdAt), date));
    return matching ? matching.moodScore : null;
  };

  return (
    <div className="w-full overflow-x-auto p-2 font-sans">
      <div className="flex flex-col gap-1 min-w-[500px]">
        {/* Grid Container */}
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 justify-start">
          {daysArray.map((day, idx) => {
            const mood = getMoodForDay(day);
            const isToday = isSameDay(day, today);
            
            return (
              <div
                key={idx}
                title={`${format(day, 'MMM dd, yyyy')}${mood !== null ? ` — Mood: ${mood}/10` : ' — No Entry'}`}
                className={`h-4.5 w-4.5 rounded-sm transition-all cursor-pointer flex items-center justify-center text-[8px] font-bold ${getColorClass(mood)} ${
                  isToday ? 'ring-2 ring-purple-400 ring-offset-1' : ''
                }`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-end items-center gap-1.5 text-[10px] text-stone-400 mt-3 px-2">
          <span>Low</span>
          <div className="h-3 w-3 rounded-sm bg-rose-200" />
          <div className="h-3 w-3 rounded-sm bg-purple-200" />
          <div className="h-3 w-3 rounded-sm bg-emerald-200" />
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <div className="h-3 w-3 rounded-sm bg-emerald-600" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

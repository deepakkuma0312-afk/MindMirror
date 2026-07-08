'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

interface MoodTrendProps {
  data: {
    createdAt: Date;
    moodScore: number;
    energy: number;
  }[];
}

export default function MoodTrend({ data }: MoodTrendProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 w-full bg-stone-100/50 animate-pulse rounded-xl" />;
  }

  // Format and sort data for chart (earliest to latest)
  const chartData = [...data]
    .reverse()
    .slice(-7)
    .map((item) => ({
      date: format(new Date(item.createdAt), 'MMM dd'),
      Mood: item.moodScore,
      Energy: item.energy,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-white/40">
        <p className="text-sm text-stone-400">No mood entries recorded for this week yet.</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#466b57" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#466b57" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            axisLine={false} 
            stroke="#a3a3a3" 
            fontSize={11} 
          />
          <YAxis 
            domain={[1, 10]} 
            tickCount={5} 
            tickLine={false} 
            axisLine={false} 
            stroke="#a3a3a3" 
            fontSize={11} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' 
            }}
          />
          <Area
            type="monotone"
            dataKey="Mood"
            stroke="#466b57"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMood)"
          />
          <Area
            type="monotone"
            dataKey="Energy"
            stroke="#a78bfa"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorEnergy)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

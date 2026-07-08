import { getSessionUser } from '@/lib/auth/supabase';
import { getMoodEntries, getInsights, getUser } from '@/lib/db/dbHelper';
import { calculateStreak, extractTriggerTags } from '@/lib/analytics/scoring';
import MoodTrend from '@/components/charts/MoodTrend';
import HeatCalendar from '@/components/charts/HeatCalendar';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Brain,
  BookOpen,
  ClipboardList,
  MessageSquarePlus,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import BreathingExercise from '@/components/shared/BreathingExercise';

export const revalidate = 0;

export default async function PatientDashboard() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const profile = await getUser(sessionUser.id);
  const name = profile?.name || 'User';

  const moodEntries = await getMoodEntries(sessionUser.id);
  const insights = await getInsights(sessionUser.id);
  const latestInsight = insights[0] || null;

  const streak = calculateStreak(moodEntries);
  const tags = extractTriggerTags(moodEntries).slice(0, 8);

  // Calculate today's status
  const todayEntry = moodEntries.find(
    (e) => new Date(e.createdAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif text-stone-800">
            Hello, <span className="italic font-normal">{name}</span>
          </h1>
          <p className="text-sm text-stone-500">
            How is your mind feeling today? Take a moment to reflect.
          </p>
        </div>

        {/* Streak & Status Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 shadow-sm">
            <Flame className="h-5 w-5 fill-amber-500 text-amber-500 animate-bounce" />
            <div className="text-left">
              <p className="text-xs text-amber-600 font-semibold leading-none">Streak</p>
              <p className="text-base font-bold leading-none mt-1">{streak} {streak === 1 ? 'day' : 'days'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-left">
              <p className="text-xs text-emerald-600 font-semibold leading-none">Daily check-in</p>
              <p className="text-sm font-bold leading-none mt-1">
                {todayEntry ? 'Completed' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Mood Ring & Quick Actions */}
        <div className="lg:col-span-1 space-y-8">

          {/* Animated Mood Ring */}
          <div className="p-8 rounded-2xl border border-white/50 bg-white/40 shadow-sm text-center flex flex-col items-center justify-center space-y-6">
            <h3 className="text-sm font-semibold text-stone-600 tracking-wide uppercase">Today's Reflection</h3>

            <Link href="/checkin" className="relative group flex items-center justify-center cursor-pointer">
              {/* Pulsing ring background */}
              <div className="absolute inset- h-40 w-40 rounded-full bg-primary/10 mood-ring-pulse" />

              <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-primary to-emerald-700 hover:from-primary hover:to-primary text-white flex flex-col items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                <MessageSquarePlus className="h-8 w-8 animate-pulse mb-1" />
                <span className="text-xs font-semibold uppercase tracking-wider">Reflect Now</span>
              </div>
            </Link>

            <div className="space-y-1">
              <p className="text-sm font-medium text-stone-700">
                {todayEntry
                  ? "You've checked in today. Want to share more?"
                  : "Start your 60-second conversational AI check-in"
                }
              </p>
              <p className="text-xs text-stone-400">
                We'll track your mood, sleep, and energy levels.
              </p>
            </div>
          </div>

          {/* Quick Actions & Breathing Modal */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-700 tracking-wide">Quick Exercises</h3>
            <div className="space-y-2">
              <BreathingExercise />

              <Link href="/journal" className="flex items-center justify-between p-3.5 hover:bg-stone-50 rounded-xl transition-all border border-stone-100 group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-stone-800">Write Journal</p>
                    <p className="text-xs text-stone-400">Jot down private thoughts</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link href="/assessments" className="flex items-center justify-between p-3.5 hover:bg-stone-50 rounded-xl transition-all border border-stone-100 group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                    <ClipboardList className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-stone-800">Clinical Screening</p>
                    <p className="text-xs text-stone-400">GAD-7 / PHQ-9 assessments</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column: Mood Charts & AI Insights */}
        <div className="lg:col-span-2 space-y-8">

          {/* AI Weekly Insight Card */}
          <div className="p-6 rounded-2xl border border-purple-200/50 bg-gradient-to-r from-purple-50/40 via-indigo-50/10 to-emerald-50/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="h-24 w-24 text-primary" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-stone-700 tracking-wide">AI Companion Insight</h3>
            </div>

            {latestInsight ? (
              <div className="space-y-4">
                <p className="text-stone-700 leading-relaxed text-sm font-sans italic">
                  "{latestInsight.summaryMd}"
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className={`px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${latestInsight.trend === 'improving'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : latestInsight.trend === 'declining'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-stone-50 text-stone-600 border border-stone-200'
                    }`}>
                    <TrendingUp className="h-3 w-3" />
                    Trend: {latestInsight.trend}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full uppercase tracking-wider ${latestInsight.riskLevel === 'high'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : latestInsight.riskLevel === 'medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                    Risk: {latestInsight.riskLevel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-stone-500 text-sm leading-relaxed">
                  Your weekly insight will appear here after a few check-ins. Keep journaling and reflecting daily!
                </p>
                <span className="text-xs text-stone-400 italic block">"Your journey starts here 🌱"</span>
              </div>
            )}
          </div>

          {/* 7-Day Trend Chart */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-700 tracking-wide">Weekly Trends</h3>
              <div className="flex items-center gap-4 text-xs font-semibold text-stone-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Mood (1-10)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#a78bfa]" />
                  <span>Energy (1-10)</span>
                </div>
              </div>
            </div>
            <MoodTrend data={moodEntries.slice(0, 10)} />
          </div>

          {/* Heat Calendar (90 Days) */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-700 tracking-wide">Reflection Heatmap (90 Days)</h3>
            <HeatCalendar entries={moodEntries} />
          </div>

          {/* Trigger Tags */}
          <div className="p-6 rounded-2xl border border-stone-200/50 bg-white/70 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-700 tracking-wide">Common Triggers</h3>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag.text}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200/70 border border-stone-200/40 rounded-full text-xs font-medium text-stone-700 transition-all cursor-default"
                  >
                    #{tag.text === 'cognitive' ? 'focus' : tag.text}{' '}
                    <span className="text-[10px] text-stone-400 font-bold bg-white/80 border border-stone-200 px-1.5 py-0.5 rounded-full ml-1">
                      {tag.count}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 leading-relaxed italic">
                No triggers identified yet. Talk to the AI check-in to tag what's affecting you.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

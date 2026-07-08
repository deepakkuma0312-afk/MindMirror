import { getSessionUser } from '@/lib/auth/supabase';
import { getMoodEntries, getInsights, addInsight, getAssessments } from '@/lib/db/dbHelper';
import { generateText } from 'ai';
import { createGoogle } from '@ai-sdk/google';

export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. Fetch latest insight
    const insights = await getInsights(sessionUser.id);
    const latestInsight = insights[0] || null;

    // Check if stale (older than 3 days)
    const isStale = latestInsight 
      ? (new Date().getTime() - new Date(latestInsight.createdAt).getTime()) > 3 * 24 * 60 * 60 * 1000
      : true;

    if (!isStale && latestInsight) {
      return new Response(JSON.stringify(latestInsight), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Fetch past 7 days of mood entries
    const moodEntries = await getMoodEntries(sessionUser.id, 7);

    // If too few logs, return a friendly placeholder insight
    if (moodEntries.length < 3) {
      return new Response(
        JSON.stringify({
          summaryMd: "Keep checking in daily. Once you have logged at least 3 reflections, I will analyze your emotional baseline and triggers here! 🌱",
          trend: "stable",
          riskLevel: "low",
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate statistics
    const avgMood = moodEntries.reduce((sum, e) => sum + e.moodScore, 0) / moodEntries.length;
    const avgEnergy = moodEntries.reduce((sum, e) => sum + e.energy, 0) / moodEntries.length;
    const avgSleep = moodEntries.reduce((sum, e) => sum + (e.sleepHours || 8), 0) / moodEntries.length;
    
    const tagsMap: Record<string, number> = {};
    moodEntries.forEach((e) => {
      if (e.tags) {
        e.tags.forEach((t) => {
          tagsMap[t] = (tagsMap[t] || 0) + 1;
        });
      }
    });
    const topTags = Object.entries(tagsMap)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const mainTag = topTags[0] || 'reflection';

    // 3. Generate insight (Gemini vs Local Rule Engine)
    const isValidGeminiKey = (key?: string) => !!key && key.startsWith('AIzaSy');
    const hasApiKey = isValidGeminiKey(process.env.GEMINI_API_KEY) || isValidGeminiKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    let summaryMd = '';
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (hasApiKey) {
      try {
        const googleProvider = createGoogle({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });

        const prompt = `Analyze this patient's mental health data over the last 7 days:
- Average Mood Score: ${avgMood.toFixed(1)}/10
- Average Energy Level: ${avgEnergy.toFixed(1)}/10
- Average Sleep Hours: ${avgSleep.toFixed(1)} hrs
- Logged Triggers: ${topTags.join(', ')}

Provide a JSON response containing:
1. "summary_md": a warm, empathetic 2-sentence clinical-grade insight referencing their main triggers (e.g. "You logged multiple stressors related to work this week, which appears to directly drag down your Sunday energy levels. Consider blocking out rest hours.")
2. "trend": one of "improving" | "stable" | "declining"
3. "risk_level": one of "low" | "medium" | "high"`;

        const result = await generateText({
          model: googleProvider('gemini-1.5-flash'),
          prompt,
          system: "You are MindMirror Clinical Analyzer, an empathetic, objective psychologist companion. Always respond in JSON.",
        });

        const parsed = JSON.parse(result.text.replace(/```json|```/gi, '').trim());
        summaryMd = parsed.summary_md;
        trend = parsed.trend;
        riskLevel = parsed.risk_level;
      } catch (err) {
        console.error('LLM Insight generation failed, falling back to rule-engine:', err);
      }
    }

    // Algorithmic Rule Engine fallback
    if (!summaryMd) {
      // Calculate trend by splitting list in half
      const midpoint = Math.floor(moodEntries.length / 2);
      const recentHalf = moodEntries.slice(0, midpoint);
      const olderHalf = moodEntries.slice(midpoint);
      
      const recentAvg = recentHalf.reduce((sum, e) => sum + e.moodScore, 0) / (recentHalf.length || 1);
      const olderAvg = olderHalf.reduce((sum, e) => sum + e.moodScore, 0) / (olderHalf.length || 1);

      if (recentAvg > olderAvg + 0.8) {
        trend = 'improving';
      } else if (recentAvg < olderAvg - 0.8) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }

      // Risk level tresholds
      if (avgMood < 5.0) {
        riskLevel = 'high';
      } else if (avgMood < 7.0 || trend === 'declining') {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Generate supportive template advice based on primary tag triggers
      if (mainTag === 'work') {
        summaryMd = `You've logged multiple entries related to #work this week. While your overall mood remains ${trend}, we notice your energy levels dip noticeably on stress days. Try inserting 5-minute breathing spaces in your calendar.`;
      } else if (mainTag === 'sleep') {
        summaryMd = `Your logs show a strong relationship between sleep hours and daily mood. On days following less than 6.5 hours of sleep, your physical energy is significantly impacted. Triage your night-time screen usage.`;
      } else if (mainTag === 'relationships') {
        summaryMd = `Connection and social dynamics were a central theme in your journal reflections this week. These interactions are keeping your emotional baseline ${trend}. Continue to hold boundaries where needed.`;
      } else {
        summaryMd = `You've maintained a steady rhythm of daily reflections, which is a great grounding practice! Your emotional baseline is currently ${trend} with a ${riskLevel} risk rating. Keep dedicating time for self-care.`;
      }
    }

    // 4. Save new insight to database
    const newInsight = await addInsight({
      userId: sessionUser.id,
      weekStart: new Date(subDays(new Date(), 7)),
      summaryMd,
      trend,
      riskLevel,
    });

    return new Response(JSON.stringify(newInsight), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Insights API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Helper date sub method
function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

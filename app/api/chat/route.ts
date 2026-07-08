import { createGoogle } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { MINDMIRROR_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { detectCrisis } from '@/lib/ai/crisis-detector';
import { getSessionUser } from '@/lib/auth/supabase';
import { addMoodEntry, addAIConversation, addAlert, getUser } from '@/lib/db/dbHelper';
import { z } from 'zod';

const CLINICAL_TOPICS = [
  { day: "Sunday", topic: "Current Symptoms (Mood, Anxiety, and Concentration)" },
  { day: "Monday", topic: "Functioning (Daily Self-Care, Work/School, and Social Withdrawal)" },
  { day: "Tuesday", topic: "Safety, Risk, and Support System" },
  { day: "Wednesday", topic: "Mental Status (Thought Flow and Cognitive Decision Making)" },
  { day: "Thursday", topic: "Basic Health Factors (Sleep, Energy, and Physical Health)" },
  { day: "Friday", topic: "History, Context, Triggers, and Coping Skills" },
  { day: "Saturday", topic: "Clinical Screening Check (PHQ-9 and GAD-7 Items)" },
];

const DAILY_MOCK_QUESTIONS = [
  // 0: Sunday (Current Symptoms)
  {
    turn1: "Thank you for sharing that. Today we are focusing on Current Symptoms. How has your focus or attention been today? Have you noticed any anxiety, irritability, or feeling on edge?",
    turn2: "I appreciate you opening up. When you experience these symptoms, how does it affect your ability to stay present or manage daily responsibilities?"
  },
  // 1: Monday (Functioning)
  {
    turn1: "Got it. Today we are reflecting on Functioning. How is your self-care routine going? Are you eating well and keeping up with daily habits, or has it felt like a struggle?",
    turn2: "That's completely understandable. How has this impacted your relationships, social connections, or work/school performance today? Have you felt like withdrawing?"
  },
  // 2: Tuesday (Safety & Risk)
  {
    turn1: "Thanks for sharing. Today we are focusing on Safety & Support. When things get heavy or stressful, do you have supportive people or protective resources you feel comfortable leaning on?",
    turn2: "It's so important to have those protective factors. What are some of your reasons, values, or coping skills that help keep you grounded when you face challenges?"
  },
  // 3: Wednesday (Mental Status)
  {
    turn1: "I see. Today we are exploring our overall Cognitive State and Mental Status. Do your thoughts feel logical and organized today, or do they feel racing or scattered?",
    turn2: "I understand. Do you feel like you recognize what's triggering these thought patterns, and are you able to make safe decisions for yourself when they happen?"
  },
  // 4: Thursday (Basic Health)
  {
    turn1: "Thanks for letting me know. Today we are focusing on Basic Health. How did you sleep last night, and how would you rate your physical energy level today?",
    turn2: "Got it. Reflecting on today, did physical fatigue, appetite changes, or any physical pain play a major role in how you are feeling?"
  },
  // 5: Friday (History & Context)
  {
    turn1: "I appreciate that. Today we reflect on Triggers and History. Have any major life events, conflicts, or specific triggers occurred recently that are impacting you today?",
    turn2: "Thank you for sharing that context. Looking back at past episodes, what has historically helped you cope or recover when these triggers arise?"
  },
  // 6: Saturday (Screening Check)
  {
    turn1: "Thanks for checking in today. Today we are doing a quick Screening Check. Over the past few days, how often have you been bothered by feeling down, depressed, or hopeless?",
    turn2: "Got it. And how often have you felt nervous, anxiety, or unable to stop or control worrying during this time?"
  }
];

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    // 1. Crisis Detection
    const hasCrisis = detectCrisis(lastMessage);
    if (hasCrisis) {
      // Create alert in database immediately
      const profile = await getUser(sessionUser.id);
      if (profile?.therapistId) {
        await addAlert({
          userId: sessionUser.id,
          therapistId: profile.therapistId,
          type: 'crisis',
          severity: 'critical',
          message: `${profile.name || 'Patient'} flagged crisis protocol during AI check-in. Note: "${lastMessage.substring(0, 100)}..."`,
        });
      }

      // Return instant JSON triggering crisis protocols
      return new Response(
        JSON.stringify({
          text: "I hear that you're going through an incredibly hard time right now, and I want to make sure you're safe. Please connect with immediate professional support. I've flagged this for your safety.",
          toolCall: {
            name: 'trigger_crisis_protocol',
            args: {
              severity: 'critical',
              reason: `Crisis keyword detected in user entry: "${lastMessage}"`,
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Real LLM vs Mock mode helper
    const isValidGeminiKey = (key?: string) => !!key && key.startsWith('AIzaSy');
    const hasApiKey = isValidGeminiKey(process.env.GEMINI_API_KEY) || isValidGeminiKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    if (hasApiKey) {
      try {
        const googleProvider = createGoogle({
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        });

        // Vercel AI SDK integration
        const coreMessages = messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        }));
        
        const dayIndex = new Date().getDay();
        const dailyTopic = CLINICAL_TOPICS[dayIndex];

        const result = await streamText({
          model: googleProvider('gemini-1.5-flash'),
          system: `${MINDMIRROR_SYSTEM_PROMPT}\n\nTODAY'S SPECIAL CLINICAL FOCUS: Today is ${dailyTopic.day}. You must tailor the conversation to evaluate the patient's "${dailyTopic.topic}". Ask specific questions about this topic, but keep the tone warm, caring, and conversational.`,
          messages: coreMessages,
          tools: {
            save_checkin: tool({
              description: 'Save user check-in data containing mood, energy, sleep hours, anxiety, tags and summary.',
              parameters: z.object({
                mood: z.number().min(1).max(10).describe('User mood score from 1-10'),
                energy: z.number().min(1).max(10).describe('User energy score from 1-10'),
                sleep_hours: z.number().describe('Hours of sleep'),
                anxiety: z.number().min(1).max(10).describe('Anxiety level from 1-10'),
                tags: z.array(z.string()).describe('Keywords or triggers mentioned (e.g. work, health, stress)'),
                summary: z.string().describe('A 1-sentence supportive journal summary'),
              }),
              execute: (async (args: { mood: number, energy: number, sleep_hours: number, anxiety: number, tags: string[], summary: string }) => {
                // Save to mood entries
                await addMoodEntry({
                  userId: sessionUser.id,
                  moodScore: args.mood,
                  energy: args.energy,
                  sleepHours: args.sleep_hours,
                  tags: args.tags,
                  note: args.summary,
                  source: 'ai',
                });

                // Save the conversation transcript
                await addAIConversation({
                  userId: sessionUser.id,
                  messages: JSON.stringify(messages),
                  extractedSignals: args,
                  sentimentScore: args.mood / 10,
                  crisisFlagged: false,
                });

                return { success: true, message: 'Check-in saved successfully.' };
              }) as any,
            } as any),
            trigger_crisis_protocol: tool({
              description: 'Trigger immediate safety protocols if user exhibits self-harm, suicide, or hopelessness.',
              parameters: z.object({
                severity: z.enum(['high', 'critical']),
                reason: z.string(),
              }),
              execute: (async (args: { severity: 'high' | 'critical', reason: string }) => {
                const profile = await getUser(sessionUser.id);
                if (profile?.therapistId) {
                  await addAlert({
                    userId: sessionUser.id,
                    therapistId: profile.therapistId,
                    type: 'crisis',
                    severity: args.severity,
                    message: `AI detected potential crisis for ${profile.name || 'Patient'}: ${args.reason}`,
                  });
                }
                return { success: true, message: 'Crisis protocol triggered.' };
              }) as any,
            } as any),
          },
        });

        return result.toTextStreamResponse();
      } catch (err: any) {
        console.error('Real LLM chat stream failed, falling back to mock mode:', err);
      }
    }

    // 3. Fallback Mock AI stream logic
    const turnCount = messages.filter((m: any) => m.role === 'user').length;
    let replyText = '';
    let toolCall: any = null;

    const dayIndex = new Date().getDay();
    const mockQuestions = DAILY_MOCK_QUESTIONS[dayIndex];

    const lowMoodKeywords = /sad|depressed|bad|tired|exhausted|stressed|anxious|angry|scattered|confused|racing|irritable|hopeless|panic|fear|avoid|nightmare|numb|distracted|forgetful|struggle|difficulty|fatigue|pain|sick/i;
    const goodMoodKeywords = /good|great|fine|happy|excited|well|calm|peaceful|organized|focused/i;

    if (turnCount === 1) {
      // Respond to user's first answer with the daily turn2 question
      replyText = mockQuestions.turn2;
    } else if (turnCount === 2) {
      // Respond to user's second answer with a general prompt to collect sleep and energy (or triggers if Thursday)
      if (dayIndex !== 4) {
        replyText = "Got it. To help complete today's wellness chart, how did you sleep last night (in hours) and how is your physical energy level today (1-10)?";
      } else {
        replyText = "Got it. Reflecting on today, what do you think is the biggest driver or trigger behind how you are feeling? Is there anything specific (like work, relationships, or health) that stands out?";
      }
    } else {
      // Complete the check-in (Turn 3+)
      // Extract mock parameters based on chat history
      const fullChatText = messages.map((m: any) => m.content).join(' ');
      
      // Extract sleep hours (e.g. "6 hours", "slept 7.5", or just first number)
      const sleepMatch = fullChatText.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs|hours|h)?/i);
      const sleepHours = sleepMatch ? parseFloat(sleepMatch[1]) : 7.5;

      // Extract energy level (e.g. "energy 8", "energy is 5", or number at end/isolated)
      const energyMatch = fullChatText.match(/(?:energy|level|is)\s*(?:level)?\s*(?:is)?\s*(\d+)/i) || fullChatText.match(/(\d+)\s*(?:\/10)?\s*$/);

      let mood = 7;
      let anxiety = 4;
      let tags: string[] = [];

      // Tokenize the chat text into words
      const words = fullChatText.toLowerCase().split(/\W+/);

      // Define lists of keywords
      const negativeWords = ['sad', 'depressed', 'bad', 'tired', 'exhausted', 'stressed', 'anxious', 'angry', 'scattered', 'confused', 'racing', 'irritable', 'hopeless', 'panic', 'fear', 'avoid', 'nightmare', 'numb', 'distracted', 'forgetful', 'struggle', 'difficulty', 'fatigue', 'pain', 'sick', 'worry', 'worried', 'dread', 'lonely', 'isolated', 'struggling'];
      const positiveWords = ['good', 'great', 'fine', 'happy', 'excited', 'well', 'calm', 'peaceful', 'organized', 'focused', 'awesome', 'wonderful', 'healthy', 'secure', 'supported'];

      let negCount = 0;
      let posCount = 0;

      for (const word of words) {
        if (negativeWords.includes(word)) negCount++;
        if (positiveWords.includes(word)) posCount++;
      }

      // Calculate dynamic mood (range 1-10)
      mood = 7 - (negCount * 1.5) + (posCount * 1.0);
      mood = Math.max(1, Math.min(10, Math.round(mood)));

      // Calculate dynamic anxiety (range 1-10)
      anxiety = 4 + (negCount * 1.5) - (posCount * 1.0);
      anxiety = Math.max(1, Math.min(10, Math.round(anxiety)));

      // Determine energy
      let energy = 6;
      if (energyMatch) {
        energy = parseInt(energyMatch[1]);
      } else {
        energy = 6 - (negCount * 1.0) + (posCount * 1.0);
        if (fullChatText.match(/tired|exhausted|fatigue|sleepy/i)) {
          energy = energy - 2;
        }
      }
      energy = Math.max(1, Math.min(10, Math.round(energy)));

      const lowercaseText = fullChatText.toLowerCase();
      if (lowercaseText.match(/work|office|job|school|study|exam/i)) tags.push('work');
      if (lowercaseText.match(/sleep|tired|insomnia|nightmare/i)) tags.push('sleep');
      if (lowercaseText.match(/family|friend|partner|husband|wife|relationship|relationships|people/i)) tags.push('relationships');
      if (lowercaseText.match(/health|sick|pain|headache|stomach/i)) tags.push('health');
      if (lowercaseText.match(/scattered|confused|racing|distracted|concentration/i)) tags.push('focus');
      if (lowercaseText.match(/anxious|anxiety|panic|fear|worry|worried|dread/i)) tags.push('anxiety');
      if (lowercaseText.match(/sad|depressed|hopeless|down|grief|loss/i)) tags.push('mood');

      if (tags.length === 0) {
        tags.push('reflection');
      }

      // Map tags to user-friendly titles
      const friendlyAreas = tags.map(tag => {
        if (tag === 'work') return 'Work';
        if (tag === 'sleep') return 'Sleep';
        if (tag === 'relationships') return 'Relationships';
        if (tag === 'health') return 'Physical Health';
        if (tag === 'focus') return 'Focus';
        if (tag === 'anxiety') return 'Anxiety';
        if (tag === 'mood') return 'Mood';
        if (tag === 'reflection') return 'General Reflection';
        return tag;
      });

      const summary = mood >= 7
        ? `Overall wellness: Positive. Focus areas: ${friendlyAreas.join(' • ')}`
        : `Areas you're struggling with: ${friendlyAreas.join(' • ')}`;

      replyText = `Thank you for sharing your reflection with me. I've noted down your mood (${mood}/10), energy (${energy}/10), sleep (${sleepHours} hrs), and focus areas (${friendlyAreas.join(', ')}). Remember to be gentle with yourself. I've saved this check-in.`;

      toolCall = {
        name: 'save_checkin',
        args: {
          mood,
          energy,
          sleep_hours: sleepHours,
          anxiety,
          tags,
          summary,
        },
      };

      // Write entry directly to local JSON file db in mock mode
      await addMoodEntry({
        userId: sessionUser.id,
        moodScore: mood,
        energy,
        sleepHours,
        tags,
        note: summary,
        source: 'ai',
      });

      // Save AI transcripts
      await addAIConversation({
        userId: sessionUser.id,
        messages: JSON.stringify([...messages, { role: 'assistant', content: replyText }]),
        extractedSignals: { mood, energy, sleep_hours: sleepHours, anxiety, tags, summary },
        sentimentScore: mood / 10,
        crisisFlagged: false,
      });
    }

      return new Response(JSON.stringify({ text: replyText, toolCall }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

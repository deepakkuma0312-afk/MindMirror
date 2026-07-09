'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, HeartHandshake, AlertCircle, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DAILY_TOPICS = [
  {
    day: "Sunday",
    topic: "Current Symptoms (Mood & Focus)",
    prompt: "Hello! I'm MindMirror. Today (Sunday), let's focus on your Current Symptoms. How has your mood been today? Have you noticed any anxiety, irritability, or difficulty concentrating?",
  },
  {
    day: "Monday",
    topic: "Daily Functioning & Routine",
    prompt: "Hello! I'm MindMirror. Today (Monday), let's check in on your Functioning. How are you holding up with your daily self-care, routine responsibilities, or work/school tasks?",
  },
  {
    day: "Tuesday",
    topic: "Safety, Risk & Support",
    prompt: "Hello! I'm MindMirror. Today (Tuesday), let's reflect on your Safety & Support system. Do you feel secure and supported by those around you, or have you been feeling overwhelmed or isolated?",
  },
  {
    day: "Wednesday",
    topic: "Mental Status & Cognitive State",
    prompt: "Hello! I'm MindMirror. Today (Wednesday), let's explore your Mental Status. How are your thoughts flowing today—do they feel logical and organized, or are they racing/scattered?",
  },
  {
    day: "Thursday",
    topic: "Basic Health Factors (Sleep & Energy)",
    prompt: "Hello! I'm MindMirror. Today (Thursday), let's look at your Basic Health. How did you sleep last night, and how is your physical energy level today?",
  },
  {
    day: "Friday",
    topic: "History, Context & Triggers",
    prompt: "Hello! I'm MindMirror. Today (Friday), let's review your Triggers and Context. Have any recent life events, conflicts, or specific triggers impacted you this week?",
  },
  {
    day: "Saturday",
    topic: "Clinical Screening Check",
    prompt: "Hello! I'm MindMirror. Today (Saturday), let's do a quick Screening Check. How often have you felt down, depressed, or bothered by excessive worry over the past few days?",
  },
];

export default function CheckinPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm MindMirror. How is your mind feeling today? Tell me a bit about your emotional state and physical energy.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const dayIndex = new Date().getDay();
    const dailyTopic = DAILY_TOPICS[dayIndex];
    setMessages([
      {
        role: 'assistant',
        content: dailyTopic.prompt,
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCompleted || isCrisis) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const updatedMessages = [...messages, { role: 'user', content: userMessage } as Message];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        
        // Handle mock or crisis response
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
        
        if (data.toolCall) {
          if (data.toolCall.name === 'trigger_crisis_protocol') {
            setIsCrisis(true);
          } else if (data.toolCall.name === 'save_checkin') {
            setIsCompleted(true);
            setExtractedData(data.toolCall.args);
          }
        }
        setIsLoading(false);
      } else {
        // Handle streaming response (Vercel AI SDK)
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantReply = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            // Parse Vercel AI SDK text line formats: e.g. 0:"hello"
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('0:')) {
                try {
                  const txt = JSON.parse(line.substring(2));
                  assistantReply += txt;
                  setMessages((prev) => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: 'assistant', content: assistantReply };
                    return copy;
                  });
                } catch (_) {}
              } else if (line.startsWith('e:') || line.startsWith('9:')) {
                // Check if a tool call was made
                if (line.includes('save_checkin')) {
                  setIsCompleted(true);
                } else if (line.includes('trigger_crisis_protocol')) {
                  setIsCrisis(true);
                }
              }
            }
          }
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I encountered a connection issue. Let's try that check-in step again." },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] flex flex-col justify-between font-sans relative">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-stone-200/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-serif text-stone-800 flex items-center gap-2">
              Daily Reflection <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            </h1>
            <p className="text-xs text-stone-400">Conversational check-in with your AI companion</p>
          </div>
        </div>
      </div>

      {/* Main Crisis Banner overlay */}
      {isCrisis && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-start sm:justify-center text-center space-y-6 z-40 border-2 border-red-100 shadow-2xl overflow-y-auto">
          <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <AlertCircle className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl text-stone-800 font-serif font-semibold">You are not alone. Help is here.</h2>
            <p className="text-sm text-stone-500 leading-relaxed">
              We detected keywords indicating extreme distress. Your safety is our absolute priority. Please reach out to one of these free, confidential helplines right now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md font-sans">
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-left">
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">US Helpline</p>
              <p className="text-lg font-bold text-stone-800 mt-1">988 Suicide & Crisis Lifeline</p>
              <p className="text-xs text-stone-500">Call or Text 24/7. Free & Confidential.</p>
            </div>
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-left">
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">India Helpline</p>
              <p className="text-lg font-bold text-stone-800 mt-1">iCall: 9152987821</p>
              <p className="text-xs text-stone-500">Professional counseling services. Monday-Saturday.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsCrisis(false)}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
            >
              Dismiss warning
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Messages Pane */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-4 mb-4 border border-stone-200/40 bg-white/30 rounded-2xl p-4 shadow-inner">
        {messages.map((message, index) => {
          const isAssistant = message.role === 'assistant';
          return (
            <div
              key={index}
              className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3.5 text-sm shadow-sm transition-all ${
                  isAssistant
                    ? 'bg-stone-100 text-stone-800 rounded-tl-sm border border-stone-200/40'
                    : 'bg-primary text-white rounded-tr-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          );
        })}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 text-stone-400 rounded-2xl rounded-tl-sm px-4 py-3 border border-stone-200/40 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Completion Card */}
        {isCompleted && (
          <div className="p-5 border-2 border-emerald-100 bg-emerald-50/50 rounded-2xl text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900 font-serif">Check-in Complete</h3>
              <p className="text-xs text-emerald-700/80 leading-relaxed mt-1">
                Your entries have been successfully saved to your wellness graph. Reflecting daily helps you track patterns and triggers.
              </p>
            </div>
            {extractedData && (
              <div className="bg-white/60 rounded-xl p-3 border border-emerald-100/50 text-left text-xs text-stone-600 space-y-1">
                <p><strong>Mood Score:</strong> {extractedData.mood}/10</p>
                <p><strong>Energy Level:</strong> {extractedData.energy}/10</p>
                <p><strong>Sleep Hours:</strong> {extractedData.sleep_hours} hrs</p>
                {extractedData.tags && <p><strong>Triggers:</strong> #{extractedData.tags.join(' #')}</p>}
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              Continue to Dashboard
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      {!isCompleted && !isCrisis && (
        <form onSubmit={handleSubmit} className="flex gap-2 bg-white/70 border border-stone-200 rounded-2xl p-2 shadow-sm font-sans focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response here..."
            className="flex-1 px-4 py-2 border-0 bg-transparent text-sm focus:outline-none placeholder-stone-400"
            disabled={isLoading || isCompleted}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}

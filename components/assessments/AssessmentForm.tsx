'use client';

import { useState } from 'react';
import { saveAssessmentAction } from '@/app/actions/assessment';
import { ClipboardList, Sparkles, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Wind } from 'lucide-react';

const OPTIONS = [
  { text: 'Not at all', value: 0 },
  { text: 'Several days', value: 1 },
  { text: 'More than half the days', value: 2 },
  { text: 'Nearly every day', value: 3 },
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

export default function AssessmentForm() {
  const [activeType, setActiveType] = useState<'PHQ9' | 'GAD7' | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ score: number; severity: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const questions = activeType === 'PHQ9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;

  const startAssessment = (type: 'PHQ9' | 'GAD7') => {
    setActiveType(type);
    setCurrentIdx(0);
    setAnswers({});
    setResult(null);
    setError(null);
  };

  const handleSelectAnswer = (val: number) => {
    setAnswers({ ...answers, [currentIdx]: val });
    
    if (currentIdx < questions.length - 1) {
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1);
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await saveAssessmentAction(activeType!, answers);
      if (res && res.error) {
        setError(res.error);
      } else if (res) {
        setResult({ score: res.score!, severity: res.severity! });
      }
    } catch (err) {
      setError('An error occurred during submission.');
    } finally {
      setPending(false);
    }
  };

  const resetForm = () => {
    setActiveType(null);
    setResult(null);
    setCurrentIdx(0);
    setAnswers({});
  };

  return (
    <div className="font-sans">
      {/* 1. Initial State: Choice of Assessment */}
      {activeType === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PHQ-9 Card */}
          <div className="p-6 rounded-2xl bg-white/70 border border-stone-200/50 hover:border-primary/40 hover:shadow-md transition-all space-y-4 text-left">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-800">Weekly Mood & Balance Checkup</h3>
              <p className="text-xs text-stone-500 leading-relaxed mt-1">
                Reflect on your mood, interest levels, and energy over the past 2 weeks. Clinically backed screening for emotional baseline drift.
              </p>
            </div>
            <button
              onClick={() => startAssessment('PHQ9')}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              Start Checkup <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* GAD-7 Card */}
          <div className="p-6 rounded-2xl bg-white/70 border border-stone-200/50 hover:border-primary/40 hover:shadow-md transition-all space-y-4 text-left">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-800">Daily Calm & Focus Checkup</h3>
              <p className="text-xs text-stone-500 leading-relaxed mt-1">
                Reflect on feelings of anxiousness, control, and muscle tension over the past 7 days. Useful for monitoring acute anxiety levels.
              </p>
            </div>
            <button
              onClick={() => startAssessment('GAD7')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              Start Checkup <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Screen: Question-by-Question Flow */}
      {activeType !== null && result === null && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white/80 border border-stone-200/60 shadow-md space-y-6 text-left">
          
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              <span>{activeType === 'PHQ9' ? 'Mood Checkup' : 'Calm Checkup'}</span>
              <span>Question {currentIdx + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Question text */}
          <div className="space-y-4">
            <span className="text-xs text-stone-400 italic">Over the last 2 weeks, how often have you been bothered by:</span>
            <h2 className="text-xl font-serif text-stone-800 font-semibold leading-relaxed">
              {questions[currentIdx]}
            </h2>
          </div>

          {/* Answers grid */}
          <div className="grid grid-cols-1 gap-2.5 pt-2">
            {OPTIONS.map((opt) => {
              const isSelected = answers[currentIdx] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectAnswer(opt.value)}
                  className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all flex justify-between items-center ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-stone-800'
                      : 'border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <span>{opt.text}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-500 font-bold">
                    +{opt.value}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-stone-100">
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="px-4 py-2 border border-stone-200 text-stone-500 text-xs font-semibold rounded-xl hover:bg-stone-50 transition-all disabled:opacity-30 cursor-pointer"
            >
              Previous Question
            </button>

            {currentIdx === questions.length - 1 && answers[currentIdx] !== undefined ? (
              <button
                onClick={handleSubmit}
                disabled={pending}
                className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                {pending ? 'Calculating...' : 'Submit Answers'} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled={answers[currentIdx] === undefined}
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="px-6 py-2.5 bg-primary/20 text-primary hover:bg-primary hover:text-white disabled:opacity-50 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                Next Question <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Completed State: Reassuring Results */}
      {result !== null && (
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white border border-emerald-100 shadow-lg space-y-6 text-center">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-serif text-stone-800">Checkup Completed</h3>
            <p className="text-xs text-stone-400">
              Results have been securely logged to your care graph.
            </p>
          </div>

          <div className="p-5 bg-stone-50 border border-stone-100 rounded-2xl space-y-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">Total Score</span>
              <span className="text-lg font-bold text-stone-800">{result.score} points</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500 font-semibold">Clinical Severity</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                result.score >= 15 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {result.severity}
              </span>
            </div>
          </div>

          {result.score >= 15 && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl text-left flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">Therapist Alert Triggered</p>
                <p className="leading-relaxed text-[11px] text-amber-700">
                  Because your score indicates severe distress, we have securely alerted your linked therapist so they can review your profile. You can also connect with help lines if you feel unstable.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={resetForm}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all border border-stone-200"
            >
              Complete another Checkup
            </button>
            <button
              onClick={resetForm}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

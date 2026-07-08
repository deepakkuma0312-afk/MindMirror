'use client';

import { useState } from 'react';
import { saveJournalAction } from '@/app/actions/journal';
import { Sparkles, Smile, Battery, Moon, Tag, BookOpen } from 'lucide-react';

export default function JournalForm() {
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [sleep, setSleep] = useState(7.5);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('mood', mood.toString());
    formData.append('energy', energy.toString());
    formData.append('sleep', sleep.toString());
    formData.append('note', note);
    formData.append('tags', tags.join(','));

    try {
      const res = await saveJournalAction(formData);
      if (res && res.error) {
        setStatus({ error: res.error });
      } else {
        setStatus({ success: true });
        setNote('');
        setTags([]);
        setMood(7);
        setEnergy(6);
        setSleep(7.5);
      }
    } catch (err) {
      setStatus({ error: 'An unexpected error occurred.' });
    } finally {
      setPending(false);
    }
  };

  // Quick tag suggestions
  const tagSuggestions = ['work', 'family', 'exercise', 'nature', 'relationship', 'sleep', 'stress', 'mindfulness'];

  const addSuggestedTag = (suggested: string) => {
    if (!tags.includes(suggested)) {
      setTags([...tags, suggested]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white/70 border border-stone-200/50 shadow-sm space-y-6 font-sans">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-stone-700 tracking-wide">Write Today's reflection</h3>
      </div>

      {status?.error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {status.error}
        </div>
      )}

      {status?.success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200">
          Reflection saved to journal successfully! 🌱
        </div>
      )}

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-stone-600">
            <span className="flex items-center gap-1.5"><Smile className="h-4 w-4 text-emerald-600" /> Mood Score</span>
            <span className="text-primary font-bold">{mood}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(parseInt(e.target.value))}
            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>Low</span>
            <span>Great</span>
          </div>
        </div>

        {/* Energy Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-stone-600">
            <span className="flex items-center gap-1.5"><Battery className="h-4 w-4 text-purple-600" /> Energy Level</span>
            <span className="text-[#a78bfa] font-bold">{energy}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#a78bfa]"
          />
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>Fatigued</span>
            <span>Energized</span>
          </div>
        </div>
      </div>

      {/* Sleep hours */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-stone-600">
          <span className="flex items-center gap-1.5"><Moon className="h-4 w-4 text-indigo-600" /> Sleep Hours</span>
          <span className="text-indigo-600 font-bold">{sleep} hrs</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          step="0.5"
          value={sleep}
          onChange={(e) => setSleep(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Journal text note */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-stone-600 block">
          Journal Reflection
        </label>
        <textarea
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did today feel? What was on your mind? What went well, and what did you struggle with? (AES Encrypted at Rest)"
          className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none placeholder-stone-400 text-stone-800 leading-relaxed"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-stone-400" /> Triggers & Context Tags
        </label>
        
        {/* Render tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 border border-stone-100 rounded-xl">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-stone-200/80 text-stone-700 text-xs px-2.5 py-1 rounded-full font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="text-stone-400 hover:text-stone-600 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type trigger (e.g. deadline) and press Enter"
          className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all placeholder-stone-400 text-stone-800"
        />

        {/* Suggested tag triggers */}
        <div className="space-y-1">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Suggested Tags</span>
          <div className="flex flex-wrap gap-1">
            {tagSuggestions.map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => addSuggestedTag(suggested)}
                className="px-2 py-1 bg-stone-100 hover:bg-stone-200/80 rounded-md text-[10px] text-stone-600 transition-all font-medium"
              >
                +{suggested}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4.5 w-4.5" />
        {pending ? 'Encrypting & Saving...' : 'Save Private Reflection'}
      </button>
    </form>
  );
}

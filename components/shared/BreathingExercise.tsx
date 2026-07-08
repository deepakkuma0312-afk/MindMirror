'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X, Play, Square } from 'lucide-react';

export default function BreathingExercise() {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);

  // Box Breathing phases configuration (4s each)
  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === 1) {
            // Transition to next phase
            setPhase((curr) => {
              switch (curr) {
                case 'inhale': return 'hold1';
                case 'hold1': return 'exhale';
                case 'exhale': return 'hold2';
                case 'hold2': return 'inhale';
              }
            });
            return 4; // Reset timer to 4s
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('inhale');
    setSecondsLeft(4);
  };

  const handleStop = () => {
    setIsActive(false);
    setSecondsLeft(4);
    setPhase('inhale');
  };

  // Get bubble size based on breathing phase
  const getBubbleScale = () => {
    if (!isActive) return 1.0;
    switch (phase) {
      case 'inhale': return 1.8; // expanding
      case 'hold1': return 1.8;  // holding big
      case 'exhale': return 1.0; // contracting
      case 'hold2': return 1.0;  // holding small
    }
  };

  const getPhaseText = () => {
    if (!isActive) return 'Ready to breathe?';
    switch (phase) {
      case 'inhale': return 'Inhale slowly...';
      case 'hold1': return 'Hold your breath...';
      case 'exhale': return 'Exhale completely...';
      case 'hold2': return 'Hold empty...';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'bg-emerald-500/20 text-emerald-800 border-emerald-400';
      case 'hold1': return 'bg-amber-500/20 text-amber-800 border-amber-400';
      case 'exhale': return 'bg-purple-500/20 text-purple-800 border-purple-400';
      case 'hold2': return 'bg-stone-500/20 text-stone-800 border-stone-400';
    }
  };

  return (
    <>
      {/* Quick Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 rounded-xl transition-all border border-stone-100 group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center text-primary">
            <Wind className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">Breathing Exercise</p>
            <p className="text-xs text-stone-400">4-4-4-4 Box Breathing pattern</p>
          </div>
        </div>
        <div className="h-6 w-6 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all">
          <Play className="h-3 w-3 fill-current" />
        </div>
      </button>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 dark:bg-stone-900/95 max-w-md w-full p-8 rounded-2xl border border-stone-200/50 shadow-2xl relative text-center space-y-8"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  handleStop();
                  setIsOpen(false);
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <h2 className="text-2xl text-stone-800 font-serif">Box Breathing</h2>
                <p className="text-xs text-stone-400">Regulate your nervous system & reduce stress</p>
              </div>

              {/* Soothing Circle Animation */}
              <div className="h-64 flex items-center justify-center relative">
                {/* Outermost breathing bubble */}
                <motion.div
                  animate={{ scale: getBubbleScale() }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="h-28 w-28 rounded-full bg-primary/10 border-2 border-primary/20 absolute"
                />

                {/* Inner bubble */}
                <motion.div
                  animate={{ scale: getBubbleScale() }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center shadow-lg relative border border-primary/30"
                >
                  <Wind className="h-6 w-6 text-primary" />
                </motion.div>

                {/* Pulse ring indicator */}
                {isActive && phase === 'inhale' && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeOut" }}
                    className="h-24 w-24 rounded-full border border-primary/40 absolute"
                  />
                )}
              </div>

              {/* Instructions and Timer */}
              <div className="space-y-4">
                <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border transition-colors duration-300 ${isActive ? getPhaseColor() : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                  {getPhaseText()}
                </div>

                <div className="text-4xl font-serif text-stone-800 font-bold select-none h-10 flex items-center justify-center">
                  {isActive ? `${secondsLeft}s` : '—'}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                {!isActive ? (
                  <button
                    onClick={handleStart}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Begin Session
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition-all border border-stone-200 flex items-center gap-2"
                  >
                    <Square className="h-4 w-4 fill-current text-stone-500" />
                    Stop
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

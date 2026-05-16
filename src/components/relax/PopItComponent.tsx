"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Volume2, VolumeX, Info } from "lucide-react";

export default function PopItComponent() {
  const TOTAL_BUBBLES = 40;
  // Initialize with false (not popped)
  const [bubbles, setBubbles] = useState<boolean[]>(Array(TOTAL_BUBBLES).fill(false));
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first interaction to comply with browser autoplay policies
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  const playPopSound = useCallback(() => {
    if (!soundEnabled || !audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    
    // Create oscillator and gain node for the "pop"
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Synth parameters for a nice "pop" sound
    const now = ctx.currentTime;
    
    // Pitch sweep (high to low very quickly)
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
    
    // Volume envelope (quick attack, quick decay)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    // Start and stop
    osc.start(now);
    osc.stop(now + 0.1);
  }, [soundEnabled]);

  const handlePop = (index: number) => {
    initAudio();
    
    setBubbles(prev => {
      const newBubbles = [...prev];
      if (!newBubbles[index]) {
        playPopSound();
      }
      newBubbles[index] = !newBubbles[index]; // Toggle state
      return newBubbles;
    });
  };

  const resetBoard = () => {
    setBubbles(Array(TOTAL_BUBBLES).fill(false));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3 text-sm text-pink-700 dark:text-pink-200/80 bg-pink-50/80 dark:bg-pink-900/30 px-5 py-4 rounded-2xl w-full leading-relaxed">
        <Info className="w-6 h-6 shrink-0 text-pink-600 dark:text-pink-400" />
        <p>
          Need a quick mental reset? Pop the bubbles to relieve stress and satisfy your fidgeting needs. 
          You can pop them back by clicking again or reset the whole board.
        </p>
      </div>

      <div className="flex justify-between w-full items-center px-2">
        <Button 
          variant="outline" 
          onClick={resetBoard}
          className="border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-900/40 text-pink-700 dark:text-pink-300 gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Reset All
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => {
            initAudio();
            setSoundEnabled(!soundEnabled);
          }}
          className={`${soundEnabled ? "text-pink-600 dark:text-pink-400" : "text-gray-400"} hover:bg-pink-50 dark:hover:bg-pink-900/20`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
      </div>

      <div className="bg-pink-300 dark:bg-pink-900/60 p-6 md:p-8 rounded-[3rem] shadow-xl border border-pink-400/50 w-full max-w-md aspect-square relative overflow-hidden">
        {/* Subtle texture/shine to make it look like rubber/silicone */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-[3rem]"></div>
        
        <div className="grid grid-cols-5 md:grid-cols-8 gap-3 md:gap-4 h-full w-full relative z-10">
          {bubbles.map((isPopped, index) => (
            <button
              key={index}
              onClick={() => handlePop(index)}
              className={`
                w-full aspect-square rounded-full transition-all duration-150 ease-out flex items-center justify-center relative
                ${isPopped 
                  ? "bg-pink-400/40 dark:bg-pink-800/40 scale-95 shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] border border-pink-500/20" 
                  : "bg-pink-400 dark:bg-pink-500 shadow-[2px_4px_8px_rgba(0,0,0,0.15),inset_0_-4px_6px_rgba(0,0,0,0.1),inset_0_4px_6px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-95"
                }
              `}
              aria-label={isPopped ? "Unpop bubble" : "Pop bubble"}
            >
              {/* Highlight reflection to make it look 3D and spherical */}
              {!isPopped && (
                <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/40 rounded-full blur-[1px] transform -rotate-12 pointer-events-none"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

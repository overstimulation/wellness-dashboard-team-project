"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Settings2, X, BrainCircuit, Coffee, Bed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Mode = "focus" | "shortBreak" | "longBreak";

export default function PomodoroComponent() {
  const [mode, setMode] = useState<Mode>("focus");
  const [isActive, setIsActive] = useState(false);
  
  // Configuration (in minutes)
  const [config, setConfig] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  });

  const [timeLeft, setTimeLeft] = useState(config.focus * 60);
  const [showConfig, setShowConfig] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timeLeft when config or mode changes
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(config[mode] * 60);
    }
  }, [config, mode, isActive]);

  // Timer interval
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Auto pause when hit 0
      setIsActive(false);
      
      // We could auto-switch modes here, but a manual switch is better for a simple destressor
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleConfigChange = (key: Mode, value: string) => {
    const val = parseInt(value);
    if (!isNaN(val) && val > 0 && val <= 120) {
      setConfig(prev => ({ ...prev, [key]: val }));
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(config[mode] * 60);
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(config[newMode] * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // SVG Circle calculation
  const totalTime = config[mode] * 60;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // Progress goes from 0 (empty) to circumference (full). Since it "eats itself", we increase offset as time drops.
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const modeColors = {
    focus: "text-red-500",
    shortBreak: "text-emerald-500",
    longBreak: "text-blue-500"
  };

  const modeBgColors = {
    focus: "bg-red-50 dark:bg-red-900/20",
    shortBreak: "bg-emerald-50 dark:bg-emerald-900/20",
    longBreak: "bg-blue-50 dark:bg-blue-900/20"
  };

  const modeBorderColors = {
    focus: "border-red-500",
    shortBreak: "border-emerald-500",
    longBreak: "border-blue-500"
  };

  const strokeColors = {
    focus: "#ef4444", // red-500
    shortBreak: "#10b981", // emerald-500
    longBreak: "#3b82f6" // blue-500
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-6">
      
      {/* Mode Selector */}
      <div className="flex w-full bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-sm">
        <button
          onClick={() => changeMode("focus")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            mode === "focus" 
            ? "bg-white dark:bg-gray-700 shadow-sm text-red-600 dark:text-red-400" 
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Focus
        </button>
        <button
          onClick={() => changeMode("shortBreak")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            mode === "shortBreak" 
            ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400" 
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Coffee className="w-4 h-4" /> Short Break
        </button>
        <button
          onClick={() => changeMode("longBreak")}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            mode === "longBreak" 
            ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" 
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Bed className="w-4 h-4" /> Long Break
        </button>
      </div>

      {/* Main Timer Display */}
      <div className={`relative flex items-center justify-center p-8 w-full max-w-sm aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm border ${showConfig ? 'border-gray-200 dark:border-gray-700' : modeBorderColors[mode]} transition-colors duration-500`}>
        
        {showConfig ? (
          <div className="flex flex-col items-center w-full space-y-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Settings2 className="w-5 h-5" /> Settings
            </h3>
            
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-red-500" /> Focus</span>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" max="120" value={config.focus} onChange={(e) => handleConfigChange("focus", e.target.value)} className="w-16 h-8 text-center" />
                  <span className="text-sm text-gray-500">m</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2"><Coffee className="w-4 h-4 text-emerald-500" /> Short</span>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" max="60" value={config.shortBreak} onChange={(e) => handleConfigChange("shortBreak", e.target.value)} className="w-16 h-8 text-center" />
                  <span className="text-sm text-gray-500">m</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2"><Bed className="w-4 h-4 text-blue-500" /> Long</span>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" max="120" value={config.longBreak} onChange={(e) => handleConfigChange("longBreak", e.target.value)} className="w-16 h-8 text-center" />
                  <span className="text-sm text-gray-500">m</span>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => setShowConfig(false)} className="w-full mt-4">
              Done
            </Button>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
            {/* SVG Circle */}
            <svg
              className="absolute transform -rotate-90"
              width="280"
              height="280"
              viewBox="0 0 280 280"
            >
              {/* Background Circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                className="fill-transparent stroke-gray-100 dark:stroke-gray-700"
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                className="fill-transparent transition-all duration-1000 ease-linear"
                stroke={strokeColors[mode]}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            {/* Time Text */}
            <div className={`text-6xl font-black tabular-nums tracking-tight ${modeColors[mode]}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2">
              {mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"}
            </div>
          </div>
        )}

        {/* Floating Settings Button */}
        {!showConfig && (
          <button 
            onClick={() => { setShowConfig(true); setIsActive(false); }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-full transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button 
          size="lg" 
          onClick={toggleTimer}
          disabled={showConfig}
          className={`w-32 h-14 rounded-full text-lg shadow-sm transition-all
            ${isActive 
              ? "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200" 
              : `text-white ${mode === 'focus' ? 'bg-red-500 hover:bg-red-600' : mode === 'shortBreak' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'}`
            }
          `}
        >
          {isActive ? (
            <><Pause className="w-5 h-5 mr-2" /> Pause</>
          ) : (
            <><Play className="w-5 h-5 mr-2" /> Start</>
          )}
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={resetTimer}
          disabled={showConfig}
          className="w-14 h-14 rounded-full text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

    </div>
  );
}

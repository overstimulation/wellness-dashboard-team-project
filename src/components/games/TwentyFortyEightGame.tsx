"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trophy } from "lucide-react";

const TILE_MAP: Record<number, { emoji: string; color: string }> = {
  2: { emoji: "🌱", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
  4: { emoji: "🌿", color: "bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-200" },
  8: { emoji: "🪴", color: "bg-teal-200 dark:bg-teal-800/40 text-teal-800 dark:text-teal-200" },
  16: { emoji: "🌳", color: "bg-emerald-300 dark:bg-emerald-700/50 text-emerald-900 dark:text-emerald-100" },
  32: { emoji: "🍎", color: "bg-yellow-200 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200" },
  64: { emoji: "🌻", color: "bg-orange-300 dark:bg-orange-700/50 text-orange-900 dark:text-orange-100" },
  128: { emoji: "🌺", color: "bg-pink-300 dark:bg-pink-700/50 text-pink-900 dark:text-pink-100" },
  256: { emoji: "🍄", color: "bg-red-400 dark:bg-red-600/50 text-white" },
  512: { emoji: "🦋", color: "bg-purple-400 dark:bg-purple-600/50 text-white" },
  1024: { emoji: "🦅", color: "bg-blue-400 dark:bg-blue-600/50 text-white" },
  2048: { emoji: "🌍", color: "bg-cyan-500 dark:bg-cyan-500/60 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]" },
};

type Tile = {
  id: string;
  value: number;
  position: [number, number];
};

export default function TwentyFortyEightGame() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const generateNewTile = (currentTiles: Tile[]): Tile | null => {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!currentTiles.some(t => t.position[0] === r && t.position[1] === c)) {
          emptyCells.push([r, c]);
        }
      }
    }
    if (emptyCells.length === 0) return null;
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return {
      id: Math.random().toString(),
      value: Math.random() < 0.9 ? 2 : 4,
      position: [row, col] as [number, number],
    };
  };

  const initializeGame = () => {
    const t1 = generateNewTile([]);
    const t2 = generateNewTile(t1 ? [t1] : []);
    setTiles([t1, t2].filter(Boolean) as Tile[]);
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    setHasStarted(true);
  };

  const handleSlide = useCallback((direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    if (!hasStarted || isGameOver || isWon) return;

    setTiles(prevTiles => {
      let newTiles = prevTiles.map(t => ({ ...t }));
      let moved = false;
      let newScore = score;

      for (let i = 0; i < 4; i++) {
        // Get line
        let line = newTiles.filter(t => direction === "LEFT" || direction === "RIGHT" ? t.position[0] === i : t.position[1] === i);
        // Sort line based on direction
        line.sort((a, b) => {
          const aPos = direction === "LEFT" || direction === "RIGHT" ? a.position[1] : a.position[0];
          const bPos = direction === "LEFT" || direction === "RIGHT" ? b.position[1] : b.position[0];
          return direction === "LEFT" || direction === "UP" ? aPos - bPos : bPos - aPos;
        });

        // Merge
        for (let j = 0; j < line.length - 1; j++) {
          if (line[j].value === line[j+1].value) {
            line[j].value *= 2;
            newScore += line[j].value;
            line.splice(j + 1, 1);
            moved = true;
          }
        }

        // Update positions
        line.forEach((t, j) => {
          const newPos = direction === "LEFT" || direction === "UP" ? j : 3 - j;
          const oldPos = direction === "LEFT" || direction === "RIGHT" ? t.position[1] : t.position[0];
          if (newPos !== oldPos) moved = true;
          if (direction === "LEFT" || direction === "RIGHT") {
            t.position = [i, newPos];
          } else {
            t.position = [newPos, i];
          }
        });

        // Update main array
        newTiles = newTiles.filter(t => !(direction === "LEFT" || direction === "RIGHT" ? t.position[0] === i : t.position[1] === i)).concat(line);
      }

      if (moved) {
        setScore(newScore);
        if (newScore > highScore) setHighScore(newScore);

        const newTile = generateNewTile(newTiles);
        if (newTile) newTiles.push(newTile);

        // Check Win
        if (newTiles.some(t => t.value === 2048)) setIsWon(true);

        // Check Loss
        if (newTiles.length === 16) {
          let possibleMerge = false;
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              const val = newTiles.find(t => t.position[0] === r && t.position[1] === c)?.value;
              const right = newTiles.find(t => t.position[0] === r && t.position[1] === c + 1)?.value;
              const down = newTiles.find(t => t.position[0] === r + 1 && t.position[1] === c)?.value;
              if (val === right || val === down) possibleMerge = true;
            }
          }
          if (!possibleMerge) setIsGameOver(true);
        }

        return newTiles;
      }
      return prevTiles;
    });
  }, [hasStarted, isGameOver, isWon, score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); // Prevent scrolling
      }
      
      switch (e.key) {
        case "ArrowUp": handleSlide("UP"); break;
        case "ArrowDown": handleSlide("DOWN"); break;
        case "ArrowLeft": handleSlide("LEFT"); break;
        case "ArrowRight": handleSlide("RIGHT"); break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSlide, hasStarted]);

  // Touch handling for mobile swipes
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        if (dx > 0) handleSlide("RIGHT");
        else handleSlide("LEFT");
      }
    } else {
      if (Math.abs(dy) > 30) {
        if (dy > 0) handleSlide("DOWN");
        else handleSlide("UP");
      }
    }
    setTouchStart(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <style>{`
        @keyframes popIn2048 {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in-2048 {
          animation: popIn2048 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
      <div className="flex justify-between w-full mb-4 px-2">
        <div className="text-xl font-bold text-orange-500">Score: {score}</div>
        <div className="text-xl font-bold flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Trophy className="w-5 h-5 text-yellow-500" /> {highScore}
        </div>
      </div>

      <div 
        className="relative bg-[#bbada0] dark:bg-gray-800 p-2 rounded-xl shadow-2xl w-full aspect-square touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!hasStarted && !isGameOver && !isWon && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm rounded-xl">
            <h2 className="text-3xl font-bold mb-2">Emoji 2048 🌍</h2>
            <p className="mb-6 text-center px-4">Merge identical seeds to grow the ultimate Tree of Life!</p>
            <Button onClick={initializeGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Play className="w-4 h-4" /> Start Game
            </Button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-md rounded-xl">
            <h2 className="text-4xl font-black mb-2 text-red-400">Game Over!</h2>
            <p className="text-xl mb-6">Score: {score}</p>
            <Button onClick={initializeGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}

        {isWon && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-md rounded-xl">
            <h2 className="text-4xl font-black mb-2 text-emerald-400">You Win! 🎉🌍</h2>
            <p className="text-xl mb-6">Score: {score}</p>
            <Button onClick={initializeGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <RotateCcw className="w-4 h-4" /> Keep Playing
            </Button>
          </div>
        )}

        {/* Grid Background */}
        <div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="bg-[#cdc1b4] dark:bg-gray-700/50 rounded-lg w-full h-full" />
          ))}
        </div>

        {/* Tiles */}
        <div className="absolute inset-2">
          {tiles.map((tile) => {
            // Calculate position in % (each cell is 25% + gap)
            const top = `${tile.position[0] * 25}%`;
            const left = `${tile.position[1] * 25}%`;
            const config = TILE_MAP[tile.value] || TILE_MAP[2048];

            return (
              <div
                key={tile.id}
                style={{ 
                  top, 
                  left,
                  transition: 'top 120ms ease-in-out, left 120ms ease-in-out'
                }}
                className={`absolute w-1/4 h-1/4 p-1 z-10`}
              >
                <div className={`w-full h-full flex flex-col items-center justify-center rounded-lg font-bold ${config.color} shadow-sm animate-pop-in-2048`}>
                  <span className="text-3xl md:text-4xl leading-none">{config.emoji}</span>
                  <span className="text-xs md:text-sm mt-1 opacity-80">{tile.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center">Use Arrow Keys or Swipe to merge blocks</p>
    </div>
  );
}

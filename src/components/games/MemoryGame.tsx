"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const EMOJIS = ["🧘‍♀️", "🏃‍♂️", "🥗", "💧", "🛌", "🧠", "❤️", "🌞"];

type CardType = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function MemoryGame() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const initializeGame = () => {
    const shuffledCards = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setIsGameOver(false);
    setHasStarted(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && !isGameOver) {
      timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, isGameOver]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched) return;

    if (flippedIndices.length === 2) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setCards(prev => {
          const unmatched = [...prev];
          unmatched[flippedIndices[0]].isFlipped = false;
          unmatched[flippedIndices[1]].isFlipped = false;
          unmatched[index].isFlipped = true;
          return unmatched;
        });
        setFlippedIndices([index]);
      }
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setMoves(m => m + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;
      
      if (newCards[firstIndex].emoji === newCards[secondIndex].emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => {
            const matched = [...prev];
            matched[firstIndex].isMatched = true;
            matched[secondIndex].isMatched = true;
            return matched;
          });
          setFlippedIndices([]);
          setMatches(m => {
            const newMatches = m + 1;
            if (newMatches === EMOJIS.length) {
              setIsGameOver(true);
            }
            return newMatches;
          });
        }, 500);
      } else {
        // No match
        timeoutRef.current = setTimeout(() => {
          setCards(prev => {
            const unmatched = [...prev];
            unmatched[firstIndex].isFlipped = false;
            unmatched[secondIndex].isFlipped = false;
            return unmatched;
          });
          setFlippedIndices([]);
          timeoutRef.current = null;
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="flex justify-between w-full mb-4 px-2">
        <div className="text-lg font-bold text-orange-500">Moves: {moves}</div>
        <div className="text-lg font-bold text-gray-500 dark:text-gray-400">Time: {formatTime(timeElapsed)}</div>
      </div>

      <div className="relative w-full aspect-square bg-white dark:bg-gray-800 border-4 border-orange-500/30 rounded-xl p-4 shadow-2xl">
        {!hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm rounded-lg">
            <h2 className="text-3xl font-bold mb-2">Memory Match 🧠</h2>
            <p className="mb-6 text-center px-4">Find all the wellness pairs to win!</p>
            <Button onClick={initializeGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Play className="w-4 h-4" /> Start Game
            </Button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-md rounded-lg">
            <h2 className="text-4xl font-black mb-2 text-emerald-400">You Win! 🎉</h2>
            <p className="text-xl mb-2">Moves: {moves}</p>
            <p className="text-xl mb-6">Time: {formatTime(timeElapsed)}</p>
            <Button onClick={initializeGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <RotateCcw className="w-4 h-4" /> Play Again
            </Button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 md:gap-4 w-full h-full">
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className="relative w-full h-full cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={() => handleCardClick(index)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front (Face Down) */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-md backface-hidden flex items-center justify-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-2xl opacity-50 text-white">?</span>
                </div>

                {/* Back (Face Up / Emoji) */}
                <div 
                  className={`absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md backface-hidden flex items-center justify-center ${card.isMatched ? 'ring-4 ring-emerald-400' : ''}`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-4xl">{card.emoji}</span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

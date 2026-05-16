"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trophy } from "lucide-react";

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const GRID_SIZE = 15;
const INITIAL_SNAKE: Point[] = [
  { x: 7, y: 7 },
  { x: 7, y: 8 },
  { x: 7, y: 9 },
];
const FOODS = ["🍎", "🥦", "🥕", "🥑", "💧"];

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>("UP");
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [foodEmoji, setFoodEmoji] = useState(FOODS[0]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  
  const directionRef = useRef<Direction>("UP");

  const generateFood = useCallback(() => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food spawns on snake
      const onSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFoodEmoji(FOODS[Math.floor(Math.random() * FOODS.length)]);
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection("UP");
    directionRef.current = "UP";
    setFood({ x: 5, y: 2 });
    setScore(0);
    setIsGameOver(false);
    setHasStarted(true);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when playing
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (directionRef.current !== "DOWN") directionRef.current = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (directionRef.current !== "UP") directionRef.current = "DOWN";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (directionRef.current !== "RIGHT") directionRef.current = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (directionRef.current !== "LEFT") directionRef.current = "RIGHT";
          break;
        case " ":
          if (isGameOver) resetGame();
          else if (hasStarted) setIsPaused(p => !p);
          else resetGame();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasStarted, isGameOver]);

  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;

    const moveSnake = () => {
      const head = snake[0];
      const newHead = { ...head };

      setDirection(directionRef.current);

      switch (directionRef.current) {
        case "UP":
          newHead.y -= 1;
          break;
        case "DOWN":
          newHead.y += 1;
          break;
        case "LEFT":
          newHead.x -= 1;
          break;
        case "RIGHT":
          newHead.x += 1;
          break;
      }

      // Collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        return;
      }

      // Collision with self
      if (snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return;
      }

      const newSnake = [newHead, ...snake];

      // Eat food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => {
          const newScore = s + 1;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood());
        setSnake(newSnake);
      } else {
        newSnake.pop();
        setSnake(newSnake);
      }
    };

    const speed = Math.max(80, 150 - score * 2);
    const timeout = setTimeout(moveSnake, speed);
    return () => clearTimeout(timeout);
  }, [hasStarted, isPaused, isGameOver, food, score, generateFood, highScore, snake]);

  // Mobile controls
  const handleMobileControl = (newDir: Direction) => {
    if (!hasStarted || isPaused || isGameOver) return;
    
    if (newDir === "UP" && directionRef.current !== "DOWN") directionRef.current = "UP";
    if (newDir === "DOWN" && directionRef.current !== "UP") directionRef.current = "DOWN";
    if (newDir === "LEFT" && directionRef.current !== "RIGHT") directionRef.current = "LEFT";
    if (newDir === "RIGHT" && directionRef.current !== "LEFT") directionRef.current = "RIGHT";
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="flex justify-between w-full mb-4 px-2">
        <div className="text-xl font-bold text-orange-500">Score: {score}</div>
        <div className="text-xl font-bold flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Trophy className="w-5 h-5 text-yellow-500" /> {highScore}
        </div>
      </div>

      <div 
        className="relative bg-white dark:bg-gray-800 border-4 border-orange-500/30 rounded-xl overflow-hidden shadow-2xl"
        style={{ 
          width: '100%', 
          aspectRatio: '1/1',
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
        }}
      >
        {!hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-2">Healthy Snake 🐍</h2>
            <p className="mb-6 text-center px-4">Use arrow keys or buttons to eat healthy food and grow!</p>
            <Button onClick={resetGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Play className="w-4 h-4" /> Start Game
            </Button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-white backdrop-blur-md">
            <h2 className="text-4xl font-black mb-2 text-red-400">Game Over!</h2>
            <p className="text-xl mb-6">Final Score: {score}</p>
            <Button onClick={resetGame} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}

        {isPaused && hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center text-white backdrop-blur-sm">
            <h2 className="text-4xl font-bold">PAUSED</h2>
          </div>
        )}

        {/* Render Grid */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);
          const isSnakeHead = snake[0].x === x && snake[0].y === y;
          const isSnakeBody = snake.some((segment, i) => i !== 0 && segment.x === x && segment.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div 
              key={index} 
              className="w-full h-full flex items-center justify-center border-[0.5px] border-gray-100 dark:border-gray-800/50"
            >
              {isSnakeHead && <span className="text-xl leading-none">🐍</span>}
              {isSnakeBody && <div className="w-full h-full bg-emerald-500 rounded-sm scale-90" />}
              {isFood && <span className="text-xl leading-none animate-pulse">{foodEmoji}</span>}
            </div>
          );
        })}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 mt-6 md:hidden w-48">
        <div />
        <Button variant="outline" className="h-14 active:bg-orange-100 dark:active:bg-orange-900" onClick={() => handleMobileControl("UP")}>↑</Button>
        <div />
        <Button variant="outline" className="h-14 active:bg-orange-100 dark:active:bg-orange-900" onClick={() => handleMobileControl("LEFT")}>←</Button>
        <Button variant="outline" className="h-14 active:bg-orange-100 dark:active:bg-orange-900" onClick={() => handleMobileControl("DOWN")}>↓</Button>
        <Button variant="outline" className="h-14 active:bg-orange-100 dark:active:bg-orange-900" onClick={() => handleMobileControl("RIGHT")}>→</Button>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const emojis = ["🍎", "🥗", "🥤", "💧", "🍇", "🥑", "🥕", "🍵"];

interface FloatingEmoji {
    id: number;
    emoji: string;
    x: number;
    y: number;
    duration: number;
    delay: number;
}

export default function BackgroundEmojis() {
    const [items, setItems] = useState<FloatingEmoji[]>([]);

    useEffect(() => {
        // Generate random positions and animation parameters only on the client
        const bucketSize = 15;
        const newItems = Array.from({ length: bucketSize }).map((_, i) => ({
            id: i,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: Math.random() * 100, // percentage
            y: Math.random() * 100, // percentage
            duration: 10 + Math.random() * 20, // 10-30s duration
            delay: Math.random() * 5,
        }));
        setItems(newItems);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {items.map((item) => (
                <motion.div
                    key={item.id}
                    className="absolute text-4xl select-none opacity-20 dark:opacity-10"
                    initial={{
                        x: `${item.x}vw`,
                        y: `${item.y}vh`,
                    }}
                    animate={{
                        x: [`${item.x}vw`, `${(item.x + 10) % 100}vw`, `${item.x}vw`],
                        y: [`${item.y}vh`, `${(item.y + 20) % 100}vh`, `${item.y}vh`],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: item.delay,
                    }}
                >
                    {item.emoji}
                </motion.div>
            ))}
        </div>
    );
}

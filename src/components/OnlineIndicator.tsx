"use client";

import { useEffect, useState } from "react";

export default function OnlineIndicator() {
    // Assume online by default to avoid flash of offline on hydration
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Correctly set initial state on client
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
            <div
                className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    }`}
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                {isOnline ? "Online" : "Offline"}
            </span>
        </div>
    );
}

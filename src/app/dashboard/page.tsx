"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sandwich, GlassWater, X, Flame, Smile, Meh, Frown, Home, HeartPulse, Settings as SettingsIcon, Droplets, Brain, TrendingUp, Moon, ChevronUp, ChevronDown, Info, Sun, Clock, Wind, Play, Square } from "lucide-react";
import OnlineIndicator from "@/components/OnlineIndicator";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Typy dla danych użytkownika
interface UserData {
  weight: string;
  height: string;
  age: string;
  city: string;
  gender: string;
  goal: string;
  sportFrequency: string;
  targetWeight: string;
}

// Typy dla wpisów historii
interface HistoryEntry {
  id: string;
  date: string;
  weight: string;
  calories?: number;
  water?: number;
  notes?: string;
  dateISO?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<"home" | "health" | "settings">("home");
  const [tab, setTab] = useState<
    "dashboard" | "history" | "settings" | "nutrition" | "data" | "mind" | "sleep" | "breathe"
  >("dashboard");
  const [userData, setUserData] = useState<UserData>({
    weight: "",
    height: "",
    age: "",
    city: "",
    gender: "",
    goal: "",
    sportFrequency: "",
    targetWeight: "",
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  // Nutrition tracking (local only)
  const [consumedCalories, setConsumedCalories] = useState<number>(0);
  const [caloriesGoal, setCaloriesGoal] = useState<number | null>(null);
  const [consumedWater, setConsumedWater] = useState<number>(0); // ml
  const [waterGoal, setWaterGoal] = useState<number>(2000); // default 2000ml
  const [calInput, setCalInput] = useState<string>("");
  const [waterInput, setWaterInput] = useState<string>("");
  const [prevDate, setPrevDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [prevWeight, setPrevWeight] = useState<string>("");
  const [allowPreviousData, setAllowPreviousData] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [editWeight, setEditWeight] = useState<string>("");
  const [showCaloriesModal, setShowCaloriesModal] = useState<boolean>(false);
  const [showWaterModal, setShowWaterModal] = useState<boolean>(false);
  const [caloriesGoalReached, setCaloriesGoalReached] = useState<boolean>(false);
  const [waterGoalReached, setWaterGoalReached] = useState<boolean>(false);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [maxCapPercentage, setMaxCapPercentage] = useState<number>(0); // 0 = infinity, 100/200/300 percentage
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherDescription, setWeatherDescription] = useState<string>("");
  const [toast, setToast] = useState<
    { message: string; type: "success" | "info" | "error" } | null
  >(null);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [showMoodForm, setShowMoodForm] = useState(true);
  const [currentMood, setCurrentMood] = useState<"sad" | "neutral" | "happy" | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  const [wakeHour, setWakeHour] = useState<number>(7);
  const [wakeMinute, setWakeMinute] = useState<number>(0);
  const [sleepCalcMode, setSleepCalcMode] = useState<"wake" | "bed">("wake");
  const toastTimer = useRef<number | null>(null);

  // Breathing Assistant State
  const [breatheMode, setBreatheMode] = useState<"box" | "relax">("box");
  const [breatheActive, setBreatheActive] = useState(false);
  const [breathePhase, setBreathePhase] = useState<"idle" | "inhale" | "hold1" | "exhale" | "hold2">("idle");
  const [breatheTimeLeft, setBreatheTimeLeft] = useState(0);
  const [breatheOrbScale, setBreatheOrbScale] = useState(1);

  // Breathing Assistant Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (breatheActive) {
      if (breatheTimeLeft > 0) {
        timer = setTimeout(() => {
          setBreatheTimeLeft(prev => prev - 1);
        }, 1000);
      } else {
        if (breatheMode === "box") {
          // Box Breathing: 4-4-4-4
          switch(breathePhase) {
            case "idle":
            case "hold2":
              setBreathePhase("inhale");
              setBreatheTimeLeft(4);
              setBreatheOrbScale(1.8);
              break;
            case "inhale":
              setBreathePhase("hold1");
              setBreatheTimeLeft(4);
              break;
            case "hold1":
              setBreathePhase("exhale");
              setBreatheTimeLeft(4);
              setBreatheOrbScale(1);
              break;
            case "exhale":
              setBreathePhase("hold2");
              setBreatheTimeLeft(4);
              break;
          }
        } else {
          // 4-7-8 Breathing
          switch(breathePhase) {
            case "idle":
            case "exhale":
              setBreathePhase("inhale");
              setBreatheTimeLeft(4);
              setBreatheOrbScale(1.8);
              break;
            case "inhale":
              setBreathePhase("hold1");
              setBreatheTimeLeft(7);
              break;
            case "hold1":
              setBreathePhase("exhale");
              setBreatheTimeLeft(8);
              setBreatheOrbScale(1);
              break;
            case "hold2": // fallback
              setBreathePhase("inhale");
              setBreatheTimeLeft(4);
              setBreatheOrbScale(1.8);
              break;
          }
        }
      }
    } else {
      setBreathePhase("idle");
      setBreatheTimeLeft(0);
      setBreatheOrbScale(1);
    }
    
    return () => clearTimeout(timer);
  }, [breatheActive, breatheTimeLeft, breathePhase, breatheMode]);

  const normalizeHistory = (raw: any[]): HistoryEntry[] => {
    return raw
      .map((item) => {
        // ensure we have a stable id and a dateISO for sorting
        const entry: HistoryEntry = { ...item } as any;
        entry.id =
          item.id ??
          item._id ??
          Date.now().toString() + Math.random().toString(36).slice(2, 8);
        if (!entry.dateISO) {
          const parsed = Date.parse(entry.date as string);
          if (!isNaN(parsed)) {
            entry.dateISO = new Date(parsed).toISOString().slice(0, 10);
          } else {
            entry.dateISO = new Date().toISOString().slice(0, 10);
          }
        }
        return entry;
      })
      .sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || ""));
  };

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "info",
    duration = 3000
  ) => {
    setToast({ message, type });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, duration);
  };

  useEffect(() => {
    // Redirect unauthenticated users to the login page
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const savedData = localStorage.getItem("wellnessUserData");
    const savedHistory = localStorage.getItem("wellnessHistory");

    if (savedData) {
      setUserData(JSON.parse(savedData));
    }

    const userId = session?.user?.id;
    if (userId) {
      (async () => {
        try {
          const [pRes, hRes, mRes] = await Promise.all([
            fetch(`/api/profile?userId=${userId}`),
            fetch(`/api/history?userId=${userId}`),
            fetch(`/api/mood?userId=${userId}`),
          ]);

          if (pRes.ok) {
            const pJson = await pRes.json();
            if (pJson?.user?.streak !== undefined) {
              console.log("Setting streak from API:", pJson.user.streak);
              setUserStreak(pJson.user.streak);
            }
            if (pJson?.profile) {
              const prof = pJson.profile;
              setUserData((prev) => ({
                ...prev,
                city: prof.city ?? prev.city ?? "",
                gender: prof.biologicalSex ?? prev.gender ?? "",
                sportFrequency: prof.activityLevel ? (prof.activityLevel === 'sedentary' || prof.activityLevel === 'light' ? 'rare' : (prof.activityLevel === 'moderate' ? 'few' : 'daily')) : prev.sportFrequency ?? "",
                goal: prof.goalType ?? prev.goal ?? "",
                targetWeight: prof.targetWeight !== undefined ? String(prof.targetWeight) : prev.targetWeight ?? "",
                height: prof.height !== undefined ? String(prof.height) : prev.height ?? "",
                weight: prof.currentWeight !== undefined ? String(prof.currentWeight) : prev.weight ?? "",
                age: prof.age !== undefined ? String(prof.age) : prev.age ?? "",
              }));
              // Load maxCapPercentage from profile
              if (prof.maxCapPercentage !== undefined) {
                setMaxCapPercentage(prof.maxCapPercentage);
              }
              // Fetch weather if city is set
              if (prof.city) {
                try {
                  const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(prof.city)}`);
                  if (weatherRes.ok) {
                    const weatherData = await weatherRes.json();
                    if (weatherData.temp !== undefined) {
                      setWeatherTemp(weatherData.temp);
                      setWeatherDescription(weatherData.description || "");
                    }
                  }
                } catch (e) {
                  console.error("Failed to fetch weather:", e);
                }
              }
            }
          }
          if (mRes.ok) {
            const mJson = await mRes.json();
            if (mJson?.entries) {
              setMoodHistory(mJson.entries);
              const todayISO = new Date().toISOString().slice(0, 10);
              const hasToday = mJson.entries.some((m: any) => m.dateISO === todayISO);
              setShowMoodForm(!hasToday);
            }
          }
          if (hRes.ok) {
            const hJson = await hRes.json();
            if (hJson?.entries) {
              const mapped = hJson.entries.map((e: any) => ({
                id: e._id ?? e.id,
                date: e.date,
                dateISO: e.dateISO ?? e.date, // Fallback if format is YYYY-MM-DD
                weight: String(e.weight ?? e.weight),
                calories: e.calories,
                water: e.water,
                notes: e.notes,
              }));
              const normalized = normalizeHistory(mapped);
              setHistory(normalized);
              localStorage.setItem(
                "wellnessHistory",
                JSON.stringify(normalized)
              );
            }
          }
        } catch (e) {
          console.error("Failed to fetch server profile/history", e);
        }
      })();
    } else {
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          const normalized = normalizeHistory(parsed);
          setHistory(normalized);
          localStorage.setItem("wellnessHistory", JSON.stringify(normalized));
        } catch (e) {
          console.error("Failed to parse saved history", e);
        }
      }
    }

    // Load today's nutrition logs (prioritize server data, fallback to local with user scope)
    if (userId) {
      // We'll handle this inside the async block above or here if we have history
      // But actually, we should do it after we setHistory to avoid race conditions.
      // However, we can also check the localStorage here if we have userId.
      // Better approach: when history is set from server, update state.
    }
  }, [status, session?.user?.id]);

  // Effect to sync state from history once history is loaded (server priority)
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = history.find(h => h.dateISO === today);

    if (todayEntry) {
      // If server has data, trust it
      if (todayEntry.calories !== undefined) setConsumedCalories(todayEntry.calories);
      if (todayEntry.water !== undefined) setConsumedWater(todayEntry.water);
    } else {
      // Fallback to scoped local storage
      try {
        const cal = localStorage.getItem(`user_${userId}_calories_${today}`);
        const water = localStorage.getItem(`user_${userId}_water_${today}`);
        if (cal) setConsumedCalories(Number(cal));
        if (water) setConsumedWater(Number(water));
      } catch (e) { }
    }
  }, [history, session?.user?.id]);

  // Custom hook to sync streak from profile when saving
  const refreshStreak = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/profile?userId=${session.user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.user?.streak !== undefined) {
          setUserStreak(json.user.streak);
        }
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  // Obliczanie BMI i BMR przy zmianie danych
  useEffect(() => {
    calculateHealthMetrics();
  }, [userData.weight, userData.height, userData.age, userData.gender]);

  const calculateHealthMetrics = () => {
    // BMI calculation
    if (userData.weight && userData.height) {
      const weightNum = parseFloat(userData.weight);
      const heightNum = parseFloat(userData.height) / 100; // convert cm to m
      const bmiValue = weightNum / (heightNum * heightNum);
      setBmi(parseFloat(bmiValue.toFixed(1)));
    } else {
      setBmi(null);
    }

    // BMR calculation (Mifflin-St Jeor Equation)
    if (userData.weight && userData.height && userData.age && userData.gender) {
      const weightNum = parseFloat(userData.weight);
      const heightNum = parseFloat(userData.height);
      const ageNum = parseFloat(userData.age);

      let bmrValue;
      if (userData.gender === "male") {
        bmrValue = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
      } else {
        bmrValue = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
      }
      setBmr(Math.round(bmrValue));
    } else {
      setBmr(null);
    }
  };

  useEffect(() => {
    if (!bmr) return;
    const freq = userData.sportFrequency;
    let multiplier = 1.2; // sedentary
    if (freq === "daily") multiplier = 1.6;
    else if (freq === "few") multiplier = 1.4;
    else if (freq === "rare") multiplier = 1.25;

    let goal = Math.round(bmr * multiplier);

    // Auto-infer goal from comparing current weight to target weight
    const currentW = parseFloat(userData.weight);
    const targetW = parseFloat(userData.targetWeight);

    if (!isNaN(currentW) && !isNaN(targetW)) {
      if (currentW > targetW) {
        // User wants to lose weight
        goal -= 300;
      } else if (currentW < targetW) {
        // User wants to gain weight
        goal += 300;
      }
      // If equal, maintain weight (no adjustment)
    } else if (userData.goal) {
      // Fallback to explicit goal if target weight not set
      if (userData.goal === "lose") goal -= 300;
      if (userData.goal === "gain") goal += 300;
    }

    setCaloriesGoal(goal);
  }, [bmr, userData.sportFrequency, userData.weight, userData.targetWeight, userData.goal]);

  // Adjust water goal based on weather temperature
  useEffect(() => {
    let baseWater = 2000; // ml
    if (weatherTemp !== null) {
      console.log("Weather temp changed:", weatherTemp);
      if (weatherTemp > 20) {
        // Add 100ml for every 1°C above 20°C (much more noticeable)
        const extraWater = Math.round((weatherTemp - 20) * 100);
        baseWater += extraWater;
      }
    }
    console.log("Setting water goal to:", baseWater);
    setWaterGoal(baseWater);
  }, [weatherTemp]);

  // Fetch weather when city changes (with debounce)
  useEffect(() => {
    if (!userData.city || userData.city.length < 2) return;

    const fetchWeather = async () => {
      console.log("Fetching weather for:", userData.city);
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(userData.city)}`);
        if (res.ok) {
          const data = await res.json();
          console.log("Weather data received:", data);
          if (data.temp !== undefined) {
            setWeatherTemp(data.temp);
            setWeatherDescription(data.description || "");
          }
        } else {
          // City not found - clear weather data to avoid stale info
          setWeatherTemp(null);
          setWeatherDescription("");
          showToast("City not found. Please enter a valid city name.", "error");
        }
      } catch (e) {
        console.error("Failed to fetch weather:", e);
        setWeatherTemp(null);
        setWeatherDescription("");
      }
    };

    // Debounce: wait 1 second after user stops typing
    const timeoutId = setTimeout(fetchWeather, 1000);
    return () => clearTimeout(timeoutId);
  }, [userData.city]);


  // Auto-sync nutrition data to server and update streak
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().slice(0, 10);

    // Save to localStorage
    try {
      localStorage.setItem(`user_${userId}_calories_${today}`, String(consumedCalories));
      localStorage.setItem(`user_${userId}_water_${today}`, String(consumedWater));
    } catch (e) { }

    // Debounce server sync - only sync if we have meaningful values
    if (consumedCalories === 0 && consumedWater === 0) return;

    // Sync to server (with goals for streak calculation)
    const syncToServer = async () => {
      try {
        const res = await fetch(`/api/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            dateISO: today,
            date: today,
            calories: consumedCalories,
            water: consumedWater,
            caloriesGoal: caloriesGoal,
            waterGoal: waterGoal,
          }),
        });
        if (res.ok) {
          // Refresh streak after successful sync
          await refreshStreak();
        }
      } catch (e) {
        console.error("Failed to sync nutrition to server", e);
      }
    };

    // Use a small delay to debounce rapid changes
    const timeoutId = setTimeout(syncToServer, 500);
    return () => clearTimeout(timeoutId);
  }, [consumedCalories, consumedWater, session?.user?.id, caloriesGoal, waterGoal]);

  // Check if goals are reached and show popup
  useEffect(() => {
    if (caloriesGoal && consumedCalories >= caloriesGoal && !caloriesGoalReached) {
      setCaloriesGoalReached(true);
      showToast("🎉 Congratulations! You have reached today's calorie goal!", "success");
    }
    // Reset flag if consumption drops below goal (so toast can reappear)
    if (caloriesGoal && consumedCalories < caloriesGoal && caloriesGoalReached) {
      setCaloriesGoalReached(false);
    }
  }, [consumedCalories, caloriesGoal, caloriesGoalReached]);

  useEffect(() => {
    if (consumedWater >= waterGoal && !waterGoalReached) {
      setWaterGoalReached(true);
      showToast("💧 Great! You have reached today's water intake goal!", "success");
    }
    // Reset flag if consumption drops below goal (so toast can reappear)
    if (consumedWater < waterGoal && waterGoalReached) {
      setWaterGoalReached(false);
    }
  }, [consumedWater, waterGoal, waterGoalReached]);

  // Reset goal reached flags on new day
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('lastGoalCheckDate');
    if (lastDate !== today) {
      setCaloriesGoalReached(false);
      setWaterGoalReached(false);
      localStorage.setItem('lastGoalCheckDate', today);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("wellnessUserData", JSON.stringify(userData));

    const dateISO = new Date().toISOString().slice(0, 10);
    const displayDate = new Date().toLocaleDateString();

    if (userData.weight) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        date: displayDate,
        dateISO,
        weight: userData.weight,
        calories: consumedCalories,
        water: consumedWater
      };

      const userId = session?.user?.id;
      if (userId) {
        // persist to server
        (async () => {
          try {
            const res = await fetch(`/api/history`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                dateISO,
                date: dateISO, // Use ISO for consistency in DB
                weight: userData.weight,
                calories: consumedCalories,
                water: consumedWater,
                caloriesGoal: caloriesGoal,
                waterGoal: waterGoal
              }),
            });
            if (res.ok) {
              const json = await res.json();
              // add server entry (id from server)
              const entry = {
                id: json.entry._id,
                date: json.entry.date,
                dateISO: json.entry.date,
                weight: json.entry.weight,
                calories: json.entry.calories,
                water: json.entry.water
              } as HistoryEntry;

              // Handle upsert in local history
              const existingIndex = history.findIndex(h => h.dateISO === entry.dateISO);
              let newHistory = [...history];
              if (existingIndex >= 0) {
                newHistory[existingIndex] = entry;
              } else {
                newHistory.push(entry);
              }
              const normalized = normalizeHistory(newHistory);
              setHistory(normalized);
              localStorage.setItem(
                "wellnessHistory",
                JSON.stringify(normalized)
              );

              // After save, refresh streak
              await refreshStreak();
            }
          } catch (e) {
            console.error("Failed to save history to server", e);
          }
        })();
        (async () => {
          try {
            await fetch(`/api/profile`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, userData }),
            });
          } catch (e) {
            console.error("Failed to save profile to server", e);
          }
        })();
      } else {
        const existingIndex = history.findIndex(h => h.dateISO === dateISO);
        let newHistory = [...history];
        if (existingIndex >= 0) {
          newHistory[existingIndex] = newEntry;
        } else {
          newHistory.push(newEntry);
        }
        const updatedHistory = normalizeHistory(newHistory);
        setHistory(updatedHistory);
        localStorage.setItem("wellnessHistory", JSON.stringify(updatedHistory));
      }
    }

    showToast("Data saved successfully!", "success");
  };

  const addPreviousEntry = async () => {
    if (!prevDate || !prevWeight) return;

    // Prevent future dates
    const today = new Date().toISOString().slice(0, 10);
    if (prevDate > today) {
      showToast("Cannot add entries for future dates", "error");
      return;
    }

    const dateISO = new Date(prevDate).toISOString().slice(0, 10);
    const displayDate = new Date(dateISO).toLocaleDateString();

    // Previous entry typically just weight, but could include arbitrary calories/water if we had inputs for it.
    // For now assuming just weight history backfill.
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      date: displayDate,
      dateISO,
      weight: prevWeight,
    };

    const userId = session?.user?.id;
    if (userId) {
      try {
        const res = await fetch(`/api/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            dateISO,
            date: dateISO,
            weight: Number(prevWeight),
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const entry = {
            id: json.entry._id,
            date: json.entry.date,
            dateISO: json.entry.date,
            weight: json.entry.weight,
          } as HistoryEntry;

          // Handle upsert locally
          const existingIndex = history.findIndex(h => h.dateISO === entry.dateISO);
          let merged = [...history];
          if (existingIndex >= 0) {
            if (allowPreviousData) merged[existingIndex] = entry; // override?
            else { /* keep old? user didn't specify */ merged[existingIndex] = entry; }
          } else {
            merged.push(entry);
          }

          const normalized = normalizeHistory(merged);
          setHistory(normalized);
          localStorage.setItem("wellnessHistory", JSON.stringify(normalized));
        }
      } catch (e) {
        console.error("Failed to persist previous entry", e);
      }
    } else {
      // Local only fallback
      const existingIndex = history.findIndex(h => h.dateISO === dateISO);
      let merged = [...history];
      if (existingIndex >= 0) {
        merged[existingIndex] = newEntry;
      } else {
        merged.push(newEntry);
      }
      const updatedHistory = normalizeHistory(merged);
      setHistory(updatedHistory);
      localStorage.setItem("wellnessHistory", JSON.stringify(updatedHistory));
    }

    setPrevWeight("");
    setPrevDate(new Date().toISOString().slice(0, 10));
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    if (!session?.user?.id) return;

    try {
      const res = await fetch('/api/auth/delete', {
        method: 'DELETE',
        body: JSON.stringify({ userId: session.user.id }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        showToast("Failed to delete account", "error");
      }
    } catch (e) {
      showToast("Error deleting account", "error");
    }
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    let processedValue = value;

    // Round and clamp numeric fields appropriately
    if (value !== "" && !isNaN(parseFloat(value))) {
      let num = parseFloat(value);

      if (field === "age") {
        // Floor to whole number and clamp to 1-120 years
        num = Math.max(1, Math.min(120, Math.floor(num)));
        processedValue = String(num);
      } else if (field === "height") {
        // Floor to whole number and clamp to 50-250 cm
        num = Math.max(50, Math.min(250, Math.floor(num)));
        processedValue = String(num);
      } else if (field === "weight" || field === "targetWeight") {
        // Round to 1 decimal place and clamp to 20-250 kg
        num = Math.max(20, Math.min(250, Math.round(num * 10) / 10));
        processedValue = String(num);
      }
    }

    setUserData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity";
  };

  // Function to calculate gradient color based on percentage (0-100%)
  // Red (0%) -> Yellow/Orange (50%) -> Green (100%)
  const getProgressGradient = (percentage: number) => {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    if (clampedPercentage <= 50) {
      // Red to Yellow (0% to 50%)
      const ratio = clampedPercentage / 50;
      const red = 255;
      const green = Math.round(255 * ratio);
      return `rgb(${red}, ${green}, 0)`;
    } else {
      // Yellow to Green (50% to 100%)
      const ratio = (clampedPercentage - 50) / 50;
      const red = Math.round(255 * (1 - ratio));
      const green = 255;
      return `rgb(${red}, ${green}, 0)`;
    }
  };

  // Custom tooltip to reliably show the hovered point's value
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // payload[0].value should be the numeric weight, but read from payload[0].payload to be safe
      const raw = payload[0];
      const value = raw?.value ?? raw?.payload?.weight;
      return (
        <div className="bg-white border border-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white p-2 rounded shadow">
          <p className="text-xs opacity-75">{label}</p>
          <p className="font-semibold">{value} kg</p>
        </div>
      );
    }
    return null;
  };

  // Quick add options for calories
  const caloriesOptions = [
    { name: "Light snack", calories: 120, icon: "/icons/food/snack.png" },
    { name: "Fruit", calories: 80, icon: "/icons/food/fruit.png" },
    { name: "Sandwich", calories: 350, icon: "/icons/food/sandwich.png" },
    { name: "Salad", calories: 280, icon: "/icons/food/salad.png" },
    { name: "Pasta dish", calories: 600, icon: "/icons/food/pasta.png" },
    { name: "Pizza slice", calories: 300, icon: "/icons/food/pizza-slice.png" },
    { name: "Burger", calories: 700, icon: "/icons/food/burger.png" },
    { name: "KFC", calories: 1500, icon: "/icons/food/KFC.png" },
    { name: "Full breakfast", calories: 550, icon: "/icons/food/breakfast.png" },
    { name: "Protein shake", calories: 200, icon: "/icons/food/protein-shake.png" },
    { name: "Energy bar", calories: 180, icon: "/icons/food/energy-bar.png" },
    { name: "Ice cream", calories: 230, icon: "/icons/food/ice-cream.png" },
  ];

  // Quick add options for water
  const waterOptions = [
    { name: "Glass of water", ml: 250, icon: "/icons/drinks/glass-of-water.png" },
    { name: "Cup of tea/coffee", ml: 250, icon: "/icons/drinks/coffee.png" },
    { name: "Small bottle", ml: 500, icon: "/icons/drinks/water-bottle.png" },
    { name: "Mug of coffee/tea", ml: 300, icon: "/icons/drinks/mug-of-coffee.png" },
    { name: "Large bottle", ml: 1500, icon: "/icons/drinks/big-water.png" },
    { name: "Can of soda", ml: 330, icon: "/icons/drinks/soda-can.png" },
    { name: "Isotonic drink", ml: 500, icon: "/icons/drinks/energy-drink-bottle.png" },
    { name: "Energy drink", ml: 330, icon: "/icons/drinks/energy-drink.png" },
  ];

  return (
    <main className="min-h-screen p-8 transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <OnlineIndicator />
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-200
              ${toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : toast.type === "error"
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-slate-800 text-white border-slate-700"}
            `}
          >
            {toast.message}
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute right-0 top-0 flex items-center gap-2 text-orange-500 font-bold animate-pulse">
            <Flame className="w-6 h-6 fill-orange-500" />
            <span>{userStreak}</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Wellness Dashboard</h1>
          <p className="text-lg opacity-75">
            Track your health and fitness journey
          </p>
        </div>

        {/* Tier 1 Navigation */}
        <div className="flex space-x-4 mb-6 justify-center flex-wrap gap-y-2">
          <Button
            variant={activeCategory === "home" ? "default" : "outline"}
            onClick={() => { setActiveCategory("home"); setTab("dashboard"); }}
            className={`px-6 py-2 flex items-center gap-2 ${activeCategory === "home" ? "bg-slate-800 hover:bg-slate-900 border-transparent dark:bg-slate-200 dark:hover:bg-slate-300" : "dark:border-gray-700"}`}
          >
            <Home className="w-5 h-5" /> Home
          </Button>
          <Button
            variant={activeCategory === "health" ? "default" : "outline"}
            onClick={() => { setActiveCategory("health"); setTab("nutrition"); }}
            className={`px-6 py-2 flex items-center gap-2 ${activeCategory === "health" ? "bg-rose-500 hover:bg-rose-600 text-white border-transparent" : "dark:border-gray-700"}`}
          >
            <HeartPulse className="w-5 h-5" /> My Health
          </Button>
          <Button
            variant={activeCategory === "settings" ? "default" : "outline"}
            onClick={() => { setActiveCategory("settings"); setTab("settings"); }}
            className={`px-6 py-2 flex items-center gap-2 ${activeCategory === "settings" ? "bg-slate-500 hover:bg-slate-600 text-white border-transparent" : "dark:border-gray-700"}`}
          >
            <SettingsIcon className="w-5 h-5" /> Settings
          </Button>
        </div>

        {/* Tier 2 Navigation (Health Sub-menu) */}
        {activeCategory === "health" && (
          <div className="flex space-x-3 mb-8 justify-center flex-wrap gap-y-2 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setTab("nutrition")}
              className={`px-5 py-2 rounded-full flex items-center gap-2 font-medium transition-all duration-300 ${
                tab === "nutrition" 
                  ? "bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Droplets className="w-4 h-4" /> Nutrition
            </button>
            <button
              onClick={() => setTab("mind")}
              className={`px-5 py-2 rounded-full flex items-center gap-2 font-medium transition-all duration-300 ${
                tab === "mind" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Brain className="w-4 h-4" /> Mind
            </button>
            <button
              onClick={() => setTab("sleep")}
              className={`px-5 py-2 rounded-full flex items-center gap-2 font-medium transition-all duration-300 ${
                tab === "sleep" 
                  ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Moon className="w-4 h-4" /> Sleep
            </button>
            <button
              onClick={() => setTab("breathe")}
              className={`px-5 py-2 rounded-full flex items-center gap-2 font-medium transition-all duration-300 ${
                tab === "breathe" 
                  ? "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400 ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Wind className="w-4 h-4" /> Breathe
            </button>
            <button
              onClick={() => setTab("history")}
              className={`px-5 py-2 rounded-full flex items-center gap-2 font-medium transition-all duration-300 ${
                tab === "history" 
                  ? "bg-purple-500/10 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> History
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Weight</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {userData.weight || "–"} kg
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Height</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {userData.height || "–"} cm
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Age</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {userData.age || "–"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Gender</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {userData.gender
                        ? userData.gender.charAt(0).toUpperCase() +
                        userData.gender.slice(1)
                        : "–"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="font-semibold">Goal</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {userData.weight && userData.targetWeight
                      ? parseFloat(userData.weight) > parseFloat(userData.targetWeight)
                        ? "Lose Weight"
                        : parseFloat(userData.weight) < parseFloat(userData.targetWeight)
                          ? "Gain Weight"
                          : "Maintain Weight"
                      : "–"}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Sport Frequency</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {userData.sportFrequency
                      ? userData.sportFrequency === "daily"
                        ? "Daily"
                        : userData.sportFrequency === "few"
                          ? "Few times a week"
                          : "Rarely"
                      : "–"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Health Metrics */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bmi && (
                  <div className="text-center p-4 rounded-lg bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                    <p className="text-2xl font-bold">{bmi}</p>
                    <p className="text-sm opacity-75">BMI</p>
                    <p className="text-xs mt-1">{getBmiCategory(bmi)}</p>
                  </div>
                )}

                {bmr && (
                  <div className="text-center p-4 rounded-lg bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                    <p className="text-2xl font-bold">{bmr} kcal</p>
                    <p className="text-sm opacity-75">Basal Metabolic Rate</p>
                    <p className="text-xs mt-1">Calories burned at rest</p>
                  </div>
                )}

                {!bmi && !bmr && (
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete your personal data to see health metrics
                  </p>
                )}

                {/* Estimated Date Integrated */}
                {(() => {
                  // Only show if we have minimal data
                  if (!userData.weight || !userData.targetWeight || !userData.goal || !bmr) return null;

                  const current = parseFloat(userData.weight);
                  const target = parseFloat(userData.targetWeight);
                  const diff = current - target;
                  const dailyDiff = userData.goal === 'lose' ? 500 : (userData.goal === 'gain' ? 500 : 0);

                  if (dailyDiff === 0) return null;

                  // Already reached?
                  if ((userData.goal === 'lose' && diff <= 0) || (userData.goal === 'gain' && diff >= 0)) return (
                    <div className="text-center p-4 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <p className="font-bold">Goal Reached! 🎉</p>
                    </div>
                  );

                  const days = Math.abs((diff * 7700) / dailyDiff);
                  const futureDate = new Date();
                  futureDate.setDate(futureDate.getDate() + days);

                  return (
                    <div className="text-center p-4 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300">
                      <p className="text-2xl font-bold">{futureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm opacity-75">Estimated Goal Date</p>
                      <p className="text-xs mt-1">({Math.round(days)} days left)</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>


            {/* Recent History */}
            <Card className="md:col-span-2 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Recent Weight History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {/* Chart */}
                    <div style={{ width: "100%", height: 200 }}>
                      <ResponsiveContainer>
                        <LineChart
                          data={history.map((h) => ({
                            date: h.date,
                            weight: Number(h.weight),
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recent numbers */}
                    <div className="grid grid-cols-1 gap-2">
                      {history
                        .slice(-5)
                        .reverse()
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex justify-between items-center py-2 border-b dark:border-gray-700"
                          >
                            <span>{entry.date}</span>
                            <span className="font-semibold">
                              {entry.weight} kg
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No weight history yet. Save your data to start tracking.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Nutrition Tab */}
        {tab === "nutrition" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Recommended today:{" "}
                  {caloriesGoal ? `${caloriesGoal} kcal` : "–"}
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          caloriesGoal
                            ? Math.round(
                              (consumedCalories / caloriesGoal) * 100
                            )
                            : 0
                        )}%`,
                        background: getProgressGradient(
                          caloriesGoal
                            ? (consumedCalories / caloriesGoal) * 100
                            : 0
                        ),
                        transition: 'all 0.3s ease',
                      }}
                      className="h-4"
                    />
                  </div>
                  <p className="mt-2 text-sm">
                    {consumedCalories} / {caloriesGoal ?? "–"} kcal (
                    {caloriesGoal
                      ? `${Math.round(
                        (consumedCalories / caloriesGoal) * 100
                      )}%`
                      : "–"}
                    )
                  </p>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <Input
                    placeholder="kcal"
                    value={calInput}
                    onChange={(e) => setCalInput(e.target.value)}
                    className="flex-1 min-w-[80px]"
                  />
                  <Button
                    onClick={() => {
                      const v = Number(calInput);
                      if (!isNaN(v) && v > 0) {
                        const rounded = Math.max(1, Math.round(v)); // Round, ensure at least 1
                        // Apply max cap if set
                        const maxCap = maxCapPercentage === 0
                          ? Infinity
                          : (caloriesGoal ?? 0) * (maxCapPercentage / 100);
                        setConsumedCalories((c) => Math.min(maxCap, c + rounded));
                        setCalInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const v = Number(calInput);
                      if (!isNaN(v) && v > 0) {
                        const rounded = Math.max(1, Math.round(v)); // Round, ensure at least 1
                        setConsumedCalories((c) => Math.max(0, c - rounded));
                        setCalInput("");
                      }
                    }}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCaloriesModal(true)}
                    className="px-3"
                  >
                    <Sandwich className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConsumedCalories(0);
                      setCaloriesGoalReached(false);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Water Intake</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Daily goal: {waterGoal} ml
                  {weatherTemp !== null && (
                    <span className="ml-2">
                      ({Math.round(weatherTemp)}°C{weatherDescription ? `, ${weatherDescription}` : ""})
                    </span>
                  )}
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((consumedWater / waterGoal) * 100)
                        )}%`,
                        background: getProgressGradient(
                          (consumedWater / waterGoal) * 100
                        ),
                        transition: 'all 0.3s ease',
                      }}
                      className="h-4"
                    />
                  </div>
                  <p className="mt-2 text-sm">
                    {consumedWater} / {waterGoal} ml (
                    {Math.round((consumedWater / waterGoal) * 100) || 0}%)
                  </p>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <Input
                    placeholder="ml"
                    value={waterInput}
                    onChange={(e) => setWaterInput(e.target.value)}
                    className="flex-1 min-w-[80px]"
                  />
                  <Button
                    onClick={() => {
                      const v = Number(waterInput);
                      if (!isNaN(v) && v > 0) {
                        const rounded = Math.max(1, Math.round(v)); // Round, ensure at least 1
                        // Apply max cap if set
                        const maxCap = maxCapPercentage === 0
                          ? Infinity
                          : waterGoal * (maxCapPercentage / 100);
                        setConsumedWater((w) => Math.min(maxCap, w + rounded));
                        setWaterInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const v = Number(waterInput);
                      if (!isNaN(v) && v > 0) {
                        const rounded = Math.max(1, Math.round(v)); // Round, ensure at least 1
                        setConsumedWater((w) => Math.max(0, w - rounded));
                        setWaterInput("");
                      }
                    }}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowWaterModal(true)}
                    className="px-3"
                  >
                    <GlassWater className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConsumedWater(0);
                      setWaterGoalReached(false);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                To add previous-dated entries, enable "Allow adding previous
                data" in Settings.
              </div>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-center p-3 rounded-lg border dark:border-gray-700"
                    >
                      <div className="flex-1">
                        {editingId === entry.id ? (
                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="date"
                              value={editDate}
                              max={new Date().toISOString().slice(0, 10)}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="border rounded p-2 bg-background"
                            />
                            <input
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              placeholder="Weight (kg)"
                              className="border rounded p-2 bg-background"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold">{entry.date}</p>
                            {/* notes removed earlier; kept conditional for backward compat */}
                            {entry.notes && (
                              <p className="text-sm dark:text-gray-400 text-gray-600">
                                {entry.notes}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="ml-4 flex items-center gap-3">
                        {editingId === entry.id ? (
                          <>
                            <Button
                              onClick={async () => {
                                // Prevent future dates
                                const today = new Date().toISOString().slice(0, 10);
                                if (editDate > today) {
                                  showToast("Cannot set entries to future dates", "error");
                                  return;
                                }
                                // save edited entry
                                const dateISO = new Date(editDate)
                                  .toISOString()
                                  .slice(0, 10);
                                const displayDate = new Date(
                                  dateISO
                                ).toLocaleDateString();
                                const userId = session?.user?.id;
                                if (userId) {
                                  try {
                                    const res = await fetch(`/api/history`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        userId,
                                        dateISO,
                                        date: dateISO,
                                        weight: Number(editWeight),
                                      }),
                                    });
                                    if (res.ok) {
                                      const json = await res.json();
                                      const updated = {
                                        id: json.entry._id,
                                        date: json.entry.date,
                                        dateISO: json.entry.date,
                                        weight: json.entry.weight,
                                      } as HistoryEntry;
                                      // Handle upsert: might be same date as old entry or different
                                      let merged = history.filter((h) => h.id !== entry.id && h.dateISO !== updated.dateISO);
                                      merged.push(updated);
                                      const normalized =
                                        normalizeHistory(merged);
                                      setHistory(normalized);
                                      localStorage.setItem(
                                        "wellnessHistory",
                                        JSON.stringify(normalized)
                                      );
                                    }
                                  } catch (e) {
                                    console.error(
                                      "Failed to update entry on server",
                                      e
                                    );
                                  }
                                } else {
                                  const localUpdated = history.map((h) =>
                                    h.id === entry.id
                                      ? {
                                        ...h,
                                        date: new Date(
                                          editDate
                                        ).toLocaleDateString(),
                                        dateISO: editDate,
                                        weight: editWeight,
                                      }
                                      : h
                                  );
                                  const normalized =
                                    normalizeHistory(localUpdated);
                                  setHistory(normalized);
                                  localStorage.setItem(
                                    "wellnessHistory",
                                    JSON.stringify(normalized)
                                  );
                                }
                                setEditingId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-xl font-bold">
                              {entry.weight} kg
                            </p>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setEditingId(entry.id);
                                setEditDate(
                                  entry.dateISO ||
                                  new Date().toISOString().slice(0, 10)
                                );
                                setEditWeight(String(entry.weight));
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              onClick={async () => {
                                const ok = confirm(
                                  "Are you sure you want to delete this entry?"
                                );
                                if (!ok) return;
                                const userId = session?.user?.id;
                                if (userId) {
                                  try {
                                    const res = await fetch(`/api/history`, {
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        entryId: entry.id,
                                      }),
                                    });
                                    if (res.ok) {
                                      const filtered = history.filter(
                                        (h) => h.id !== entry.id
                                      );
                                      const normalized =
                                        normalizeHistory(filtered);
                                      setHistory(normalized);
                                      localStorage.setItem(
                                        "wellnessHistory",
                                        JSON.stringify(normalized)
                                      );
                                    } else {
                                      console.error(
                                        "Failed to delete entry",
                                        res.status
                                      );
                                    }
                                  } catch (e) {
                                    console.error("Failed to delete entry", e);
                                  }
                                } else {
                                  // local delete
                                  const filtered = history.filter(
                                    (h) => h.id !== entry.id
                                  );
                                  const normalized = normalizeHistory(filtered);
                                  setHistory(normalized);
                                  localStorage.setItem(
                                    "wellnessHistory",
                                    JSON.stringify(normalized)
                                  );
                                }
                              }}
                              className="text-red-500"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No history entries yet.
                  </p>
                  <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">
                    Your weight entries will appear here after you save your
                    data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sleep Tab */}
        {tab === "sleep" && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
            
            {/* Mode Toggle */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-full flex shadow-inner backdrop-blur-sm border dark:border-gray-700">
                <button 
                  onClick={() => setSleepCalcMode("wake")} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${sleepCalcMode === "wake" ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  <Sun className="w-4 h-4" /> I need to wake up at
                </button>
                <button 
                  onClick={() => setSleepCalcMode("bed")} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${sleepCalcMode === "bed" ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  <Moon className="w-4 h-4" /> I am going to sleep at
                </button>
              </div>
            </div>

            <Card className="dark:bg-gray-800/80 backdrop-blur-xl border-indigo-100 dark:border-indigo-900 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-32 bg-indigo-500 opacity-[0.03] dark:opacity-10 blur-3xl rounded-full pointer-events-none" />
              <CardHeader className="relative z-10 pb-0 flex flex-col items-center">
                <CardTitle className="text-center text-3xl font-light text-indigo-950 dark:text-indigo-100">
                  {sleepCalcMode === "wake" ? "When do you need to wake up?" : "When are you going to sleep?"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 relative z-10 flex flex-col items-center pt-8">
                {/* Custom Digital Timer */}
                <div className="flex items-center justify-center space-x-6 text-7xl font-light tabular-nums tracking-tighter text-indigo-950 dark:text-indigo-50">
                  <div className="flex flex-col items-center group">
                    <button onClick={() => setWakeHour(h => (h + 1) % 24)} className="p-3 opacity-0 group-hover:opacity-100 transition-all text-indigo-400 hover:text-indigo-600 hover:-translate-y-1 focused:opacity-100 focus:outline-none"><ChevronUp className="w-10 h-10" /></button>
                    <div className="bg-white/50 dark:bg-black/20 w-32 h-32 flex items-center justify-center rounded-3xl shadow-inner border border-indigo-100 dark:border-indigo-800 backdrop-blur-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] select-none">
                      {String(wakeHour).padStart(2, '0')}
                    </div>
                    <button onClick={() => setWakeHour(h => (h - 1 + 24) % 24)} className="p-3 opacity-0 group-hover:opacity-100 transition-all text-indigo-400 hover:text-indigo-600 hover:translate-y-1 focused:opacity-100 focus:outline-none"><ChevronDown className="w-10 h-10" /></button>
                  </div>
                  <div className="text-indigo-300 dark:text-indigo-700 animate-pulse font-medium">:</div>
                  <div className="flex flex-col items-center group">
                    <button onClick={() => setWakeMinute(m => (m + 5) % 60)} className="p-3 opacity-0 group-hover:opacity-100 transition-all text-indigo-400 hover:text-indigo-600 hover:-translate-y-1 focused:opacity-100 focus:outline-none"><ChevronUp className="w-10 h-10" /></button>
                    <div className="bg-white/50 dark:bg-black/20 w-32 h-32 flex items-center justify-center rounded-3xl shadow-inner border border-indigo-100 dark:border-indigo-800 backdrop-blur-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] select-none">
                      {String(wakeMinute).padStart(2, '0')}
                    </div>
                    <button onClick={() => setWakeMinute(m => (m - 5 + 60) % 60)} className="p-3 opacity-0 group-hover:opacity-100 transition-all text-indigo-400 hover:text-indigo-600 hover:translate-y-1 focused:opacity-100 focus:outline-none"><ChevronDown className="w-10 h-10" /></button>
                  </div>
                </div>
                
                {sleepCalcMode === "bed" && (
                  <Button 
                    variant="outline" 
                    className="rounded-full border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                    onClick={() => {
                      const now = new Date();
                      setWakeHour(now.getHours());
                      setWakeMinute(now.getMinutes());
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" /> Set to NOW
                  </Button>
                )}

                <div className="flex items-center gap-3 text-sm text-indigo-600/80 dark:text-indigo-300/80 bg-indigo-50/80 dark:bg-indigo-900/30 px-5 py-3 rounded-2xl max-w-sm text-center leading-relaxed">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>Our calculations include a built-in <strong>15 minute</strong> physical buffer required for an average human to fall into REM latency.</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-700">
              <h3 className="text-xl font-medium text-center text-gray-600 dark:text-gray-300">
                {sleepCalcMode === "wake" ? "To wake up refreshed, head to bed at:" : "If you sleep then, optimal wake times are:"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(sleepCalcMode === "wake" ? [6, 5, 4] : [4, 5, 6]).map(cycles => {
                  const totalBase = wakeHour * 60 + wakeMinute;
                  const totalCycleMins = cycles * 90 + 15;
                  
                  let calculatedTotal = 0;
                  if (sleepCalcMode === "wake") {
                    calculatedTotal = totalBase - totalCycleMins;
                    while (calculatedTotal < 0) calculatedTotal += 24 * 60;
                  } else {
                    calculatedTotal = totalBase + totalCycleMins;
                  }
                  
                  const calcH = Math.floor(calculatedTotal / 60) % 24;
                  const calcM = calculatedTotal % 60;
                  const timeStr = `${String(calcH).padStart(2, '0')}:${String(calcM).padStart(2, '0')}`;
                  
                  const isOptimal = cycles === 5 || cycles === 6;
                  
                  return (
                    <Card key={cycles} className={`relative overflow-hidden transition-all duration-500 hover:-translate-y-1 group ${isOptimal ? 'border-indigo-200 dark:border-indigo-800 shadow-[0_10px_40px_-15px_rgba(99,102,241,0.4)] bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/30 dark:to-gray-800/90' : 'opacity-80 hover:opacity-100 border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50'}`}>
                      {isOptimal && <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />}
                      <CardContent className="p-8 text-center space-y-3">
                        {isOptimal ? (
                          <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-1">✨ Optimal</div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Minimum</div>
                        )}
                        <div className={`text-5xl font-light tracking-tight transition-transform group-hover:scale-110 ${isOptimal ? 'text-indigo-950 dark:text-indigo-50' : 'text-gray-800 dark:text-gray-200'}`}>{timeStr}</div>
                        <div className="text-sm font-medium opacity-75">{cycles} cycles</div>
                        <div className="text-xs opacity-50 bg-black/5 dark:bg-white/5 inline-block px-3 py-1 rounded-full">{cycles * 1.5} hrs sleep</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Breathe Tab */}
        {tab === "breathe" && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
            
            {/* Mode Toggle */}
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-full flex shadow-inner backdrop-blur-sm border dark:border-gray-700">
                <button 
                  onClick={() => { setBreatheMode("box"); setBreatheActive(false); setBreathePhase("idle"); setBreatheOrbScale(1); }} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${breatheMode === "box" ? "bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  Box Breathing (Focus)
                </button>
                <button 
                  onClick={() => { setBreatheMode("relax"); setBreatheActive(false); setBreathePhase("idle"); setBreatheOrbScale(1); }} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${breatheMode === "relax" ? "bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                  4-7-8 Technique (Relax)
                </button>
              </div>
            </div>

            <Card className="dark:bg-gray-800/80 backdrop-blur-xl border-cyan-100 dark:border-cyan-900 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col justify-center items-center">
              <div className="absolute top-0 right-0 p-32 bg-cyan-500 opacity-[0.03] dark:opacity-10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-32 bg-teal-500 opacity-[0.03] dark:opacity-10 blur-3xl rounded-full pointer-events-none" />
              
              <CardContent className="relative z-10 flex flex-col items-center justify-center p-8 w-full h-full">
                
                <h3 className="text-2xl font-light text-cyan-950 dark:text-cyan-50 mb-12 h-8 transition-all duration-500 uppercase tracking-widest text-center">
                  {!breatheActive ? "Focus on your breath" : breathePhase === "hold1" || breathePhase === "hold2" ? "Hold" : breathePhase}
                </h3>

                {/* The Breathe Orb */}
                <div className="relative flex items-center justify-center w-64 h-64 mb-16">
                  <div 
                    className={`absolute inset-0 bg-gradient-to-tr from-cyan-400 to-teal-300 rounded-full blur-2xl opacity-20 transition-all ${breatheActive && breathePhase === 'inhale' ? 'opacity-50 blur-3xl' : ''}`}
                    style={{ 
                      transform: `scale(${breatheOrbScale})`,
                      transitionDuration: breatheActive && breathePhase === "inhale" ? "4000ms" : breatheActive && breathePhase === "exhale" ? (breatheMode === "box" ? "4000ms" : "8000ms") : "300ms",
                      transitionTimingFunction: "ease-in-out" 
                    }}
                  />
                  <div 
                    className={`relative z-10 w-48 h-48 rounded-full shadow-[0_0_60px_rgba(6,182,212,0.4)] flex items-center justify-center border border-white/30 dark:border-cyan-400/30 overflow-hidden transition-all bg-black/40 backdrop-blur-md`}
                    style={{ 
                      transform: `scale(${breatheOrbScale})`,
                      transitionDuration: breatheActive && breathePhase === "inhale" ? "4000ms" : breatheActive && breathePhase === "exhale" ? (breatheMode === "box" ? "4000ms" : "8000ms") : "300ms",
                      transitionTimingFunction: "ease-in-out"
                    }}
                  >
                    {/* Siri/Cortana Fluid Mesh Blobs */}
                    <div className={`absolute w-20 h-20 bg-cyan-400 rounded-full mix-blend-screen filter blur-xl opacity-80 transition-all duration-700 ease-in-out ${breatheActive ? 'animate-[spin_10s_linear_infinite] scale-150' : 'scale-100'}`} style={{ top: '-5%', left: '-5%', transformOrigin: 'center right' }}></div>
                    <div className={`absolute w-20 h-20 bg-indigo-500 rounded-full mix-blend-screen filter blur-xl opacity-80 transition-all duration-700 ease-in-out ${breatheActive ? 'animate-[spin_14s_linear_infinite_reverse] scale-150' : 'scale-100'}`} style={{ bottom: '-5%', right: '-5%', transformOrigin: 'center left' }}></div>
                    <div className={`absolute w-20 h-20 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-xl opacity-60 transition-all duration-700 ease-in-out ${breatheActive ? 'animate-[spin_12s_linear_infinite] scale-125' : 'scale-100'}`} style={{ top: '30%', left: '30%', transformOrigin: 'bottom right' }}></div>

                    {/* Central Dark Core to make text readable and create an empty ring look */}
                    <div className="absolute inset-5 rounded-full bg-black/60 backdrop-blur-sm z-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"></div>

                    <div className="relative z-10 text-6xl font-light text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] tracking-tighter">
                      {breatheActive && breatheTimeLeft > 0 ? breatheTimeLeft : ""}
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg"
                  onClick={() => {
                    if (breatheActive) {
                      setBreatheActive(false);
                      setBreathePhase("idle");
                      setBreatheTimeLeft(0);
                      setBreatheOrbScale(1);
                    } else {
                      setBreatheActive(true);
                    }
                  }}
                  className={`rounded-full px-8 py-6 text-lg shadow-lg transition-all duration-300 ${breatheActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-200 dark:border-red-900/50' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
                  variant={breatheActive ? "outline" : "default"}
                >
                  {breatheActive ? (
                    <><Square className="w-5 h-5 mr-2" /> Stop Session</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" /> Start Breathing</>
                  )}
                </Button>

                <div className="flex items-center gap-3 text-sm text-cyan-700 dark:text-cyan-200/80 bg-cyan-50/80 dark:bg-cyan-900/30 px-5 py-4 rounded-2xl max-w-md text-center leading-relaxed mt-10">
                  <Info className="w-6 h-6 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <p className="text-left">
                    Follow the visual expansion of the orb to pace your breath. 
                    <strong> Box Breathing</strong> helps regain focus and clarity, while the <strong>4-7-8 Technique</strong> acts as a natural tranquiliser for your nervous system to help you sleep.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab - Combined Profile & App Settings */}
        {tab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-8 pb-24">
            
            {/* Section 1: Personal Profile */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Personal Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      placeholder="e.g., 70"
                      value={userData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                      type="number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      placeholder="e.g., 175"
                      value={userData.height}
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                      type="number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                    <Input
                      id="targetWeight"
                      placeholder="e.g., 65"
                      value={userData.targetWeight}
                      onChange={(e) =>
                        handleInputChange("targetWeight", e.target.value)
                      }
                      type="number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      placeholder="e.g., 25"
                      value={userData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      type="number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Warsaw"
                      value={userData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    id="gender"
                    value={userData.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    style={{
                      colorScheme: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "dark"
                        : "light",
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Goal</Label>
                  <p className="text-sm text-muted-foreground border rounded-md p-2 bg-muted/30">
                    {userData.weight && userData.targetWeight ? (
                      parseFloat(userData.weight) > parseFloat(userData.targetWeight)
                        ? "🔻 Lose weight (auto-detected from weight → target)"
                        : parseFloat(userData.weight) < parseFloat(userData.targetWeight)
                          ? "🔺 Gain weight (auto-detected from weight → target)"
                          : "⚖️ Maintain weight (weight = target)"
                    ) : (
                      "Set weight and target weight to auto-detect goal"
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sportFrequency">Sport Frequency</Label>
                  <Select
                    id="sportFrequency"
                    value={userData.sportFrequency}
                    onChange={(e) =>
                      handleInputChange("sportFrequency", e.target.value)
                    }
                    style={{
                      colorScheme: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "dark"
                        : "light",
                    }}
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="few">Few times a week</option>
                    <option value="rare">Rarely</option>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSave} size="lg">
                  Save All Data
                </Button>
              </CardContent>
            </Card>

            {/* Section 2: App Preferences */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Max Cap Setting */}
                <div className="space-y-2">
                  <Label htmlFor="maxCap">Maximum Value Cap</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit how much you can log above your daily goal. For example, 200% means you can log up to twice your goal.
                  </p>
                  <Select
                    id="maxCap"
                    value={String(maxCapPercentage)}
                    onChange={async (e) => {
                      const newCap = Number(e.target.value);
                      setMaxCapPercentage(newCap);
                      // Save to server
                      const userId = session?.user?.id;
                      if (userId) {
                        try {
                          await fetch(`/api/profile`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              userId,
                              userData: { maxCapPercentage: newCap },
                            }),
                          });
                          showToast("Settings saved!", "success");
                        } catch (e) {
                          console.error("Failed to save max cap", e);
                        }
                      }
                    }}
                    style={{
                      colorScheme: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "dark"
                        : "light",
                    }}
                  >
                    <option value="100">100% (No excess)</option>
                    <option value="200">200%</option>
                    <option value="300">300%</option>
                    <option value="0">∞ (No limit)</option>
                  </Select>
                </div>

                {/* Previous-data setting */}
                <div className="p-4 border rounded bg-transparent dark:bg-input/30 border-input">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allowPreviousData}
                      onChange={(e) => setAllowPreviousData(e.target.checked)}
                    />
                    <span className="text-sm">Allow adding previous data</span>
                  </label>

                  {allowPreviousData && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="date"
                        className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base dark:bg-input/30"
                        value={prevDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setPrevDate(e.target.value)}
                      />
                      <input
                        placeholder="Weight (kg)"
                        className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base dark:bg-input/30"
                        value={prevWeight}
                        onChange={(e) => setPrevWeight(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button onClick={addPreviousEntry}>Add previous</Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Account Danger Zone */}
            <Card className="dark:bg-red-900/10 border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
                  className="w-full text-gray-700 dark:text-gray-300"
                >
                  Log out
                </Button>

                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

        {/* Mind Tab */}
        {tab === "mind" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {showMoodForm ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden transform transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-normal">How are you feeling right now?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center gap-6">
                    {(['sad', 'neutral', 'happy'] as const).map((mood) => {
                      const isSelected = currentMood === mood;
                      const Icon = mood === 'sad' ? Frown : mood === 'neutral' ? Meh : Smile;
                      const colors = {
                        sad: 'text-blue-500 hover:text-blue-400 bg-blue-500/10',
                        neutral: 'text-yellow-500 hover:text-yellow-400 bg-yellow-500/10',
                        happy: 'text-emerald-500 hover:text-emerald-400 bg-emerald-500/10'
                      };
                      return (
                        <button
                          key={mood}
                          onClick={() => setCurrentMood(mood)}
                          className={`
                            p-4 rounded-full transition-all duration-300 transform
                            ${isSelected ? 'scale-110 shadow-lg shadow-current ring-4 ring-offset-2 dark:ring-offset-gray-900 ring-current opacity-100' : 'opacity-40 hover:opacity-80 scale-100'}
                            ${colors[mood]}
                          `}
                        >
                          <Icon className="w-12 h-12" />
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <textarea
                      placeholder="Take a moment to reflect on your current state..."
                      className="w-full min-h-[120px] p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      value={moodNotes}
                      onChange={(e) => setMoodNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    {moodHistory.some(m => m.dateISO === new Date().toISOString().slice(0, 10)) && (
                      <Button variant="ghost" className="mr-2" onClick={() => {
                        setShowMoodForm(false);
                        setCurrentMood(null);
                        setMoodNotes("");
                      }}>Cancel</Button>
                    )}
                    <Button 
                      disabled={!currentMood}
                      className="px-8"
                      onClick={async () => {
                        const userId = session?.user?.id;
                        if (!userId || !currentMood) return;
                        const dateISO = new Date().toISOString().slice(0, 10);
                        
                        try {
                          const res = await fetch('/api/mood', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, dateISO, mood: currentMood, notes: moodNotes })
                          });
                          if (res.ok) {
                            const { entry } = await res.json();
                            setMoodHistory([entry, ...moodHistory]);
                            setShowMoodForm(false);
                            setCurrentMood(null);
                            setMoodNotes("");
                            showToast("Reflection saved successfully!", "success");
                          } else {
                            showToast("Failed to save reflection", "error");
                          }
                        } catch(e) { console.error(e); }
                      }}
                    >
                      Save Reflection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-center mt-2 mb-6">
                <Button 
                  variant="outline" 
                  className="rounded-full shadow-sm"
                  onClick={() => setShowMoodForm(true)}
                >
                  + Log another reflection
                </Button>
              </div>
            )}
            
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Reflections Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {moodHistory.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
                    {moodHistory.map((entry: any, index: number) => {
                      const timeString = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const Icon = entry.mood === 'sad' ? Frown : entry.mood === 'neutral' ? Meh : Smile;
                      const iconColors = {
                        sad: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50',
                        neutral: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50',
                        happy: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50'
                      };
                      return (
                        <div key={entry._id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${iconColors[entry.mood as keyof typeof iconColors]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{entry.dateISO}</span>
                              <span className="text-xs text-gray-500">{timeString}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 break-words">{entry.notes || "No reflection note added."}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No reflections down here yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      {/* Calories Modal */}
      {showCaloriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sandwich className="h-6 w-6" />
                Quick Add Calories
              </h2>
              <button
                onClick={() => setShowCaloriesModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {caloriesOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setConsumedCalories((c) => c + option.calories);
                    setShowCaloriesModal(false);
                  }}
                  className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left flex items-center gap-3"
                >
                  <div className="w-14 h-14 flex-shrink-0 border-2 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden p-1">
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{option.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      +{option.calories} kcal
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Water Modal */}
      {showWaterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <GlassWater className="h-6 w-6" />
                Quick Add Water
              </h2>
              <button
                onClick={() => setShowWaterModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {waterOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setConsumedWater((w) => w + option.ml);
                    setShowWaterModal(false);
                  }}
                  className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left flex items-center gap-3"
                >
                  <div className="w-14 h-14 flex-shrink-0 border-2 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden p-1">
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{option.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      +{option.ml} ml
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

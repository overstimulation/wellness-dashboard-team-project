"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sandwich, GlassWater, X } from "lucide-react";
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
}

// Typy dla wpisów historii
interface HistoryEntry {
  id: string;
  date: string;
  weight: string;
  notes?: string;
  dateISO?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<
    "dashboard" | "history" | "settings" | "nutrition"
  >("dashboard");
  const [userData, setUserData] = useState<UserData>({
    weight: "",
    height: "",
    age: "",
    city: "",
    gender: "",
    goal: "",
    sportFrequency: "",
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
  const [toast, setToast] = useState<
    { message: string; type: "success" | "info" | "error" } | null
  >(null);
  const toastTimer = useRef<number | null>(null);

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
          const [pRes, hRes] = await Promise.all([
            fetch(`/api/profile?userId=${userId}`),
            fetch(`/api/history?userId=${userId}`),
          ]);

          if (pRes.ok) {
            const pJson = await pRes.json();
            if (pJson?.profile) {
              const prof = pJson.profile;
              setUserData((prev) => ({
                ...prev,
                age: prof.age !== undefined ? String(prof.age) : prev.age,
                weight:
                  prof.currentWeight !== undefined
                    ? String(prof.currentWeight)
                    : prev.weight,
                height:
                  prof.height !== undefined ? String(prof.height) : prev.height,
                city: prof.city ?? prev.city,
                gender: prof.biologicalSex ?? prev.gender,
                sportFrequency: prof.activityLevel ?? prev.sportFrequency,
                goal: prof.goalType ?? prev.goal,
              }));
            }
          }
          if (hRes.ok) {
            const hJson = await hRes.json();
            if (hJson?.entries) {
              const mapped = hJson.entries.map((e: any) => ({
                id: e._id ?? e.id,
                date: e.date,
                dateISO: e.dateISO,
                weight: String(e.weight ?? e.weight),
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

    // Load today's nutrition logs (per-date keys)
    try {
      const today = new Date().toISOString().slice(0, 10);
      const cal = localStorage.getItem(`calories_${today}`);
      const water = localStorage.getItem(`water_${today}`);
      if (cal) setConsumedCalories(Number(cal));
      if (water) setConsumedWater(Number(water));
    } catch (e) {
      // ignore
    }
  }, [status, session?.user?.id]);

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
    if (userData.goal === "lose") goal -= 300;
    if (userData.goal === "gain") goal += 300;
    setCaloriesGoal(goal);
  }, [bmr, userData.sportFrequency, userData.goal]);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`calories_${today}`, String(consumedCalories));
      localStorage.setItem(`water_${today}`, String(consumedWater));
    } catch (e) {}
  }, [consumedCalories, consumedWater]);

  // Check if goals are reached and show popup
  useEffect(() => {
    if (caloriesGoal && consumedCalories >= caloriesGoal && !caloriesGoalReached) {
      setCaloriesGoalReached(true);
      showToast("🎉 Gratulacje! Osiągnąłeś dzisiejszą normę kalorii!", "success");
    }
  }, [consumedCalories, caloriesGoal, caloriesGoalReached]);

  useEffect(() => {
    if (consumedWater >= waterGoal && !waterGoalReached) {
      setWaterGoalReached(true);
      showToast("💧 Świetnie! Osiągnąłeś dzisiejszą normę wody!", "success");
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

    if (userData.weight) {
      const dateISO = new Date().toISOString().slice(0, 10);
      const displayDate = new Date().toLocaleDateString();
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        date: displayDate,
        dateISO,
        weight: userData.weight,
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
                date: displayDate,
                weight: userData.weight,
              }),
            });
            if (res.ok) {
              const json = await res.json();
              // add server entry (id from server)
              const entry = {
                id: json.entry._id,
                date: json.entry.date,
                dateISO: json.entry.dateISO,
                weight: json.entry.weight,
              } as HistoryEntry;
              const normalized = normalizeHistory([...(history || []), entry]);
              setHistory(normalized);
              localStorage.setItem(
                "wellnessHistory",
                JSON.stringify(normalized)
              );
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
        const updatedHistory = normalizeHistory([...(history || []), newEntry]);
        setHistory(updatedHistory);
        localStorage.setItem("wellnessHistory", JSON.stringify(updatedHistory));
      }
    }

    showToast("Data saved successfully!", "success");
  };

  const addPreviousEntry = async () => {
    if (!prevDate || !prevWeight) return;
    const dateISO = new Date(prevDate).toISOString().slice(0, 10);
    const displayDate = new Date(dateISO).toLocaleDateString();
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
            date: displayDate,
            weight: Number(prevWeight),
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const entry = {
            id: json.entry._id,
            date: json.entry.date,
            dateISO: json.entry.dateISO,
            weight: json.entry.weight,
          } as HistoryEntry;
          const merged = allowPreviousData
            ? [entry, ...(history || [])]
            : [...(history || []), entry];
          const normalized = normalizeHistory(merged);
          setHistory(normalized);
          localStorage.setItem("wellnessHistory", JSON.stringify(normalized));
        }
      } catch (e) {
        console.error("Failed to persist previous entry", e);
      }
    } else {
      const merged = allowPreviousData
        ? [newEntry, ...(history || [])]
        : [...(history || []), newEntry];
      const updatedHistory = normalizeHistory(merged);
      setHistory(updatedHistory);
      localStorage.setItem("wellnessHistory", JSON.stringify(updatedHistory));
    }

    setPrevWeight("");
    setPrevDate(new Date().toISOString().slice(0, 10));
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
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
    { name: "Light snack", calories: 100, icon: "/icons/food/light-snack.png" },
    { name: "Fruit", calories: 80, icon: "/icons/food/fruit.png" },
    { name: "Sandwich", calories: 300, icon: "/icons/food/sandwich.png" },
    { name: "Salad", calories: 200, icon: "/icons/food/salad.png" },
    { name: "Pasta dish", calories: 450, icon: "/icons/food/pasta.png" },
    { name: "Pizza slice", calories: 285, icon: "/icons/food/pizza.png" },
    { name: "Burger", calories: 540, icon: "/icons/food/burger.png" },
    { name: "Rice with chicken", calories: 500, icon: "/icons/food/rice-chicken.png" },
    { name: "Full breakfast", calories: 400, icon: "/icons/food/breakfast.png" },
    { name: "Protein shake", calories: 150, icon: "/icons/food/protein-shake.png" },
    { name: "Energy bar", calories: 200, icon: "/icons/food/energy-bar.png" },
    { name: "Ice cream", calories: 250, icon: "/icons/food/ice-cream.png" },
  ];

  // Quick add options for water
  const waterOptions = [
    { name: "Glass of water", ml: 250, icon: "/icons/drinks/cup.png" },
    { name: "Small bottle", ml: 500, icon: "/icons/drinks/bottle.png" },
    { name: "Large bottle", ml: 1500, icon: "/icons/drinks/water.png" },
    { name: "Cup of tea/coffee", ml: 250, icon: "/icons/drinks/coffee.png" },
    { name: "Mug of coffee/tea", ml: 300, icon: "/icons/drinks/coffee-shop.png" },
    { name: "Isotonic drink", ml: 500, icon: "/icons/drinks/isotonic.png" },
    { name: "Can of soda", ml: 330, icon: "/icons/drinks/soda-can.png" },
  ];

  return (
    <main className="min-h-screen p-8 transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Wellness Dashboard</h1>
          <p className="text-lg opacity-75">
            Track your health and fitness journey
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 justify-center">
          {["dashboard", "history", "nutrition", "settings"].map((t) => (
            <Button
              key={t}
              variant={tab === t ? "default" : "outline"}
              onClick={() => setTab(t as any)}
              className="px-6 py-2"
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

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
                    {userData.goal
                      ? userData.goal === "gain"
                        ? "Gain Weight"
                        : userData.goal === "lose"
                        ? "Lose Weight"
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
                          <YAxis />
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

                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="kcal"
                    value={calInput}
                    onChange={(e) => setCalInput(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      const v = Number(calInput);
                      if (!isNaN(v) && v > 0) {
                        setConsumedCalories((c) => c + v);
                        setCalInput("");
                      }
                    }}
                  >
                    Add
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
                    onClick={() => setConsumedCalories(0)}
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

                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="ml"
                    value={waterInput}
                    onChange={(e) => setWaterInput(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      const v = Number(waterInput);
                      if (!isNaN(v) && v > 0) {
                        setConsumedWater((w) => w + v);
                        setWaterInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowWaterModal(true)}
                    className="px-3"
                  >
                    <GlassWater className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setConsumedWater(0)}>
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
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        entryId: entry.id,
                                        dateISO,
                                        date: displayDate,
                                        weight: Number(editWeight),
                                      }),
                                    });
                                    if (res.ok) {
                                      const json = await res.json();
                                      const updated = {
                                        id: json.entry._id,
                                        date: json.entry.date,
                                        dateISO: json.entry.dateISO,
                                        weight: json.entry.weight,
                                      } as HistoryEntry;
                                      const merged = history.map((h) =>
                                        h.id === entry.id ? updated : h
                                      );
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

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="max-w-2xl mx-auto">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Personal Data</CardTitle>
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
                  <Label htmlFor="goal">Goal</Label>
                  <Select
                    id="goal"
                    value={userData.goal}
                    onChange={(e) => handleInputChange("goal", e.target.value)}
                    style={{
                      colorScheme: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "dark"
                        : "light",
                    }}
                  >
                    <option value="">Select your goal</option>
                    <option value="gain">Gain weight</option>
                    <option value="lose">Lose weight</option>
                    <option value="maintain">Maintain weight</option>
                  </Select>
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

                {/* Previous-data setting */}
                <div className="mt-6 p-4 border rounded bg-transparent dark:bg-input/30 border-input">
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
          </div>
        )}
      </div>

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

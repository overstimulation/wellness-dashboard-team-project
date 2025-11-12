"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
}

export default function DashboardPage() {
  const [tab, setTab] = useState<"dashboard" | "history" | "settings">("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    weight: "",
    height: "",
    age: "",
    city: "",
    gender: "",
    goal: "",
    sportFrequency: ""
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);

  // Ładowanie danych z localStorage przy starcie
  useEffect(() => {
    const savedData = localStorage.getItem("wellnessUserData");
    const savedHistory = localStorage.getItem("wellnessHistory");
    const savedDarkMode = localStorage.getItem("wellnessDarkMode");
    
    if (savedData) {
      setUserData(JSON.parse(savedData));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
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

  const handleSave = () => {
    localStorage.setItem("wellnessUserData", JSON.stringify(userData));
    
    // Dodaj aktualną wagę do historii jeśli się zmieniła
    if (userData.weight) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        weight: userData.weight
      };
      
      const updatedHistory = [newEntry, ...history.slice(0, 9)]; // Keep last 10 entries
      setHistory(updatedHistory);
      localStorage.setItem("wellnessHistory", JSON.stringify(updatedHistory));
    }
    
    alert("Data saved successfully!");
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("wellnessDarkMode", JSON.stringify(newDarkMode));
  };

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity";
  };

  return (
    <main className={`min-h-screen p-8 transition-colors duration-300 ${
      darkMode 
        ? "bg-gray-900 text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Wellness Dashboard</h1>
          <p className="text-lg opacity-75">Track your health and fitness journey</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 justify-center">
          {["dashboard", "history", "settings"].map((t) => (
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
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Weight</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      {userData.weight || "–"} kg
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Height</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      {userData.height || "–"} cm
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Age</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      {userData.age || "–"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Gender</p>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      {userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : "–"}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="font-semibold">Goal</p>
                  <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    {userData.goal ? 
                      userData.goal === "gain" ? "Gain Weight" :
                      userData.goal === "lose" ? "Lose Weight" : "Maintain Weight"
                      : "–"
                    }
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold">Sport Frequency</p>
                  <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    {userData.sportFrequency ? 
                      userData.sportFrequency === "daily" ? "Daily" :
                      userData.sportFrequency === "few" ? "Few times a week" : "Rarely"
                      : "–"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Health Metrics */}
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bmi && (
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-2xl font-bold">{bmi}</p>
                    <p className="text-sm opacity-75">BMI</p>
                    <p className="text-xs mt-1">{getBmiCategory(bmi)}</p>
                  </div>
                )}
                
                {bmr && (
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-2xl font-bold">{bmr} kcal</p>
                    <p className="text-sm opacity-75">Basal Metabolic Rate</p>
                    <p className="text-xs mt-1">Calories burned at rest</p>
                  </div>
                )}
                
                {(!bmi && !bmr) && (
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                    Complete your personal data to see health metrics
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent History */}
            <Card className={`md:col-span-2 ${darkMode ? "bg-gray-800 border-gray-700" : ""}`}>
              <CardHeader>
                <CardTitle>Recent Weight History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                        <span>{entry.date}</span>
                        <span className="font-semibold">{entry.weight} kg</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                    No weight history yet. Save your data to start tracking.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center p-3 rounded-lg border dark:border-gray-700">
                      <div>
                        <p className="font-semibold">{entry.date}</p>
                        {entry.notes && (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <p className="text-xl font-bold">{entry.weight} kg</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                    No history entries yet.
                  </p>
                  <p className={`text-sm mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Your weight entries will appear here after you save your data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="max-w-2xl mx-auto">
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
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
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      type="number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      placeholder="e.g., 175"
                      value={userData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
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
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={userData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full border rounded p-2 bg-background"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Goal</Label>
                  <select
                    id="goal"
                    value={userData.goal}
                    onChange={(e) => handleInputChange("goal", e.target.value)}
                    className="w-full border rounded p-2 bg-background"
                  >
                    <option value="">Select your goal</option>
                    <option value="gain">Gain weight</option>
                    <option value="lose">Lose weight</option>
                    <option value="maintain">Maintain weight</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sportFrequency">Sport Frequency</Label>
                  <select
                    id="sportFrequency"
                    value={userData.sportFrequency}
                    onChange={(e) => handleInputChange("sportFrequency", e.target.value)}
                    className="w-full border rounded p-2 bg-background"
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="few">Few times a week</option>
                    <option value="rare">Rarely</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Toggle dark theme
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>

                <Button className="w-full" onClick={handleSave} size="lg">
                  Save All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
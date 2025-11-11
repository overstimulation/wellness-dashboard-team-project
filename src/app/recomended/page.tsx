"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RecommendationsProps {
  weight: number;
  goal: string;
  city: string;
}

export default function RecommendationsPage({
  weight = 70,
  goal = "maintain",
  city = "Your city",
}: RecommendationsProps) {
  const [water, setWater] = useState(0);
  const [calories, setCalories] = useState(0);
  const [customWater, setCustomWater] = useState("");
  const [customCalories, setCustomCalories] = useState("");

  // trza to jakos wyciagnac, nie tykam backandu here
  const recommendedWater = weight * 35;
  const recommendedCalories = goal === "gain" ? 2500 : goal === "lose" ? 1800 : 2000;

  const addWater = (amount: number) => setWater((prev) => prev + amount);
  const addCalories = (amount: number) => setCalories((prev) => prev + amount);

  const addCustomWater = () => {
    const val = parseInt(customWater);
    if (!isNaN(val)) setWater((prev) => prev + val);
    setCustomWater("");
  };

  const addCustomCalories = () => {
    const val = parseInt(customCalories);
    if (!isNaN(val)) setCalories((prev) => prev + val);
    setCustomCalories("");
  };

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Today's Recommendations</h1>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Recommended Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Recommended water intake: {recommendedWater} ml</p>
          <p>Recommended calories: {recommendedCalories} kcal</p>
          <p>Current temperature in {city}: 22°C (placeholder)</p>

          {/* Water buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[250, 500].map((val) => (
              <Button key={val} onClick={() => addWater(val)}>
                +{val} ml
              </Button>
            ))}
            <Input
              placeholder="Custom ml"
              value={customWater}
              onChange={(e) => setCustomWater(e.target.value)}
              className="w-24"
            />
            <Button onClick={addCustomWater}>Add</Button>
          </div>
          <p>Total water drank: {water} ml</p>

          {/* Calories buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[250, 500, 1000, 2500].map((val) => (
              <Button key={val} onClick={() => addCalories(val)}>
                +{val} kcal
              </Button>
            ))}
            <Input
              placeholder="Custom kcal"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              className="w-24"
            />
            <Button onClick={addCustomCalories}>Add</Button>
          </div>
          <p>Total calories consumed: {calories} kcal</p>
        </CardContent>
      </Card>
    </main>
  );
}

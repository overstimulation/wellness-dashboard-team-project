import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import DailyLog from "@/models/DailyLog";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    await connectDB();

    try {
        const DEMO_EMAIL = "demo@wellness.com";
        const DEMO_PASS = "demo123";

        // 1. Cleanup existing demo user
        const existingUser = await User.findOne({ email: DEMO_EMAIL });
        if (existingUser) {
            // Delete logs
            await DailyLog.deleteMany({ user: existingUser._id });
            // Delete profile
            await UserProfile.deleteMany({ user: existingUser._id });
            // Delete user
            await User.deleteOne({ _id: existingUser._id });
        }

        // 2. Create User
        const hashedPassword = await bcrypt.hash(DEMO_PASS, 10);
        const user = new User({
            name: "Demo User",
            email: DEMO_EMAIL,
            password: hashedPassword,
            streak: 15, // Artificial streak
            lastLogDate: new Date().toISOString().slice(0, 10),
        });
        await user.save();

        // 3. Create Profile
        const profile = new UserProfile({
            user: user._id,
            age: 28,
            initialWeight: 85,
            currentWeight: 78,
            height: 180,
            biologicalSex: 'male',
            city: 'Demo City',
            activityLevel: 'moderate',
            weightGoal: 75,
            targetWeight: 75, // New field
            goalType: 'lose',
            hasCompletedOnboarding: true,
        });
        await profile.save();

        user.profile = profile._id;
        await user.save();

        // 4. Generate History (30 days)
        const logs = [];
        const today = new Date();

        // Starting weight 30 days ago
        let currentSimWeight = 85;

        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);

            // Simulate weight loss curve (some fluctuations)
            const change = (Math.random() * 0.4) - 0.3; // Trend down slightly on average
            currentSimWeight += change;

            // BMR for 85kg/180cm/28yo Male is approx 1850.
            // With activity "moderate" (1.55x), TDEE is ~2800 kcal.
            // Goal "lose" (-300) -> Target ~2500 kcal.

            // To guarantee streak, we must hit the calculated goal.
            // Let's assume the dashboard logic uses BMR * multiplier + goal_offset.
            // safe limit: > 2500 kcal and > 2000 ml water.

            let cals = 0;
            let water = 0;

            // Goals are calculated clientside but persisted. 
            // We want to make sure 'calories' >= 'goal' logic passes.
            // Let's ensure > 3000 to be safe for any reasonable BMR.
            if (i < 15) {
                // Last 15 days: consistent (streak)
                // Hitting widely safe targets
                cals = 3200;
                water = 3000;
            } else {
                // Older days: random, possibly missing
                cals = 1500 + Math.floor(Math.random() * 1000); // 1500-2500
                water = 1000 + Math.floor(Math.random() * 1200);
            }

            logs.push({
                user: user._id,
                date: dateStr,
                weight: Number(currentSimWeight.toFixed(1)),
                calories: cals,
                water: water,
                mood: 'happy',
                sleep: 7 + Math.floor(Math.random() * 2),
            });
        }

        // Bulk insert logs
        await DailyLog.insertMany(logs);

        return NextResponse.json({
            message: "Demo account seeded",
            email: DEMO_EMAIL,
            password: DEMO_PASS,
            streak: user.streak
        });

    } catch (error) {
        console.error("SEED_ERROR", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

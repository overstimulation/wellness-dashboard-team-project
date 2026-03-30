import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import DailyLog from "@/models/DailyLog";
import MoodLog from "@/models/MoodLog";
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
            await MoodLog.deleteMany({ user: existingUser._id });
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
            city: 'Warsaw',
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
        const moodLogs = [];
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
                sleep: 7 + Math.floor(Math.random() * 2),
            });

            // Generate Mood Logs for this day (1-3 entries)
            const numMoods = Math.floor(Math.random() * 3) + 1; // 1 to 3
            const possibleMoods = ['sad', 'neutral', 'happy'];
            const notesHappy = ["Feeling great today!", "Had a nice walk.", "Very productive at work.", "Relaxing evening.", "Life is good!"];
            const notesNeutral = ["Just a regular day.", "Nothing special happened.", "Tired but okay.", "A bit bored.", "Got some chores done."];
            const notesSad = ["Feeling a bit down.", "Stressed from work.", "Didn't sleep well.", "Rough day.", "Just want this week to end."];

            for (let j = 0; j < numMoods; j++) {
                // Determine a time for the log
                const moodD = new Date(d);
                if (j === 0) moodD.setHours(8 + Math.floor(Math.random() * 3)); // Morning
                else if (j === 1) moodD.setHours(13 + Math.floor(Math.random() * 4)); // Afternoon
                else moodD.setHours(19 + Math.floor(Math.random() * 4)); // Evening

                // Weight probability (happier if streak is good)
                let moodSelection;
                if (i < 15) {
                    // last 15 days (streak) - more happy
                    moodSelection = Math.random() < 0.7 ? 'happy' : (Math.random() < 0.5 ? 'neutral' : 'sad');
                } else {
                    // older days - neutral/sad lean
                    moodSelection = possibleMoods[Math.floor(Math.random() * possibleMoods.length)];
                }

                let note = "";
                if (moodSelection === 'happy') note = notesHappy[Math.floor(Math.random() * notesHappy.length)];
                if (moodSelection === 'neutral') note = notesNeutral[Math.floor(Math.random() * notesNeutral.length)];
                if (moodSelection === 'sad') note = notesSad[Math.floor(Math.random() * notesSad.length)];

                moodLogs.push({
                    user: user._id,
                    dateISO: dateStr,
                    mood: moodSelection,
                    notes: note,
                    createdAt: moodD,
                    updatedAt: moodD,
                });
            }
        }

        // Bulk insert logs
        await DailyLog.insertMany(logs);
        await MoodLog.insertMany(moodLogs);

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

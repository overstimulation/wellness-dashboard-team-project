import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MoodLog from "@/models/MoodLog";
import User from "@/models/User";

export async function GET(req: Request) {
  await connectDB();

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { message: "userId query param required" },
        { status: 400 }
      );
    }

    const entries = await MoodLog.find({ user: userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error("MOOD_GET_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await connectDB();

  try {
    const { userId, dateISO, mood, notes } = await req.json();
    if (!userId || !dateISO || !mood) {
      return NextResponse.json(
        { message: "userId, dateISO and mood are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Insert new entry (not upsert, because we allow multiple entries)
    const entry = new MoodLog({
      user: userId,
      dateISO,
      mood,
      notes,
    });

    await entry.save();

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("MOOD_POST_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

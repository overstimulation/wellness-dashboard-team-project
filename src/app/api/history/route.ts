import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import DailyLog from "@/models/DailyLog";
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

    const entries = await DailyLog.find({ user: userId }).sort({
      date: -1,
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error("HISTORY_GET_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await connectDB();

  try {
    const { userId, dateISO, date, weight, calories, water, caloriesGoal, waterGoal } = await req.json();
    if (!userId || !dateISO || !date) {
      return NextResponse.json(
        { message: "userId, dateISO and date are required" },
        { status: 400 }
      );
    }

    // UPSERT: Find by user and date, update if exists, insert if not.
    // We update fields if they are provided. This allows partial updates if needed.
    const updateData: any = { date };
    if (weight) updateData.weight = weight;
    if (calories !== undefined) updateData.calories = calories;
    if (water !== undefined) updateData.water = water;

    const entry = await DailyLog.findOneAndUpdate(
      { user: userId, date: dateISO }, // Search by ISO date (YYYY-MM-DD)
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // STREAK LOGIC
    // Check if goals are met
    if (
      calories !== undefined &&
      water !== undefined &&
      caloriesGoal &&
      waterGoal
    ) {
      const isCalorieGoalMet = calories >= caloriesGoal;
      const isWaterGoalMet = water >= waterGoal;

      if (isCalorieGoalMet && isWaterGoalMet) {
        const user = await User.findById(userId);
        if (user) {
          const today = dateISO; // The date being logged (YYYY-MM-DD)
          const lastLogDate = user.lastLogDate;

          // Calculate yesterday relative to the logged date, not server time
          const logDateObj = new Date(today + "T00:00:00Z");
          const yesterdayObj = new Date(logDateObj);
          yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
          const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);

          // We only increase streak if this date hasn't been counted yet
          if (lastLogDate !== today) {
            if (lastLogDate === yesterdayStr) {
              // Consecutive day - increment streak
              user.streak = (user.streak || 0) + 1;
            } else if (!lastLogDate) {
              // First log ever - start streak at 1
              user.streak = 1;
            } else {
              // Check if lastLogDate is before yesterday (gap in streak)
              const lastLogObj = new Date(lastLogDate + "T00:00:00Z");
              if (lastLogObj < yesterdayObj) {
                // Missed a day - reset streak to 1
                user.streak = 1;
              }
              // If lastLogDate is after yesterday (logging for past date), don't change streak
            }

            user.lastLogDate = today;
            await user.save();
          }
        }
      }
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("HISTORY_POST_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  // Deprecated or forwarded to POST (Upsert)
  // Return method not allowed or implement similar update logic
  return NextResponse.json({ message: "Use POST for upsert" }, { status: 405 });
}

export async function DELETE(req: Request) {
  await connectDB();

  try {
    const { entryId } = await req.json();
    if (!entryId) {
      return NextResponse.json(
        { message: "entryId required" },
        { status: 400 }
      );
    }

    const deleted = await DailyLog.findByIdAndDelete(entryId);
    if (!deleted) {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Deleted", entry: deleted },
      { status: 200 }
    );
  } catch (error) {
    console.error("HISTORY_DELETE_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

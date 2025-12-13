import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import DailyLog from "@/models/DailyLog";
import WeightEntry from "@/models/WeightEntry";

export async function DELETE(req: Request) {
    await connectDB();

    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { message: "UserId is required" },
                { status: 400 }
            );
        }

        // Delete user and all related data
        await User.findByIdAndDelete(userId);
        await UserProfile.findOneAndDelete({ user: userId });
        await DailyLog.deleteMany({ user: userId });
        await WeightEntry.deleteMany({ user: userId });

        return NextResponse.json(
            { message: "Account deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE_ACCOUNT_ERROR", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";

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

    const user = await User.findById(userId).populate("profile");
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json(
      {
        profile: user.profile || null,
        user: { id: user._id, email: user.email, name: user.name, streak: user.streak },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PROFILE_GET_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await connectDB();

  try {
    const { userId, userData } = await req.json();
    if (!userId || !userData) {
      return NextResponse.json(
        { message: "userId and userData required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    let profile = null;
    if (user.profile) {
      profile = await UserProfile.findById(user.profile);
      if (profile) {
        Object.assign(profile, userData);
        await profile.save();
      }
    }

    if (!profile) {
      profile = new UserProfile({ user: user._id, ...userData });
      await profile.save();
      user.profile = profile._id;
      await user.save();
    }

    return NextResponse.json(
      { message: "Profile saved", profile },
      { status: 200 }
    );
  } catch (error) {
    console.error("PROFILE_POST_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

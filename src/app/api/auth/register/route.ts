import { NextResponse } from "next/server";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { message: "Email, name, and password are required." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserProfile = new UserProfile({
      // user will be set later
    });

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      profile: newUserProfile._id,
    });
    
    newUserProfile.user = newUser._id;

    await newUser.save();
    await newUserProfile.save();

    return NextResponse.json(
      { message: "User created successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

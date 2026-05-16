import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EisenhowerTask from "@/models/EisenhowerTask";
import User from "@/models/User";

// GET all tasks for a user
export async function GET(req: Request) {
  await connectDB();
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    const tasks = await EisenhowerTask.find({ user: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("EISENHOWER_GET_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST a new task
export async function POST(req: Request) {
  await connectDB();
  try {
    const { userId, title, quadrant } = await req.json();
    
    if (!userId || !title || !quadrant) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const task = new EisenhowerTask({
      user: userId,
      title,
      quadrant,
      isCompleted: false,
    });

    await task.save();
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("EISENHOWER_POST_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT to update a task (quadrant, title, or completion status)
export async function PUT(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const { taskId, ...updates } = body;
    
    if (!taskId) {
      return NextResponse.json({ message: "taskId required" }, { status: 400 });
    }

    const task = await EisenhowerTask.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error("EISENHOWER_PUT_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(req: Request) {
  await connectDB();
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    
    if (!taskId) {
      return NextResponse.json({ message: "taskId required" }, { status: 400 });
    }

    await EisenhowerTask.findByIdAndDelete(taskId);
    return NextResponse.json({ message: "Task deleted" }, { status: 200 });
  } catch (error) {
    console.error("EISENHOWER_DELETE_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

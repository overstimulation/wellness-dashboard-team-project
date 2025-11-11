import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WeightEntry from "@/models/WeightEntry";

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

    const entries = await WeightEntry.find({ user: userId }).sort({
      dateISO: -1,
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
    const { userId, dateISO, date, weight, notes } = await req.json();
    if (!userId || !dateISO || !date || !weight) {
      return NextResponse.json(
        { message: "userId, dateISO, date and weight required" },
        { status: 400 }
      );
    }

    const newEntry = new WeightEntry({
      user: userId,
      dateISO,
      date,
      weight,
      notes,
    });

    await newEntry.save();

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error("HISTORY_POST_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  await connectDB();

  try {
    const { entryId, dateISO, date, weight, notes } = await req.json();
    if (!entryId || !dateISO || !date || !weight) {
      return NextResponse.json(
        { message: "entryId, dateISO, date and weight required" },
        { status: 400 }
      );
    }

    const updated = await WeightEntry.findByIdAndUpdate(
      entryId,
      { dateISO, date, weight, notes },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry: updated }, { status: 200 });
  } catch (error) {
    console.error("HISTORY_PUT_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
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

    const deleted = await WeightEntry.findByIdAndDelete(entryId);
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

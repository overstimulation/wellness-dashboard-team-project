import mongoose, { Schema, models, Document, Model } from 'mongoose';

export interface IDailyLog extends Document {
    user: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    weight?: number;
    calories?: number;
    water?: number; // ml
    mood?: string;
    sleep?: number; // hours
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DailyLogSchema: Schema<IDailyLog> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        weight: Number,
        calories: Number,
        water: Number,
        mood: String,
        sleep: Number,
        notes: String,
    },
    {
        timestamps: true,
    }
);

// Ensure one log per user per day
DailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyLog: Model<IDailyLog> =
    models.DailyLog || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

export default DailyLog;

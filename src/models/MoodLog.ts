import mongoose, { Schema, models, Document, Model } from 'mongoose';

export interface IMoodLog extends Document {
    user: mongoose.Types.ObjectId;
    dateISO: string; // YYYY-MM-DD
    mood: 'sad' | 'neutral' | 'happy'; // The elected mood
    notes?: string; // Optional user reflection
    createdAt: Date;
    updatedAt: Date;
}

const MoodLogSchema: Schema<IMoodLog> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        dateISO: {
            type: String,
            required: true, // Used for quick day-based grouping without doing Date math in DB
        },
        mood: {
            type: String,
            enum: ['sad', 'neutral', 'happy'],
            required: true,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficiently querying a user's logs, sorted by creation date
MoodLogSchema.index({ user: 1, createdAt: -1 });
MoodLogSchema.index({ user: 1, dateISO: -1 });

const MoodLog: Model<IMoodLog> =
    models.MoodLog || mongoose.model<IMoodLog>('MoodLog', MoodLogSchema);

export default MoodLog;

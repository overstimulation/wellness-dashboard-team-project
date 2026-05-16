import mongoose, { Schema, models, Document, Model } from 'mongoose';

export interface IEisenhowerTask extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    quadrant: 'q1' | 'q2' | 'q3' | 'q4'; // q1: Urgent & Important, q2: Not Urgent & Important, etc.
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EisenhowerTaskSchema: Schema<IEisenhowerTask> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        quadrant: {
            type: String,
            enum: ['q1', 'q2', 'q3', 'q4'],
            required: true,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficiently querying a user's tasks
EisenhowerTaskSchema.index({ user: 1 });

const EisenhowerTask: Model<IEisenhowerTask> =
    models.EisenhowerTask || mongoose.model<IEisenhowerTask>('EisenhowerTask', EisenhowerTaskSchema);

export default EisenhowerTask;

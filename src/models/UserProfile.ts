import mongoose, { Schema, models, Document, Model } from 'mongoose';

export interface IUserProfile extends Document {
  user: mongoose.Types.ObjectId;
  age: number;
  initialWeight: number;
  currentWeight: number;
  height: number;
  biologicalSex: 'male' | 'female';
  city: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weightGoal: number;
  goalType: 'lose' | 'maintain' | 'gain';
  hasCompletedOnboarding: boolean;
}

const UserProfileSchema: Schema<IUserProfile> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  age: {
    type: Number,
  },
  initialWeight: {
    type: Number,
  },
  currentWeight: {
    type: Number,
  },
  height: {
    type: Number,
  },
  biologicalSex: {
    type: String,
    enum: ['male', 'female'],
  },
  city: {
    type: String,
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
  },
  weightGoal: {
    type: Number,
  },
  goalType: {
    type: String,
    enum: ['lose', 'maintain', 'gain'],
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false,
  },
});

const UserProfile: Model<IUserProfile> =
  models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;

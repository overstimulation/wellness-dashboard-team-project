import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address.'],
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    select: false, // By default, don't return the password
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastLogDate: {
    type: String, // YYYY-MM-DD
  },
});

// Force model recompilation in dev to pick up schema changes
if (process.env.NODE_ENV === 'development') {
  delete models.User;
}
const User = models.User || model('User', UserSchema);

export default User;

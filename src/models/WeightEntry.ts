import mongoose, { Schema, models, Model, Document } from "mongoose";

export interface IWeightEntry extends Document {
  user: mongoose.Types.ObjectId;
  dateISO: string;
  date: string;
  weight: string;
  notes?: string;
}

const WeightEntrySchema: Schema<IWeightEntry> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dateISO: { type: String, required: true },
  date: { type: String, required: true },
  weight: { type: String, required: true },
  notes: { type: String },
});

const WeightEntry: Model<IWeightEntry> =
  models.WeightEntry ||
  mongoose.model<IWeightEntry>("WeightEntry", WeightEntrySchema);

export default WeightEntry;

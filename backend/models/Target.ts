import mongoose, { Schema, Document } from 'mongoose';

export interface ITarget extends Document {
  name: string;
  url: string;
  owner: mongoose.Types.ObjectId | string;
  authorizationConfirmed: boolean;
  createdAt: Date;
}

const TargetSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Target identifier/name is required'],
      trim: true
    },
    url: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true
    },
    owner: {
      type: Schema.Types.Mixed,
      required: true
    },
    authorizationConfirmed: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Target: mongoose.Model<ITarget> =
  (mongoose.models.Target as mongoose.Model<ITarget>) || mongoose.model<ITarget>('Target', TargetSchema);
export default Target;

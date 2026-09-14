import mongoose, { Schema, Document } from 'mongoose';

export interface IFinding extends Document {
  scanId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  targetId?: mongoose.Types.ObjectId | string;
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  category: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  recommendation: string;
  urlTested: string;
  status: 'Open' | 'Mitigated' | 'False Positive';
  createdAt: Date;
}

const FindingSchema: Schema = new Schema(
  {
    scanId: {
      type: Schema.Types.Mixed,
      required: true
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true
    },
    targetId: {
      type: Schema.Types.Mixed
    },
    name: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
      default: 'Low'
    },
    category: {
      type: String,
      default: 'General'
    },
    confidence: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'High'
    },
    description: {
      type: String,
      required: true
    },
    evidence: {
      type: String,
      default: ''
    },
    recommendation: {
      type: String,
      default: ''
    },
    urlTested: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Open', 'Mitigated', 'False Positive'],
      default: 'Open'
    }
  },
  {
    timestamps: true
  }
);

export const Finding: mongoose.Model<IFinding> =
  (mongoose.models.Finding as mongoose.Model<IFinding>) || mongoose.model<IFinding>('Finding', FindingSchema);
export default Finding;

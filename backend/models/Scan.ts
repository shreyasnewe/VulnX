import mongoose, { Schema, Document } from 'mongoose';

export interface IScan extends Document {
  targetId: mongoose.Types.ObjectId | string;
  targetUrl: string;
  targetName?: string;
  userId: mongoose.Types.ObjectId | string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  startedAt: Date;
  completedAt?: Date;
  securityScore: number;
  totalFindings: number;
  severityDistribution: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
    Informational: number;
  };
  checksExecuted?: Array<{ name: string; status: string; error?: string }>;
  createdAt: Date;
}

const ScanSchema: Schema = new Schema(
  {
    targetId: {
      type: Schema.Types.Mixed,
      required: true
    },
    targetUrl: {
      type: String,
      required: true
    },
    targetName: {
      type: String,
      default: ''
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Running', 'Completed', 'Failed'],
      default: 'Pending'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    securityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    totalFindings: {
      type: Number,
      default: 0
    },
    severityDistribution: {
      Critical: { type: Number, default: 0 },
      High: { type: Number, default: 0 },
      Medium: { type: Number, default: 0 },
      Low: { type: Number, default: 0 },
      Informational: { type: Number, default: 0 }
    },
    checksExecuted: {
      type: Array,
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Scan: mongoose.Model<IScan> =
  (mongoose.models.Scan as mongoose.Model<IScan>) || mongoose.model<IScan>('Scan', ScanSchema);
export default Scan;

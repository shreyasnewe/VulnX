import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  scanId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  filePath: string;
  targetName?: string;
  generatedAt: Date;
  summary?: {
    securityScore: number;
    totalFindings: number;
    targetUrl: string;
  };
}

const ReportSchema: Schema = new Schema(
  {
    scanId: {
      type: Schema.Types.Mixed,
      required: true
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true
    },
    filePath: {
      type: String,
      default: ''
    },
    targetName: {
      type: String
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    summary: {
      securityScore: Number,
      totalFindings: Number,
      targetUrl: String
    }
  },
  {
    timestamps: true
  }
);

export const Report: mongoose.Model<IReport> =
  (mongoose.models.Report as mongoose.Model<IReport>) || mongoose.model<IReport>('Report', ReportSchema);
export default Report;

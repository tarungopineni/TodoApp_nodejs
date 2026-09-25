import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DailyTaskCompletionDocument = DailyTaskCompletion & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      if (ret.dailyTaskId) {
        ret.dailyTaskId = ret.dailyTaskId.toString();
      }
      if (ret.userId) {
        ret.userId = ret.userId.toString();
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class DailyTaskCompletion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'DailyTask', required: true })
  dailyTaskId: MongooseSchema.Types.ObjectId | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD in IST

  @Prop({ required: true, default: false })
  completed: boolean;

  @Prop({ default: null })
  completedAt: Date;
}

export const DailyTaskCompletionSchema = SchemaFactory.createForClass(DailyTaskCompletion);

// Compound unique index ensuring only one record per dailyTaskId + date
DailyTaskCompletionSchema.index({ dailyTaskId: 1, date: 1 }, { unique: true });
DailyTaskCompletionSchema.index({ userId: 1, date: 1 });

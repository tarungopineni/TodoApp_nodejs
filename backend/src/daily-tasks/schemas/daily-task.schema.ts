import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DailyTaskDocument = DailyTask & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      if (ret.owner_id) {
        ret.owner_id = ret.owner_id.toString();
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class DailyTask {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, default: 3 })
  priority: number;

  @Prop({ required: true, default: false })
  complete: boolean;

  @Prop({ required: true })
  creationDate: string; // YYYY-MM-DD in IST when created

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner_id: MongooseSchema.Types.ObjectId | string;
}

export const DailyTaskSchema = SchemaFactory.createForClass(DailyTask);

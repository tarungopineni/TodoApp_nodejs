import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  first_name: string;

  @Prop({ required: true, trim: true })
  last_name: string;

  @Prop({ default: 'dev' })
  role: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: null })
  phonenumber: string;

  @Prop({ default: null })
  lastDailyTaskSyncDate: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

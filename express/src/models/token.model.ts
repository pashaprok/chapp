import mongoose from 'mongoose';
import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { User } from './user.model';

export class Token {
  @prop()
  public _id: mongoose.Types.ObjectId;

  @prop({
    required: true,
    ref: () => User,
    type: () => mongoose.Types.ObjectId,
  })
  public user: Ref<User, mongoose.Types.ObjectId>;

  @prop({ required: true })
  public refresh: string;
}

export default getModelForClass(Token);

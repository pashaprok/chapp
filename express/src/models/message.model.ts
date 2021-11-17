import mongoose from 'mongoose';
import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { User } from './user.model';
import { Chat } from './chat.model';

export class Message {
  @prop()
  public _id: mongoose.Types.ObjectId;

  @prop({
    required: true,
    ref: () => User,
    type: () => mongoose.Types.ObjectId,
  })
  public author: Ref<User, mongoose.Types.ObjectId>;

  @prop({ required: true, ref: 'Chat', type: () => String })
  public chat: Ref<Chat, string>;

  @prop({ required: true })
  public txt: string;

  @prop({ required: true })
  public msgDate: Date;
}

export default getModelForClass(Message);

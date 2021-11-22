import mongoose from 'mongoose';
import { getModelForClass, prop /* Ref */ } from '@typegoose/typegoose';
import { User } from './user.model';
// import { Message } from './message.model';

export class Chat {
  @prop()
  public _id: string;

  // @prop({
  //   ref: () => Message,
  //   type: () => mongoose.Types.ObjectId,
  //   foreignField: 'chat',
  //   localField: '_id',
  // })
  // public messages: Ref<Message, mongoose.Types.ObjectId>[];

  @prop({
    required: true,
    ref: () => User,
    type: () => mongoose.Types.ObjectId,
  })
  public usersIn: string[];
}

export default getModelForClass(Chat);

import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { User } from './user.model';
import { Message } from './message.model';

export class Chat {
  @prop()
  public _id: string;

  @prop({
    ref: () => Message,
    type: () => String,
    foreignField: 'chat',
    localField: '_id',
  })
  public messages: Ref<Message, string>[];

  @prop({ required: true, ref: () => User, type: () => String })
  public usersIn: Ref<User, string>[];
}

export default getModelForClass(Chat);

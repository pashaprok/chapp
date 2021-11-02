import { prop, getModelForClass } from '@typegoose/typegoose';

export class User {
  @prop()
  public _id: string;

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public email: string;

  @prop({ required: true })
  public password: string;

  @prop({ default: Date.now() })
  public registeredAt: Date;
}

export default getModelForClass(User);

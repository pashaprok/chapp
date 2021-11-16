import { prop, getModelForClass } from '@typegoose/typegoose';
import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { strongPasswordRegExp } from '../constants/regex';
import { v4 as uuidv4 } from 'uuid';

export class User {
  @prop({ default: uuidv4() })
  public _id: string;

  @prop({ required: true })
  @IsNotEmpty({ message: 'Can not be empty!' })
  public name: string;

  @prop({ required: true })
  @IsNotEmpty({ message: 'Can not be empty!' })
  @IsEmail({}, { message: 'Invalid email!' })
  @Transform(({ value }) => value.toLowerCase())
  public email: string;

  @prop({ required: true })
  @IsNotEmpty({ message: 'Can not be empty!' })
  @Length(8, 50, { message: 'Must be greater than 8 chars and less 50' })
  @Matches(strongPasswordRegExp, {
    message: 'Password must contain digits, lowercase and uppercase',
  })
  public password: string;

  @prop({ default: Date.now() })
  public registeredAt: Date;
}

export default getModelForClass(User);

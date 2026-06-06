/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class loginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Length(1, 100)
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  password!: string;
}

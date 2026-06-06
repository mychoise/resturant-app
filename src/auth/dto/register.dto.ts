/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsEmail, IsNotEmpty, Length, IsIn } from 'class-validator';

export enum Role {
  WAITER = 'waiter',
  KITCHEN = 'kitchen',
  ADMIN = 'admin',
}

export class registerDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Length(1, 100)
  email!: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  password!: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @IsIn([Role.WAITER, Role.KITCHEN, Role.ADMIN])
  role!: Role;
}

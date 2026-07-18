import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class getAllUserDto {
  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsString()
  @IsOptional()
  category?: 'kitchen' | 'waiter' | 'admin';
}

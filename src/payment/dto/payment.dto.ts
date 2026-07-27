import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class paymentFilter {
  @IsString()
  @IsOptional()
  paymentType?: 'cash' | 'online';

  @IsString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;
}

import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  menu_item_id: string;
  @IsString()
  item_name: string;
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  table_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class AddInPreviousDto {
  @IsUUID()
  order_id: string;

  @IsUUID()
  table_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class FilterOrderDto {
  @IsString()
  @IsOptional()
  status?: 'pending' | 'preparing' | 'ready' | 'served';

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsString()
  @IsOptional()
  date?: string;

  @IsUUID()
  @IsOptional()
  table_id?: string;
}

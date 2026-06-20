import {
  IsArray,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { uuid } from 'drizzle-orm/pg-core';
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

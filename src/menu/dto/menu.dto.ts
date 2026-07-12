import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddMenu {
  @IsUUID()
  @IsNotEmpty({ message: 'category shouldnot be empty' })
  categoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'name shouldnot be empty' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'description sholdnot be empty' })
  description: string;

  @IsNumber()
  @IsNotEmpty({ message: 'price sholdnot be empty' })
  price: number;

  @IsBoolean()
  is_available: boolean;
}

export class UpdateMenu {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'name shouldnot be empty' })
  name?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'description shouldnot be empty' })
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsNotEmpty({ message: 'price shouldnot be empty' })
  price?: number;

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;
}

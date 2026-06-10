import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  image!: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}

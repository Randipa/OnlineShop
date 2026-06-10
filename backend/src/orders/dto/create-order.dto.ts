import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsString, Min, MinLength, ValidateNested } from "class-validator";

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(10)
  shippingAddress!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

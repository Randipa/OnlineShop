import { Type } from "class-transformer";
import { IsArray, IsInt, IsString, IsUUID, Min, ValidateNested } from "class-validator";

class OrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  shippingAddress!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

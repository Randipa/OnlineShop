import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PaymentMethod } from "../payment-method.enum";

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  paymentIntentId!: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;
}

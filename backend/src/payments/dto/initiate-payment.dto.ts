import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { PaymentMethod } from "../payment-method.enum";

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}

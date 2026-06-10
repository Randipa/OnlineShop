import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  paymentIntentId!: string;
}

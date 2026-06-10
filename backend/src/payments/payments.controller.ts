import { Body, Controller, Headers, Post, Req, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post("create-intent")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createIntent(
    @Request() req: { user: { id: string } },
    @Body() dto: CreatePaymentIntentDto
  ) {
    return this.paymentsService.createPaymentIntent(dto.orderId, req.user.id);
  }

  @Post("confirm")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  confirm(
    @Request() req: { user: { id: string } },
    @Body() dto: ConfirmPaymentDto
  ) {
    return this.paymentsService.confirmPayment(
      dto.orderId,
      dto.paymentIntentId,
      req.user.id
    );
  }

  @Post("webhook")
  webhook(@Req() req: ExpressRequest, @Headers("stripe-signature") signature: string) {
    const rawBody = (req as ExpressRequest & { rawBody?: Buffer }).rawBody;
    return this.paymentsService.handleWebhook(rawBody || Buffer.from(""), signature);
  }
}

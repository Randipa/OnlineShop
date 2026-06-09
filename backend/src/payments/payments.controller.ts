import { Body, Controller, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post("create-intent")
  @UseGuards(JwtAuthGuard)
  createIntent(@Body("orderId") orderId: string) {
    return this.paymentsService.createPaymentIntent(orderId);
  }

  @Post("webhook")
  webhook(@Req() req: Request, @Headers("stripe-signature") signature: string) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    return this.paymentsService.handleWebhook(rawBody || Buffer.from(""), signature);
  }
}

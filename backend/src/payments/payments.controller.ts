import { Body, Controller, Get, Headers, Post, Req, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request as ExpressRequest } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import { PaymentMethod } from "./payment-method.enum";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get("methods")
  getMethods() {
    return this.paymentsService.getAvailableMethods();
  }

  @Get("stripe-config")
  getStripeConfig() {
    return this.paymentsService.getStripeConfig();
  }

  @Post("initiate")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  initiate(
    @Request() req: { user: { id: string; name: string; email: string } },
    @Body() dto: InitiatePaymentDto
  ) {
    return this.paymentsService.initiatePayment(
      dto.orderId,
      dto.method,
      req.user.id,
      { name: req.user.name, email: req.user.email }
    );
  }

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
      req.user.id,
      dto.method || PaymentMethod.STRIPE
    );
  }

  @Post("webhook")
  stripeWebhook(@Req() req: ExpressRequest, @Headers("stripe-signature") signature: string) {
    const rawBody = (req as ExpressRequest & { rawBody?: Buffer }).rawBody;
    return this.paymentsService.handleStripeWebhook(rawBody || Buffer.from(""), signature);
  }

  @Post("payhere/notify")
  payHereNotify(@Body() body: Record<string, string>) {
    return this.paymentsService.handlePayHereNotify(body);
  }
}

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private ordersService: OrdersService,
    private config: ConfigService
  ) {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new InternalServerErrorException("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }

  async createPaymentIntent(orderId: string, userId: string) {
    const order = await this.ordersService.findOne(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }
    if (order.status !== "PENDING") {
      throw new ForbiddenException("This order has already been paid or cancelled");
    }

    const amount = Math.round(Number(order.total) * 100);
    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      returnUrl: `${frontendUrl}/orders/${orderId}?success=true`,
    };
  }

  async confirmPayment(orderId: string, paymentIntentId: string, userId: string) {
    const order = await this.ordersService.findOne(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.metadata.orderId !== orderId) {
      throw new ForbiddenException("Payment does not match this order");
    }
    if (intent.status !== "succeeded") {
      throw new ForbiddenException("Payment has not been completed");
    }

    return this.ordersService.fulfillPayment(orderId, intent.id);
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      this.logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      return { received: false };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.warn("Stripe webhook signature verification failed", err);
      return { received: false };
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        await this.ordersService.fulfillPayment(orderId, intent.id);
        this.logger.log(`Order ${orderId} marked as PAID`);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        this.logger.warn(`Payment failed for order ${orderId}`);
      }
    }

    return { received: true };
  }
}

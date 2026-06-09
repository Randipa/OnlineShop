import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private ordersService: OrdersService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2025-02-24.acacia",
    });
  }

  async createPaymentIntent(orderId: string) {
    const order = await this.ordersService.findOne(orderId);
    const amount = Math.round(Number(order.total) * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret, amount };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      return { received: false };
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        await this.ordersService.markPaid(orderId, intent.id);
      }
    }

    return { received: true };
  }
}

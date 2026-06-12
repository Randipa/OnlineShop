import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { OrdersService } from "../orders/orders.service";
import { PaymentMethod } from "./payment-method.enum";
import {
  createPayHereCheckoutHash,
  formatPayHereAmount,
  verifyPayHereNotification,
} from "./providers/payhere.util";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private ordersService: OrdersService,
    private config: ConfigService
  ) {}

  getAvailableMethods() {
    const methods: PaymentMethod[] = [];
    if (this.isStripeConfigured()) methods.push(PaymentMethod.STRIPE);
    if (this.isPayHereConfigured()) methods.push(PaymentMethod.PAYHERE);
    return { methods };
  }

  getStripeConfig() {
    const publishableKey = this.config.get<string>("STRIPE_PUBLISHABLE_KEY")?.trim() || "";
    const valid =
      publishableKey.startsWith("pk_") &&
      !publishableKey.includes("your_stripe") &&
      publishableKey.length > 20;
    return { configured: valid, publishableKey: valid ? publishableKey : null };
  }

  async initiatePayment(orderId: string, method: PaymentMethod, userId: string, user: { name: string; email: string }) {
    const order = await this.ordersService.findOne(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }
    if (order.status !== "PENDING") {
      throw new ForbiddenException("This order has already been paid or cancelled");
    }

    switch (method) {
      case PaymentMethod.STRIPE:
        return this.initiateStripe(orderId, order.total.toString());
      case PaymentMethod.PAYHERE:
        return this.initiatePayHere(orderId, order.total.toString(), user, order.shippingAddress);
      default:
        throw new BadRequestException("Unsupported payment method");
    }
  }

  async createPaymentIntent(orderId: string, userId: string) {
    const order = await this.ordersService.assertOrderOwner(orderId, userId);
    if (order.status !== "PENDING") {
      throw new ForbiddenException("This order has already been paid or cancelled");
    }
    return this.initiateStripe(orderId, order.total.toString());
  }

  async confirmPayment(orderId: string, paymentReference: string, userId: string, method = PaymentMethod.STRIPE) {
    const order = await this.ordersService.findOne(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }

    if (method === PaymentMethod.STRIPE) {
      const stripe = this.getStripe();
      const intent = await stripe.paymentIntents.retrieve(paymentReference);
      if (intent.metadata.orderId !== orderId) {
        throw new ForbiddenException("Payment does not match this order");
      }
      if (intent.status !== "succeeded") {
        throw new ForbiddenException("Payment has not been completed");
      }
      return this.ordersService.fulfillPayment(orderId, intent.id, PaymentMethod.STRIPE);
    }

    if (order.status === "PAID") return order;
    throw new BadRequestException("Payment confirmation is handled via provider webhook for this method");
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const stripe = this.getStripe();
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      this.logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      return { received: false };
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.warn("Stripe webhook signature verification failed", err);
      return { received: false };
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        await this.ordersService.fulfillPayment(orderId, intent.id, PaymentMethod.STRIPE);
        this.logger.log(`Order ${orderId} marked as PAID via Stripe`);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata.orderId;
      if (orderId) {
        this.logger.warn(`Stripe payment failed for order ${orderId}`);
      }
    }

    return { received: true };
  }

  async handlePayHereNotify(body: Record<string, string>) {
    const merchantId = this.config.get<string>("PAYHERE_MERCHANT_ID");
    const merchantSecret = this.config.get<string>("PAYHERE_MERCHANT_SECRET");
    if (!merchantId || !merchantSecret) {
      this.logger.error("PayHere is not configured");
      return { received: false };
    }

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
    } = body;

    const valid = verifyPayHereNotification(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      merchantSecret
    );

    if (!valid) {
      this.logger.warn(`PayHere signature invalid for order ${order_id}`);
      return { received: false };
    }

    if (status_code === "2") {
      await this.ordersService.fulfillPayment(
        order_id,
        payment_id || `payhere-${order_id}`,
        PaymentMethod.PAYHERE
      );
      this.logger.log(`Order ${order_id} marked as PAID via PayHere`);
    }

    return { received: true };
  }

  private async initiateStripe(orderId: string, total: string) {
    const stripe = this.getStripe();
    const amount = Math.round(Number(total) * 100);
    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    });

    return {
      method: PaymentMethod.STRIPE,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      returnUrl: `${frontendUrl}/orders/${orderId}?success=true`,
    };
  }

  private initiatePayHere(
    orderId: string,
    total: string,
    user: { name: string; email: string },
    shippingAddress: string
  ) {
    const merchantId = this.config.get<string>("PAYHERE_MERCHANT_ID")?.trim();
    const merchantSecret = this.config.get<string>("PAYHERE_MERCHANT_SECRET")?.trim();
    if (!merchantId || !merchantSecret) {
      throw new InternalServerErrorException("PayHere is not configured");
    }

    const currency = (this.config.get<string>("PAYHERE_CURRENCY") || "LKR").trim();
    const lkrRate = Number(this.config.get<string>("PAYHERE_USD_TO_LKR_RATE") || "320");
    const amount = formatPayHereAmount(total, currency, lkrRate);
    const sandbox = this.config.get<string>("PAYHERE_SANDBOX") !== "false";
    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";
    const backendUrl =
      this.config.get<string>("BACKEND_PUBLIC_URL") ||
      `http://localhost:${this.config.get("PORT") || 4000}`;

    const hash = createPayHereCheckoutHash(merchantId, orderId, amount, currency, merchantSecret);
    const [firstName, ...rest] = user.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;

    return {
      method: PaymentMethod.PAYHERE,
      actionUrl: sandbox
        ? "https://sandbox.payhere.lk/pay/checkout"
        : "https://www.payhere.lk/pay/checkout",
      fields: {
        merchant_id: merchantId,
        return_url: `${frontendUrl}/orders/${orderId}?success=true&provider=payhere`,
        cancel_url: `${frontendUrl}/checkout?cancelled=true`,
        notify_url: `${backendUrl}/api/payments/payhere/notify`,
        order_id: orderId,
        items: "ShopVerse Order",
        currency,
        amount,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone: "0771234567",
        address: shippingAddress.slice(0, 100),
        city: "Colombo",
        country: "Sri Lanka",
        hash,
      },
    };
  }

  private getStripe() {
    if (!this.stripe) {
      const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
      if (!secretKey) {
        throw new InternalServerErrorException("STRIPE_SECRET_KEY is not configured");
      }
      this.stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    }
    return this.stripe;
  }

  private isStripeConfigured() {
    return Boolean(this.config.get<string>("STRIPE_SECRET_KEY"));
  }

  private isPayHereConfigured() {
    return Boolean(
      this.config.get<string>("PAYHERE_MERCHANT_ID") &&
        this.config.get<string>("PAYHERE_MERCHANT_SECRET")
    );
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0);
      const orderItems: {
        productId: string;
        quantity: number;
        price: Prisma.Decimal;
      }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}`);
        }

        const price = product.price;
        total = total.add(price.mul(item.quantity));
        orderItems.push({ productId: product.id, quantity: item.quantity, price });
      }

      return tx.order.create({
        data: {
          userId,
          total,
          shippingAddress: dto.shippingAddress,
          status: OrderStatus.PENDING,
          items: { create: orderItems },
        },
        include: {
          items: { include: { product: true } },
        },
      });
    });
  }

  findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    if (status === OrderStatus.CANCELLED && order.status === OrderStatus.PAID) {
      return this.restoreStockAndUpdateStatus(id, OrderStatus.CANCELLED);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } } },
    });
  }

  async assertOrderOwner(orderId: string, userId: string) {
    const order = await this.findOne(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }
    return order;
  }

  async fulfillPayment(orderId: string, paymentId: string, paymentMethod: PaymentMethod) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException("Order not found");
      if (order.status === OrderStatus.PAID) return order;
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException("Order cannot be paid in its current state");
      }

      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}. Payment cannot be completed.`
          );
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, paymentId, paymentMethod },
        include: { items: { include: { product: true } } },
      });
    });
  }

  private async restoreStockAndUpdateStatus(id: string, status: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException("Order not found");

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: { items: { include: { product: true } } },
      });
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async findOneForUser(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.userId !== userId) {
      throw new ForbiddenException("You do not have access to this order");
    }
    return order;
  }
}

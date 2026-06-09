import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(params?: { category?: string; featured?: boolean; search?: string }) {
    return this.prisma.product.findMany({
      where: {
        ...(params?.category && { category: { slug: params.category } }),
        ...(params?.featured && { featured: true }),
        ...(params?.search && {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
          ],
        }),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { stock: product.stock + quantity },
    });
  }

  private async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  getInventory() {
    return this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        price: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: "asc" },
    });
  }
}

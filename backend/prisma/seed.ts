import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@shop.com" },
    update: {},
    create: {
      email: "admin@shop.com",
      password: adminPassword,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@shop.com" },
    update: {},
    create: {
      email: "user@shop.com",
      password: userPassword,
      name: "Demo User",
      role: Role.USER,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: { name: "Electronics", slug: "electronics" },
    }),
    prisma.category.upsert({
      where: { slug: "fashion" },
      update: {},
      create: { name: "Fashion", slug: "fashion" },
    }),
    prisma.category.upsert({
      where: { slug: "home" },
      update: {},
      create: { name: "Home & Living", slug: "home" },
    }),
  ]);

  const products = [
    {
      name: "Wireless Headphones Pro",
      slug: "wireless-headphones-pro",
      description: "Premium noise-cancelling wireless headphones with 40hr battery life.",
      price: 149.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      stock: 45,
      featured: true,
      categoryId: categories[0].id,
    },
    {
      name: "Smart Watch Series X",
      slug: "smart-watch-series-x",
      description: "Track fitness, receive notifications, and stay connected on the go.",
      price: 299.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      stock: 30,
      featured: true,
      categoryId: categories[0].id,
    },
    {
      name: "Minimalist Backpack",
      slug: "minimalist-backpack",
      description: "Water-resistant laptop backpack with ergonomic design.",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
      stock: 60,
      featured: true,
      categoryId: categories[1].id,
    },
    {
      name: "Ceramic Coffee Set",
      slug: "ceramic-coffee-set",
      description: "Handcrafted 4-piece ceramic coffee set for your morning ritual.",
      price: 49.99,
      image: "https://images.unsplash.com/photo-1517668808822-9ebb02b2a0e6?w=600",
      stock: 25,
      featured: false,
      categoryId: categories[2].id,
    },
    {
      name: "USB-C Hub Adapter",
      slug: "usb-c-hub-adapter",
      description: "7-in-1 USB-C hub with HDMI, SD card, and fast charging.",
      price: 59.99,
      image: "https://images.unsplash.com/photo-1625948517791-64c3907d55f5?w=600",
      stock: 80,
      featured: false,
      categoryId: categories[0].id,
    },
    {
      name: "Linen Throw Blanket",
      slug: "linen-throw-blanket",
      description: "Soft organic linen blanket — perfect for cozy evenings.",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
      stock: 15,
      featured: false,
      categoryId: categories[2].id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log("Seed complete!");
  console.log("Admin:", admin.email, "/ admin123");
  console.log("User: user@shop.com / user123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

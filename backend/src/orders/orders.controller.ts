import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get("my")
  myOrders(@Request() req: { user: { id: string } }) {
    return this.ordersService.findByUser(req.user.id);
  }

  @Get(":id")
  findOne(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.ordersService.findOneForUser(id, req.user.id);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.ordersService.findAll();
  }

  @Patch(":id/status")
  @UseGuards(AdminGuard)
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}

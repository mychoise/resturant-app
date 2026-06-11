import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { User } from 'src/auth/decorators/user.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() orderData: any, @User() user: any) {
    return this.orderService.createOrder(orderData, user.id);
  }

  @Post('/update/:order_id')
  @UseGuards(JwtAuthGuard)
  async updateOrderStatus(
    @Body() orderData: any,
    @User() user: any,
    @Param('order_id') order_id: string,
  ) {
    return this.orderService.addInPreviousOrder(orderData, user.id, order_id);
  }

  @Post('/status/:order_item_id')
  @UseGuards(JwtAuthGuard)
  async changeStatus(
    @Param('order_item_id') order_item_id: string,
    @Body('status') status: 'pending' | 'preparing' | 'ready' | 'served',
  ) {
    return this.orderService.changeStatus(order_item_id, status);
  }
}

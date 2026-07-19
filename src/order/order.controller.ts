import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { FilterOrderDto } from './dto/createorder.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/dto/register.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getEveryOrders(@Query() query: FilterOrderDto) {
    return this.orderService.adminGetAllOrder(query);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() orderData: any, @User() user: any) {
    return this.orderService.createOrder(orderData, user.id);
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get('/all/:table_id')
  @UseGuards(JwtAuthGuard)
  async getAllOrdersByTable(@Param('table_id') table_id: string) {
    return this.orderService.getAllOrderById(table_id);
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

  @Get('stats')
  // @UseGuards(JwtAuthGuard)
  async getOrderStats() {
    return this.orderService.getOrderStats();
  }
}

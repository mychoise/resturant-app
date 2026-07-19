import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FilterOrderDto } from 'src/order/dto/createorder.dto';
import { paymentFilter } from './dto/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/pay')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Body() data: any) {
    return this.paymentService.createPayment(
      data.table_id,
      data.order_id,
      data.payment_type,
    );
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllPayment(@Query() query: paymentFilter) {
    return this.paymentService.viewAllPayment(query);
  }

  @Get('/stats')
  async getPaymentStats() {
    return this.paymentService.PaymentStats();
  }
}

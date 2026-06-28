import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';

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
}

import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderGateway } from './order.gateway';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderGateway, JwtAuthGuard, JwtService],
})
export class OrderModule {}

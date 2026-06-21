import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderGateway } from './order.gateway';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { JwtService } from '@nestjs/jwt';
import { TableService } from 'src/table/table.service';
import { TableModule } from 'src/table/table.module';

@Module({
  imports: [TableModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderGateway,
    JwtAuthGuard,
    JwtService,
    TableService,
  ],
})
export class OrderModule {}

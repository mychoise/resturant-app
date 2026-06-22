import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderGateway } from './order.gateway';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { JwtService } from '@nestjs/jwt';
import { TableService } from 'src/table/table.service';
import { TableModule } from 'src/table/table.module';
import { BullModule } from '@nestjs/bullmq';
import { OrderProcessor } from './order.processor';

@Module({
  imports: [
    TableModule,
    BullModule.registerQueue({
      name: 'send-alert',
    }),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderGateway,
    JwtAuthGuard,
    JwtService,
    TableService,
    OrderProcessor,
  ],
})
export class OrderModule {}

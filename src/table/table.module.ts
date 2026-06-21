import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';

@Module({
  controllers: [TableController],
  providers: [TableService, JwtAuthGuard],
})
export class TableModule {}
